CREATE DATABASE IF NOT EXISTS campus_pulse;
USE campus_pulse;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_code_hash VARCHAR(255) NULL,
  verification_expires_at DATETIME NULL,
  verification_last_sent_at DATETIME NULL,
  verification_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resources (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  building VARCHAR(120) NOT NULL,
  category ENUM('Study area', 'Computer lab', 'Printer', 'Cafeteria') NOT NULL,
  tags VARCHAR(255) NULL,
  opening_hour TIME NULL,
  closing_hour TIME NULL,
  max_capacity INT UNSIGNED NULL,
  current_condition VARCHAR(50) NULL,
  latitude DECIMAL(9, 6) NULL,
  longitude DECIMAL(9, 6) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_resources_category (category),
  INDEX idx_resources_building (building),
  INDEX idx_resources_is_active (is_active),
  INDEX idx_resources_coords (latitude, longitude),
  CONSTRAINT fk_resources_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resource_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  reported_condition VARCHAR(50) NOT NULL,
  comment TEXT NULL,
  is_moderated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_reports_resource_created (resource_id, created_at),
  INDEX idx_reports_user_resource_created (user_id, resource_id, created_at),
  INDEX idx_reports_is_moderated (is_moderated),
  CONSTRAINT fk_reports_resource
    FOREIGN KEY (resource_id) REFERENCES resources(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reports_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS votes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  vote_type ENUM('confirm', 'dispute') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_votes_report_user (report_id, user_id),
  INDEX idx_votes_report_type (report_id, vote_type),
  INDEX idx_votes_user (user_id),
  CONSTRAINT fk_votes_report
    FOREIGN KEY (report_id) REFERENCES reports(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_votes_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);