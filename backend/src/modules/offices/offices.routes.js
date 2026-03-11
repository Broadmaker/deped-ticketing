// src/modules/offices/offices.routes.js
import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth.js'
import { validate, createOfficeSchema, updateOfficeSchema, createServiceSchema, updateServiceSchema } from '../../middleware/validate.js'
import {
  listOffices, getOffice, createOffice, updateOffice, deleteOffice,
  createService, updateService, deleteService,
} from './offices.controller.js'

const router = Router()

// Public
router.get('/', listOffices)
router.get('/:id', getOffice)

// Protected — superadmin only
router.use(authenticate)
router.post  ('/',                            authorize('superadmin'), validate(createOfficeSchema), createOffice)
router.patch ('/:id',                         authorize('superadmin'), validate(updateOfficeSchema), updateOffice)
router.delete('/:id',                         authorize('superadmin'), deleteOffice)
router.post  ('/:officeId/services',          authorize('superadmin'), validate(createServiceSchema), createService)
router.patch ('/:officeId/services/:serviceId', authorize('superadmin'), validate(updateServiceSchema), updateService)
router.delete('/:officeId/services/:serviceId', authorize('superadmin'), deleteService)

export default router