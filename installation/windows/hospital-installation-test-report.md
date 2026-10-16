# Installation and diagnostics test report — 2026-10-13

The Windows setup script completed `npm ci`, Python dependency installation and `pip check`, and the production frontend build. It preserved the existing ignored `server/.env.local` and did not import SQL.

`npm run test:installation` passed against a uniquely named disposable MySQL database with synthetic data. It verified missing tables before startup, API and frontend startup, `/api` routing, first Super Admin creation, login, an authenticated report read, XLSX generation and download, occupied-port rejection, clean stop/restart, invalid database credentials, and missing Python diagnostics. The test removes only its own temporary database and files.

Existing checks passed: `npm run test:security` (26), `npm run test:attendance-hardening` (8), `npm run test:lifecycle` (4), `npm run test:permissions` (25 permission keys synchronized), `npm run test:exports`, and `npm run build`. The new scripts pass targeted ESLint. Repository-wide `npm run lint` still fails on two formatting errors in `server/index.mjs` that predated this installation work; it also reports 15 warnings elsewhere.

`npm ci` reported 33 dependency advisories (2 low, 10 moderate, 20 high, 1 critical). These have not been triaged in this installation task. Hospital IT should assess them before go-live.

No Task Scheduler task was registered on the working PC and no Windows reboot was performed. Hospital IT must verify the scheduled task and restart behavior on the intended Windows host. LAN HTTPS, certificate trust, firewall rules, and a staff-workstation browser walkthrough remain go-live checks because those hospital details are not yet available.
