// src/modules/reports/reports.routes.js
import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { getSummary } from './reports.controller.js'

const router = Router()
router.use(authenticate)
router.get('/summary', getSummary)

export default router