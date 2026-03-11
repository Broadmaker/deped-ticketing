// src/middleware/auth.js
import jwt from 'jsonwebtoken'
import { ENV } from '../config/env.js'
import pool from '../config/db.js'

// Verify JWT and attach user to req
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided.' })
    }

    const token = header.slice(7)
    const payload = jwt.verify(token, ENV.JWT_SECRET)

    // Fetch fresh user from DB (catches deactivated accounts)
    const { rows } = await pool.query(
      `SELECT id, username, name, email, avatar, role, office_id, status
       FROM users WHERE id = $1`,
      [payload.userId]
    )

    const user = rows[0]
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Account not found or deactivated.' })
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' })
    }
    return res.status(401).json({ error: 'Invalid token.' })
  }
}

// Role-based access guard — use after authenticate
export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'You do not have permission to perform this action.',
      })
    }
    next()
  }
}

// Office-scoped access — staff/office_admin can only access their office
export function authorizeOffice(req, res, next) {
  const user = req.user
  if (user.role === 'superadmin') return next()

  const officeId = req.params.officeId || req.body.officeId || req.query.officeId
  if (officeId && user.office_id !== officeId) {
    return res.status(403).json({ error: 'Access restricted to your office only.' })
  }
  next()
}