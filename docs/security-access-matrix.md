# API access matrix

Reviewed 2026-10-13. Paths below start with `/api` unless stated otherwise. Braces enumerate alternatives; `:id` denotes a route parameter. This is an inventory of the access contract, not a claim that every combination has a runtime test. The executable scenarios are in `server/security/api.test.mjs`.

Evidence: permission descriptions/defaults and guards in `server/index.mjs`; route visibility in `src/routes/__root.tsx`, `src/components/layout/AppSidebar.tsx`, and `src/lib/auth.tsx`; specialized handlers in `server/{assignments,movements,plantilla,service-records,reports}.mjs`. Where these disagree or policy is uncertain, the exceptions below record current behavior instead of inventing HR rules.

## Shared rules

- Protected requests require a valid, active, unexpired session. Forced-password-change sessions may only use the password-change flow, session lookup and logout. Mutations also undergo origin validation (device routes use their own source gate).
- Permissions are configurable. Role names are not substitutes for permission checks. Super Admin restrictions also protect Super Admin account assignment/reset and the last active Super Admin.
- `own` means the session's linked employee ID equals the subject ID; no linked employee grants no ownership exception. Employee detail/service-record/leave-balance reads have existing own-record exceptions independent of the self-service permission. Preserve pending stakeholder review.
- `attendance scope`: `attendance.write`, or `attendance.read` plus either `employees.read` or absence of `self_service.access`, permits all employees. Otherwise require `self_service.access` and ownership. This unusual combination is existing behavior, not a new policy.
- `document job`: unexpired job; creator, subject, or `employees.read`. Existing single-use enforcement applies to Excel/Word download handlers; PDF preview handlers can allow repeat viewing. DTR exports use their own employee scope checks. Service-record/report files use their respective read guards and file-name validation.

## Endpoint rules

| Methods and paths | Required access / own exception | Evidence / qualifications |
|---|---|---|
| GET `/health` | Public diagnostics | Existing behavior; exposes database name/export dependency details. Review deployment exposure. |
| POST `/auth/login` | Public; credentials, active account, three-attempt lock | `handleLogin` |
| GET `/auth/bootstrap-status`; POST `/auth/bootstrap-super-admin` | Public, creation only before first user | Bootstrap handlers; cannot register another administrator after initialization |
| GET `/public/agency` | Public branding | `handlePublicAgencySettings` |
| GET `/auth/me`; POST `/auth/logout` | Public session lookup/clear; anonymous lookup returns null | Does not grant protected data access |
| POST `/auth/change-password` | Valid session, including forced-change session | Keeps current session and invalidates other sessions |
| PATCH `/users/me` | Valid session; own name/photo fields | No role/employee reassignment through this endpoint |
| GET `/dashboard` | `dashboard.view` | Without `employees.read`, linked employee snapshot |
| GET `/notifications`; PATCH `/notifications/:id/read`; POST `/notifications/read-all` | Valid session; recipient ownership | `handleListNotifications`, `handleReadNotification`, `handleReadAllNotifications` |
| GET `/realtime/events` | Valid session; targeted recipient filters; generic refresh metadata only | Session rechecked on delivery and heartbeat |
| GET, POST `/admin/users`; PATCH, DELETE `/admin/users/:id` | `admin.users` | Super Admin target/assignment and last active Super Admin safeguards |
| POST `/admin/users/:id/{reset-password,reset-temporary-password,unlock}` | `admin.users` | Same elevated-target protection; resets revoke sessions |
| GET `/admin/employee-account-candidates`; POST `/admin/employee-accounts/{bulk,reset-passwords}` | `admin.users` | Bulk account handlers |
| GET `/admin/role-permissions` | `role_permissions.manage` OR `admin.users` | Admin may inspect, not modify by default |
| PATCH `/admin/role-permissions` | `role_permissions.manage` | Invalidates affected role's sessions |
| GET `/admin/audit-logs`; GET `/admin/error-logs` | `admin.audit`; `admin.errors`, respectively | Includes central import logs |
| GET `/employees` | `employees.read` | Employee self-service does not expose directory |
| POST `/employees`; DELETE `/employees/:id`; POST `/employees/:id/restore` | `employees.write` | Archive/restore lifecycle remains unchanged |
| GET `/employees/:id` | `employees.read` OR own | Includes sections and embedded attachments |
| PATCH `/employees/:id` | `employees.write` OR own + `self_service.access` | Self-service allowlist preserves employment/salary/account fields |
| POST `/employees/:id/sections/:section`; PATCH, DELETE `/employees/:id/sections/:section/:rowId` | `employees.write` OR own + `self_service.access` | Row must belong to URL subject. Self-service: family, children, education, civilService, work, organization, training, ipcr; salary/service excluded; field allowlists apply |
| POST `/employees/:id/pds/excel`, `/employees/:id/wes/docx` | Employee read/own access | Generation handlers validate subject |
| GET `/employees/pds/excel/:file`, `/employees/wes/docx/:file` | Valid session + document job | Single use, expiry and file-name checks |
| GET `/employees/:id/leave` | `leave.read` OR own | Own balances, ledger and application history |
| POST `/employees/:id/leave/adjustments` | `leave.write` | Ledger effects preserved |
| GET `/leave/types` | Valid session | Needed by own application UI |
| POST `/leave/types`; DELETE `/leave/types/:id` | `leave.write` | Type management |
| GET `/leave/applications` | `leave.read` | Management list; own history uses employee leave endpoint |
| POST `/leave/applications` | `leave.write` OR own | Existing application validations retained; own filing does not currently require the self-service key |
| DELETE `/leave/applications/:id` | `leave.write` | Existing status restrictions remain |
| POST `/leave/applications/:id/decision` | `approvals.manage` | Includes approval and reversal; HR not automatically authorized |
| POST `/leave/applications/:id/cancel` | `leave.write` OR own + `self_service.access` | Existing cancellation/status rules |
| POST `/leave/applications/:id/form6/{excel,pdf}` | `leave.read` OR own | Subject checked against actual application |
| GET `/leave/forms/form6/{excel,pdf}/:file` | Valid session + document job | Excel single use; PDF repeated preview |
| GET `/attendance/dtr`; GET `/attendance/check-unimported-dtrs/:employeeId` | Attendance read + attendance scope | Query subject cannot override ownership |
| POST `/attendance/dtr`; PATCH, DELETE `/attendance/dtr/:id` | `attendance.write` | Manual time-slot locks preserved |
| GET `/attendance/imports/:id/logs`; GET `/attendance/import-exceptions`; POST `/attendance/import-exceptions/:id`; POST `/attendance/import-exceptions/reprocess` | `attendance.write` | Import diagnostics/mapping/reprocessing |
| POST `/attendance/{import,import-file,import-single-dtr,import-all,import-all-dtr,refresh}` | `attendance.write` | No live device fetching in isolated test mode |
| GET `/attendance/correction-requests` | Authenticated; own or approval scope | Correction handlers |
| POST `/attendance/correction-requests` | Own + `self_service.access` | Linked employee required |
| POST `/attendance/correction-requests/:id/{decision,reverse}` | `attendance.corrections.approve` | Distinct from general approvals |
| POST `/attendance/correction-requests/:id/cancel` | Own self-service or attendance management | Existing status checks |
| GET `/attendance/schedules`, `/attendance/schedule/overrides` | Attendance read + attendance scope | Employee filters scoped |
| POST `/attendance/schedule/{bulk,overrides}`; DELETE `/attendance/schedule/overrides/:employeeId/:date` | `attendance.write` | Persisted schedules and refresh rules unchanged |
| GET `/attendance/noters`, `/attendance/biometrics`; POST `/attendance/biometrics/check-status`; GET `/attendance/biometrics/realtime/{status,logs}` | Attendance read | Shared metadata/device status; review employee visibility if policy requires restriction |
| POST `/attendance/noters`; DELETE `/attendance/noters/:id`; POST `/attendance/biometrics`; PUT, PATCH, DELETE `/attendance/biometrics/:id`; POST `/attendance/biometrics/realtime/sync-now` | `attendance.write` | Device management; isolated mode never contacts real devices |
| POST `/attendance/dtr/{excel,pdf}`; GET `/attendance/dtr/{excel,pdf}/:file`; GET `/attendance/export` | Attendance read + attendance scope | A self-service request naming another subject generates the caller's DTR. Downloaded Excel/PDF files are removed after send |
| POST `/attendance/dtr/mass/pdf`; GET `/attendance/dtr/mass/pdf/:file`; GET `/attendance/export/mass` | `attendance.write` | Mass data access |
| GET `/service-records/:employeeId`; POST `/service-records/:employeeId/export/{xlsx,pdf}`; GET `/service-records/files/:file` | `service_records.read` OR own | `server/service-records.mjs`; file subject validated |
| POST `/service-records/:employeeId`; PATCH, DELETE `/service-records/entries/:id` | `service_records.write` | Manual official record entries |
| GET `/reports/personnel-plantilla`; POST `/reports/personnel-plantilla/export/{xlsx,pdf}`; GET `/reports/files/:file` | `reports.view` | `server/reports.mjs` |
| GET `/plantilla`, `/plantilla/:id/history` | `plantilla.read` | `server/plantilla.mjs` |
| POST `/plantilla`; PATCH, DELETE `/plantilla/:id`; POST `/plantilla/:id/disconnect` | `plantilla.write` | Occupancy/history consistency |
| GET `/engagements` | `employees.read` | `server/assignments.mjs` |
| POST `/engagements`; PATCH `/engagements/:id`; POST `/engagements/:id/{renew,terminate}` | `engagements.manage` | Posting/renewal/termination effects preserved |
| GET `/movements`, `/movements/:id/events` | `movements.read` | `server/movements.mjs` |
| POST `/movements`; PATCH `/movements/:id`; POST `/movements/:id/{submit,unsubmit,post,reverse}` | `movements.write` | Current create/post behavior retained, including automatic posting |
| POST `/movements/:id/{review,approve,reject,return}` | `approvals.manage` | Existing workflow/preparer checks also apply |
| GET `/settings` | Valid session | Shared dropdown/config data |
| GET `/settings/references`, `/settings/references/:category/:id/usage` | `employees.read` | Distinct from settings modification |
| POST `/settings/references/:category`; PUT, PATCH, DELETE `/settings/references/:category/:id`; POST `/settings/references/:category/:id/retire` | `settings.manage` | Reference/retirement validation |
| POST `/settings/organization-hierarchy/preview`; PUT `/settings/organization-hierarchy` | `settings.manage` | Hierarchy rules unchanged |
| PUT `/settings/agency`; GET, PUT `/settings/database`; POST `/settings/database/test` | `settings.manage` | Database configuration mutations are not exercised against working settings |
| POST `/settings/{departments,positions,salary-grades}`; PUT, PATCH, DELETE `/settings/{departments,positions,salary-grades}/:id` | `settings.manage` | Legacy department writes can return409 (read-only library) |
| POST `/settings/salary-grades/{rename-table,activate}`; DELETE `/settings/salary-grades/table` | `settings.manage` | Salary table operations |
| GET, POST `/iclock/{cdata,getrequest}` (no `/api`) | Device protocol; no user cookie; ingestion requires active configured source IP | Synthetic loopback punches only; IP is not cryptographic device authentication |

## Role expectations and questions

Default Super Admin can administer all areas. Admin manages system configuration/accounts/logs, not HR operations. HR manages employee/attendance/leave/assignment records but does not automatically decide approvals. Approver has approval access without HR write privileges. Employee owns self-service records. Viewer reads configured areas without writes. Exact keys remain in the existing default maps, checked by `npm run test:permissions` and exercised through normal login.

Do not change these unresolved choices silently: own reads when self-service is removed; broad export-reader access; the attendance permission combination above; automatic movement posting; employee-visible device metadata; public health diagnostics; IP-only ADMS trust. These need deployment or stakeholder decisions, not new HR rules embedded in security tests.
