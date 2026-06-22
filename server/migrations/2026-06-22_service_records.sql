-- Service Record generation
-- Additive migration for MySQL 8.0+.
-- The application initializer dynamically matches employees.id.

CREATE TABLE IF NOT EXISTS service_record_entries (
  id CHAR(36) NOT NULL PRIMARY KEY, employee_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL, service_from DATE NOT NULL, service_to DATE NULL,
  position_title VARCHAR(200) NOT NULL, department VARCHAR(200) NULL, agency VARCHAR(200) NULL,
  appointment_status VARCHAR(80) NULL, annual_salary DECIMAL(12,2) NULL, salary_grade INT UNSIGNED NULL, salary_step INT UNSIGNED NULL,
  item_number VARCHAR(120) NULL, branch VARCHAR(120) NULL, leave_without_pay VARCHAR(120) NULL,
  separation_date DATE NULL, separation_cause VARCHAR(200) NULL, remarks TEXT NULL,
  created_by INT UNSIGNED NULL, updated_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_service_record_employee_period(employee_id,service_from,service_to),
  FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
 ) ENGINE=InnoDB;
