# STRH HRIS TOR Requirements Gap Matrix

**Project:** Development of a Human Resource Information System for DOH - Southern Tagalog Regional Hospital  
**Assessment date:** 20 June 2026  
**Source:** `STRH HRIS TOR.docx`  
**Assessment basis:** Current application routes, API/server implementation, database initialization, and available implementation notes in this repository.

## Purpose

This matrix compares the TOR requirements with the HRIS currently implemented in this repository. It is intended to serve as the working Inception Report checklist for requirements validation with STRH.

This is a code-level assessment, not yet a User Acceptance Testing result. A feature marked **Implemented** still requires validation using STRH data, users, devices, network, and operating procedures.

Government forms not yet supplied by STRH are deliberately classified as **Awaiting STRH** and are excluded from the immediate development sequence.

## Status Legend

| Status | Meaning |
|---|---|
| Implemented | A working application, API, and database path is present. Operational/UAT validation may still be required. |
| Partial | Part of the requirement exists, but important TOR behavior or coverage is missing. |
| Not implemented | No working implementation was found. |
| Awaiting STRH | Work depends on an STRH template, policy, infrastructure detail, approval, or decision. |
| Contractual / operational | Primarily a procurement, deployment, training, support, or service obligation rather than an application feature. |

## Executive Assessment

### Strongest implemented areas

- Database-backed employee core records and major 201-file subsections
- Attendance/DTR processing, manual corrections, schedule overrides, locking, import, and export
- Biometric device configuration, synchronization, ADMS endpoints, and real-time status/log monitoring
- Leave applications, leave types, balances, adjustments, credit ledger, approval reversal, and Form 6-aware data fields
- Employee login, three-attempt account lock, password change, role checks, notifications, audit logs, error logs, and manual backup creation
- Employee self-service access to profile information, PDS export, leave filing, leave history, and DTR correction requests

### Highest-priority non-form gaps

1. Populate and connect the new organizational and HR reference libraries to employee/Plantilla records
2. Plantilla/PSIPOP position management
3. Personnel action and movement history
4. Administrative and disciplinary case history
5. Functional reports and analytics
6. Configurable action-level access control and configurable session timeout
7. Additional employee self-service transactions and multi-level approvals
8. Automated backup schedules, restore workflow, and recovery testing
9. Portal announcements and policy/news publishing

## A. Project-Level Scope and Deliverables

| ID | TOR requirement | Status | Current evidence / finding | Required action / acceptance criterion |
|---|---|---|---|---|
| A01 | System analysis and requirements validation | Partial | TOR review and implementation notes exist, but no approved requirement baseline was found. | Review this matrix with STRH; record decisions, owners, priorities, exclusions, and approval. |
| A02 | Detailed specification / Inception Report before development | Partial | Application development is advanced; no formally approved detailed specification was found. | Convert this matrix into the approved Inception Report and attach validated workflows and acceptance criteria. |
| A03 | Design, development, and customization of HRIS | Partial | Major modules exist, but several core TOR requirements remain incomplete. | Complete priority gaps in the approved sequence and control scope changes. |
| A04 | Installation, configuration, and deployment | Contractual / operational | Local development and run scripts are present. Production server configuration is not documented in the repository. | Define production topology, environment configuration, service startup, SSL, domain, firewall, and rollback procedure. |
| A05 | Biometric and infrastructure integration | Partial | Biometric APIs, ADMS handling, device configuration, imports, and synchronization exist in `server/index.mjs` and `src/routes/attendance.tsx`. | Validate with each actual STRH device, network segment, device user mapping, timezone, and failure/retry scenario. |
| A06 | Migration of existing employee records | Partial | Database-backed employee records exist; no complete repeatable STRH migration package or reconciliation report was found. | Prepare mapping, import validation, duplicate handling, rejected-row report, and signed migration reconciliation. |
| A07 | System testing and quality assurance | Partial | Functional code exists, but the package has no dedicated automated test script or UAT pack. | Add critical automated tests and an STRH UAT checklist covering permissions, calculations, approvals, exports, audit, and recovery. |
| A08 | Administrator, HR, and end-user training | Contractual / operational | Training materials and completion records were not found. | Prepare role-based training plans, exercises, attendance sheets, evaluations, and knowledge-transfer sign-off. |
| A09 | Technical and user documentation | Not implemented | No complete policies, procedures, user, operations, administrator, FAQ, or troubleshooting manual set was found. | Produce and version the required manuals after workflows stabilize. |
| A10 | Post-implementation support and maintenance | Contractual / operational | Application logging exists, but SLA/helpdesk operating processes are not defined. | Define support channels, ticket fields, escalation matrix, response clocks, release policy, and SLA reporting. |

## B. General System Requirements

| ID | TOR requirement | Status | Current evidence / finding | Required action / acceptance criterion |
|---|---|---|---|---|
| B01 | Web and mobile-browser-compatible application | Partial | Responsive React routes and mobile navigation exist. Formal browser/device compatibility results were not found. | Test and document supported desktop and mobile browsers at STRH. |
| B02 | Internet-ready secure application | Partial | Authentication, server-side sessions, HttpOnly/SameSite cookies, and production Secure-cookie behavior exist. Production hardening is not documented. | Complete security configuration, dependency review, headers, firewall rules, secrets management, and penetration testing. |
| B03 | Secure Socket Layer (SSL) | Awaiting STRH | The application expects production-secure cookies, but certificate/domain/reverse-proxy configuration is outside the current repository. | STRH must provide the domain/network decision; deploy a valid certificate and enforce HTTPS redirects. |
| B04 | Required/approved development framework | Awaiting STRH | Current stack is React/TanStack/Vite with a Node.js server and MySQL, not Laravel or .NET. TOR wording is ambiguous regarding JavaScript. | Obtain written STRH acceptance of the current technology stack before further expansion. |
| B05 | Multi-tier / MVC-style architecture | Partial | UI, API/server logic, and relational database are separated, but the server is largely one large module. | Document architecture and progressively separate routing, services, policies, and repositories for maintainability. |
| B06 | Connect to major relational databases | Partial | MySQL is implemented through `mysql2`. Oracle, PostgreSQL, MSSQL, and DBF compatibility was not found. | Confirm whether MySQL-only is acceptable; otherwise define a database portability strategy. |
| B07 | Compatibility with Windows Server 2019+ and/or open-source OS | Awaiting STRH | The Node application is potentially portable, while several export/device paths are Windows-oriented. No deployment certification exists. | Select the production OS and run installation, service, export, backup, and device-integration tests. |
| B08 | Backward compatibility with legacy browsers/OS | Not implemented | The modern React/Vite stack is not intended for Internet Explorer or unspecified legacy browsers. | Ask STRH to replace this with an explicit supported-browser matrix or fund a separate compatibility solution. |
| B09 | Library of authorized signatories for approvals | Partial | DTR noters and user roles exist, but a general effective-dated signatory/approval-routing library was not found. | Add configurable signatories by transaction, office, effective dates, sequence, and delegation. |
| B10 | User-defined report templates, content, style, and output | Not implemented | `src/routes/reports.tsx` is a â€œComing soonâ€ catalog. | Build standard reports first, then add saved filters/templates and controlled export formats. |
| B11 | Policy changes configurable without source-code modification | Partial | Leave types/metadata, reference tables, schedules, and agency settings are configurable; many business rules remain coded. | Move approved rules, thresholds, leave accruals, workflows, and signatories into versioned configuration tables. |
| B12 | Configurable access down to activity/action | Partial | Roles are Admin, HR, Employee, and Viewer with route/handler checks; fine-grained permissions are absent. | Add permission keys, role-permission mapping, optional user overrides, and deny-by-default enforcement in UI and API. |
| B13 | Employee can extract own information | Partial | Employees can access profiles, leave data, DTR-related data, PDS export, and requests. A complete personal-data export is absent. | Add an authorized personal data package/export and audit every extraction. |
| B14 | Authorized administrators/users have full permitted access | Implemented | Role-based server authorization and Admin/HR modules are present. | Validate the final permission matrix during UAT after fine-grained permissions are introduced. |

## C. Employee Management and 201 Files

| ID | TOR requirement | Status | Current evidence / finding | Required action / acceptance criterion |
|---|---|---|---|---|
| C01 | Central employee database and searchable employee master list | Implemented | `employees` and related section tables support employee list/detail APIs and UI. | UAT search, filters, duplicate handling, archive/separation behavior, and data completeness. |
| C02 | Department reference table | Implemented | `departments` table, settings API, and reference-management UI exist. | Validate official STRH values and codes. |
| C03 | Position and salary-grade reference tables | Implemented | `positions` and `salary_grades` tables and reference UI exist. | Validate official position titles, salary schedules, steps, and effective dates. |
| C04 | Sector, office, division, and section/unit tables | Partial | A hierarchical, coded, active/effective-dated reference library is implemented in `hr_reference_values` and the Employee References UI. Official STRH values and employee/Plantilla linkage are still pending. | Obtain official STRH values, populate the libraries, and connect them to employee and Plantilla records. |
| C05 | Eligibility reference table | Partial | A standardized eligibility library is now available in `hr_reference_values`; existing employee eligibility records still store free-form payload values. | Populate official eligibility values and link employee eligibility records while allowing controlled exceptions. |
| C06 | Employment status and job-level tables | Partial | Effective-dated employment status and job-level libraries are implemented; current employee status/level fields are not yet relationally linked. | Populate official values and migrate/link current employee fields without data loss. |
| C07 | Plantilla/non-plantilla and budget-code tables | Partial | Plantilla classification and budget-code libraries are implemented in `hr_reference_values`; Plantilla records that consume them are not yet built. | Populate official values and use them in the Plantilla/PSIPOP module. |
| C08 | Online PDS/201 personal, family, education, eligibility, work, voluntary, training, awards, and references data | Partial | Core employee fields and family, children, education, civil service, work, organization, training, salary, service, and IPCR sections exist. Some prescribed PDS groups and employee-side updating need validation/completion. | Map every official PDS field to the schema; add missing voluntary work, learning/development classification, other information/awards, and references as needed. |
| C09 | Maintain employee job-related history | Implemented | Governed personnel movements preserve source, before/after, lifecycle, and event history while atomically updating employee and Plantilla state. | UAT action-specific mappings and historical-data migration. |
| C10 | PSIPOP-patterned Plantilla database | Implemented | Dedicated Plantilla items, occupancy, vacancy, salary/funding, effective dates, history, API, and UI are implemented with active-occupancy constraints. | Import and reconcile the STRH-approved PSIPOP source data. |
| C11 | Administrative/disciplinary case history | Not implemented | No disciplinary-case table, API, UI, or restricted permission was found. | Add confidential case records, outcomes/penalties, dates, attachments, access restrictions, and audit events. |
| C12 | Appointment, assignment, designation, separation, qualification standard, and salary-action records | Partial | Structured personnel actions, approval lifecycle, authority data, document references, posting, and reversal are implemented; qualification evaluation and direct attachment upload remain. | Add approved attachment storage and qualification-standard checks after STRH supplies rules. |
| C13 | Original appointment, promotion, transfer, renewal, reassignment, detail, job rotation, reclassification, step increment, resignation, retirement, termination, death, etc. | Implemented | TOR action types have snapshots, authority, effectivity, document references, review/approval/posting, audit events, conflict detection, and controlled reversal. | Complete UAT and confirm action-specific rules and separation of duties with STRH. |
| C14 | Employee profile charts and statistics | Partial | Dashboard metrics exist, but detailed authorized HR profiles/statistics are incomplete. | Add drill-down statistics using validated dimensions and privacy-aware filters. |
| C15 | Service record, COE, personnel statistics, plantilla, master list, salary/step/loyalty reports | Partial | Service Record generation now combines posted movements, preserved legacy rows, controlled manual periods, overlap validation, and generic Excel/PDF exports. Other standard reports and the STRH-approved Service Record template remain pending. | Obtain the official STRH template, complete mapping/UAT, then implement the remaining prioritized reports. |
| C16 | Payroll notification for step increment/loyalty actions | Not implemented | General notifications exist, but no personnel-action-to-payroll workflow was found. | Add configurable recipient roles/users and acknowledgement tracking when approved actions affect pay. |

## D. Attendance and Leave Credits

| ID | TOR requirement | Status | Current evidence / finding | Required action / acceptance criterion |
|---|---|---|---|---|
| D01 | Facial/fingerprint biometric integration | Implemented | Device configuration, TCP checks, ADMS endpoints, imports, synchronization, logs, and real-time monitoring exist. | Conduct end-to-end testing using all contracted STRH devices and realistic outages. |
| D02 | DTR generation and computerized attendance processing | Implemented | Attendance logs are transformed into DTR entries with import, refresh, edit, export, Excel, and PDF paths. | Validate schedule rules, overnight shifts, holidays, rest days, time zones, and rounding policies. |
| D03 | Manual DTR editing with lock/unlock and audit trail | Implemented | DTR maintenance, locking protections, correction workflow, reversals, events, and audit/error logging are present. | UAT all permission, conflict, lock, reversal, and concurrent-update cases. |
| D04 | Employee schedules and alternative work arrangements | Partial | Bulk schedules and date-specific overrides exist; online attendance registration and complete alternative-work-arrangement policies are not evident. | Confirm STRH policies and add approved remote/alternative attendance methods with controls. |
| D05 | Configurable leave types and related attendance codes | Partial | Comprehensive leave metadata exists; general codes for travel order, OB, overtime, offsetting, and CTO are not a unified configurable library. | Add attendance/activity code libraries with pay, DTR, leave, and approval effects. |
| D06 | Automatic leave deduction and leave usage tracking | Implemented | Approval updates balances and a credit ledger records deductions, adjustments, and reversals. | Validate non-credit leave types and rules that must not deduct normal balances. |
| D07 | Automatic leave-credit accrual under defined policies | Not implemented | Manual adjustments and balances exist; no scheduled accrual engine was found. | Add versioned accrual policies, scheduled posting, preview, approval, ledger entries, and rerun protection. |
| D08 | Low/critical leave-balance warning | Not implemented | No configurable threshold notification path was found. | Add threshold rules, recipient configuration, notification deduplication, and acknowledgement. |
| D09 | Leave adjustments/manual editing | Implemented | Leave adjustments and ledger entries are available to authorized users. | Validate reason requirements, supporting documents, permissions, and reversal policy. |
| D10 | Online/offline leave applications | Partial | Online employee and HR filing exists. A controlled offline capture/import workflow is not separately defined. | Confirm whether HR encoding on behalf of an employee satisfies â€œofflineâ€; otherwise add signed-document capture and source tracking. |
| D11 | Multi-step leave recommendation, certification, and final action | Partial | Recommendation/final-action fields exist, but a complete configurable multi-level workflow and independent certification records are not evident. | Finalize routing, separation of duties, signatories, delegation, credit certification snapshot, and final approval rules. |
| D12 | DTR/leave/tardiness/absence/overtime and other attendance reports | Partial | DTR exports exist; the broader report center is not functional. | Implement prioritized attendance and leave reports with filters, totals, drill-down, Excel/PDF, and audit. |
| D13 | Payroll deduction support for LWOP, tardiness, and undertime | Partial | DTR stores tardiness and undertime and leave supports LWOP; no payroll integration or approved deduction export was found. | Define payroll interface, cutoff/locking, correction handling, and reconciliation with STRH. |

## E. Employee Self-Service Portal

| ID | TOR requirement | Status | Current evidence / finding | Required action / acceptance criterion |
|---|---|---|---|---|
| E01 | Secure employee login and role-defined access | Implemented | Authenticated employee routes, sessions, server authorization, and employee-to-record linking exist. | UAT privacy isolation so employees cannot access another employeeâ€™s records. |
| E02 | Leave application and history | Implemented | Employees can submit leave and view balances/application history. | Complete the validated multi-level workflow and exception rules. |
| E03 | Employee profile, work profile, training, and related records | Partial | Self-service exposes profile and record summaries; editable scope and disciplinary-record visibility require final policy. | Define which fields employees may edit, propose for correction, view only, or never view. |
| E04 | View/print DTR, leave credits, leave records, and related information | Partial | DTR/leave access and exports exist across attendance/profile/self-service paths; consolidate the employee experience and validate print permissions. | Add a clear self-service records/download center with audit entries. |
| E05 | DTR correction requests | Implemented | Employee submission, HR review, approval/disapproval, event history, and reversal exist. | Validate lock/conflict and notification behavior in UAT. |
| E06 | CTO, OB pass, schedule adjustment, certificate, and other HR requests | Not implemented | Self-service cards exist, but certificate and schedule actions call â€œComing soonâ€; CTO/OB workflows were not found. | Build a generic request framework or separate workflows using configurable types, fields, approvers, status, attachments, and audit. |
| E07 | Multi-level online approvals by immediate superior | Partial | Leave/DTR decisions exist, but a general organizational supervisor hierarchy and configurable multi-level routing are absent. | Add supervisor assignments, approval stages, delegation, escalation, and signatory configuration. |
| E08 | News, policy, and announcements page management | Not implemented | No announcement/news publishing module was found. | Add draft/publish/archive, audience, schedule, attachment, priority, acknowledgement, and audit capabilities. |
| E09 | Unlimited users with different functionalities | Partial | Admin user management exists. Functionalities are limited to four fixed roles rather than configurable permissions. | Retain scalable user creation and add action-level permission configuration. |
| E10 | Lock account after three unsuccessful logins | Implemented | `MAX_FAILED_LOGIN_ATTEMPTS = 3`, account locking, session invalidation, and admin unlock are implemented. | UAT counting, lock messages, unlock, audit records, and simultaneous sessions. |
| E11 | Administrator-configurable session timeout | Partial | Server sessions expire after a fixed eight hours (`SESSION_HOURS = 8`). No administrator setting was found. | Store timeout policy in settings and safely apply it to new/active sessions. |
| E12 | Change/forgot password facility | Partial | Password change, temporary passwords, forced change, and reset by admin exist. A user-driven â€œforgot passwordâ€ recovery flow was not found. | STRH must select secure recovery: HR/admin reset, verified email OTP/link, or another approved method. |

## F. Security, Audit, Backup, and Data Management

| ID | TOR requirement | Status | Current evidence / finding | Required action / acceptance criterion |
|---|---|---|---|---|
| F01 | Comprehensive transaction audit trail | Partial | `audit_logs` and many explicit events exist, but completeness for every sensitive read/change has not been proven. | Define an audit event catalog; cover create/read/update/delete/export/approve/reverse/login/admin/security actions. |
| F02 | Real-time user-activity monitoring | Partial | Real-time event infrastructure and audit view exist; a security-focused live activity monitor is not evident. | Define monitoring requirements, alert rules, retention, and authorized viewers. |
| F03 | Role-based access control | Implemented | API-side role checks and route visibility exist. | Extend to configurable permissions without weakening server-side enforcement. |
| F04 | Error logging and operational diagnostics | Implemented | `error_logs`, Admin error-log UI, biometric sync logs, and API error handling exist. | Add severity, correlation IDs, retention, alerting, and sensitive-data redaction. |
| F05 | Manual database backup | Implemented | Admin can create and download JSON database backups. | Encrypt backups, protect downloads, record checksums, and document supported restoration. |
| F06 | Automated daily and monthly backups | Not implemented | No scheduled backup mechanism or retention rotation was found. | Add scheduler, daily/monthly retention, encryption, off-system destination, failure alerts, and audit. |
| F07 | Backup restore and periodic restoration testing | Not implemented | No administrator restore workflow or restore-test evidence was found. | Build a controlled restore tool/runbook and perform documented restoration drills. |
| F08 | 12-hour recovery window | Awaiting STRH | Recovery capability has not been measured. | Define RTO/RPO, dependencies, backup location, responsible staff, and timed recovery exercise. |
| F09 | NAP retention and reloadable archives | Not implemented | No retention schedule, archive package, disposition control, or reload workflow was found. | Obtain STRH retention schedule; implement archive/export manifest, integrity checks, reload, and disposition approval. |
| F10 | Data Privacy Act-aligned safeguards | Partial | Authentication, roles, audit, secure cookies, and logging exist; a complete privacy/security control assessment is absent. | Perform privacy impact/security assessment; define data classification, minimization, retention, breach handling, and access review. |

## G. Biometric Hardware, Support, Warranty, and Training

| ID | TOR requirement | Status | Current evidence / finding | Required action / acceptance criterion |
|---|---|---|---|---|
| G01 | Five biometric devices meeting specified capacity/connectivity | Awaiting STRH | Software can register devices; physical quantity/specifications cannot be verified from the repository. | Inventory and acceptance-test all supplied devices against TOR specifications. |
| G02 | Five sentry/ADMS device installations and network readiness | Awaiting STRH | ADMS endpoints exist, but production network/device deployment is not evidenced. | Approve IP/network design, firewall access, time synchronization, device mapping, and monitoring. |
| G03 | Updates, patches, security updates, and version upgrades | Contractual / operational | No formal release/patch calendar was found. | Define maintenance windows, versioning, change approval, rollback, and release notes. |
| G04 | Helpdesk, escalation, and SLA response/resolution | Contractual / operational | No ticketing/SLA operating record was found. | Establish channels, ownership, priority definitions, clock rules, escalation, and monthly SLA report. |
| G05 | Two-year proactive warranty/support obligations | Contractual / operational | Must be managed through the implementation contract and acceptance documents. | Track warranty start, contacts, covered services, site visits, incidents, and expiry. |
| G06 | IT, HR admin, HR user, and end-user training batches | Contractual / operational | No final training package was found. | Deliver role-specific training and maintain certificates, attendance, evaluations, and handover records. |

## H. Government and STRH Forms

| ID | TOR requirement | Status | Current evidence / finding | Required action / acceptance criterion |
|---|---|---|---|---|
| H01 | PDS and CS Form No. 6 exports | Partial | PDS and leave Form 6 Excel/PDF generation paths exist using available templates. | Validate field mapping and print output with STRH; do not treat them as final until approved. |
| H02 | Remaining HRMS/government forms in the TOR | Awaiting STRH | Official STRH-approved templates are not available in the repository. | STRH supplies current editable templates, revision dates, field rules, signatories, and sample completed copies. |
| H03 | Forms can be modified/added after agency updates | Partial | Current exports are template/script-specific; no general administrator form-template engine exists. | After templates arrive, decide whether controlled template replacement is sufficient or a generalized mapping engine is required. |

## Critical Decisions Required from STRH

These decisions should be recorded during requirements validation before the affected development proceeds:

1. **Technology stack acceptance:** Confirm whether the current React/Node/MySQL implementation satisfies the TOR or requires a formal deviation/approval.
2. **Supported environment:** Identify production Windows/Linux version, database version, domain, SSL owner, reverse proxy, network zones, storage, and backup destination.
3. **Browser support:** Replace â€œlatest and old browsers/Internet Explorerâ€ with a testable supported-browser/version matrix.
4. **Organizational hierarchy:** Provide the official sector, office, division, section/unit structure, codes, and effective dates.
5. **Plantilla source:** Provide current PSIPOP/plantilla data, item-number rules, funding/budget codes, vacancy definitions, and sample historical changes.
6. **Personnel-action workflow:** Define preparer, reviewer, recommender, approving authority, posting rules, allowed reversals, and required supporting documents.
7. **Confidential case access:** Identify exactly which roles/users may view and maintain disciplinary records.
8. **Approval routing:** Provide supervisor hierarchy, alternate/delegated approvers, signatories, and transaction-specific approval sequences.
9. **Leave policies:** Confirm accrual rules, holidays, work schedules, critical-balance thresholds, non-credit leave handling, and payroll cutoff rules.
10. **Payroll boundary:** Confirm whether payroll processing/integration is in scope and specify the required interface/export.
11. **Records retention:** Provide approved NAP-aligned retention, archival, legal-hold, and disposal rules.
12. **Official forms:** Supply only the current approved templates; form work remains deferred until then.

## Recommended Delivery Sequence

### Phase 0 - Requirements validation and baseline approval

1. Walk through this matrix with STRH HR, IT, payroll, records, and management representatives.
2. Confirm every status and clarify ambiguous TOR provisions.
3. Approve priorities, exclusions, workflows, data owners, and measurable acceptance criteria.
4. Record all approved deviations, especially the technology stack and browser/database requirements.

### Phase 1 - Reference Libraries

Build the dependencies required by Plantilla and personnel actions:

- Sector
- Office
- Division
- Section/unit
- Eligibility
- Employment status
- Job level
- Plantilla/non-plantilla classification
- Funding source and budget code
- Personnel-action type
- Administrative-case type and penalty/sanction type
- Authorized signatory and approval-routing configuration

**Completion criterion:** Authorized administrators can create, edit, activate/deactivate, order, and effective-date each value; APIs reject invalid/inactive references; changes are audited; existing employee data is mapped without loss.

### Phase 2 - Plantilla / PSIPOP

Build authorized position items, item numbers, position/salary/funding/assignment data, occupied/vacant status, employee occupancy, and effective-dated history.

**Completion criterion:** The system prevents conflicting active occupancy, preserves history, identifies vacancies accurately, and produces a validated plantilla/vacancy listing.

### Phase 3 - Personnel Actions and Movements

Build the TOR action types with preparation, review, approval, posting, attachments, old/new snapshots, notifications, and controlled reversal.

**Completion criterion:** An approved action updates the employeeâ€™s current profile and Plantilla occupancy atomically while preserving immutable before/after history and audit records.

### Phase 4 - Administrative and Disciplinary Cases

Build restricted case records, status history, findings, penalties, effectivity, attachments, and privacy-specific access/audit controls.

**Completion criterion:** Only expressly authorized users can access the module, and every access/change/export is auditable.

### Phase 5 - Reports, Remaining Workflows, and Operational Hardening

Implement standard reports, other self-service transactions, announcements, granular permissions, automated backups/restores, retention/archive controls, documentation, testing, training, and production readiness.

## Immediate Next Sprint Recommendation

Begin **Phase 1 - Reference Libraries** only after STRH validates the hierarchy and coding rules. The initial sprint should deliver:

1. Database tables and additive migration logic for the missing libraries
2. Admin maintenance UI consistent with the existing employee references page
3. Active/inactive and effective-date behavior
4. Server-side validation and referential integrity
5. Permission and audit events for every library change
6. Mapping plan for current free-text employee data
7. Seed/import worksheet for STRHâ€™s official values
8. Acceptance checklist for HR and IT reviewers

Plantilla and personnel movement development should start immediately after these libraries pass validation because both modules depend on them.

## Approval Record

| Review role | Name | Decision / comments | Date |
|---|---|---|---|
| STRH HRMS representative |  |  |  |
| STRH IT representative |  |  |  |
| STRH payroll representative |  |  |  |
| STRH records/privacy representative |  |  |  |
| Project implementation representative |  |  |  |

