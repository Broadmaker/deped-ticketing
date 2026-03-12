// src/modules/notifications/notifications.controller.js
import pool from '../../config/db.js'
import { asyncHandler } from '../../middleware/errorHandler.js'

// GET /api/notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT id, ticket_id, type, message, is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `, [req.user.id])
  // Normalize is_read to boolean
  res.json(rows.map(n => ({ ...n, is_read: !!n.is_read })))
})

// PATCH /api/notifications/:id/read
export const markRead = asyncHandler(async (req, res) => {
  await pool.query(
    `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id]
  )
  res.json({ message: 'Marked as read.' })
})

// PATCH /api/notifications/read-all
export const markAllRead = asyncHandler(async (req, res) => {
  await pool.query(
    `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
    [req.user.id]
  )
  res.json({ message: 'All marked as read.' })
})