// src/modules/csm/csm.controller.js
import { randomBytes } from 'crypto'
import pool from '../../config/db.js'
import { asyncHandler } from '../../middleware/errorHandler.js'

// ── Helper: create or get CSM token for a ticket ─────────────────────────────
export async function getOrCreateCsmToken(ticketId) {
  const [[existing]] = await pool.query(
    `SELECT token FROM csm_surveys WHERE ticket_id = ?`, [ticketId]
  )
  if (existing) return existing.token

  const token = randomBytes(32).toString('hex')
  await pool.query(
    `INSERT INTO csm_surveys (ticket_id, token) VALUES (?, ?)`,
    [ticketId, token]
  )
  return token
}

// GET /api/csm/:token — load survey page data (public)
export const getSurvey = asyncHandler(async (req, res) => {
  const { token } = req.params

  const [[survey]] = await pool.query(
    `SELECT s.id, s.ticket_id, s.submitted_at,
            t.subject, t.submitter_name, t.status,
            o.name AS office_name, sv.label AS service_label
     FROM csm_surveys s
     JOIN tickets  t  ON t.id  = s.ticket_id
     JOIN offices  o  ON o.id  = t.office_id
     JOIN services sv ON sv.id = t.service_id
     WHERE s.token = ?`, [token]
  )

  if (!survey) return res.status(404).json({ error: 'Survey not found or link is invalid.' })

  res.json({
    ticket_id:    survey.ticket_id,
    subject:      survey.subject,
    submitter:    survey.submitter_name,
    office:       survey.office_name,
    service:      survey.service_label,
    already_done: !!survey.submitted_at,
  })
})

// POST /api/csm/:token — submit survey (public)
export const submitSurvey = asyncHandler(async (req, res) => {
  const { token } = req.params
  const { overall_rating, issue_resolved, response_time_rating, staff_rating, comments } = req.body

  const [[survey]] = await pool.query(
    `SELECT id, ticket_id, submitted_at FROM csm_surveys WHERE token = ?`, [token]
  )
  if (!survey) return res.status(404).json({ error: 'Survey not found or link is invalid.' })
  if (survey.submitted_at) return res.status(400).json({ error: 'This survey has already been submitted.' })

  // Validate ratings are 1-5
  for (const [key, val] of Object.entries({ overall_rating, response_time_rating, staff_rating })) {
    if (val !== undefined && (val < 1 || val > 5)) {
      return res.status(400).json({ error: `${key} must be between 1 and 5.` })
    }
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // Save survey responses
    await conn.query(`
      UPDATE csm_surveys SET
        overall_rating       = ?,
        issue_resolved       = ?,
        response_time_rating = ?,
        staff_rating         = ?,
        comments             = ?,
        submitted_at         = NOW()
      WHERE token = ?
    `, [overall_rating, issue_resolved ? 1 : 0, response_time_rating, staff_rating, comments || null, token])

    // Auto-close the ticket
    await conn.query(
      `UPDATE tickets SET status = 'closed', updated_at = NOW() WHERE id = ? AND status != 'closed'`,
      [survey.ticket_id]
    )

    // Log the activity
    await conn.query(`
      INSERT INTO activity_log (id, ticket_id, action, performed_by)
      VALUES (UUID(), ?, 'Ticket closed — CSM survey submitted by submitter', 'System')
    `, [survey.ticket_id])

    await conn.commit()
    res.json({ message: 'Survey submitted successfully. Thank you for your feedback!' })
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
})

// GET /api/csm/results — admin view all survey results
export const getSurveyResults = asyncHandler(async (req, res) => {
  const user = req.user
  const officeFilter = user.role !== 'superadmin' ? `AND t.office_id = '${user.office_id}'` : ''

  const [results] = await pool.query(`
    SELECT s.ticket_id, s.overall_rating, s.issue_resolved,
           s.response_time_rating, s.staff_rating, s.comments, s.submitted_at,
           t.subject, t.submitter_name, o.name AS office_name, sv.label AS service_label,
           u.name AS assigned_to_name
    FROM csm_surveys s
    JOIN tickets  t  ON t.id  = s.ticket_id
    JOIN offices  o  ON o.id  = t.office_id
    JOIN services sv ON sv.id = t.service_id
    LEFT JOIN users u ON u.id = t.assigned_to_id
    WHERE s.submitted_at IS NOT NULL ${officeFilter}
    ORDER BY s.submitted_at DESC
  `)

  // Compute averages
  const [[avg]] = await pool.query(`
    SELECT
      ROUND(AVG(s.overall_rating), 2)       AS avg_overall,
      ROUND(AVG(s.response_time_rating), 2) AS avg_response_time,
      ROUND(AVG(s.staff_rating), 2)         AS avg_staff,
      SUM(s.issue_resolved)                 AS resolved_yes,
      COUNT(*)                              AS total
    FROM csm_surveys s
    JOIN tickets t ON t.id = s.ticket_id
    WHERE s.submitted_at IS NOT NULL ${officeFilter}
  `)

  res.json({ results, averages: avg })
})