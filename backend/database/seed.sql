-- ============================================================
-- Seed Data — DepEd ZamSib Ticketing System
-- Run AFTER schema.sql
-- ============================================================

-- ─── OFFICES ─────────────────────────────────────────────────────────────────

INSERT INTO offices (id, name, icon, description, is_active, sort_order) VALUES
  ('ict',     'ICT Office',     '💻', 'Handles all technology, network, hardware, and software concerns.',     TRUE,  1),
  ('records', 'Records Office', '📁', 'Manages school records, documents, and certifications.',               FALSE, 2),
  ('budget',  'Budget Office',  '💰', 'Handles financial transactions, budgeting, and procurement.',          FALSE, 3),
  ('hr',      'HR Office',      '👥', 'Manages personnel matters, leave applications, and appointments.',     FALSE, 4);

-- ─── SERVICES ────────────────────────────────────────────────────────────────

INSERT INTO services (id, office_id, label, icon, description, sort_order) VALUES
  ('hardware',  'ict', 'Hardware Issue',          '🖥️',  'Desktop, laptop, printer, projector, or peripheral problems.',   1),
  ('software',  'ict', 'Software Issue',          '💾',  'Installation, licensing, crashes, or application errors.',        2),
  ('network',   'ict', 'Network / Internet',      '🌐',  'Connectivity issues, slow internet, or Wi-Fi problems.',          3),
  ('email',     'ict', 'Email & Accounts',        '📧',  'DepEd email setup, password reset, or account access.',           4),
  ('lms',       'ict', 'LMS / E-Learning',        '📚',  'Learning Management System access or issues.',                    5),
  ('data',      'ict', 'Data & Backup',           '💿',  'Data recovery, backup requests, or file restoration.',            6),
  ('cctv',      'ict', 'CCTV / Security',         '📷',  'CCTV installation, maintenance, or footage requests.',            7),
  ('other',     'ict', 'Other ICT Concern',       '🔧',  'Concerns not covered by the above categories.',                   8);

-- ─── USERS (passwords are bcrypt hashes of the shown values) ─────────────────
-- Passwords will be hashed by the seed script — these are plaintext placeholders
-- See database/seed.js for the actual bcrypt hashing

-- superadmin   password: admin123
-- office_admin password: ict2025
-- staff x3     password: staff123

-- ─── TICKET SEQUENCE RESET ───────────────────────────────────────────────────

SELECT setval('ticket_seq', 6);  -- start after seed tickets