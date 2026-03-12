// src/modules/users/users.routes.js
import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth.js'
import { validate, createUserSchema, updateUserSchema } from '../../middleware/validate.js'
import { listUsers, getUser, createUser, updateUser, toggleStatus, deleteUser } from './users.controller.js'

const router = Router()

router.use(authenticate)

router.get  ('/',              authorize('superadmin', 'office_admin'), listUsers)
router.get  ('/:id',           authorize('superadmin'), getUser)
router.post ('/',              authorize('superadmin'), validate(createUserSchema), createUser)
router.patch('/:id',           authorize('superadmin'), validate(updateUserSchema), updateUser)
router.patch('/:id/toggle-status', authorize('superadmin'), toggleStatus)
router.delete('/:id',          authorize('superadmin'), deleteUser)

export default router