ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS lifecycle_state VARCHAR(30) NOT NULL DEFAULT 'Active' AFTER emp_status,
  ADD COLUMN IF NOT EXISTS current_org_unit_ref_id INT UNSIGNED NULL AFTER lifecycle_state;

ALTER TABLE personnel_movements
  MODIFY status ENUM('Draft','Submitted','Reviewed','Approved','Scheduled','Posted','Rejected','Reversed') NOT NULL DEFAULT 'Draft',
  ADD COLUMN IF NOT EXISTS scheduled_at DATETIME NULL AFTER approved_at,
  ADD COLUMN IF NOT EXISTS activation_error TEXT NULL AFTER reversal_reason;

CREATE TABLE IF NOT EXISTS non_plantilla_engagements (
  id CHAR(36) NOT NULL PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  engagement_type ENUM('JO','COS','Casual','Contractual','Other') NOT NULL,
  org_unit_ref_id INT UNSIGNED NOT NULL,
  designation VARCHAR(200) NOT NULL,
  contract_number VARCHAR(160) NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  rate DECIMAL(12,2) NULL,
  funding_source VARCHAR(200) NULL,
  supervisor VARCHAR(200) NULL,
  remarks TEXT NULL,
  status ENUM('Scheduled','Active','Expired','Terminated','Renewed') NOT NULL,
  previous_engagement_id CHAR(36) NULL,
  created_by INT UNSIGNED NULL,
  ended_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ended_at DATETIME NULL,
  active_employee_id CHAR(36) GENERATED ALWAYS AS (CASE WHEN status='Active' THEN employee_id ELSE NULL END) STORED,
  UNIQUE KEY uniq_active_non_plantilla_employee (active_employee_id),
  INDEX idx_engagement_employee_dates (employee_id,date_from,date_to),
  INDEX idx_engagement_status_end (status,date_to),
  INDEX idx_engagement_org_status (org_unit_ref_id,status),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  FOREIGN KEY (org_unit_ref_id) REFERENCES hr_reference_values(id) ON DELETE RESTRICT,
  FOREIGN KEY (previous_engagement_id) REFERENCES non_plantilla_engagements(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (ended_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS temporary_assignments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  movement_id CHAR(36) NOT NULL,
  assignment_type ENUM('Detail','Designation','Reassignment','Job Rotation') NOT NULL,
  org_unit_ref_id INT UNSIGNED NULL,
  position_id INT UNSIGNED NULL,
  assignment_label VARCHAR(200) NULL,
  date_from DATE NOT NULL,
  date_to DATE NULL,
  status ENUM('Scheduled','Active','Ended','Reversed') NOT NULL,
  created_by INT UNSIGNED NULL,
  ended_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME NULL,
  INDEX idx_temporary_employee_dates (employee_id,date_from,date_to),
  INDEX idx_temporary_status_dates (status,date_from,date_to),
  UNIQUE KEY uniq_temporary_movement (movement_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  FOREIGN KEY (movement_id) REFERENCES personnel_movements(id) ON DELETE RESTRICT,
  FOREIGN KEY (org_unit_ref_id) REFERENCES hr_reference_values(id) ON DELETE RESTRICT,
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (ended_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS plantilla_reconciliations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  plantilla_item_id CHAR(36) NOT NULL,
  occupancy_id CHAR(36) NOT NULL,
  effective_from DATE NOT NULL,
  remarks TEXT NOT NULL,
  classification_before VARCHAR(50) NOT NULL,
  before_snapshot_json JSON NOT NULL,
  after_snapshot_json JSON NOT NULL,
  confirmed_by INT UNSIGNED NULL,
  confirmed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_reconciled_employee (employee_id),
  UNIQUE KEY uniq_reconciled_occupancy (occupancy_id),
  INDEX idx_reconciliation_item (plantilla_item_id,confirmed_at),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
  FOREIGN KEY (plantilla_item_id) REFERENCES plantilla_items(id) ON DELETE RESTRICT,
  FOREIGN KEY (occupancy_id) REFERENCES plantilla_occupancies(id) ON DELETE RESTRICT,
  FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
