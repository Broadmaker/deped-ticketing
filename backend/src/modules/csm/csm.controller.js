// src/modules/csm/csm.controller.js
import { randomBytes } from 'crypto'
import pool from '../../config/db.js'
import { asyncHandler } from '../../middleware/errorHandler.js'

// ── Helper: create or get CSM token ──────────────────────────────────────────
export async function getOrCreateCsmToken(ticketId) {
  const [[existing]] = await pool.query(
    `SELECT token FROM csm_surveys WHERE ticket_id = ?`, [ticketId]
  )
  if (existing) return existing.token
  const token = randomBytes(32).toString('hex')
  await pool.query(
    `INSERT INTO csm_surveys (ticket_id, token) VALUES (?, ?)`, [ticketId, token]
  )
  return token
}

// GET /api/csm/:token — load survey info (public)
export const getSurvey = asyncHandler(async (req, res) => {
  const { token } = req.params
  const [[survey]] = await pool.query(`
    SELECT s.ticket_id, s.submitted_at,
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
  const {
    client_type, sex, age,
    cc1, cc2, cc3,
    sqd0, sqd1, sqd2, sqd3, sqd4, sqd5, sqd6, sqd7, sqd8,
    suggestions, email_optional,
  } = req.body

  const [[survey]] = await pool.query(
    `SELECT id, ticket_id, submitted_at FROM csm_surveys WHERE token = ?`, [token]
  )
  if (!survey)           return res.status(404).json({ error: 'Survey not found.' })
  if (survey.submitted_at) return res.status(400).json({ error: 'This survey has already been submitted.' })

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    await conn.query(`
      UPDATE csm_surveys SET
        client_type = ?, sex = ?, age = ?,
        cc1 = ?, cc2 = ?, cc3 = ?,
        sqd0 = ?, sqd1 = ?, sqd2 = ?, sqd3 = ?, sqd4 = ?,
        sqd5 = ?, sqd6 = ?, sqd7 = ?, sqd8 = ?,
        suggestions = ?, email_optional = ?,
        submitted_at = NOW()
      WHERE token = ?
    `, [
      client_type || null, sex || null, age || null,
      cc1 || null, cc2 || null, cc3 || null,
      sqd0||null, sqd1||null, sqd2||null, sqd3||null, sqd4||null,
      sqd5||null, sqd6||null, sqd7||null, sqd8||null,
      suggestions || null, email_optional || null,
      token,
    ])

    // Auto-close ticket
    await conn.query(
      `UPDATE tickets SET status = 'closed', updated_at = NOW() WHERE id = ? AND status != 'closed'`,
      [survey.ticket_id]
    )

    await conn.query(`
      INSERT INTO activity_log (id, ticket_id, action, performed_by)
      VALUES (UUID(), ?, 'Ticket closed — CSM survey submitted by client', 'System')
    `, [survey.ticket_id])

    await conn.commit()
    res.json({ message: 'Survey submitted. Thank you for your feedback!' })
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
})

// GET /api/csm — admin view all results
export const getSurveyResults = asyncHandler(async (req, res) => {
  const user = req.user
  const officeFilter = user.role !== 'superadmin' ? `AND t.office_id = '${user.office_id}'` : ''

  const [results] = await pool.query(`
    SELECT s.*, t.subject, t.submitter_name, o.name AS office_name,
           sv.label AS service_label, u.name AS assigned_to_name
    FROM csm_surveys s
    JOIN tickets  t  ON t.id  = s.ticket_id
    JOIN offices  o  ON o.id  = t.office_id
    JOIN services sv ON sv.id = t.service_id
    LEFT JOIN users u ON u.id = t.assigned_to_id
    WHERE s.submitted_at IS NOT NULL ${officeFilter}
    ORDER BY s.submitted_at DESC
  `)

  // Compute SQD averages (numeric values only, exclude N/A)
  const [[avg]] = await pool.query(`
    SELECT COUNT(*) AS total,
      ROUND(AVG(CASE WHEN sqd0 != 'NA' THEN CAST(sqd0 AS DECIMAL) END), 2) AS avg_sqd0,
      ROUND(AVG(CASE WHEN sqd1 != 'NA' THEN CAST(sqd1 AS DECIMAL) END), 2) AS avg_sqd1,
      ROUND(AVG(CASE WHEN sqd7 != 'NA' THEN CAST(sqd7 AS DECIMAL) END), 2) AS avg_sqd7,
      ROUND(AVG(CASE WHEN sqd8 != 'NA' THEN CAST(sqd8 AS DECIMAL) END), 2) AS avg_sqd8
    FROM csm_surveys s
    JOIN tickets t ON t.id = s.ticket_id
    WHERE s.submitted_at IS NOT NULL ${officeFilter}
  `)

  res.json({ results, averages: avg })
})