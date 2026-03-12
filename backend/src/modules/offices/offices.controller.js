// src/modules/offices/offices.controller.js
import pool from '../../config/db.js'
import { asyncHandler } from '../../middleware/errorHandler.js'

// GET /api/offices  (public)
export const listOffices = asyncHandler(async (req, res) => {
  // Fetch offices
  const [offices] = await pool.query(
    `SELECT id, name, icon, description, is_active, sort_order FROM offices ORDER BY sort_order`
  )
  // Fetch all services
  const [services] = await pool.query(
    `SELECT id, office_id, label, icon, description, sort_order FROM services ORDER BY sort_order`
  )
  // Join in JS (MySQL 5.7 compatible — avoids JSON_ARRAYAGG issues)
  const result = offices.map(o => ({
    ...o,
    is_active: !!o.is_active,
    services: services.filter(s => s.office_id === o.id),
  }))
  res.json(result)
})

// POST /api/offices
export const createOffice = asyncHandler(async (req, res) => {
  const { id, name, icon, description } = req.body
  await pool.query(
    `INSERT INTO offices (id, name, icon, description, is_active) VALUES (?, ?, ?, ?, 0)`,
    [id, name, icon || '🏢', description || null]
  )
  const [rows] = await pool.query(`SELECT * FROM offices WHERE id = ?`, [id])
  res.status(201).json({ ...rows[0], is_active: !!rows[0].is_active })
})

// PATCH /api/offices/:id
export const updateOffice = asyncHandler(async (req, res) => {
  const { name, icon, description, is_active, sort_order } = req.body
  const updates = []; const params = []

  if (name        !== undefined) { updates.push('name = ?');        params.push(name) }
  if (icon        !== undefined) { updates.push('icon = ?');        params.push(icon) }
  if (description !== undefined) { updates.push('description = ?'); params.push(description) }
  if (is_active   !== undefined) { updates.push('is_active = ?');   params.push(is_active ? 1 : 0) }
  if (sort_order  !== undefined) { updates.push('sort_order = ?');  params.push(sort_order) }

  if (!updates.length) return res.json({ message: 'No changes.' })
  params.push(req.params.id)
  await pool.query(`UPDATE offices SET ${updates.join(', ')} WHERE id = ?`, params)
  res.json({ message: 'Office updated.' })
})

// DELETE /api/offices/:id
export const deleteOffice = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`SELECT id FROM offices WHERE id = ?`, [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'Office not found.' })
  await pool.query(`DELETE FROM offices WHERE id = ?`, [req.params.id])
  res.json({ message: 'Office deleted.' })
})

// POST /api/offices/:officeId/services
export const createService = asyncHandler(async (req, res) => {
  const { id, label, icon, description, sort_order } = req.body
  await pool.query(
    `INSERT INTO services (id, office_id, label, icon, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, req.params.officeId, label, icon || '🔧', description || null, sort_order || 0]
  )
  const [rows] = await pool.query(`SELECT * FROM services WHERE id = ?`, [id])
  res.status(201).json(rows[0])
})

// PATCH /api/offices/:officeId/services/:serviceId
export const updateService = asyncHandler(async (req, res) => {
  const { label, icon, description, sort_order } = req.body
  const updates = []; const params = []

  if (label       !== undefined) { updates.push('label = ?');       params.push(label) }
  if (icon        !== undefined) { updates.push('icon = ?');        params.push(icon) }
  if (description !== undefined) { updates.push('description = ?'); params.push(description) }
  if (sort_order  !== undefined) { updates.push('sort_order = ?');  params.push(sort_order) }

  if (!updates.length) return res.json({ message: 'No changes.' })
  params.push(req.params.serviceId)
  await pool.query(`UPDATE services SET ${updates.join(', ')} WHERE id = ?`, params)
  res.json({ message: 'Service updated.' })
})

// DELETE /api/offices/:officeId/services/:serviceId
export const deleteService = asyncHandler(async (req, res) => {
  await pool.query(
    `DELETE FROM services WHERE id = ? AND office_id = ?`,
    [req.params.serviceId, req.params.officeId]
  )
  res.json({ message: 'Service deleted.' })
})