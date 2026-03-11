// src/modules/auth/auth.routes.js
import { Router } from 'express'
import { login, getMe, logout } from './auth.controller.js'
import { authenticate } from '../../middleware/auth.js'
import { validate, loginSchema } from '../../middleware/validate.js'

const router = Router()

router.post('/login',  validate(loginSchema), login)
router.get ('/me',     authenticate, getMe)
router.post('/logout', authenticate, logout)

export default router