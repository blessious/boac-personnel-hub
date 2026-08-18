SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE plantilla_items ADD INDEX idx_plantilla_list_status_item (item_status, item_number)',
    'SELECT ''idx_plantilla_list_status_item already exists'''
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'plantilla_items'
    AND index_name = 'idx_plantilla_list_status_item'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE personnel_movements ADD INDEX idx_personnel_movements_list (status, action_type, created_at, control_number)',
    'SELECT ''idx_personnel_movements_list already exists'''
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'personnel_movements'
    AND index_name = 'idx_personnel_movements_list'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE personnel_movements ADD INDEX idx_personnel_movements_created_control (created_at, control_number)',
    'SELECT ''idx_personnel_movements_created_control already exists'''
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'personnel_movements'
    AND index_name = 'idx_personnel_movements_created_control'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE personnel_movements ADD INDEX idx_personnel_movements_status_created_control (status, created_at, control_number)',
    'SELECT ''idx_personnel_movements_status_created_control already exists'''
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'personnel_movements'
    AND index_name = 'idx_personnel_movements_status_created_control'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE leave_applications ADD INDEX idx_leave_applications_status_created (status, created_at)',
    'SELECT ''idx_leave_applications_status_created already exists'''
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'leave_applications'
    AND index_name = 'idx_leave_applications_status_created'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE dtr_correction_requests ADD INDEX idx_dtr_correction_requests_list (status, request_type, work_date, created_at)',
    'SELECT ''idx_dtr_correction_requests_list already exists'''
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'dtr_correction_requests'
    AND index_name = 'idx_dtr_correction_requests_list'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE attendance_imports ADD INDEX idx_attendance_imports_imported_at (imported_at)',
    'SELECT ''idx_attendance_imports_imported_at already exists'''
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'attendance_imports'
    AND index_name = 'idx_attendance_imports_imported_at'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE attendance_import_logs ADD INDEX idx_attendance_import_logs_import_id_id (import_id, id)',
    'SELECT ''idx_attendance_import_logs_import_id_id already exists'''
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'attendance_import_logs'
    AND index_name = 'idx_attendance_import_logs_import_id_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE attendance_import_exceptions ADD INDEX idx_attendance_import_exceptions_list (import_id, status, created_at)',
    'SELECT ''idx_attendance_import_exceptions_list already exists'''
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'attendance_import_exceptions'
    AND index_name = 'idx_attendance_import_exceptions_list'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE attendance_import_exceptions ADD INDEX idx_attendance_import_exceptions_status_created (status, created_at)',
    'SELECT ''idx_attendance_import_exceptions_status_created already exists'''
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'attendance_import_exceptions'
    AND index_name = 'idx_attendance_import_exceptions_status_created'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
