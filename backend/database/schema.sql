-- ============================================================
-- DepEd ZamSib Helpdesk & Ticketing System — Database Schema
-- PostgreSQL (compatible with MySQL with minor driver changes)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

CREATE TYPE ticket_status   AS ENUM ('open', 'in-progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE user_role       AS ENUM ('superadmin', 'office_admin', 'staff');
CREATE TYPE user_status     AS ENUM ('active', 'inactive');

-- ─── OFFICES ─────────────────────────────────────────────────────────────────

CREATE TABLE offices (
  id          VARCHAR(50)  PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  icon        VARCHAR(10)  NOT NULL DEFAULT '🏢',
  description TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT FALSE,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── SERVICES ────────────────────────────────────────────────────────────────

CREATE TABLE services (
  id          VARCHAR(50)  PRIMARY KEY,
  office_id   VARCHAR(50)  NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  label       VARCHAR(150) NOT NULL,
  icon        VARCHAR(10)  NOT NULL DEFAULT '🔧',
  description TEXT,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_office ON services(office_id);

-- ─── USERS ───────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            VARCHAR(50)  PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  avatar        VARCHAR(5)   NOT NULL DEFAULT 'U',
  role          user_role    NOT NULL DEFAULT 'staff',
  office_id     VARCHAR(50)  REFERENCES offices(id) ON DELETE SET NULL,
  status        user_status  NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_office   ON users(office_id);
CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_status   ON users(status);

-- ─── TICKETS ─────────────────────────────────────────────────────────────────

CREATE TABLE tickets (
  id               VARCHAR(30)      PRIMARY KEY,   -- e.g. TKT-2025-0001
  office_id        VARCHAR(50)      NOT NULL REFERENCES offices(id),
  service_id       VARCHAR(50)      NOT NULL REFERENCES services(id),
  -- Submitter info (public — not a user account)
  submitter_name   VARCHAR(150)     NOT NULL,
  submitter_email  VARCHAR(255)     NOT NULL,
  submitter_phone  VARCHAR(30),
  submitter_school VARCHAR(200)     NOT NULL,
  -- Ticket content
  subject          VARCHAR(300)     NOT NULL,
  concern          TEXT             NOT NULL,
  -- State
  status           ticket_status    NOT NULL DEFAULT 'open',
  priority         ticket_priority  NOT NULL DEFAULT 'medium',
  -- Assignment
  assigned_to_id   VARCHAR(50)      REFERENCES users(id) ON DELETE SET NULL,
  -- Resolution
  resolution       TEXT,
  -- Timestamps
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_office     ON tickets(office_id);
CREATE INDEX idx_tickets_status     ON tickets(status);
CREATE INDEX idx_tickets_priority   ON tickets(priority);
CREATE INDEX idx_tickets_assigned   ON tickets(assigned_to_id);
CREATE INDEX idx_tickets_created    ON tickets(created_at DESC);

-- ─── TICKET REPLIES ───────────────────────────────────────────────────────────

CREATE TABLE ticket_replies (
  id         VARCHAR(50)  PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
  ticket_id  VARCHAR(30)  NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id    VARCHAR(50)  REFERENCES users(id) ON DELETE SET NULL,
  author_name VARCHAR(150) NOT NULL,   -- snapshot in case user is deleted
  message    TEXT         NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_replies_ticket ON ticket_replies(ticket_id);

-- ─── ACTIVITY LOG ─────────────────────────────────────────────────────────────

CREATE TABLE activity_log (
  id          VARCHAR(50)  PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
  ticket_id   VARCHAR(30)  NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  action      VARCHAR(300) NOT NULL,
  performed_by VARCHAR(150) NOT NULL,   -- name snapshot
  user_id     VARCHAR(50)  REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_ticket ON activity_log(ticket_id);

-- ─── TICKET ID SEQUENCE ───────────────────────────────────────────────────────
-- Used to auto-generate TKT-YYYY-XXXX style IDs

CREATE SEQUENCE ticket_seq START 1;

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_offices_updated_at
  BEFORE UPDATE ON offices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();