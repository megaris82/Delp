-- Helpdesk database schema
-- Engine: InnoDB, Charset: utf8mb4

CREATE DATABASE IF NOT EXISTS helpdesk
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE helpdesk;

-- --------------------------------------------------------
-- Users
-- --------------------------------------------------------
CREATE TABLE users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(50) NOT NULL UNIQUE,
  password        VARCHAR(255) NOT NULL,
  firstName       VARCHAR(50),
  lastName        VARCHAR(50),
  email           VARCHAR(100),
  country         VARCHAR(80),
  city            VARCHAR(80),
  address         VARCHAR(150),
   `role`          ENUM('user', 'technician', 'admin') NOT NULL DEFAULT 'user',
  register_status ENUM('pending', 'denied', 'accepted') NOT NULL DEFAULT 'pending',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- --------------------------------------------------------
-- Announcements
-- --------------------------------------------------------
CREATE TABLE announcements (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(150) NOT NULL,
  body       TEXT,
  created_by INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- --------------------------------------------------------
-- Preseeded admin account (username: admin / password: adminpass123)
-- The password hash below is bcrypt of 'adminpass123'.
-- --------------------------------------------------------
INSERT INTO users (username, password, firstName, lastName, email, `role`, register_status)
SELECT 'admin', '$2a$10$XtIRAi3IT9KBQg5GXChVuePcDYBxZhQWyWpsL0EQztcnnYWqLwyd2', 'Admin', 'Admin', 'admin@helpdesk.local', 'admin', 'accepted'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- --------------------------------------------------------
-- Categories
-- --------------------------------------------------------
CREATE TABLE categories (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(80) NOT NULL,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- --------------------------------------------------------
-- Tickets
-- --------------------------------------------------------
CREATE TABLE tickets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  created_by  INT,
  assigned_to INT NULL,
  `status`    ENUM('open', 'in_progress', 'closed') NOT NULL DEFAULT 'open',
  category_id INT,
  description TEXT,
  resolution  TEXT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by)  REFERENCES users (id)    ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users (id)    ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- --------------------------------------------------------
-- Attachments
-- --------------------------------------------------------
CREATE TABLE attachments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id   INT,
  uploaded_by INT,
  file_path   VARCHAR(255),
  FOREIGN KEY (ticket_id)   REFERENCES tickets (id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users (id)   ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- --------------------------------------------------------
-- Comments
-- --------------------------------------------------------
CREATE TABLE comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id  INT,
  user_id    INT,
  body       TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users (id)   ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
