CREATE TABLE IF NOT EXISTS attendance_import_exceptions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  import_id CHAR(36) NOT NULL,
  employee_no VARCHAR(80) NULL,
  punch_at DATETIME NULL,
  source VARCHAR(40) NOT NULL,
  source_device VARCHAR(120) NULL,
  raw_payload JSON NULL,
  status ENUM('Open', 'Mapped', 'Reprocessed', 'Ignored') NOT NULL DEFAULT 'Open',
  mapped_employee_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  resolved_by INT UNSIGNED NULL,
  resolved_at DATETIME NULL,
  resolution_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_attendance_import_exceptions_import_id (import_id),
  INDEX idx_attendance_import_exceptions_status (status),
  INDEX idx_attendance_import_exceptions_employee_no (employee_no),
  CONSTRAINT fk_attendance_import_exceptions_import_id
    FOREIGN KEY (import_id) REFERENCES attendance_imports(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_import_exceptions_mapped_employee_id
    FOREIGN KEY (mapped_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  CONSTRAINT fk_attendance_import_exceptions_resolved_by
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
