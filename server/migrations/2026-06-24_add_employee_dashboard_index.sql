-- Add a covering index for dashboard summaries grouped by department and position.
-- This avoids large filesorts that can trigger ER_OUT_OF_SORTMEMORY on MySQL.

SET @index_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'employees'
    AND INDEX_NAME = 'idx_employees_dashboard_position'
);

SET @statement := IF(
  @index_exists = 0,
  'ALTER TABLE employees ADD INDEX idx_employees_dashboard_position (department, position, emp_status)',
  'SELECT 1'
);

PREPARE dashboard_index_statement FROM @statement;
EXECUTE dashboard_index_statement;
DEALLOCATE PREPARE dashboard_index_statement;
