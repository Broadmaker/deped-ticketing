// src/middleware/validate.js
import { z } from 'zod'

// Zod schemas for every request body

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
})

// ── Users ─────────────────────────────────────────────────────────────────────
export const createUserSchema = z.object({
  username:  z.string().min(3).max(50),
  password:  z.string().min(6, 'Password must be at least 6 characters.'),
  name:      z.string().min(2).max(150),
  email:     z.string().email(),
  role:      z.enum(['superadmin', 'office_admin', 'staff']),
  office_id: z.string().nullable().optional(),
})

export const updateUserSchema = z.object({
  username:  z.string().min(3).max(50).optional(),
  password:  z.string().min(6).optional(),
  name:      z.string().min(2).max(150).optional(),
  email:     z.string().email().optional(),
  role:      z.enum(['superadmin', 'office_admin', 'staff']).optional(),
  office_id: z.string().nullable().optional(),
  status:    z.enum(['active', 'inactive']).optional(),
})

// ── Offices ───────────────────────────────────────────────────────────────────
export const createOfficeSchema = z.object({
  id:          z.string().min(1).max(50).regex(/^[a-z0-9_]+$/, 'ID must be lowercase alphanumeric.'),
  name:        z.string().min(2).max(150),
  icon:        z.string().max(10).optional(),
  description: z.string().max(500).optional(),
})

export const updateOfficeSchema = z.object({
  name:        z.string().min(2).max(150).optional(),
  icon:        z.string().max(10).optional(),
  description: z.string().max(500).optional(),
  is_active:   z.boolean().optional(),
  sort_order:  z.number().int().optional(),
})

// ── Services ──────────────────────────────────────────────────────────────────
export const createServiceSchema = z.object({
  id:          z.string().min(1).max(50).regex(/^[a-z0-9_]+$/, 'ID must be lowercase alphanumeric.'),
  label:       z.string().min(2).max(150),
  icon:        z.string().max(10).optional(),
  description: z.string().max(500).optional(),
  sort_order:  z.number().int().optional(),
})

export const updateServiceSchema = z.object({
  label:       z.string().min(2).max(150).optional(),
  icon:        z.string().max(10).optional(),
  description: z.string().max(500).optional(),
  sort_order:  z.number().int().optional(),
})

// ── Tickets ───────────────────────────────────────────────────────────────────
export const createTicketSchema = z.object({
  office_id:        z.string().min(1),
  service_id:       z.string().min(1),
  submitter_name:   z.string().min(2).max(150),
  submitter_email:  z.string().email(),
  submitter_phone:  z.string().max(30).optional().nullable(),
  submitter_school: z.string().min(2).max(200),
  subject:          z.string().min(3, 'Subject is too short.').max(300),
  concern:          z.string().min(3, 'Please describe your concern.'),
})

export const updateTicketSchema = z.object({
  status:         z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
  priority:       z.enum(['high', 'medium', 'low']).optional(),
  assigned_to_id: z.string().nullable().optional(),
  resolution:     z.string().nullable().optional(),
})

// ── Replies ───────────────────────────────────────────────────────────────────
export const createReplySchema = z.object({
  message: z.string().min(1, 'Reply cannot be empty.'),
})

// ── Middleware factory ─────────────────────────────────────────────────────────
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed.',
        details: result.error.errors.map(e => ({
          field:   e.path.join('.'),
          message: e.message,
        })),
      })
    }
    req.body = result.data
    next()
  }
}