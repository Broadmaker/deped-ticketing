// src/modules/offices/offices.controller.js
import pool from '../../config/db.js'
import { asyncHandler } from '../../middleware/errorHandler.js'

// GET /api/offices  (public — used by submit form)
export const listOffices = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT o.id, o.name, o.icon, o.description, o.is_active, o.sort_order,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', s.id, 'label', s.label, 'icon', s.icon,
                 'description', s.description, 'sort_order', s.sort_order
               ) ORDER BY s.sort_order
             ) FILTER (WHERE s.id IS NOT NULL),
             '[]'
           ) AS services
    FROM offices o
    LEFT JOIN services s ON s.office_id = o.id
    GROUP BY o.id
    ORDER BY o.sort_order
  `)
  res.json(rows)
})

// GET /api/offices/:id
export const getOffice = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT o.*, COALESCE(
      json_agg(json_build_object('id',s.id,'label',s.label,'icon',s.icon,'description',s.description,'sort_order',s.sort_order) ORDER BY s.sort_order)
      FILTER (WHERE s.id IS NOT NULL), '[]') AS services
    FROM offices o LEFT JOIN services s ON s.office_id = o.id
    WHERE o.id = $1 GROUP BY o.id
  `, [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'Office not found.' })
  res.json(rows[0])
})

// POST /api/offices
export const createOffice = asyncHandler(async (req, res) => {
  const { id, name, icon, description } = req.body
  const { rows } = await pool.query(`
    INSERT INTO offices (id, name, icon, description, is_active)
    VALUES ($1,$2,$3,$4,FALSE) RETURNING *
  `, [id, name, icon || '🏢', description || null])
  res.status(201).json(rows[0])
})

// PATCH /api/offices/:id
export const updateOffice = asyncHandler(async (req, res) => {
  const { name, icon, description, is_active, sort_order } = req.body
  const updates = []; const params = []

  if (name        !== undefined) { params.push(name);        updates.push(`name = $${params.length}`) }
  if (icon        !== undefined) { params.push(icon);        updates.push(`icon = $${params.length}`) }
  if (description !== undefined) { params.push(description); updates.push(`description = $${params.length}`) }
  if (is_active   !== undefined) { params.push(is_active);   updates.push(`is_active = $${params.length}`) }
  if (sort_order  !== undefined) { params.push(sort_order);  updates.push(`sort_order = $${params.length}`) }

  if (!updates.length) return res.json({ message: 'No changes.' })
  params.push(req.params.id)
  await pool.query(`UPDATE offices SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params)
  res.json({ message: 'Office updated.' })
})

// DELETE /api/offices/:id
export const deleteOffice = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT id FROM offices WHERE id = $1', [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'Office not found.' })
  await pool.query('DELETE FROM offices WHERE id = $1', [req.params.id])
  res.json({ message: 'Office deleted.' })
})

// POST /api/offices/:officeId/services
export const createService = asyncHandler(async (req, res) => {
  const { id, label, icon, description, sort_order } = req.body
  const { rows } = await pool.query(`
    INSERT INTO services (id, office_id, label, icon, description, sort_order)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
  `, [id, req.params.officeId, label, icon || '🔧', description || null, sort_order || 0])
  res.status(201).json(rows[0])
})

// PATCH /api/offices/:officeId/services/:serviceId
export const updateService = asyncHandler(async (req, res) => {
  const { label, icon, description, sort_order } = req.body
  const updates = []; const params = []

  if (label       !== undefined) { params.push(label);       updates.push(`label = $${params.length}`) }
  if (icon        !== undefined) { params.push(icon);        updates.push(`icon = $${params.length}`) }
  if (description !== undefined) { params.push(description); updates.push(`description = $${params.length}`) }
  if (sort_order  !== undefined) { params.push(sort_order);  updates.push(`sort_order = $${params.length}`) }

  if (!updates.length) return res.json({ message: 'No changes.' })
  params.push(req.params.serviceId)
  await pool.query(`UPDATE services SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params)
  res.json({ message: 'Service updated.' })
})

// DELETE /api/offices/:officeId/services/:serviceId
export const deleteService = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM services WHERE id = $1 AND office_id = $2',
    [req.params.serviceId, req.params.officeId])
  res.json({ message: 'Service deleted.' })
})