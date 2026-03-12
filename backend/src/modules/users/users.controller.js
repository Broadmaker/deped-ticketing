// src/modules/users/users.controller.js
import bcrypt from 'bcryptjs'
import pool from '../../config/db.js'
import { asyncHandler } from '../../middleware/errorHandler.js'

// GET /api/users
export const listUsers = asyncHandler(async (req, res) => {
  const user = req.user
  const { role, office_id, status, search } = req.query

  const conditions = []
  const params     = []

  // office_admin can only see their own office
  if (user.role === 'office_admin') {
    conditions.push('u.office_id = ?')
    params.push(user.office_id)
  }

  if (office_id) { conditions.push('u.office_id = ?'); params.push(office_id) }
  if (role)      { conditions.push('u.role = ?');      params.push(role) }
  if (status)    { conditions.push('u.status = ?');    params.push(status) }
  if (search) {
    conditions.push('(u.name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)')
    const q = `%${search}%`
    params.push(q, q, q)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await pool.query(`
    SELECT u.id, u.username, u.name, u.email, u.avatar, u.role,
           u.office_id, o.name AS office_name, u.status,
           u.last_login_at, u.created_at
    FROM users u
    LEFT JOIN offices o ON o.id = u.office_id
    ${where}
    ORDER BY u.created_at DESC
  `, params)

  res.json(rows)
})

// POST /api/users
export const createUser = asyncHandler(async (req, res) => {
  const { username, password, name, email, role, office_id } = req.body
  const hash          = await bcrypt.hash(password, 12)
  const resolvedOffice = role === 'superadmin' ? null : (office_id || null)
  const id            = `u${Date.now()}`

  await pool.query(
    `INSERT INTO users (id, username, password_hash, name, email, avatar, role, office_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, username, hash, name, email, name.slice(0,2).toUpperCase(), role, resolvedOffice]
  )
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.name, u.email, u.avatar, u.role,
            u.office_id, o.name AS office_name, u.status, u.created_at
     FROM users u LEFT JOIN offices o ON o.id = u.office_id
     WHERE u.id = ?`,
    [id]
  )
  res.status(201).json(rows[0])
})

// PATCH /api/users/:id
export const updateUser = asyncHandler(async (req, res) => {
  const { username, password, name, email, role, office_id, status, avatar } = req.body
  const updates = []; const params = []

  if (username  !== undefined) { updates.push('username = ?');      params.push(username) }
  if (name      !== undefined) { updates.push('name = ?');          params.push(name) }
  if (avatar    !== undefined) { updates.push('avatar = ?');        params.push(avatar) }
  if (email     !== undefined) { updates.push('email = ?');         params.push(email) }
  if (status    !== undefined) { updates.push('status = ?');        params.push(status) }
  if (role      !== undefined) {
    updates.push('role = ?')
    params.push(role)
    const resolvedOffice = role === 'superadmin' ? null : (office_id !== undefined ? office_id : undefined)
    if (resolvedOffice !== undefined) { updates.push('office_id = ?'); params.push(resolvedOffice) }
  } else if (office_id !== undefined) {
    updates.push('office_id = ?')
    params.push(office_id)
  }
  if (password !== undefined && password !== '') {
    const hash = await bcrypt.hash(password, 12)
    updates.push('password_hash = ?')
    params.push(hash)
  }

  if (!updates.length) return res.json({ message: 'No changes.' })
  params.push(req.params.id)
  await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params)
  res.json({ message: 'User updated.' })
})

// PATCH /api/users/:id/toggle-status
export const toggleStatus = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`SELECT status FROM users WHERE id = ?`, [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'User not found.' })
  const newStatus = rows[0].status === 'active' ? 'inactive' : 'active'
  await pool.query(`UPDATE users SET status = ? WHERE id = ?`, [newStatus, req.params.id])
  res.json({ message: `User ${newStatus}.`, status: newStatus })
})

// DELETE /api/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id)
    return res.status(400).json({ error: 'You cannot delete your own account.' })
  await pool.query(`DELETE FROM users WHERE id = ?`, [req.params.id])
  res.json({ message: 'User deleted.' })
})