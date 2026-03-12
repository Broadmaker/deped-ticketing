// backend/database/seed.js
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import pool from '../src/config/db.js'

const SALT_ROUNDS = 12

async function seed() {
  console.log('🌱 Seeding database...')
  const conn = await pool.getConnection()

  try {
    await conn.beginTransaction()

    // ── Offices ───────────────────────────────────────────────────────────
    console.log('  Inserting offices...')
    const offices = [
      ['ict',     'ICT Office',     '💻', 'Handles all technology, network, hardware, and software concerns.',  1, 1],
      ['records', 'Records Office', '📁', 'Manages school records, documents, and certifications.',             0, 2],
      ['budget',  'Budget Office',  '💰', 'Handles financial transactions, budgeting, and procurement.',        0, 3],
      ['hr',      'HR Office',      '👥', 'Manages personnel matters, leave applications, and appointments.',   0, 4],
    ]
    for (const [id, name, icon, description, is_active, sort_order] of offices) {
      await conn.query(
        `INSERT INTO offices (id, name, icon, description, is_active, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [id, name, icon, description, is_active, sort_order]
      )
    }

    // ── Services ──────────────────────────────────────────────────────────
    console.log('  Inserting services...')
    const services = [
      ['hardware', 'ict', 'Hardware Issue',     '🖥️',  'Desktop, laptop, printer, projector, or peripheral problems.', 1],
      ['software', 'ict', 'Software Issue',     '💾',  'Installation, licensing, crashes, or application errors.',      2],
      ['network',  'ict', 'Network / Internet', '🌐',  'Connectivity issues, slow internet, or Wi-Fi problems.',        3],
      ['email',    'ict', 'Email & Accounts',   '📧',  'DepEd email setup, password reset, or account access.',         4],
      ['lms',      'ict', 'LMS / E-Learning',   '📚',  'Learning Management System access or issues.',                  5],
      ['data',     'ict', 'Data & Backup',      '💿',  'Data recovery, backup requests, or file restoration.',          6],
      ['cctv',     'ict', 'CCTV / Security',    '📷',  'CCTV installation, maintenance, or footage requests.',          7],
      ['other',    'ict', 'Other ICT Concern',  '🔧',  'Concerns not covered by the above categories.',                 8],
    ]
    for (const [id, office_id, label, icon, description, sort_order] of services) {
      await conn.query(
        `INSERT INTO services (id, office_id, label, icon, description, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [id, office_id, label, icon, description, sort_order]
      )
    }

    // ── Users ─────────────────────────────────────────────────────────────
    console.log('  Hashing passwords and inserting users...')
    const users = [
      { id: 'u001', username: 'admin',     password: 'admin123', name: 'System Administrator', email: 'admin@deped-zamsib.gov.ph',       role: 'superadmin',   office_id: null,  avatar: 'SA', status: 'active' },
      { id: 'u002', username: 'ict.admin', password: 'ict2025',  name: 'Ricardo Villanueva',   email: 'rvillanueva@deped-zamsib.gov.ph', role: 'office_admin', office_id: 'ict', avatar: 'RV', status: 'active' },
      { id: 'u003', username: 'jdelacruz', password: 'staff123', name: 'Juan dela Cruz',       email: 'jdelacruz@deped-zamsib.gov.ph',   role: 'staff',        office_id: 'ict', avatar: 'JD', status: 'active' },
      { id: 'u004', username: 'areyes',    password: 'staff123', name: 'Ana Reyes',            email: 'areyes@deped-zamsib.gov.ph',       role: 'staff',        office_id: 'ict', avatar: 'AR', status: 'active' },
      { id: 'u005', username: 'mlopez',    password: 'staff123', name: 'Mark Lopez',           email: 'mlopez@deped-zamsib.gov.ph',       role: 'staff',        office_id: 'ict', avatar: 'ML', status: 'inactive' },
    ]
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, SALT_ROUNDS)
      await conn.query(
        `INSERT INTO users (id, username, password_hash, name, email, avatar, role, office_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [u.id, u.username, hash, u.name, u.email, u.avatar, u.role, u.office_id || null, u.status]
      )
    }

    // ── Sample Tickets ────────────────────────────────────────────────────
    console.log('  Inserting sample tickets...')
    const tickets = [
      { id:'TKT-2025-0001', office_id:'ict', service_id:'hardware', submitter_name:'Maria Santos',     submitter_email:'msantos@deped.gov.ph',    submitter_phone:'09171234567', submitter_school:'Ipil Central School',        subject:'Projector not working in Room 3',             concern:'The LCD projector in Room 3 stopped working. It powers on but shows no image. We have a presentation this Friday.',          status:'resolved',    priority:'high',   assigned_to_id:'u003', resolution:'Replaced HDMI cable and cleaned lens. Projector now fully functional.',               created_at:'2025-06-10 08:22:00', updated_at:'2025-06-11 14:05:00' },
      { id:'TKT-2025-0002', office_id:'ict', service_id:'network',  submitter_name:'Pedro Ramos',      submitter_email:'pramos@deped.gov.ph',     submitter_phone:'09281234567', submitter_school:'Naga Elementary School',     subject:'No internet connection in the computer lab',  concern:'All computers in the computer lab lost internet connection since Monday morning. The router lights appear normal.',          status:'in-progress', priority:'medium', assigned_to_id:'u004', resolution:null,                                                                               created_at:'2025-06-12 09:00:00', updated_at:'2025-06-12 10:30:00' },
      { id:'TKT-2025-0003', office_id:'ict', service_id:'email',    submitter_name:'Lourdes Bautista', submitter_email:'lbautista@deped.gov.ph',  submitter_phone:null,          submitter_school:'Zamboanga Sibugay NHS',      subject:'Cannot access DepEd email account',          concern:'I have been locked out of my DepEd email account for 3 days. Password reset is not sending to my recovery email.',          status:'open',        priority:'high',   assigned_to_id:null,   resolution:null,                                                                               created_at:'2025-06-13 07:45:00', updated_at:'2025-06-13 07:45:00' },
      { id:'TKT-2025-0004', office_id:'ict', service_id:'software', submitter_name:'Roberto Cruz',     submitter_email:'rcruz@deped.gov.ph',      submitter_phone:'09451234567', submitter_school:'Tungawan Central School',    subject:'MS Office license expired on all units',     concern:'All 20 computers in our school have expired MS Office licenses. We cannot open or edit any Word or Excel files.',            status:'open',        priority:'low',    assigned_to_id:null,   resolution:null,                                                                               created_at:'2025-06-14 13:20:00', updated_at:'2025-06-14 13:20:00' },
      { id:'TKT-2025-0005', office_id:'ict', service_id:'data',     submitter_name:'Gloria Mendoza',   submitter_email:'gmendoza@deped.gov.ph',   submitter_phone:'09331234567', submitter_school:'Siay National High School',  subject:'Accidentally deleted enrollment data files', concern:'Our enrollment data for SY 2024-2025 was accidentally deleted from the shared drive. We need it recovered urgently.',       status:'resolved',    priority:'medium', assigned_to_id:'u003', resolution:'Files recovered from shadow copy backup. All enrollment data restored and verified.', created_at:'2025-06-08 11:00:00', updated_at:'2025-06-09 16:30:00' },
      { id:'TKT-2025-0006', office_id:'ict', service_id:'hardware', submitter_name:'Cesar Villanueva', submitter_email:'cvillanueva@deped.gov.ph', submitter_phone:'09201234567', submitter_school:'Kabasalan NHS',              subject:'Printer jammed and showing error code E5',   concern:'The office printer is showing error code E5 and will not print. We have tried clearing the jam but it persists.',            status:'closed',      priority:'low',    assigned_to_id:'u004', resolution:'Replaced worn feed roller. Printer operational.',                                   created_at:'2025-06-05 08:00:00', updated_at:'2025-06-06 09:00:00' },
    ]
    for (const t of tickets) {
      await conn.query(
        `INSERT INTO tickets (id,office_id,service_id,submitter_name,submitter_email,submitter_phone,
          submitter_school,subject,concern,status,priority,assigned_to_id,resolution,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE id = id`,
        [t.id,t.office_id,t.service_id,t.submitter_name,t.submitter_email,t.submitter_phone,
         t.submitter_school,t.subject,t.concern,t.status,t.priority,t.assigned_to_id,t.resolution,
         t.created_at,t.updated_at]
      )
    }

    // ── Sample Replies ────────────────────────────────────────────────────
    console.log('  Inserting sample replies and activity logs...')
    const replies = [
      [randomUUID(), 'TKT-2025-0001', 'u003', 'Juan dela Cruz', 'Received your ticket. Will check the projector tomorrow morning.', '2025-06-10 09:00:00'],
      [randomUUID(), 'TKT-2025-0001', 'u003', 'Juan dela Cruz', 'Issue resolved. It was a faulty HDMI cable. Replaced and tested.',  '2025-06-11 14:05:00'],
      [randomUUID(), 'TKT-2025-0002', 'u004', 'Ana Reyes',      'On-site inspection scheduled for tomorrow.',                        '2025-06-12 10:30:00'],
    ]
    for (const [id, ticket_id, user_id, author_name, message, created_at] of replies) {
      await conn.query(
        `INSERT INTO ticket_replies (id,ticket_id,user_id,author_name,message,created_at) VALUES (?,?,?,?,?,?)`,
        [id, ticket_id, user_id, author_name, message, created_at]
      )
    }

    const logs = [
      ['TKT-2025-0001', 'Ticket submitted',            'System',               null,   '2025-06-10 08:22:00'],
      ['TKT-2025-0001', 'Assigned to Juan dela Cruz',  'System Administrator', 'u001', '2025-06-10 08:45:00'],
      ['TKT-2025-0001', 'Status → In Progress',        'Juan dela Cruz',       'u003', '2025-06-10 09:00:00'],
      ['TKT-2025-0001', 'Resolution note updated',     'Juan dela Cruz',       'u003', '2025-06-11 14:00:00'],
      ['TKT-2025-0001', 'Status → Resolved',           'Juan dela Cruz',       'u003', '2025-06-11 14:05:00'],
      ['TKT-2025-0002', 'Ticket submitted',            'System',               null,   '2025-06-12 09:00:00'],
      ['TKT-2025-0002', 'Assigned to Ana Reyes',       'System Administrator', 'u001', '2025-06-12 09:30:00'],
      ['TKT-2025-0002', 'Status → In Progress',        'Ana Reyes',            'u004', '2025-06-12 10:30:00'],
      ['TKT-2025-0003', 'Ticket submitted',            'System',               null,   '2025-06-13 07:45:00'],
      ['TKT-2025-0004', 'Ticket submitted',            'System',               null,   '2025-06-14 13:20:00'],
      ['TKT-2025-0005', 'Ticket submitted',            'System',               null,   '2025-06-08 11:00:00'],
      ['TKT-2025-0005', 'Assigned to Juan dela Cruz',  'System Administrator', 'u001', '2025-06-08 11:30:00'],
      ['TKT-2025-0005', 'Status → Resolved',           'Juan dela Cruz',       'u003', '2025-06-09 16:30:00'],
      ['TKT-2025-0006', 'Ticket submitted',            'System',               null,   '2025-06-05 08:00:00'],
      ['TKT-2025-0006', 'Assigned to Ana Reyes',       'System Administrator', 'u001', '2025-06-05 08:30:00'],
      ['TKT-2025-0006', 'Status → Closed',             'Ana Reyes',            'u004', '2025-06-06 09:00:00'],
    ]
    for (const [ticket_id, action, performed_by, user_id, created_at] of logs) {
      await conn.query(
        `INSERT INTO activity_log (id,ticket_id,action,performed_by,user_id,created_at) VALUES (?,?,?,?,?,?)`,
        [randomUUID(), ticket_id, action, performed_by, user_id, created_at]
      )
    }

    // Reset ticket sequence counter to 6
    await conn.query(`UPDATE ticket_seq SET seq_val = 6 WHERE id = 1`)

    await conn.commit()
    console.log('✅ Database seeded successfully.')
    console.log('')
    console.log('  Demo accounts:')
    console.log('  ┌─────────────┬──────────────┬──────────────┐')
    console.log('  │ Username    │ Password     │ Role         │')
    console.log('  ├─────────────┼──────────────┼──────────────┤')
    console.log('  │ admin       │ admin123     │ Super Admin  │')
    console.log('  │ ict.admin   │ ict2025      │ Office Admin │')
    console.log('  │ jdelacruz   │ staff123     │ Staff        │')
    console.log('  │ areyes      │ staff123     │ Staff        │')
    console.log('  └─────────────┴──────────────┴──────────────┘')
  } catch (err) {
    await conn.rollback()
    console.error('❌ Seed failed:', err.message)
    process.exit(1)
  } finally {
    conn.release()
    await pool.end()
  }
}

seed()