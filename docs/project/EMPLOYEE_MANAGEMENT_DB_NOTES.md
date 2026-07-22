# Employee Management Database Notes

## What is connected

- Dashboard metrics now load from `GET /api/dashboard`.
- Employee Management now uses MySQL through `/api/employees`.
- The employee 201 file is database-backed for:
  - Personal / core employee information
  - Family
  - Children
  - Educational background
  - Civil service eligibility
  - Work experience
  - Organization membership
  - Training
  - Salary records
  - Service records
  - IPCR

## Tables

- `employees` stores the core 201 profile and fields used for search, filters, and dashboard summaries.
- 201 subsection tables store JSON payload rows linked by `employee_id`:
  - `employee_family_records`
  - `employee_child_records`
  - `employee_education_records`
  - `employee_civil_service_records`
  - `employee_work_records`
  - `employee_organization_records`
  - `employee_training_records`
  - `employee_salary_records`
  - `employee_service_records`
  - `employee_ipcr_records`
- All subsection tables cascade delete when an employee is deleted.

## API Routes

- `GET /api/dashboard`
- `GET /api/employees`
- `POST /api/employees`
- `GET /api/employees/:id`
- `PATCH /api/employees/:id`
- `DELETE /api/employees/:id`
- `POST /api/employees/:id/sections/:section`
- `PATCH /api/employees/:id/sections/:section/:rowId`
- `DELETE /api/employees/:id/sections/:section/:rowId`

Supported section keys are `family`, `children`, `education`, `civilService`, `work`, `organization`, `training`, `salary`, `service`, and `ipcr`.

## Deferred Modules

- Attendance & Leave is intentionally a placeholder and has no mock data.
- Leave Management is intentionally a placeholder and has no mock data.
- Self-Service Portal is intentionally a placeholder and has no mock data.
- Reports & Analytics is intentionally a placeholder and has no mock data.
- The 201 Leave Balance tab is intentionally deferred until the Attendance & Leave module is implemented.

## Future Integration Notes

- Use `employees.id` as the stable foreign key for attendance, leave, self-service, and reports.
- Use `employees.employee_no` only as the visible employee ID; it can be edited and should not be the relational key.
- Build leave balances in dedicated leave tables later, then connect the 201 Leave Balance tab to those tables.
- Reports should aggregate from the real employee tables and the future attendance, leave, and self-service tables.
- No mock employee seed is inserted. Empty MySQL tables should produce empty dashboard/list states.
