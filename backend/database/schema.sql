-- ============================================================
-- DepEd ZamSib Helpdesk & Ticketing System — Database Schema
-- MySQL 8.0+
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- ─── OFFICES ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS offices (
  id          VARCHAR(50)  NOT NULL,
  name        VARCHAR(150) NOT NULL,
  icon        VARCHAR(20)  NOT NULL DEFAULT '🏢',
  description TEXT,
  is_active   TINYINT(1)   NOT NULL DEFAULT 0,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── SERVICES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS services (
  id          VARCHAR(50)  NOT NULL,
  office_id   VARCHAR(50)  NOT NULL,
  label       VARCHAR(150) NOT NULL,
  icon        VARCHAR(20)  NOT NULL DEFAULT '🔧',
  description TEXT,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_services_office FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_services_office ON services(office_id);

-- ─── USERS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(50)  NOT NULL,
  username      VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  avatar        VARCHAR(10)  NOT NULL DEFAULT 'U',
  role          ENUM('superadmin','office_admin','staff') NOT NULL DEFAULT 'staff',
  office_id     VARCHAR(50)  DEFAULT NULL,
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  last_login_at DATETIME     DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email    (email),
  CONSTRAINT fk_users_office FOREIGN KEY (office_id) REFERENCES offices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_office ON users(office_id);
CREATE INDEX idx_users_role   ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ─── TICKETS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tickets (
  id               VARCHAR(30)  NOT NULL,
  office_id        VARCHAR(50)  NOT NULL,
  service_id       VARCHAR(50)  NOT NULL,
  submitter_name   VARCHAR(150) NOT NULL,
  submitter_email  VARCHAR(255) NOT NULL,
  submitter_phone  VARCHAR(30)  DEFAULT NULL,
  submitter_school VARCHAR(200) NOT NULL,
  subject          VARCHAR(300) NOT NULL,
  concern          TEXT         NOT NULL,
  status           ENUM('open','in-progress','resolved','closed') NOT NULL DEFAULT 'open',
  priority         ENUM('high','medium','low')                    NOT NULL DEFAULT 'medium',
  assigned_to_id   VARCHAR(50)  DEFAULT NULL,
  resolution       TEXT         DEFAULT NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_tickets_office   FOREIGN KEY (office_id)      REFERENCES offices(id),
  CONSTRAINT fk_tickets_service  FOREIGN KEY (service_id)     REFERENCES services(id),
  CONSTRAINT fk_tickets_assigned FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tickets_office   ON tickets(office_id);
CREATE INDEX idx_tickets_status   ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to_id);
CREATE INDEX idx_tickets_created  ON tickets(created_at);

-- ─── TICKET ID SEQUENCE ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_seq (
  id      INT      NOT NULL DEFAULT 1,
  seq_val INT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO ticket_seq (id, seq_val) VALUES (1, 0)
  ON DUPLICATE KEY UPDATE id = id;

-- ─── TICKET REPLIES ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_replies (
  id          VARCHAR(50)  NOT NULL,
  ticket_id   VARCHAR(30)  NOT NULL,
  user_id     VARCHAR(50)  DEFAULT NULL,
  author_name VARCHAR(150) NOT NULL,
  message     TEXT         NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_replies_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_replies_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_replies_ticket ON ticket_replies(ticket_id);

-- ─── ACTIVITY LOG ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_log (
  id           VARCHAR(50)  NOT NULL,
  ticket_id    VARCHAR(30)  NOT NULL,
  action       VARCHAR(300) NOT NULL,
  performed_by VARCHAR(150) NOT NULL,
  user_id      VARCHAR(50)  DEFAULT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_activity_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_activity_ticket ON activity_log(ticket_id);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id         INT          NOT NULL AUTO_INCREMENT,
  user_id    VARCHAR(50)  NOT NULL,
  ticket_id  VARCHAR(30)  DEFAULT NULL,
  type       VARCHAR(50)  NOT NULL DEFAULT 'assignment',
  message    TEXT         NOT NULL,
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_notif_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_notif_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ─── CSM SURVEY ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS csm_surveys (
  id                   INT          NOT NULL AUTO_INCREMENT,
  ticket_id            VARCHAR(30)  NOT NULL,
  token                VARCHAR(64)  NOT NULL,
  overall_rating       TINYINT      DEFAULT NULL,
  issue_resolved       TINYINT(1)   DEFAULT NULL,
  response_time_rating TINYINT      DEFAULT NULL,
  staff_rating         TINYINT      DEFAULT NULL,
  comments             TEXT         DEFAULT NULL,
  submitted_at         DATETIME     DEFAULT NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_csm_ticket  (ticket_id),
  UNIQUE KEY uq_csm_token   (token),
  CONSTRAINT fk_csm_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;