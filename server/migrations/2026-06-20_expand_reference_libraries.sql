-- STRH HRIS reference-library expansion
-- Additive migration: safe to run more than once.

CREATE TABLE IF NOT EXISTS hr_reference_values (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  parent_id INT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  effective_from DATE NULL,
  effective_to DATE NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_hr_reference_category_code (category, code),
  UNIQUE KEY uniq_hr_reference_category_name (category, name),
  INDEX idx_hr_reference_category_active (category, is_active, sort_order),
  INDEX idx_hr_reference_parent_id (parent_id),
  CONSTRAINT fk_hr_reference_parent_id FOREIGN KEY (parent_id)
    REFERENCES hr_reference_values(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
