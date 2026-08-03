ALTER TABLE employee_family_records
  ADD INDEX idx_employee_family_records_employee_created_id (employee_id, created_at, id);

ALTER TABLE employee_child_records
  ADD INDEX idx_employee_child_records_employee_created_id (employee_id, created_at, id);

ALTER TABLE employee_education_records
  ADD INDEX idx_employee_education_records_employee_created_id (employee_id, created_at, id);

ALTER TABLE employee_civil_service_records
  ADD INDEX idx_employee_civil_service_records_employee_created_id (employee_id, created_at, id);

ALTER TABLE employee_work_records
  ADD INDEX idx_employee_work_records_employee_created_id (employee_id, created_at, id);

ALTER TABLE employee_organization_records
  ADD INDEX idx_employee_organization_records_employee_created_id (employee_id, created_at, id);

ALTER TABLE employee_training_records
  ADD INDEX idx_employee_training_records_employee_created_id (employee_id, created_at, id);

ALTER TABLE employee_salary_records
  ADD INDEX idx_employee_salary_records_employee_created_id (employee_id, created_at, id);

ALTER TABLE employee_service_records
  ADD INDEX idx_employee_service_records_employee_created_id (employee_id, created_at, id);

ALTER TABLE employee_ipcr_records
  ADD INDEX idx_employee_ipcr_records_employee_created_id (employee_id, created_at, id);
