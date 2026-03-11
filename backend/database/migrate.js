// backend/database/migrate.js
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pool from '../src/config/db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function migrate() {
  console.log('🔄 Running database migration...')
  const client = await pool.connect()
  try {
    const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8')
    await client.query(sql)
    console.log('✅ Schema created successfully.')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()