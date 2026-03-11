// src/modules/tickets/tickets.controller.js
import pool from '../../config/db.js'
import { asyncHandler } from '../../middleware/errorHandler.js'

// Generate ticket ID: TKT-YYYY-XXXX
async function generateTicketId(client) {
  const year = new Date().getFullYear()
  const { rows } = await client.query(`SELECT nextval('ticket_seq') AS seq`)
  const seq = String(rows[0].seq).padStart(4, '0')
  return `TKT-${year}-${seq}`
}

// ── Base query (reused by list + detail) ─────────────────────────────────────
const TICKET_SELECT = `
  SELECT
    t.id, t.subject, t.concern, t.status, t.priority,
    t.submitter_name, t.submitter_email, t.submitter_phone, t.submitter_school,
    t.resolution, t.created_at, t.updated_at,
    t.office_id,   o.name  AS office_name,
    t.service_id,  s.label AS service_label, s.icon AS service_icon,
    t.assigned_to_id,
    u.name   AS assigned_to_name,
    u.avatar AS assigned_to_avatar
  FROM tickets t
  LEFT JOIN offices  o ON o.id = t.office_id
  LEFT JOIN services s ON s.id = t.service_id
  LEFT JOIN users    u ON u.id = t.assigned_to_id
`

// GET /api/tickets
export const listTickets = asyncHandler(async (req, res) => {
  const user = req.user
  const { status, priority, service_id, search, page = 1, limit = 50 } = req.query

  const conditions = []
  const params = []

  // Office scope
  if (user.role !== 'superadmin') {
    params.push(user.office_id)
    conditions.push(`t.office_id = $${params.length}`)
  }

  if (status)     { params.push(status);     conditions.push(`t.status = $${params.length}`) }
  if (priority)   { params.push(priority);   conditions.push(`t.priority = $${params.length}`) }
  if (service_id) { params.push(service_id); conditions.push(`t.service_id = $${params.length}`) }
  if (search) {
    params.push(`%${search}%`)
    const i = params.length
    conditions.push(`(t.id ILIKE $${i} OR t.submitter_name ILIKE $${i} OR t.subject ILIKE $${i} OR t.submitter_school ILIKE $${i} OR u.name ILIKE $${i})`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (Number(page) - 1) * Number(limit)

  const [dataRes, countRes] = await Promise.all([
    pool.query(`${TICKET_SELECT} ${where} ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]),
    pool.query(`SELECT COUNT(*) FROM tickets t LEFT JOIN users u ON u.id = t.assigned_to_id ${where}`, params),
  ])

  res.json({
    data:  dataRes.rows,
    total: Number(countRes.rows[0].count),
    page:  Number(page),
    limit: Number(limit),
  })
})

// GET /api/tickets/:id
export const getTicket = asyncHandler(async (req, res) => {
  const user = req.user
  const { id } = req.params

  const { rows } = await pool.query(`${TICKET_SELECT} WHERE t.id = $1`, [id])
  const ticket = rows[0]
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' })

  // Office scope check
  if (user.role !== 'superadmin' && ticket.office_id !== user.office_id) {
    return res.status(403).json({ error: 'Access restricted to your office only.' })
  }

  // Fetch replies and activity log in parallel
  const [repliesRes, activityRes] = await Promise.all([
    pool.query(
      `SELECT r.id, r.user_id, r.author_name, r.message, r.created_at
       FROM ticket_replies r WHERE r.ticket_id = $1 ORDER BY r.created_at ASC`,
      [id]
    ),
    pool.query(
      `SELECT id, action, performed_by, user_id, created_at
       FROM activity_log WHERE ticket_id = $1 ORDER BY created_at ASC`,
      [id]
    ),
  ])

  res.json({ ...ticket, replies: repliesRes.rows, activity_log: activityRes.rows })
})

// POST /api/tickets  (public — no auth required)
export const createTicket = asyncHandler(async (req, res) => {
  const { office_id, service_id, submitter_name, submitter_email,
          submitter_phone, submitter_school, subject, concern } = req.body

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const id = await generateTicketId(client)
    await client.query(`
      INSERT INTO tickets (id, office_id, service_id, submitter_name, submitter_email,
                           submitter_phone, submitter_school, subject, concern)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [id, office_id, service_id, submitter_name, submitter_email,
        submitter_phone || null, submitter_school, subject, concern])

    await client.query(`
      INSERT INTO activity_log (ticket_id, action, performed_by)
      VALUES ($1, 'Ticket submitted', 'System')
    `, [id])

    await client.query('COMMIT')
    res.status(201).json({ id, message: 'Ticket submitted successfully.' })
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
})

// PATCH /api/tickets/:id
export const updateTicket = asyncHandler(async (req, res) => {
  const user = req.user
  const { id } = req.params
  const { status, priority, assigned_to_id, resolution } = req.body

  // Verify ticket exists and user has office access
  const { rows: existing } = await pool.query('SELECT * FROM tickets WHERE id = $1', [id])
  const ticket = existing[0]
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' })
  if (user.role !== 'superadmin' && ticket.office_id !== user.office_id) {
    return res.status(403).json({ error: 'Access restricted to your office only.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const updates = []
    const params  = []
    const logs    = []

    if (status !== undefined && status !== ticket.status) {
      params.push(status); updates.push(`status = $${params.length}`)
      logs.push(`Status → ${status.charAt(0).toUpperCase() + status.slice(1)}`)
    }
    if (priority !== undefined && priority !== ticket.priority) {
      params.push(priority); updates.push(`priority = $${params.length}`)
      logs.push(`Priority → ${priority}`)
    }
    if (assigned_to_id !== undefined && assigned_to_id !== ticket.assigned_to_id) {
      params.push(assigned_to_id || null); updates.push(`assigned_to_id = $${params.length}`)
      if (assigned_to_id) {
        const { rows: assignee } = await client.query('SELECT name FROM users WHERE id = $1', [assigned_to_id])
        logs.push(`Assigned to ${assignee[0]?.name || assigned_to_id}`)
      } else {
        logs.push('Unassigned')
      }
    }
    if (resolution !== undefined) {
      params.push(resolution || null); updates.push(`resolution = $${params.length}`)
      if (resolution) logs.push('Resolution note updated')
    }

    if (updates.length > 0) {
      params.push(id)
      await client.query(
        `UPDATE tickets SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
        params
      )
    }

    // Write activity log entries
    for (const action of logs) {
      await client.query(
        `INSERT INTO activity_log (ticket_id, action, performed_by, user_id)
         VALUES ($1, $2, $3, $4)`,
        [id, action, user.name, user.id]
      )
    }

    await client.query('COMMIT')
    res.json({ message: 'Ticket updated.' })
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
})

// POST /api/tickets/:id/replies
export const addReply = asyncHandler(async (req, res) => {
  const user = req.user
  const { id } = req.params
  const { message } = req.body

  const { rows } = await pool.query('SELECT office_id FROM tickets WHERE id = $1', [id])
  if (!rows[0]) return res.status(404).json({ error: 'Ticket not found.' })
  if (user.role !== 'superadmin' && rows[0].office_id !== user.office_id) {
    return res.status(403).json({ error: 'Access restricted to your office only.' })
  }

  const { rows: reply } = await pool.query(
    `INSERT INTO ticket_replies (ticket_id, user_id, author_name, message)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id, user.id, user.name, message]
  )

  await pool.query(
    `INSERT INTO activity_log (ticket_id, action, performed_by, user_id)
     VALUES ($1, $2, $3, $4)`,
    [id, 'Reply added', user.name, user.id]
  )

  await pool.query('UPDATE tickets SET updated_at = NOW() WHERE id = $1', [id])

  res.status(201).json(reply[0])
})

// GET /api/tickets/track/:id  (public)
export const trackTicket = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { rows } = await pool.query(`
    SELECT t.id, t.subject, t.status, t.priority, t.created_at, t.updated_at,
           t.submitter_name, t.submitter_school,
           s.label AS service_label, s.icon AS service_icon,
           o.name AS office_name,
           u.name AS assigned_to_name
    FROM tickets t
    LEFT JOIN services s ON s.id = t.service_id
    LEFT JOIN offices  o ON o.id = t.office_id
    LEFT JOIN users    u ON u.id = t.assigned_to_id
    WHERE t.id = $1
  `, [id])

  if (!rows[0]) return res.status(404).json({ error: 'Ticket not found.' })

  const { rows: replies } = await pool.query(
    `SELECT author_name, message, created_at FROM ticket_replies WHERE ticket_id = $1 ORDER BY created_at ASC`,
    [id]
  )

  res.json({ ...rows[0], replies })
})

// GET /api/tickets/stats  (dashboard)
export const getStats = asyncHandler(async (req, res) => {
  const user = req.user
  const scope = user.role === 'superadmin' ? '' : `WHERE t.office_id = '${user.office_id}'`

  const [statusRes, priorityRes, serviceRes, recentRes] = await Promise.all([
    pool.query(`SELECT status, COUNT(*) AS count FROM tickets t ${scope} GROUP BY status`),
    pool.query(`SELECT priority, COUNT(*) AS count FROM tickets t ${scope} GROUP BY priority`),
    pool.query(`
      SELECT s.label, s.icon, COUNT(*) AS count
      FROM tickets t
      JOIN services s ON s.id = t.service_id
      ${scope}
      GROUP BY s.id, s.label, s.icon
      ORDER BY count DESC LIMIT 6
    `),
    pool.query(`
      ${TICKET_SELECT}
      ${scope ? scope.replace('WHERE', 'WHERE') : ''}
      ORDER BY t.created_at DESC LIMIT 5
    `),
  ])

  res.json({
    by_status:   statusRes.rows,
    by_priority: priorityRes.rows,
    by_service:  serviceRes.rows,
    recent:      recentRes.rows,
  })
})