// src/config/env.js
import 'dotenv/config'

export const ENV = {
  PORT:           process.env.PORT           || 4000,
  NODE_ENV:       process.env.NODE_ENV       || 'development',
  JWT_SECRET:     process.env.JWT_SECRET     || 'dev_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  CLIENT_URL:     process.env.CLIENT_URL     || 'http://localhost:3000',
}

if (ENV.NODE_ENV === 'production' && ENV.JWT_SECRET === 'dev_secret_change_in_production') {
  console.error('❌ FATAL: JWT_SECRET must be set in production!')
  process.exit(1)
}