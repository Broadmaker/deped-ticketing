// src/app.js
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import 'dotenv/config'
import { ENV } from './config/env.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

// Route modules
import authRoutes    from './modules/auth/auth.routes.js'
import ticketRoutes  from './modules/tickets/tickets.routes.js'
import userRoutes    from './modules/users/users.routes.js'
import officeRoutes  from './modules/offices/offices.routes.js'
import reportRoutes  from './modules/reports/reports.routes.js'
import notifRoutes   from './modules/notifications/notifications.routes.js'
import csmRoutes     from './modules/csm/csm.routes.js'
import { verifyMailer } from './services/mailer.js'

const app = express()

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin:      ENV.CLIENT_URL,
  credentials: true,
}))

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 20,
  message: { error: 'Too many login attempts. Please try again later.' },
}))

app.use('/api', rateLimit({
  windowMs: 60 * 1000,  // 1 min
  max: 200,
  message: { error: 'Too many requests. Please slow down.' },
}))

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:  'ok',
    service: 'DepEd ZamSib Ticketing API',
    env:     ENV.NODE_ENV,
    time:    new Date().toISOString(),
  })
})

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/users',   userRoutes)
app.use('/api/offices', officeRoutes)
app.use('/api/reports',        reportRoutes)
app.use('/api/notifications',  notifRoutes)
app.use('/api/csm',            csmRoutes)

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(ENV.PORT, () => {
  console.log('')
  console.log('  🎓 DepEd ZamSib Ticketing API')
  console.log(`  🚀 Running on http://localhost:${ENV.PORT}`)
  console.log(`  🌍 Environment: ${ENV.NODE_ENV}`)
  console.log(`  🔗 Frontend:    ${ENV.CLIENT_URL}`)
  console.log('')
})

verifyMailer()

export default app