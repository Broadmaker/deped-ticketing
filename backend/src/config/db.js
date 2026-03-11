// src/config/db.js
import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'deped_ticketing',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Connection pool settings
  max:              10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

// Test connection on startup
pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('✅ PostgreSQL connected.')
  }
})

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message)
})

export default pool