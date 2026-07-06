CREATE TABLE IF NOT EXISTS attendance_import_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  import_id CHAR(36) NOT NULL,
  level ENUM('Info', 'Success', 'Warning', 'Error') NOT NULL DEFAULT 'Info',
  source_row_number INT UNSIGNED NULL,
  employee_no VARCHAR(80) NULL,
  message VARCHAR(500) NOT NULL,
  details JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attendance_import_logs_import_id (import_id),
  INDEX idx_attendance_import_logs_level (level),
  CONSTRAINT fk_attendance_import_logs_import_id
    FOREIGN KEY (import_id) REFERENCES attendance_imports(id) ON DELETE CASCADE
) ENGINE=InnoDB;
