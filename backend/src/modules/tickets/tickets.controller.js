// src/modules/tickets/tickets.controller.js
import { randomUUID } from 'crypto'
import pool from '../../config/db.js'
import { asyncHandler } from '../../middleware/errorHandler.js'
import { sendTicketConfirmation, sendStatusUpdate } from '../../services/mailer.js'
import { getOrCreateCsmToken } from '../csm/csm.controller.js'

// ── Helper: generate next TKT-YYYY-XXXX id ───────────────────────────────────
async function nextTicketId(conn) {
  // Atomic increment using MySQL's UPDATE + SELECT
  await conn.query(`UPDATE ticket_seq SET seq_val = seq_val + 1 WHERE id = 1`)
  const [[{ seq_val }]] = await conn.query(`SELECT seq_val FROM ticket_seq WHERE id = 1`)
  const year = new Date().getFullYear()
  return `TKT-${year}-${String(seq_val).padStart(4, '0')}`
}

// POST /api/tickets  (public)
export const submitTicket = asyncHandler(async (req, res) => {
  const { office_id, service_id, submitter_name, submitter_email,
          submitter_phone, submitter_school, subject, concern } = req.body

  // Validate office exists and is active
  const [[office]] = await pool.query(
    `SELECT id FROM offices WHERE id = ? AND is_active = 1`, [office_id]
  )
  if (!office) return res.status(400).json({ error: 'Selected office is not available.' })

  // Validate service belongs to office
  const [[service]] = await pool.query(
    `SELECT id FROM services WHERE id = ? AND office_id = ?`, [service_id, office_id]
  )
  if (!service) return res.status(400).json({ error: 'Selected service is not valid for this office.' })

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const id = await nextTicketId(conn)

    await conn.query(`
      INSERT INTO tickets (id, office_id, service_id, submitter_name, submitter_email,
                           submitter_phone, submitter_school, subject, concern)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, office_id, service_id, submitter_name, submitter_email,
        submitter_phone || null, submitter_school, subject, concern])

    await conn.query(`
      INSERT INTO activity_log (id, ticket_id, action, performed_by)
      VALUES (?, ?, 'Ticket submitted', 'System')
    `, [randomUUID(), id])

    await conn.commit()

    // Send confirmation email (non-blocking — don't fail ticket if email fails)
    const [[ticketRow]] = await pool.query(
      `SELECT t.subject, o.name AS office_name, s.label AS service_label
       FROM tickets t
       JOIN offices o ON o.id = t.office_id
       JOIN services s ON s.id = t.service_id
       WHERE t.id = ?`, [id]
    )
    sendTicketConfirmation({
      to:      submitter_email,
      name:    submitter_name,
      ticketId: id,
      subject: ticketRow?.subject  || subject,
      office:  ticketRow?.office_name   || office_id,
      service: ticketRow?.service_label || service_id,
    }).catch(err => console.warn('📧 Confirmation email failed:', err.message))

    res.status(201).json({ id, message: 'Ticket submitted successfully.' })
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
})

// GET /api/tickets/track/:id  (public)
export const trackTicket = asyncHandler(async (req, res) => {
  const [[ticket]] = await pool.query(`
    SELECT t.id, t.subject, t.status, t.priority, t.created_at, t.updated_at,
           o.name AS office_name, s.label AS service_label,
           t.resolution
    FROM tickets t
    JOIN offices  o ON o.id = t.office_id
    JOIN services s ON s.id = t.service_id
    WHERE t.id = ?
  `, [req.params.id])

  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' })

  const [replies] = await pool.query(`
    SELECT author_name, message, created_at FROM ticket_replies
    WHERE ticket_id = ? ORDER BY created_at ASC
  `, [req.params.id])

  res.json({ ...ticket, replies })
})

// GET /api/tickets/stats  (admin)
export const getStats = asyncHandler(async (req, res) => {
  const user = req.user
  const officeFilter = user.role !== 'superadmin' ? `WHERE t.office_id = '${user.office_id}'` : ''
  const officeAnd    = user.role !== 'superadmin' ? `AND t.office_id = '${user.office_id}'` : ''

  const [[counts]] = await pool.query(`
    SELECT
      COUNT(*)                                                        AS total,
      SUM(CASE WHEN status = 'open'        THEN 1 ELSE 0 END)        AS open_count,
      SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END)        AS in_progress,
      SUM(CASE WHEN status = 'resolved'    THEN 1 ELSE 0 END)        AS resolved_count,
      SUM(CASE WHEN status = 'closed'      THEN 1 ELSE 0 END)        AS closed_count,
      SUM(CASE WHEN assigned_to_id IS NULL THEN 1 ELSE 0 END)        AS unassigned,
      SUM(CASE WHEN priority = 'high'      THEN 1 ELSE 0 END)        AS high_priority_count
    FROM tickets t ${officeFilter}
  `)

  const [recentRaw] = await pool.query(`
    SELECT t.id, t.subject, t.status, t.priority, t.created_at,
           o.name AS office_name, s.label AS service_label,
           u.name AS assigned_to_name
    FROM tickets t
    JOIN offices  o ON o.id = t.office_id
    JOIN services s ON s.id = t.service_id
    LEFT JOIN users u ON u.id = t.assigned_to_id
    WHERE 1=1 ${officeAnd}
    ORDER BY t.created_at DESC
    LIMIT 5
  `)

  const [staffRaw] = await pool.query(`
    SELECT u.id, u.name, u.avatar,
      COUNT(t.id)                                                    AS total,
      SUM(CASE WHEN t.status = 'open'        THEN 1 ELSE 0 END)     AS open,
      SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END)     AS in_progress,
      SUM(CASE WHEN t.status = 'resolved' OR t.status = 'closed' THEN 1 ELSE 0 END) AS resolved
    FROM users u
    LEFT JOIN tickets t ON t.assigned_to_id = u.id ${officeAnd ? officeAnd.replace('WHERE', 'AND') : ''}
    WHERE u.role IN ('office_admin','staff')
      ${user.role !== 'superadmin' ? `AND u.office_id = '${user.office_id}'` : ''}
    GROUP BY u.id
    ORDER BY total DESC
    LIMIT 5
  `)

  res.json({
    counts,
    recent_tickets: recentRaw,
    staff_workload:  staffRaw,
  })
})

// GET /api/tickets  (admin)
export const listTickets = asyncHandler(async (req, res) => {
  const user = req.user
  const { status, priority, office_id, assigned_to_id, search, page = 1, limit = 20 } = req.query

  const conditions = []
  const params     = []

  if (user.role !== 'superadmin') {
    conditions.push('t.office_id = ?')
    params.push(user.office_id)
  }
  if (status)         { conditions.push('t.status = ?');         params.push(status) }
  if (priority)       { conditions.push('t.priority = ?');       params.push(priority) }
  if (office_id)      { conditions.push('t.office_id = ?');      params.push(office_id) }
  if (assigned_to_id) { conditions.push('t.assigned_to_id = ?'); params.push(assigned_to_id) }
  if (search) {
    conditions.push('(t.subject LIKE ? OR t.submitter_name LIKE ? OR t.id LIKE ?)')
    const q = `%${search}%`
    params.push(q, q, q)
  }

  const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (Number(page) - 1) * Number(limit)

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM tickets t ${where}`, params
  )

  const [rows] = await pool.query(`
    SELECT t.id, t.subject, t.status, t.priority, t.created_at, t.updated_at,
           o.name AS office_name, s.label AS service_label,
           t.submitter_name, t.submitter_school,
           u.name AS assigned_to_name, u.id AS assigned_to_id
    FROM tickets t
    JOIN offices  o ON o.id = t.office_id
    JOIN services s ON s.id = t.service_id
    LEFT JOIN users u ON u.id = t.assigned_to_id
    ${where}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, Number(limit), offset])

  res.json({ tickets: rows, total: Number(total), page: Number(page), limit: Number(limit) })
})

// GET /api/tickets/:id  (admin)
export const getTicket = asyncHandler(async (req, res) => {
  const user = req.user
  const [[ticket]] = await pool.query(`
    SELECT t.*, o.name AS office_name, s.label AS service_label,
           u.name AS assigned_to_name, u.avatar AS assigned_to_avatar
    FROM tickets t
    JOIN offices  o ON o.id = t.office_id
    JOIN services s ON s.id = t.service_id
    LEFT JOIN users u ON u.id = t.assigned_to_id
    WHERE t.id = ?
  `, [req.params.id])

  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' })
  if (user.role !== 'superadmin' && ticket.office_id !== user.office_id)
    return res.status(403).json({ error: 'Access restricted to your office only.' })

  const [replies] = await pool.query(`
    SELECT r.id, r.author_name, r.message, r.created_at, u.avatar, u.role
    FROM ticket_replies r
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.ticket_id = ? ORDER BY r.created_at ASC
  `, [req.params.id])

  const [activityLog] = await pool.query(`
    SELECT action, performed_by, created_at
    FROM activity_log WHERE ticket_id = ? ORDER BY created_at ASC
  `, [req.params.id])

  res.json({ ...ticket, replies, activity_log: activityLog })
})

// PATCH /api/tickets/:id  (admin)
export const updateTicket = asyncHandler(async (req, res) => {
  const user = req.user
  const { id } = req.params
  const { status, priority, assigned_to_id, resolution } = req.body

  const [[ticket]] = await pool.query(`SELECT * FROM tickets WHERE id = ?`, [id])
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' })
  if (user.role !== 'superadmin' && ticket.office_id !== user.office_id)
    return res.status(403).json({ error: 'Access restricted to your office only.' })

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const updates = []
    const params  = []
    const logs    = []

    // Status can only move forward: open → in-progress → resolved → closed
    const STATUS_ORDER = { 'open': 0, 'in-progress': 1, 'resolved': 2, 'closed': 3 }
    let statusChanged = false
    if (status !== undefined && status !== ticket.status) {
      const currentRank = STATUS_ORDER[ticket.status] ?? 0
      const newRank     = STATUS_ORDER[status] ?? 0
      if (newRank <= currentRank) {
        return res.status(400).json({
          error: `Cannot change status from "${ticket.status}" back to "${status}". Status can only move forward.`
        })
      }
      updates.push('status = ?'); params.push(status)
      logs.push(`Status → ${status.charAt(0).toUpperCase() + status.slice(1)}`)
      statusChanged = true
    }
    if (priority !== undefined && priority !== ticket.priority) {
      updates.push('priority = ?'); params.push(priority)
      logs.push(`Priority → ${priority}`)
    }
    if (assigned_to_id !== undefined && assigned_to_id !== ticket.assigned_to_id) {
      updates.push('assigned_to_id = ?'); params.push(assigned_to_id || null)
      if (assigned_to_id) {
        const [[assignee]] = await conn.query(`SELECT name FROM users WHERE id = ?`, [assigned_to_id])
        const assigneeName = assignee?.name || assigned_to_id
        logs.push(`Assigned to ${assigneeName}`)
        // Notify the assigned user
        await conn.query(
          `INSERT INTO notifications (user_id, ticket_id, type, message) VALUES (?, ?, 'assignment', ?)`,
          [assigned_to_id, id, `You have been assigned ticket ${id}: "${ticket.subject}" by ${user.name}.`]
        )
      } else {
        logs.push(`Unassigned`)
        if (ticket.assigned_to_id) {
          await conn.query(
            `INSERT INTO notifications (user_id, ticket_id, type, message) VALUES (?, ?, 'unassignment', ?)`,
            [ticket.assigned_to_id, id, `Ticket ${id}: "${ticket.subject}" has been unassigned from you by ${user.name}.`]
          )
        }
      }
    }
    if (resolution !== undefined) {
      updates.push('resolution = ?'); params.push(resolution || null)
      if (resolution) logs.push('Resolution note updated')
    }

    if (updates.length > 0) {
      params.push(id)
      await conn.query(
        `UPDATE tickets SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, params
      )
    }

    for (const action of logs) {
      await conn.query(
        `INSERT INTO activity_log (id, ticket_id, action, performed_by, user_id) VALUES (?, ?, ?, ?, ?)`,
        [randomUUID(), id, action, user.name, user.id]
      )
    }

    await conn.commit()

    // Send status update email if status changed
    if (statusChanged) {
      console.log(`📧 Sending status email for ${id}: ${ticket.status} → ${status}`)
      const [[updated]] = await pool.query(
        `SELECT t.submitter_name, t.submitter_email, t.subject, t.resolution, o.name AS office_name
         FROM tickets t JOIN offices o ON o.id = t.office_id WHERE t.id = ?`, [id]
      )
      if (updated?.submitter_email) {
        console.log(`📧 Sending to: ${updated.submitter_email}`)
        // Generate CSM token for resolved/closed tickets
        let csmToken = null
        if (status === 'resolved' || status === 'closed') {
          try { csmToken = await getOrCreateCsmToken(id) } catch (_) {}
        }
        sendStatusUpdate({
          to:         updated.submitter_email,
          name:       updated.submitter_name,
          ticketId:   id,
          subject:    updated.subject,
          oldStatus:  ticket.status,
          newStatus:  status,
          officeName: updated.office_name,
          resolution: updated.resolution,
          csmToken,
        }).catch(err => console.warn('📧 Status email failed:', err.message))
      }
    }

    res.json({ message: 'Ticket updated.' })
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
})

// POST /api/tickets/:id/replies  (admin)
export const addReply = asyncHandler(async (req, res) => {
  const user = req.user
  const { id } = req.params
  const { message } = req.body

  const [[ticket]] = await pool.query(`SELECT office_id FROM tickets WHERE id = ?`, [id])
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' })
  if (user.role !== 'superadmin' && ticket.office_id !== user.office_id)
    return res.status(403).json({ error: 'Access restricted to your office only.' })

  const replyId = randomUUID()
  await pool.query(
    `INSERT INTO ticket_replies (id, ticket_id, user_id, author_name, message) VALUES (?, ?, ?, ?, ?)`,
    [replyId, id, user.id, user.name, message]
  )
  await pool.query(`UPDATE tickets SET updated_at = NOW() WHERE id = ?`, [id])

  const [[reply]] = await pool.query(
    `SELECT r.*, u.avatar, u.role FROM ticket_replies r LEFT JOIN users u ON u.id = r.user_id WHERE r.id = ?`,
    [replyId]
  )
  res.status(201).json(reply)
})