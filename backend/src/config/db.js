// src/config/db.js
import mysql from 'mysql2/promise'
import 'dotenv/config'

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  database:           process.env.DB_NAME     || 'deped_ticketing',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+08:00',
})

// Test connection on startup
pool.getConnection().then(conn => {
  if (process.env.NODE_ENV !== 'test') console.log('✅ MySQL connected.')
  conn.release()
}).catch(err => {
  console.error('❌ MySQL connection error:', err.message)
})

export default pool