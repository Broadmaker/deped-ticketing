// src/modules/notifications/notifications.routes.js
import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { getNotifications, markRead, markAllRead } from './notifications.controller.js'

const router = Router()
router.use(authenticate)
router.get  ('/',            getNotifications)
router.patch('/read-all',    markAllRead)
router.patch('/:id/read',    markRead)

export default router