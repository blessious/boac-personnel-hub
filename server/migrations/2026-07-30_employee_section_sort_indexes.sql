SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE employee_family_records ADD INDEX idx_employee_family_records_employee_created_id (employee_id, created_at, id)',
    'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'employee_family_records'
    AND index_name = 'idx_employee_family_records_employee_created_id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE employee_child_records ADD INDEX idx_employee_child_records_employee_created_id (employee_id, created_at, id)',
    'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'employee_child_records'
    AND index_name = 'idx_employee_child_records_employee_created_id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE employee_education_records ADD INDEX idx_employee_education_records_employee_created_id (employee_id, created_at, id)',
    'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'employee_education_records'
    AND index_name = 'idx_employee_education_records_employee_created_id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE employee_civil_service_records ADD INDEX idx_employee_civil_service_records_employee_created_id (employee_id, created_at, id)',
    'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'employee_civil_service_records'
    AND index_name = 'idx_employee_civil_service_records_employee_created_id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE employee_work_records ADD INDEX idx_employee_work_records_employee_created_id (employee_id, created_at, id)',
    'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'employee_work_records'
    AND index_name = 'idx_employee_work_records_employee_created_id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE employee_organization_records ADD INDEX idx_employee_organization_records_employee_created_id (employee_id, created_at, id)',
    'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'employee_organization_records'
    AND index_name = 'idx_employee_organization_records_employee_created_id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE employee_training_records ADD INDEX idx_employee_training_records_employee_created_id (employee_id, created_at, id)',
    'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'employee_training_records'
    AND index_name = 'idx_employee_training_records_employee_created_id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE employee_salary_records ADD INDEX idx_employee_salary_records_employee_created_id (employee_id, created_at, id)',
    'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'employee_salary_records'
    AND index_name = 'idx_employee_salary_records_employee_created_id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE employee_service_records ADD INDEX idx_employee_service_records_employee_created_id (employee_id, created_at, id)',
    'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'employee_service_records'
    AND index_name = 'idx_employee_service_records_employee_created_id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE employee_ipcr_records ADD INDEX idx_employee_ipcr_records_employee_created_id (employee_id, created_at, id)',
    'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'employee_ipcr_records'
    AND index_name = 'idx_employee_ipcr_records_employee_created_id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
