-- Persistent metadata for short-lived document exports.
-- Generated files remain in the preview directory only until delivery or cleanup.

CREATE TABLE IF NOT EXISTS document_export_jobs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL UNIQUE,
  export_type VARCHAR(40) NOT NULL,
  employee_id CHAR(36) NULL,
  created_by INT UNSIGNED NULL,
  expires_at DATETIME NOT NULL,
  downloaded_at DATETIME NULL,
  download_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_document_export_jobs_expiry (expires_at),
  INDEX idx_document_export_jobs_employee (employee_id),
  CONSTRAINT fk_document_export_jobs_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_document_export_jobs_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
