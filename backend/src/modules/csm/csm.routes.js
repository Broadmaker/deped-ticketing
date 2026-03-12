// src/modules/csm/csm.routes.js
import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { getSurvey, submitSurvey, getSurveyResults } from './csm.controller.js'

const router = Router()

// Public — no auth needed (submitters access via email link)
router.get ('/:token',   getSurvey)
router.post('/:token',   submitSurvey)

// Admin only
router.get ('/',         authenticate, getSurveyResults)

export default router