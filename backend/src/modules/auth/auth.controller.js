// src/modules/auth/auth.controller.js
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../../config/db.js'
import { ENV } from '../../config/env.js'
import { asyncHandler } from '../../middleware/errorHandler.js'

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body

  const [rows] = await pool.query(
    `SELECT id, username, password_hash, name, email, avatar, role, office_id, status
     FROM users WHERE username = ?`,
    [username.trim()]
  )
  const user = rows[0]

  if (!user)
    return res.status(401).json({ error: 'Invalid username or password.' })

  if (user.status !== 'active')
    return res.status(401).json({ error: 'This account has been deactivated. Please contact your administrator.' })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid)
    return res.status(401).json({ error: 'Invalid username or password.' })

  await pool.query(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [user.id])

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN }
  )

  const { password_hash, ...safeUser } = user
  res.json({ token, user: safeUser, expiresIn: ENV.JWT_EXPIRES_IN })
})

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.name, u.email, u.avatar, u.role,
            u.office_id, u.status, u.last_login_at, u.created_at,
            o.name AS office_name
     FROM users u
     LEFT JOIN offices o ON o.id = u.office_id
     WHERE u.id = ?`,
    [req.user.id]
  )
  res.json(rows[0])
})

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.json({ message: 'Logged out successfully.' })
})