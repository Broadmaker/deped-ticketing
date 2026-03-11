// src/modules/tickets/tickets.routes.js
import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate, createTicketSchema, updateTicketSchema, createReplySchema } from '../../middleware/validate.js'
import {
  listTickets, getTicket, createTicket, updateTicket,
  addReply, trackTicket, getStats,
} from './tickets.controller.js'

const router = Router()

// Public routes (no auth)
router.post('/',          validate(createTicketSchema), createTicket)
router.get ('/track/:id', trackTicket)

// Protected routes
router.use(authenticate)
router.get ('/stats',    getStats)
router.get ('/',         listTickets)
router.get ('/:id',      getTicket)
router.patch('/:id',     validate(updateTicketSchema), updateTicket)
router.post ('/:id/replies', validate(createReplySchema), addReply)

export default router