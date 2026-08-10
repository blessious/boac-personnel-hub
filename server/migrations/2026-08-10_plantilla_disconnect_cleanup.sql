UPDATE employees e
SET e.item_no = NULL,
    e.department = '',
    e.position = '',
    e.status = 'Unassigned',
    e.emp_status = 'Inactive',
    e.lifecycle_state = 'Inactive',
    e.current_org_unit_ref_id = NULL
WHERE e.is_hidden = 0
  AND NOT EXISTS (
    SELECT 1
    FROM plantilla_occupancies po
    WHERE po.employee_id = e.id
      AND po.status = 'Active'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM non_plantilla_engagements ne
    WHERE ne.employee_id = e.id
      AND ne.status = 'Active'
  )
  AND (
    COALESCE(e.item_no, '') <> ''
    OR COALESCE(e.department, '') <> ''
    OR COALESCE(e.position, '') <> ''
    OR e.current_org_unit_ref_id IS NOT NULL
  );
