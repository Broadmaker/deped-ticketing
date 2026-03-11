// src/modules/users/users.controller.js
import bcrypt from 'bcryptjs'
import pool from '../../config/db.js'
import { asyncHandler } from '../../middleware/errorHandler.js'

const SALT_ROUNDS = 12

function makeAvatar(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function makeId() {
  return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

// GET /api/users
export const listUsers = asyncHandler(async (req, res) => {
  const { role, office_id, status, search } = req.query
  const conditions = []
  const params = []

  if (role)      { params.push(role);      conditions.push(`u.role = $${params.length}`) }
  if (office_id) { params.push(office_id); conditions.push(`u.office_id = $${params.length}`) }
  if (status)    { params.push(status);    conditions.push(`u.status = $${params.length}`) }
  if (search) {
    params.push(`%${search}%`)
    const i = params.length
    conditions.push(`(u.name ILIKE $${i} OR u.username ILIKE $${i} OR u.email ILIKE $${i})`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows } = await pool.query(`
    SELECT u.id, u.username, u.name, u.email, u.avatar, u.role,
           u.office_id, o.name AS office_name, u.status,
           u.last_login_at, u.created_at
    FROM users u
    LEFT JOIN offices o ON o.id = u.office_id
    ${where}
    ORDER BY u.created_at ASC
  `, params)

  res.json(rows)
})

// GET /api/users/:id
export const getUser = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT u.id, u.username, u.name, u.email, u.avatar, u.role,
           u.office_id, o.name AS office_name, u.status, u.last_login_at, u.created_at
    FROM users u
    LEFT JOIN offices o ON o.id = u.office_id
    WHERE u.id = $1
  `, [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'User not found.' })
  res.json(rows[0])
})

// POST /api/users
export const createUser = asyncHandler(async (req, res) => {
  const { username, password, name, email, role, office_id } = req.body
  const id   = makeId()
  const hash = await bcrypt.hash(password, SALT_ROUNDS)
  const avatar = makeAvatar(name)
  const resolvedOffice = role === 'superadmin' ? null : (office_id || null)

  const { rows } = await pool.query(`
    INSERT INTO users (id, username, password_hash, name, email, avatar, role, office_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING id, username, name, email, avatar, role, office_id, status, created_at
  `, [id, username, hash, name, email, avatar, role, resolvedOffice])

  res.status(201).json(rows[0])
})

// PATCH /api/users/:id
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { username, password, name, email, role, office_id, status } = req.body

  const { rows: existing } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
  if (!existing[0]) return res.status(404).json({ error: 'User not found.' })

  const updates = []
  const params  = []

  if (username) { params.push(username); updates.push(`username = $${params.length}`) }
  if (name)     { params.push(name);     updates.push(`name = $${params.length}`); updates.push(`avatar = $${params.length}`); params.push(makeAvatar(name)); params.pop(); params.push(name); }
  if (email)    { params.push(email);    updates.push(`email = $${params.length}`) }
  if (role)     { params.push(role);     updates.push(`role = $${params.length}`) }
  if (status)   { params.push(status);   updates.push(`status = $${params.length}`) }
  if (password) {
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    params.push(hash); updates.push(`password_hash = $${params.length}`)
  }
  if (name) {
    params.push(makeAvatar(name)); updates.push(`avatar = $${params.length}`)
  }
  if (office_id !== undefined) {
    const resolvedRole = role || existing[0].role
    params.push(resolvedRole === 'superadmin' ? null : office_id)
    updates.push(`office_id = $${params.length}`)
  }

  if (updates.length === 0) return res.json({ message: 'No changes.' })

  params.push(id)
  await pool.query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
    params
  )

  res.json({ message: 'User updated.' })
})

// PATCH /api/users/:id/toggle-status
export const toggleStatus = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT status FROM users WHERE id = $1', [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'User not found.' })
  const newStatus = rows[0].status === 'active' ? 'inactive' : 'active'
  await pool.query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2', [newStatus, req.params.id])
  res.json({ status: newStatus })
})

// DELETE /api/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account.' })
  const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [id])
  if (!rows[0]) return res.status(404).json({ error: 'User not found.' })
  await pool.query('DELETE FROM users WHERE id = $1', [id])
  res.json({ message: 'User deleted.' })
})