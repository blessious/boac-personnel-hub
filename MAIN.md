# STRH HRIS Project Overview

This repository contains the Human Resource Information System for DOH Southern Tagalog Regional Hospital. It is a local-first web application for HR personnel records, attendance and DTR processing, leave management, plantilla tracking, employee movements, service records, user administration, and HR reporting.

The application is built as a React/TanStack Router frontend served by Vite, with a Node.js API server backed by MySQL. Several HR document exports are generated through Python scripts and spreadsheet/PDF templates.

## Application Stack

- Frontend: React 19, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS 4, shadcn/Radix UI components, lucide-react icons.
- Backend: Node.js ES modules using the built-in HTTP server and `mysql2/promise`.
- Database: MySQL/MariaDB-compatible schema, with SQL dumps and additive migrations.
- Export tooling: Python scripts using packages such as `openpyxl`, `reportlab`, `pypdf`, and `pyzk`.
- Local development: `npm run dev` starts both the API server and Vite client.

## Important Ports

- Frontend dev server: `http://localhost:47100`
- API server: `http://localhost:47101`
- Biometric ADMS port default: `6000`

Vite proxies `/api` requests to `http://localhost:47101`.

## Project Structure

```text
.
+-- src/
|   +-- routes/                 # TanStack Router pages
|   +-- components/             # Layout, UI, forms, reference panels, modals
|   +-- lib/                    # API clients, auth, realtime, settings, utilities
|   +-- hooks/                  # Device/mobile helpers
|   +-- styles.css              # Tailwind theme and global app styles
|   +-- routeTree.gen.ts        # Generated TanStack route tree; do not edit manually
+-- server/
|   +-- index.mjs               # Main API server
|   +-- dev.mjs                 # Starts API and Vite together
|   +-- plantilla.mjs           # Plantilla schema and API handlers
|   +-- movements.mjs           # Personnel movement schema and workflow handlers
|   +-- service-records.mjs     # Service record schema and export handlers
|   +-- migrations/             # Additive SQL migrations
|   +-- templates/              # Export templates and fonts
|   +-- exports/                # Generated previews/exports
|   +-- backups/                # JSON database backups
+-- latest database/            # Latest database dump candidates
+-- leave application/          # CS Form No. 6 templates
+-- Personal Data Sheet/        # PDS Excel template
+-- artifacts/                  # Generated manuals/reports
+-- scripts/                    # Seeding and document-generation helpers
+-- setup.bat                   # First-time Windows setup script
+-- run.bat                     # Development launcher
+-- package.json                # Node scripts and dependencies
```

## Runtime Configuration

The server loads environment variables from `server/.env.local` first, then `server/.env`, unless values are already supplied by the host process.

Common variables:

```env
HRIS_DB_HOST=localhost
HRIS_DB_USER=root
HRIS_DB_PASSWORD=
HRIS_DB_NAME=hris_db
HRIS_API_PORT=47101
HRIS_ADMS_PORT=6000
HRIS_PYTHON_EXE=.venv\Scripts\python.exe
HRIS_BIOMETRIC_PYTHON_EXE=python
HRIS_LIBREOFFICE_EXE=C:\Program Files\LibreOffice\program\soffice.com
```

Do not commit real database passwords or other secrets. Keep local credentials in `server/.env.local`.

## Setup

For a fresh Windows machine, run:

```bat
setup.bat
```

The setup script:

- Checks or installs Node.js and Python.
- Installs Node dependencies with `npm ci` or `npm install`.
- Creates `.venv`.
- Installs Python dependencies used by exports and biometric integration.
- Creates `server/backups`, `server/exports`, and `server/exports/previews`.
- Creates a default `server/.env.local` if one does not exist.
- Offers to import `latest database\hris_db.sql` into MySQL.
- Checks for LibreOffice for PDF/export previews.

To start the app:

```bat
run.bat
```

Or directly:

```bash
npm run dev
```

## Available NPM Scripts

- `npm run dev` - starts `server/index.mjs` and the Vite client together.
- `npm run dev:client` - starts only the Vite client on port `47100`.
- `npm run api` - starts only the API server.
- `npm run build` - production Vite build.
- `npm run build:dev` - development-mode Vite build.
- `npm run preview` - serves the built app on port `47100`.
- `npm run lint` - runs ESLint.
- `npm run format` - formats the repository with Prettier.

## Frontend Architecture

Routing is file-based through TanStack Router. The root layout lives in `src/routes/__root.tsx` and wraps the app with:

- `QueryClientProvider`
- `AuthProvider`
- `RealtimeProvider`
- `SettingsProvider`
- main app shell, sidebar, header, mobile bottom navigation, and toast provider

Main routes:

- `/` - dashboard; employees see the self-service dashboard.
- `/login` - authentication.
- `/change-password` - required password change flow.
- `/employees` - employee list, search, filters, add/delete, and nested routes.
- `/employees/$id` - employee profile/detail.
- `/employees/references` - employee reference management.
- `/attendance` - DTR, biometric imports, correction requests, noters, schedules, and exports.
- `/plantilla` - plantilla item and occupancy management.
- `/movements` - employee movement workflow.
- `/service-records` - automatic/manual service record generation and export.
- `/leave` - leave types, applications, balances, adjustments, Form 6 export.
- `/self-service` - employee self-service portal.
- `/requests` - employee request tracking.
- `/reports` - HR reports and analytics.
- `/admin` - users, account candidates, audit logs, error logs, and backups.
- `/settings` - agency settings and reference data.
- `/my-profile` - logged-in employee profile.

Navigation is centralized in `src/components/layout/navigation.ts` and filtered by role.

## Roles and Access

The application uses four roles:

- `Admin`
- `HR`
- `Employee`
- `Viewer`

Access control is enforced in the root route layout. Admin users can access all management areas except self-service-only sections. HR users can access HR workflows but not system administration. Viewer users have read-oriented access to dashboard, employees, plantilla, movements, service records, and reports. Employee users are restricted to self-service, their own profile, requests, attendance, and their own employee record.

Backend handlers also use role guards such as employee read/write checks and admin checks.

## Backend Architecture

The main API server is `server/index.mjs`. It:

- Loads environment variables.
- Creates and uses a MySQL connection pool.
- Manages session cookies with the `hris_session` cookie.
- Provides auth, employee, attendance, leave, settings, notifications, realtime, admin, and export endpoints.
- Initializes feature schemas for plantilla, personnel movements, and service records.
- Calls Python scripts for DTR, PDS, leave Form 6, service record, biometric, and PDF export workflows.

Feature modules:

- `server/plantilla.mjs` creates and handles `plantilla_items`, `plantilla_occupancies`, and `plantilla_item_history`.
- `server/movements.mjs` creates and handles `personnel_movements` and `personnel_movement_events`.
- `server/service-records.mjs` creates and handles `service_record_entries`, combines automatic movement-derived rows with manual entries, and exports service records.

Frontend API clients are in `src/lib/*-api.ts` and use the shared `api()` helper from `src/lib/api.ts`.

## Major API Areas

The frontend calls these API groups:

- `/api/auth/*` - login, logout, session lookup, password changes.
- `/api/users/me` - logged-in profile updates.
- `/api/dashboard` - HR dashboard summaries.
- `/api/employees/*` - employee CRUD, profile sections, PDS export, leave balances.
- `/api/attendance/*` - DTR entries, imports, corrections, schedules, biometric devices, exports.
- `/api/leave/*` - leave types, applications, decisions, balances, adjustments, Form 6 exports.
- `/api/plantilla/*` - plantilla items, occupancy actions, history.
- `/api/movements/*` - movement creation and workflow actions.
- `/api/service-records/*` - service record rows and exports.
- `/api/settings/*` - agency settings, departments, positions, salary grades, reference libraries.
- `/api/admin/*` - users, backups, logs, account candidates.
- `/api/notifications/*` - notification list and read state.
- `/api/realtime/events` - server-sent events for UI refresh.
- `/api/public/agency` - public agency branding/settings.
- `/api/visit-log` - frontend visit telemetry logging.

## Database Overview

The project includes several SQL dumps. The most complete baseline appears to be under `latest database/`, especially `latest database\hris_db.sql`, with older or alternate dumps at the repository root.

Core tables seen in the SQL dumps and migrations include:

- Authentication and administration: `users`, `sessions`, `audit_logs`.
- Agency/reference setup: `agency_settings`, `departments`, `positions`, `salary_grades`, `hr_reference_values`.
- Employees and PDS-style sections: `employees`, `employee_family_records`, `employee_child_records`, `employee_education_records`, `employee_civil_service_records`, `employee_work_records`, `employee_training_records`, `employee_organization_records`, `employee_ipcr_records`, `employee_salary_records`, `employee_service_records`.
- Attendance and DTR: `attendance_logs`, `attendance_imports`, `dtr_entries`, `dtr_export_jobs`, `dtr_noters`, `employee_schedule_overrides`, `biometric_devices`.
- Leave: `leave_types`, `leave_balances`, `leave_adjustments`, `leave_credit_ledger`, `leave_applications`.
- Plantilla: `plantilla_items`, `plantilla_occupancies`, `plantilla_item_history`.
- Movements: `personnel_movements`, `personnel_movement_events`.
- Service records: `service_record_entries`.

Database changes should be additive and migration-based where possible. Existing scripts use `CREATE TABLE IF NOT EXISTS`, indexes, foreign keys, and generated columns for active occupancy constraints.

## Export and Template Workflows

The app contains official or office-specific templates and generated exports:

- Leave Form 6 source files are in `leave application/`.
- PDS source spreadsheet is in `Personal Data Sheet/`.
- DTR templates and fonts are in `server/templates/`.
- Generated previews are written to `server/exports/previews/`.
- Service record, DTR, PDS, leave, merge, and biometric scripts live in `server/*.py`.
- LibreOffice is used for spreadsheet-to-PDF preview/export paths when available.

Generated export files should normally be treated as runtime artifacts, not hand-edited source.

## Coding Conventions

- Use TypeScript and React function components on the frontend.
- Keep shared API logic in `src/lib`.
- Use existing UI primitives in `src/components/ui`.
- Use route files under `src/routes` for page-level behavior.
- Do not manually edit `src/routeTree.gen.ts`; it is generated by TanStack Router.
- Use the shared `api<T>()` helper for JSON API calls.
- Keep backend validation close to request handlers or feature modules.
- Use MySQL parameter binding through `mysql2/promise`; do not build SQL by concatenating user input.
- Preserve existing auth and role checks when adding features.
- Keep document/export business logic out of UI components.

## Quality Checks

Run these after code changes:

```bash
npm run lint
npm run build
```

For changes that touch exports or Python scripts, also test the relevant export path in the UI and confirm output files are created under `server/exports/previews/`.

For database changes:

- Inspect current schema first.
- Add or update migrations instead of editing production data destructively.
- Import or test against `latest database\hris_db.sql` where practical.
- Verify affected API flows against real MySQL data.

## Known Operational Notes

- The shell used during this inspection did not have `git` available in PATH.
- The app name appears in scripts as HRPMIS and in UI/docs as STRH HRIS; this is likely historical naming drift.
- Some generated files and runtime artifacts are committed, including exports, manuals, database dumps, and LibreOffice profile files.
- There are multiple database dump variants; prefer the `latest database` folder unless a task explicitly targets an older dump.
- The root route title currently contains mojibake for an em dash in `src/routes/__root.tsx`, but this document does not change app code.

## Development Guidance

Before changing features:

1. Inspect the relevant route, API client, backend handler, and database table.
2. Preserve current role behavior and existing working workflows.
3. Add loading, empty, validation, error, and confirmation states where the UI changes.
4. Keep SQL parameterized and return consistent JSON errors/status codes.
5. Run available checks and fix failures before handing off.
