// src/modules/notifications/notifications.controller.js
import pool from '../../config/db.js'
import { asyncHandler } from '../../middleware/errorHandler.js'

// GET /api/notifications — get current user's unread notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT id, ticket_id, type, message, is_read, created_at
    FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 50
  `, [req.user.id])
  res.json(rows)
})

// PATCH /api/notifications/:id/read — mark one as read
export const markRead = asyncHandler(async (req, res) => {
  await pool.query(
    `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  )
  res.json({ message: 'Marked as read.' })
})

// PATCH /api/notifications/read-all — mark all as read
export const markAllRead = asyncHandler(async (req, res) => {
  await pool.query(
    `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
    [req.user.id]
  )
  res.json({ message: 'All marked as read.' })
})