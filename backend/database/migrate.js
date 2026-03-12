// backend/database/migrate.js
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pool from '../src/config/db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function migrate() {
  console.log('🔄 Running database migration...')
  const conn = await pool.getConnection()
  try {
    const raw = readFileSync(join(__dirname, 'schema.sql'), 'utf8')

    // Strip single-line comments (-- ...) and blank lines, then split on ;
    const stripped = raw
      .split('\n')
      .map(line => line.replace(/--.*$/, '').trimEnd())
      .join('\n')

    const statements = stripped
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const stmt of statements) {
      try {
        await conn.query(stmt)
      } catch (err) {
        // Ignore "already exists" errors — safe to re-run
        if (
          err.code === 'ER_DUP_KEYNAME'        ||  // duplicate index
          err.code === 'ER_TABLE_EXISTS_ERROR'  ||  // table already exists
          err.code === 'ER_DUP_ENTRY'               // duplicate row
        ) {
          continue
        }
        throw err
      }
    }

    console.log('✅ Schema created successfully.')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    conn.release()
    await pool.end()
  }
}

migrate()