// src/middleware/errorHandler.js

// Central error handler — always returns JSON
export function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  console.error(err)

  // Zod validation error
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed.',
      details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    })
  }

  // PostgreSQL unique constraint
  if (err.code === '23505') {
    const field = err.detail?.match(/\(([^)]+)\)/)?.[1] || 'field'
    return res.status(409).json({ error: `${field} already exists.` })
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist.' })
  }

  // Known operational errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message })
  }

  // Unknown — don't leak internals in production
  const isDev = process.env.NODE_ENV === 'development'
  res.status(500).json({
    error: 'Internal server error.',
    ...(isDev && { detail: err.message, stack: err.stack }),
  })
}

// Wrap async route handlers — no try/catch needed in controllers
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

// 404 handler
export function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` })
}