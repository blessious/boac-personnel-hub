# STRH HRIS Project Completion Audit

**Audit date:** 2026-07-27  
**Repository:** `C:\laragon\www\HRIS`  
**Scope:** React 19, TypeScript, Vite, TanStack Router, Node.js, MySQL, SQL migrations, and Python document/export tooling  
**Change constraint:** No application code was modified. This audit is the only file added.

## Executive assessment

The repository is a substantial working HRIS, not a prototype. The production build succeeds, the TypeScript/React application has connected API clients for its major implemented workflows, the Node server has server-side authorization on most handlers, and all Python files compile. However, the system is **not deployment-ready** because several issues can corrupt or expose HR data:

1. Employee accounts can update HR-controlled employee master fields and every 201-file JSON section on their own record.
2. Personnel movements of type **Renewal** and **Other** can be posted even though posting performs no corresponding business update.
3. Soft-hidden employees remain included in dashboard and report totals.
4. PDS/WES generated-file downloads are not bound to the user or generation job, and filenames can collide.
5. The advertised database backup omits attendance/DTR, schedules, notifications, sessions, and other operational tables, while the included account hashes and HR data are stored as unencrypted JSON.
6. Frontend action visibility frequently uses hard-coded roles while the backend uses configurable permissions. This produces enabled controls that return 403 and hides controls from users who were explicitly granted the permission.
7. The SQL migrations cannot recreate the application schema; most tables and columns are created or altered dynamically at server startup.

## Inspection and validation performed

- Inspected all 16 route files under `src/routes`.
- Inspected all frontend API clients under `src/lib`, shared auth/navigation/settings logic, and workflow components.
- Inspected the complete route dispatcher and handlers in `server/index.mjs`.
- Inspected `server/assignments.mjs`, `movements.mjs`, `plantilla.mjs`, `service-records.mjs`, and `reports.mjs`.
- Inspected all 9 SQL migration files and compared them with `latest database/hris_db.sql` and runtime schema initialization.
- Inspected all Python files under `server` and `scripts`, including PDS, WES, DTR, leave, service-record, and personnel/plantilla exports.
- Searched the tracked repository for TODO, FIXME, mock, placeholder, temporary, and “Coming soon” code.
- Reconciled frontend API usage against backend routes.
- Ran `npm run build`: **passed**, with large-chunk warnings.
- Ran `npm run lint`: **passed with 16 warnings**, all `react-refresh/only-export-components`.
- Compiled every Python file with `py_compile`: **passed**, with one `SyntaxWarning` in the obsolete `server/fix_attendance.py`.
- No automated application test files were found.

## Severity scale

| Severity | Meaning |
|---|---|
| Critical | Security, privacy, data-integrity, recovery, or deployment-reproducibility failure that should be fixed first. |
| High | Core workflow is incomplete, misleading, inaccessible, or likely to produce incorrect operational results. |
| Medium | Important state, validation, error handling, or maintainability gap that should be resolved before broad rollout. |
| Low | Quality, usability, repository hygiene, or optional hardening issue. |

## Findings by module

### Authentication

| ID | Severity | Affected files | Current behavior | Expected behavior | Recommended fix |
|---|---|---|---|---|---|
| AUTH-01 | Critical | `server/index.mjs` (`handleUpdateUser`, `handleDeleteUser`, `hasActiveSuperAdmin`) | A Super Admin can demote or delete the last active Super Admin. The “active Super Admin” check is used when creating/promoting accounts but not to preserve the last account during update/delete. | At least one active, usable Super Admin must always remain. | In the same transaction as update/delete, lock and count active Super Admins excluding the target; reject deactivation, demotion, or deletion when it would leave zero. Add concurrent-request tests. |
| AUTH-02 | High | `src/lib/auth.tsx`, `src/components/layout/navigation.ts`, `src/routes/__root.tsx`, `src/routes/attendance.tsx`, `leave.tsx`, `plantilla.tsx`, `movements.tsx`, `service-records.tsx`, `schedules.tsx`, `employees.references.tsx` | Route access mostly uses the permission array, but many page actions use hard-coded role helpers (`canWriteHrRecords`, `canReadHrRecords`) or the unrelated `can("edit")` mapping to `employees.write`. Configured permission changes therefore do not reliably change UI behavior. | Every route, tab, button, and API handler must use the same permission key. | Replace role helper checks with `hasPermission()` for the module-specific key; retain role names only as default permission templates. Add a permission matrix integration test for every role and module. |
| AUTH-03 | Medium | `src/routes/__root.tsx`, `src/lib/auth.tsx` | While authentication is loading, the provider returns `null`. Unauthorized routes also briefly return `null` and redirect to `/`, with no explicit access-denied or session-load error state. | Users should see a loading state, a session failure state, or a clear 403 page. | Add an application bootstrap loader and an access-denied route; preserve the requested URL where appropriate and distinguish network failure from an unauthenticated session. |
| AUTH-04 | Medium | `server/index.mjs` (`readBody`, mutation routing, session cookie) | Session cookies are `HttpOnly` and `SameSite=Lax`, but state-changing routes have no CSRF token or explicit Origin/Host validation. | Mutations should be protected even if deployment topology or cookie policy changes. | Add same-origin Origin/Host validation or a CSRF token for non-ADMS mutations; document reverse-proxy requirements. |

### Dashboard

| ID | Severity | Affected files | Current behavior | Expected behavior | Recommended fix |
|---|---|---|---|---|---|
| DASH-01 | High | `server/index.mjs` (`handleDashboard`), `server/reports.mjs`, `src/routes/index.tsx` | Most dashboard employee queries read all rows in `employees`, while the employee list treats `is_hidden = 1` as deleted. Hidden employees remain in totals and demographic charts. | Dashboard, directory, and reports should apply one documented active/archive scope. | Add `is_hidden = 0` to current-workforce queries, or expose explicit “active/archive/all” scopes. Centralize the predicate and regression-test totals after hiding an employee. |
| DASH-02 | High | `server/index.mjs` (`DEFAULT_ROLE_PERMISSIONS`, `handleDashboard`), `src/routes/index.tsx` | The Employee role has `dashboard.view`; the backend returns organization-wide demographics to any caller with that permission. The frontend hides the HR dashboard only because the employee lacks `employees.read`. | API authorization must enforce the same privacy boundary as the UI. | Require `employees.read` for organization-wide dashboard metrics or return a separate employee-scoped dashboard payload. |
| DASH-03 | Medium | `src/routes/index.tsx` | A dashboard load failure displays an error banner but leaves metric variables at zero, making failure look like valid zero data. There is no retry button. | Failed data should not be rendered as real totals. | Render a blocking error/empty panel with Retry, and show skeletons or “Unavailable” rather than zero until data is loaded. |
| DASH-04 | Low | `src/routes/index.tsx` | The greeting always says “Good morning,” and stat-card spark lines/trend directions are static decoration rather than calculated trends. | Labels and trends should be accurate or clearly decorative. | Calculate greeting by local time; calculate trends from historical data or remove trend semantics. |

### Employees

| ID | Severity | Affected files | Current behavior | Expected behavior | Recommended fix |
|---|---|---|---|---|---|
| EMP-01 | Critical | `server/index.mjs` (`canWriteEmployeeRecord`, `handleUpdateEmployee`, section CRUD), `src/routes/employees.$id.tsx`, `src/routes/self-service.tsx` | A linked employee can PATCH their own complete employee payload, including employee number, biometric ID, department, position, employment status, lifecycle state, organization link, schedules, DTR noter flags, and `regular`. They can also create/update/delete every 201 section, including salary, service, and IPCR. The UI exposes the same edit flag across all tabs. | Employee self-service should only edit an approved allowlist of personal/contact fields and designated self-service sections; HR-controlled changes should use HR workflows/approval. | Split self-service DTOs/endpoints from HR employee endpoints. Enforce field and section allowlists server-side, add approval/versioning where required, and reject over-posted fields. |
| EMP-02 | High | `server/index.mjs` (`handleUpdateEmployee`), `server/assignments.mjs`, `server/movements.mjs` | Direct employee updates are blocked for some Plantilla-owned fields only when an active Plantilla occupancy exists. Active non-Plantilla engagements are not similarly protected, so department, position/status, and lifecycle data can drift from engagement records. | Assignment-owned fields must only change through Plantilla, engagement, or movement workflows. | Centralize assignment ownership checks for both Plantilla and non-Plantilla employees and make denormalized employee fields derived/synchronized transactionally. |
| EMP-03 | High | `src/routes/leave.tsx`, `src/lib/employees-api.ts` | The Leave page loads only page 1 with 100 employees. Employees beyond the first 100 cannot be selected for leave entry or ledger review. | All eligible employees must be searchable/selectable regardless of population. | Use server-side employee search/autocomplete, or page through all results as the movement/service-record pages do. |
| EMP-04 | High | `server/index.mjs` (`EMPLOYEE_SECTION_TABLES`, section CRUD), `src/routes/employees.$id.tsx` | 201 sections store arbitrary `payload` JSON with no per-section server schema, required fields, size limits, or value validation. TypeScript form shapes do not protect direct API calls. | Every 201 section should have a versioned schema and server validation. | Add Zod/JSON-schema validation per section, normalize dates/numbers, reject unknown keys where appropriate, and migrate existing payloads with schema versions. |
| EMP-05 | Medium | `server/index.mjs` (`handleDeleteEmployee`, `handleGetEmployee`), `src/routes/employees.tsx` | “Delete” only sets `is_hidden = 1`. There is no archive list, restore action, archived-status explanation, or consistent exclusion from downstream modules. | Soft deletion should be an explicit archive workflow with restore and consistent query rules. | Rename the action to Archive, add archive metadata and restore UI/API, and consistently scope downstream queries. |
| EMP-06 | Medium | `src/routes/employees.$id.tsx`, `src/routes/settings.tsx`, `server/index.mjs` | Images are stored as client-provided data URLs in database LONGTEXT fields. Employee photos have only client-side size checking; branding images have no size/dimension validation. The backend accepts arbitrary strings. | Images should be validated server-side and stored with controlled MIME type, dimensions, and size. | Add upload endpoints, MIME/magic-byte checks, resizing, storage paths/object storage, and database metadata rather than large base64 payloads. |

### Attendance and DTR

| ID | Severity | Affected files | Current behavior | Expected behavior | Recommended fix |
|---|---|---|---|---|---|
| ATT-01 | High | `src/routes/attendance.tsx`, `src/routes/schedules.tsx`, `src/lib/auth.tsx`, `server/index.mjs` | Attendance management UI is enabled by HR/Super Admin role rather than `attendance.write`. Schedule routing requires `attendance.write`, listing additionally requires `attendance.read` plus `employees.read`, and correction listing/creation contains direct role checks. Custom permission assignments are inconsistent. | Attendance read/write/approval/self-service capabilities should be permission-driven end to end. | Define a documented permission matrix and replace role checks with `attendance.read`, `attendance.write`, `approvals.manage`, and self-service ownership checks. |
| ATT-02 | High | `src/routes/attendance.tsx`, `server/index.mjs` (`parseUploadedDtrFile`) | Both import dialogs accept and validate `.xls`, but the backend always rejects `.xls` and instructs the user to save as `.xlsx`. | The file chooser and backend should advertise the same formats. | Remove `.xls` from `accept` and validation text, or add a safe `.xls` parser/conversion path. |
| ATT-03 | High | `src/lib/attendance-api.ts`, `src/routes/attendance.tsx`, `src/routes/requests.tsx`, `server/index.mjs` | A working correction-cancel endpoint/client exists, but no page calls `cancelDtrCorrectionRequest`. Employees can submit and track a pending request but cannot withdraw it. | Pending employee requests should expose a confirmed Cancel action. | Add ownership-aware cancel controls in Attendance and My Requests with pending-only confirmation and refresh. |
| ATT-04 | High | `src/routes/attendance.tsx`, `src/routes/admin.tsx`, `src/lib/attendance-api.ts`, `server/index.mjs` | Import errors tell HR to check “Admin > Error Log,” but default HR has no `admin.errors` permission. The detailed import-log endpoint/client exists but is not used. | The importer should see row-level results immediately without requiring unrelated admin access. | Add an import-result dialog using `/api/attendance/imports/:id/logs`, include retry/export, and reserve global error logs for administrators. |
| ATT-05 | Medium | `src/lib/attendance-api.ts`, `server/index.mjs` | Legacy/alternate endpoints are not used by the frontend: `POST /api/attendance/import`, `POST /api/attendance/import-file`, `POST /api/attendance/import-all-dtr`, `GET /api/attendance/export`, `GET /api/attendance/export/mass`, `PATCH /api/attendance/biometrics/:id`, and `POST /api/attendance/noters`. | Supported API surface should be intentional, documented, and tested. | Remove deprecated aliases after a compatibility window or mark/document them; connect noter management and CSV export if they are required features. |
| ATT-06 | Medium | `src/routes/attendance.tsx` | Main DTR, corrections, employees, noters, realtime status, and device-load failures are mostly toast-only and often replace data with empty arrays or leave stale content. There is no persistent error/retry state for most panels. | Each independently loaded panel should distinguish loading, empty, failed, and stale states. | Add per-panel state objects, inline Retry, last-updated indication, and abort stale requests. |
| ATT-07 | Medium | `server/index.mjs` (`prepareDtrExport`, download/preview handlers) | Generated DTR files are authorized at generation time, but download/preview is authorized only by broad `attendance.read`; no export-job ownership or employee check is applied to the filename. | Employees should only retrieve their own DTR jobs; HR access should be auditable and scoped. | Resolve the filename through `dtr_export_jobs`, verify creator/employee or elevated permission, and use an opaque one-time job token. |

### Leave

| ID | Severity | Affected files | Current behavior | Expected behavior | Recommended fix |
|---|---|---|---|---|---|
| LEAVE-01 | Critical | `src/routes/self-service.tsx`, `src/routes/leave.tsx`, `server/index.mjs` (`handleCreateLeaveApplication`) | The frontend counts weekdays, but the backend trusts client-supplied `daysRequested`. It does not robustly validate date format/order, recompute workdays, enforce advance notice, detect overlapping applications, apply holidays/half-days, or prevent insufficient/negative credit. | Leave duration and eligibility must be calculated and validated server-side from policy, calendar, and existing applications. | Implement a versioned leave-policy/calendar service; recompute chargeable days server-side; validate overlaps, notice, balance, holidays, weekends, and partial days; return warnings separately from blockers. |
| LEAVE-02 | High | `server/index.mjs` (`handleDecideLeaveApplication`, `changeLeaveBalance`) | Approval always deducts `days_requested`, even when the decision records different approved days with pay, without pay, or other. Re-decisions reverse/reapply the requested amount. | Ledger impact should match the approved chargeable credit and leave-credit group. | Calculate the exact approved credit charge transactionally, store it on the application, and use that immutable amount for reversals. |
| LEAVE-03 | High | `src/routes/leave.tsx`, `src/lib/auth.tsx`, `server/index.mjs` | Leave management buttons use `can("edit")`, which checks `employees.write`, while the backend requires `leave.write`. A customized role can see unusable controls or lack controls it is allowed to use. | UI and API should both use `leave.write`. | Gate leave type, manual application, delete, and adjustment actions with `hasPermission("leave.write")`; keep approval on `approvals.manage`. |
| LEAVE-04 | High | `src/routes/leave.tsx` | Employee selection is limited to the first 100 employees. | Every employee should be available through server-side search. | Replace the fixed list with debounced API search and pagination. |
| LEAVE-05 | High | `src/routes/requests.tsx`, `src/routes/self-service.tsx`, `server/index.mjs` | Employees cannot cancel/withdraw their own pending leave application. The `Cancelled` state exists, but deletion requires `leave.write` and decision changes require approval permission. | An employee should be able to withdraw their own pending request, with an audit event. | Add an ownership-checked pending-only cancel endpoint and expose it in Self-Service/My Requests. |
| LEAVE-06 | Medium | `src/routes/leave.tsx`, `src/routes/self-service.tsx` | Page-level load errors are toast-only on the HR page; the self-service leave summary silently becomes empty on failure. | Loading failure must not look like no leave data. | Add persistent error/retry states and preserve last good data with a stale indicator. |
| LEAVE-07 | Medium | `src/routes/self-service.tsx`, `server/index.mjs` | Leave types carry requirement lists and the application stores `requirements_payload`, but the self-service form has no attachment upload or requirement-completion workflow. | Required documents should be captured, validated, reviewed, and included in audit history. | Add secure attachment storage, per-requirement completion fields, size/type scanning, reviewer access, and retention rules. |

### Plantilla

| ID | Severity | Affected files | Current behavior | Expected behavior | Recommended fix |
|---|---|---|---|---|---|
| PLAN-01 | High | `src/lib/assignments-api.ts`, `server/assignments.mjs`, `src/routes/employees.tsx`, `src/routes/plantilla.tsx` | Non-Plantilla engagement create/update/renew/terminate endpoints and clients exist, but no page consumes them. Initial engagement can be created only during employee onboarding; existing JO/COS/Casual contracts cannot be managed through the UI. | HR should be able to list, renew, edit scheduled engagements, and terminate active engagements. | Add an Engagements panel/page with expiry queues, history, renewal linkage, termination confirmation, and permission `engagements.manage`. |
| PLAN-02 | Medium | `src/routes/plantilla.tsx` | List, settings, and reference failures are toast-only. The main page has no explicit initial loading/error state and can render an empty table after failure. | Failed load should be distinguishable from no Plantilla records. | Add page/panel loading, error, empty, and Retry states. |

### Personnel Movements

| ID | Severity | Affected files | Current behavior | Expected behavior | Recommended fix |
|---|---|---|---|---|---|
| MOVE-01 | Critical | `server/movements.mjs`, `src/lib/movements-api.ts`, `src/routes/movements.tsx` | `Renewal` and `Other` are selectable action types. The posting transaction has no branch for either action, yet still marks the movement `Posted` and records snapshots/events. | Every postable action must have defined, validated business effects, or must be explicitly non-posting/document-only. | Implement renewal behavior (normally linked engagement/appointment dates and service history); define “Other” semantics or remove it; add a defensive final `else` that rejects unimplemented action types. |
| MOVE-02 | High | `src/routes/movements.tsx`, `src/lib/movements-api.ts`, `server/movements.mjs` | “Supporting documents” are parsed from lines into `{name, reference}` JSON. No file is uploaded, verified, retained, or downloadable. | Supporting documents should be actual controlled attachments or the UI must clearly say “references only.” | Add secure attachment records/storage and audit links, or rename the field to Document References and prevent claims of uploaded support. |
| MOVE-03 | High | `src/routes/movements.tsx`, `src/lib/auth.tsx`, `server/movements.mjs` | Prepare visibility uses HR/Super Admin role while backend authorization uses `movements.write`; approval uses the correct permission. | Configurable movement permissions must control UI and API consistently. | Replace `canWriteHrRecords` with `hasPermission("movements.write")`. |
| MOVE-04 | Medium | `server/movements.mjs`, `src/routes/movements.tsx` | Scheduled movement activation runs inside the API process every five minutes. Failures are stored and shown only when a user opens movement details; there is no operational alert/escalation. | Failed scheduled personnel actions should be visible immediately to responsible HR/admin users. | Emit persistent notifications/error-log entries, add an “activation failed” queue, and provide a safe retry action with idempotency. |

### Service Records

| ID | Severity | Affected files | Current behavior | Expected behavior | Recommended fix |
|---|---|---|---|---|---|
| SERV-01 | High | `server/service-records.mjs`, `server/index.mjs`, `src/routes/employees.$id.tsx` | The service-record builder queries `employee_service_records` into `legacy` but never maps or includes those rows. Service entries entered in the 201 “Service” section are silently absent from the Service Records module/export. | Legacy/201 service periods should be included, migrated, or explicitly deprecated with a visible warning. | Map and deduplicate legacy rows, or migrate them transactionally into `service_record_entries` and remove the duplicate source. Add migration reporting. |
| SERV-02 | High | `server/service_record_export.py`, `server/service-records.mjs` | PDF/XLSX output is explicitly labeled “GENERIC SERVICE RECORD - NOT THE OFFICIAL STRH TEMPLATE.” | Deployment should use the approved STRH/CSC service-record format and certification/signatory fields. | Obtain the approved template, map all required fields, add certification/signature metadata, and visually validate representative multi-page records. |
| SERV-03 | High | `src/routes/service-records.tsx`, `src/lib/auth.tsx`, `server/service-records.mjs` | UI management uses HR/Super Admin role while backend uses `service_records.write`; dynamically granted permissions do not work consistently. | Use `service_records.read/write` throughout. | Replace role helpers with specific permission checks and add own-record read-only behavior explicitly. |
| SERV-04 | Medium | `src/routes/service-records.tsx` | Employee-list and record load failures are toast-only; failed selection can leave stale records visible. | Selected employee, loading, empty, failed, and stale states should be explicit. | Clear or mark stale records on employee change, add inline error/Retry, and abort superseded loads. |

### Reports

| ID | Severity | Affected files | Current behavior | Expected behavior | Recommended fix |
|---|---|---|---|---|---|
| REPT-01 | High | `server/reports.mjs`, `src/routes/reports.tsx` | Employee totals/distributions include `is_hidden = 1` rows, unlike the Employee directory. | Report scope must match documented current/archived rules. | Apply a shared scope predicate and show the scope/as-of date in UI and exports. |
| REPT-02 | High | `src/routes/reports.tsx`, `src/lib/reports-api.ts`, `server/reports.mjs` | Reports implements only one current-state personnel/Plantilla report family. No attendance, leave, movement, service-record, employee masterlist, retirement/loyalty, or configurable report workflows exist. | Required operational and management report families should be implemented and permissioned. | Agree a report catalog, then implement server-side filters, totals, exports, saved definitions, and access tests in deployment priority order. |
| REPT-03 | Medium | `server/reports.mjs`, `src/routes/reports.tsx` | Department charts are limited to 12, top positions to 15, and Plantilla item export data to 500 rows. The UI explains only the 12-row preview; exports can silently omit Plantilla items beyond 500. | UI limits may be previews, but exported detail must be complete or disclose truncation. | Remove export limits or paginate/stream all rows; return truncation metadata and display it prominently. |
| REPT-04 | Medium | `src/routes/reports.tsx`, `server/reports.mjs` | There are no date, office, employment type, active/archive, or as-of filters. “Current encoded HRIS records” is the only scope. | Users should be able to run reproducible reports with explicit parameters. | Add validated server-side filters, include parameters and generated-by metadata in exports, and support saved report presets later. |

### Employee Self-Service

| ID | Severity | Affected files | Current behavior | Expected behavior | Recommended fix |
|---|---|---|---|---|---|
| ESS-01 | High | `src/routes/self-service.tsx` | “File Overtime,” “Request Certificate,” and “Schedule Change” are visible buttons whose only action is `toast.info("Coming soon")`. The dashboard “Request Certificate” shortcut ultimately leads to this placeholder. | Visible service actions should open a working workflow or be clearly disabled/hidden. | Build the workflows and endpoints, or remove/disable the cards with an explicit availability label until complete. |
| ESS-02 | High | `src/routes/requests.tsx`, `src/lib/requests-api.ts` | My Requests is a client-side merge of leave applications and DTR corrections only. There is no generic request table/API, document requests, overtime, schedule changes, attachments, SLA, or unified audit trail. | My Requests should represent every supported employee request consistently. | Add a request/workflow domain model or adapters backed by a unified server endpoint, with type, status, owner, approver, events, attachments, and actions. |
| ESS-03 | Critical | `src/routes/employees.$id.tsx`, `src/routes/self-service.tsx`, `server/index.mjs` | Self-service editing inherits the unrestricted own-record behavior described in EMP-01. | Self-service edits must be field-scoped and controlled. | Complete EMP-01 before enabling self-service profile editing in production. |
| ESS-04 | Medium | `src/routes/self-service.tsx` | The service page silently converts leave-history load failure into no data, while current request status shows only the latest five leave requests and excludes DTR corrections. | Failure and partial coverage should be explicit. | Use the unified request API, add persistent error/Retry, and label limited previews with a View All link. |

### Administration

| ID | Severity | Affected files | Current behavior | Expected behavior | Recommended fix |
|---|---|---|---|---|---|
| ADMIN-01 | Critical | `server/index.mjs` (`handleCreateBackup`), `src/routes/admin.tsx` | “Data Backup” exports only a selected table list. It omits `sessions`, `password_history`, `notifications`, all attendance logs/imports/DTR/corrections/export jobs, biometric devices, shift templates/assignments, schedule overrides, and salary adjustment tables. It is not a recoverable full-system backup. | A backup labeled database/system backup must capture the complete schema and required data or clearly be labeled partial HR master-data export. | Prefer a tested MySQL logical/physical backup plus manifest. If JSON remains, discover/version all tables, include schema/constraints, and verify restore equivalence. |
| ADMIN-02 | Critical | `server/index.mjs`, `src/routes/admin.tsx`, `.gitignore` | Backup JSON contains user password hashes and extensive HR PII, stored unencrypted on the same server and downloadable through the UI. There is no encryption, off-system copy, integrity signature, or retention control. | Backups must be encrypted, access-controlled, integrity-checked, and stored separately according to policy. | Encrypt at rest with managed keys, restrict/audit downloads, use off-system storage, sign manifests, and define retention/destruction rules. |
| ADMIN-03 | High | `server/index.mjs`, `src/routes/admin.tsx`, setup/start scripts | There is no restore endpoint/tool, scheduled daily/monthly backup, retention rotation, failure alert, or restoration test. | Recovery must be automated and proven before deployment. | Create an operations runbook and controlled restore tool; schedule backups; add retention, monitoring, and documented restore drills. |
| ADMIN-04 | Critical | `server/migrations/*.sql`, `server/index.mjs`, `latest database/hris_db.sql` | Nine migrations cover only fragments of the schema. Most tables/columns/indexes/constraints are created or mutated by `initializeDatabase()` and module initializers at boot. A clean database cannot be reproduced from migrations alone, and no migration version table records applied changes. | Schema creation and upgrades must be deterministic, ordered, reviewable, and repeatable without relying on application startup side effects. | Generate a complete baseline migration, convert every runtime DDL change into versioned migrations, add migration tracking/locking, and make application startup validate rather than mutate production schema. |
| ADMIN-05 | Medium | `server/index.mjs`, `src/routes/admin.tsx` | Audit/error/import logs are fixed to recent limits (generally 100/200) with no pagination, date/user/action filters, retention policy, or export. | Administrators should be able to investigate complete retained history within policy. | Add indexed server-side pagination/filtering, retention configuration, and controlled export. |
| ADMIN-06 | Medium | `server/fix_attendance.py`, `scripts/seed-mock-201.mjs`, `artifacts/*` | A tracked one-off patch script points to `C:/Users/admin/Videos/HRPMIS` outside this repository and contains mojibake. A mock 201 seeder and old combined/copied source artifacts are tracked without a production guard. No runtime frontend mock dataset was found. | Production repository contents should be intentional and environment-safe. | Remove/archive the obsolete patch script and copied source artifacts; require an explicit development environment flag and confirmation for mock seeders; document that mock data must never run against production. |
| ADMIN-07 | Medium | Entire repository | No automated unit, integration, API authorization, migration, or export regression tests were found. Build/lint alone do not validate HR workflows. | Critical workflows and permission boundaries should be regression-tested. | Add tests for auth/permissions, employee self-edit boundaries, leave ledger math, movement posting/reversal, assignment constraints, backup completeness/restore, and generated documents. |

### Settings

| ID | Severity | Affected files | Current behavior | Expected behavior | Recommended fix |
|---|---|---|---|---|---|
| SET-01 | High | `src/routes/employees.references.tsx`, `src/components/layout/navigation.ts`, `src/routes/__root.tsx`, `server/index.mjs` | Employee References is routed by `employees.read`; its controls use HR/Super Admin role; backend mutations require `settings.manage`. Default HR sees enabled position/salary/reference controls but receives 403, while default Admin has `settings.manage` but cannot navigate to the page because it lacks `employees.read`. | Reference-library navigation and controls must match `settings.manage`, with optional read-only access defined separately. | Move/manage the page under Settings or introduce `references.read/write`; gate each control with the backend permission. |
| SET-02 | Medium | `src/routes/settings.tsx`, `src/lib/settings-context.tsx`, `server/index.mjs` | Selecting a branding file immediately says “uploaded” although it is only in component state until Save. No size, MIME magic-byte, dimension, or aspect validation exists; large data URLs can hit the 15 MB request limit. | Upload status should reflect persistence and invalid assets should be rejected before/at the server. | Use validated upload endpoints, show preview vs saved state, enforce size/dimensions, and display save progress/errors. |
| SET-03 | Medium | `src/routes/settings.tsx` | Save has no busy/disabled state, unsaved-change warning, or field-length validation; image removal is immediate in local state with no confirmation and can be lost/overwritten silently. | Settings edits should have clear dirty, saving, saved, and failed states. | Add form validation, dirty tracking, disabled Save while pending, discard/reset, and confirmation for removing persisted branding. |

### Document Exports

| ID | Severity | Affected files | Current behavior | Expected behavior | Recommended fix |
|---|---|---|---|---|---|
| DOC-01 | Critical | `server/index.mjs` (PDS/WES generation and download), `src/lib/employees-api.ts` | PDS and WES download handlers require only an authenticated session and a matching filename. They do not verify the employee or creator. Filenames contain the employee name and have no timestamp/UUID, so concurrent generations for the same employee overwrite each other and any authenticated user who knows the filename can retrieve the file. | Every generated file must be bound to an opaque job, owner/subject, permission, expiry, and one-time download policy. | Create an export-job table with random token/UUID filenames; authorize download against creator/employee/elevated permission; make generation atomic and collision-free. |
| DOC-02 | High | `server/pds_excel.py`, `server/index.mjs`, employee section schema/UI | PDS export maps only part of the official form. It leaves most page-4 questions/references/declarations unmapped, has no schema source for several prescribed fields, and silently truncates civil service (7), work (28), voluntary/organization (7), and training (21) rows. | The official PDS should be field-complete and disclose or generate continuation sheets for overflow. | Create a field-by-field official form mapping, add missing employee data sections, validate checkbox/control mappings, generate continuation sheets, and return warnings for unmapped/overflow data. |
| DOC-03 | High | `server/service_record_export.py`, `server/service-records.mjs` | Service Record exports are intentionally generic and not the approved STRH template. | Official deployment exports should use approved format and signatory/certification content. | Complete SERV-02 and treat current files as internal previews only. |
| DOC-04 | High | `server/index.mjs`, `setup.bat`, leave/DTR export handlers | Leave PDF and DTR PDF generation depend on a hard-coded Windows LibreOffice path. Setup installs Python packages but does not install/verify LibreOffice or perform an export smoke test. | Setup/startup should validate every required export dependency and give an actionable health result. | Make LibreOffice path configurable/discoverable, add startup/health checks, document installation, and run a template conversion smoke test in deployment validation. |
| DOC-05 | Medium | `server/pds_excel.py`, `leave_form6_excel.py`, `dtr_excel.py`, `dtr_pdf.py`, `wes_docx.py`, `personnel_plantilla_report.py`, templates | Scripts compile, but there are no golden-file, field-mapping, overflow, concurrency, or visual-render tests. Build success does not prove official forms are correct. | Export output should be automatically and visually verified against representative fixtures. | Add deterministic fixtures, workbook/XML assertions, PDF/DOCX render checks, page-count/overflow tests, and manual sign-off samples. |
| DOC-06 | Medium | `server/reports.mjs`, `server/personnel_plantilla_report.py` | Personnel/Plantilla export input is capped upstream (including 500 Plantilla items), so a successfully generated file can be incomplete without an error. | Generated files should be complete or explicitly marked partial. | Remove the cap for exports and stream/paginate data; include record count and truncation metadata in the document. |

## Frontend-to-backend coverage check

### Visible frontend features with no working backend workflow

| Frontend feature | Status |
|---|---|
| File Overtime / compensatory time | Visible button; only shows “Coming soon.” |
| Request Certificate / COE / certification | Visible button; only shows “Coming soon.” |
| Schedule Change request | Visible button; only shows “Coming soon.” |
| General employee request history | Only leave and DTR corrections are merged client-side; no general request backend exists. |
| Leave requirement attachments | Requirement metadata exists, but no upload/review workflow exists. |
| Personnel movement supporting documents | References only; no file storage or retrieval. |
| Backup restore, schedule, retention, verification | No backend or UI workflow. |

### Backend endpoints or client functions not used by the frontend

These are not automatically defects—some may be compatibility or operational endpoints—but they are unowned surface that should be connected, documented, or removed.

- Assignment/engagement: `GET /api/assignments/summary`; all standalone engagement list/create/update/renew/terminate clients and routes.
- Attendance: correction cancel; detailed import logs; legacy row/file imports; `POST /api/attendance/import-all-dtr`; standalone CSV/mass CSV export; DTR noter creation; `PATCH` biometric update alias.
- Operational: `/api/health` is appropriately backend-only; generated-file routes are used indirectly through returned URLs and are not considered dead.

## Placeholder, mock, TODO, and temporary code summary

- No active frontend mock-data module was found in `src`.
- Three production-visible self-service actions call a shared `comingSoon()` placeholder.
- `scripts/seed-mock-201.mjs` can populate extensive mock 201/leave data and is tracked without a production environment guard.
- `server/fix_attendance.py` is a temporary one-off rewrite script aimed at a different absolute repository path and should not ship.
- `artifacts/admin_combined.tsx` and `artifacts/settings_copy.txt` are copied/older source artifacts, not runtime code.
- No TODO/FIXME markers were found in current application logic, but absence of markers does not mean the workflows above are complete.

## State coverage summary

| State | Assessment |
|---|---|
| Loading | Present on many primary pages, but inconsistent for Plantilla, Movements, Administration user lists, and independent Attendance panels. |
| Validation | Stronger in movement/service-record/biometric forms; materially incomplete for employee JSON sections, self-service employee updates, leave policy calculations, and branding uploads. |
| Empty | Generally present for tables and requests. Some failed loads are converted to empty arrays and therefore look like valid empty states. |
| Confirmation | Destructive confirmations exist in many modules, but some use native `window.confirm`; employee leave/DTR withdrawal actions are missing entirely. |
| Error | Toasts are widely used, but persistent error plus Retry is missing from several core panels. Some errors leave stale data or misleading zeros. |

## Prioritized implementation plan

### Critical

1. **Lock down employee self-service writes.** Create separate field/section allowlisted endpoints and block over-posting (EMP-01/ESS-03).
2. **Reject unimplemented movement posting.** Implement Renewal semantics and remove/define Other before any further posting (MOVE-01).
3. **Secure generated files.** Add opaque export jobs, ownership checks, unique filenames, expiry, and atomic download for PDS/WES, then apply the pattern to DTR/leave files (DOC-01, ATT-07).
4. **Make backups truthful and recoverable.** Replace the partial unencrypted JSON snapshot with encrypted complete backups and a tested restore process (ADMIN-01/02/03).
5. **Create a deterministic database baseline and migration runner.** Stop production startup from being the migration system (ADMIN-04).
6. **Protect the last Super Admin.** Add transactional last-account safeguards (AUTH-01).
7. **Make leave charging authoritative on the server.** Recompute duration and approved credit impact, prevent invalid/overlapping/insufficient applications, and correct reversal math (LEAVE-01/02).

### Required before deployment

1. Normalize all frontend authorization to module-specific permission keys and test the full matrix (AUTH-02, ATT-01, LEAVE-03, PLAN-02, MOVE-03, SERV-03, SET-01).
2. Exclude archived employees consistently from current dashboard/reports and add an archive/restore workflow (DASH-01, REPT-01, EMP-05).
3. Prevent direct employee fields from drifting from active non-Plantilla engagements (EMP-02).
4. Implement management UI for existing non-Plantilla engagements, including renewal/termination (PLAN-01).
5. Include/migrate legacy 201 service rows and replace the generic Service Record export with the approved template (SERV-01/02).
6. Complete official PDS field mapping and overflow handling (DOC-02).
7. Make import details accessible to HR, fix the `.xls` mismatch, and connect employee cancellation actions (ATT-02/03/04).
8. Add real persistent error/retry states to core data panels.
9. Validate LibreOffice and all export dependencies during deployment setup (DOC-04).
10. Add automated tests for permissions, leave ledger math, movement posting/reversal, migrations, backup/restore, and exports (ADMIN-07).

### Important improvements

1. Build a unified employee request domain/API and complete overtime, certificate, and schedule-change workflows (ESS-01/02).
2. Add secure attachments for leave and movement workflows (LEAVE-07, MOVE-02).
3. Replace fixed employee lists with server-side search (EMP-03, LEAVE-04).
4. Add versioned server validation for every 201 JSON section (EMP-04).
5. Expand the report catalog, add filters/as-of parameters, and eliminate silent export caps (REPT-02/03/04).
6. Add operational alerts and retry for failed scheduled movements (MOVE-04).
7. Add paginated/filterable audit and error logs with retention policy (ADMIN-05).
8. Move image uploads out of database data URLs and add validation (EMP-06, SET-02).

### Optional enhancements

1. Replace native confirmation dialogs with consistent accessible application dialogs.
2. Add dirty-state/discard handling to Settings and long forms.
3. Remove or formally deprecate unused API aliases and clients.
4. Remove temporary/copy artifacts and guard mock seed scripts.
5. Split large frontend chunks and address the 16 Fast Refresh lint warnings.
6. Replace decorative dashboard trends with real comparisons and time-aware greetings.

## Recommended first task

**Start with EMP-01: split employee self-service updates from HR employee management and enforce a strict backend allowlist.** It is the best first task because it closes the most direct data-integrity and privilege boundary before further workflow or deployment work proceeds.
