# Security and permissions test report

Reviewed 2026-10-13. Access contract: [security-access-matrix.md](security-access-matrix.md). The implementation adds actual HTTP/database tests; it does not establish that all possible endpoints or payloads are safe.

## Run and isolation

Use a separate local MySQL instance with a disposable account allowed to create and drop test schemas. Set all four connection values explicitly in PowerShell, then run:

```powershell
$env:HRIS_TEST_DB_HOST = '127.0.0.1'
$env:HRIS_TEST_DB_PORT = '<isolated MySQL port>'
$env:HRIS_TEST_DB_USER = '<disposable MySQL account>'
$env:HRIS_TEST_DB_PASSWORD = '<its password>'
npm run test:security
npm run test:attendance-hardening
npm run test:lifecycle
npm run test:permissions
npm run build
npm run lint
```

`npm run test:security:browser` launches an isolated API and Vite browser fixture on port 47313 using the same explicit DB settings. Press Enter to stop it and remove its schema. The harness checks the DB name, local host and ports before starting the API, creates a random `hris_security_` schema, and drops only that exact schema. The API uses its own temporary export directory. Background processors and outbound biometric checks are disabled in test mode; ADMS requests are synthetic loopback traffic. A missing DB setting fails before the connection. The schema fixture applies the supplied performance-index migration because fresh startup does not consistently install those indexes; that migration reliability issue is separate work.

For this run, the separate MySQL instance listened on `127.0.0.1:47312`. No working HRIS database, live device, real user, or production export was used.

The isolated MySQL process was stopped and its test schemas were removed. Its temporary data directory remains at `C:\Users\bless\AppData\Local\Temp\hris-security-mysql-8a3a9541f9454af9a70bebb10725016b` because automatic cleanup refused the recursive directory removal.

## Evidence and findings

`npm run test:security`: **26 passed, 0 failed, 0 skipped**. Six default roles, two employees, an unlinked account, anonymous/expired/inactive sessions and individually changed permissions were exercised through normal login and cookie sessions. The suite checks ownership, overposted employee fields, section rows, DTR changes/locks/corrections, schedule and import controls, leave approval and ledger effects, engagement and movement consistency, administration, notification ownership, origin validation, realtime recipients, synthetic ADMS ingestion, and Excel/Word/PDF generation and downloads. Denied mutations are paired with permitted ones; important saved state is checked directly in MySQL. For example, approved credit leave decrements the balance and creates a ledger row, while cancellation restores it.

Confirmed defects and narrow fixes:

1. A subject could not download an HR-created PDS/WES document. The download guard compared the session employee ID to the wrong field name. It now compares `employee_id`; creator, subject and elevated access, expiry and one-time download still work.
2. A temporary-password session could call protected APIs directly before completing the password change. `requireUser` now blocks them with 403; the password-change endpoint, session lookup and logout remain available.
3. A generic realtime refresh contained another employee's identifier, and a stream could continue receiving events after logout. Generic invalidations now carry only the topic, and delivery/heartbeat revalidate the session and recipient.
4. Authorized Admin audit/error lists failed on MySQL 8.0.45 because prepared `LIMIT` values were rejected. Those three paginated reads now use bound `query` calls; response structures and permission guards are unchanged.
5. In browser navigation, an old employee form could briefly remain rendered after logout changed the URL to login. The root layout now checks the rendered route as well as the destination, so the private outlet is hidden during that transition.

The browser walkthrough used only synthetic accounts. All six roles signed in. HR edited a profile; an Employee filed leave; an Approver approved it and generated Form 6; Viewer could read the directory but not add records; Admin could open user management but got 403 on HR leave; Super Admin could inspect permissions. An Employee got 403 opening the directory directly. Removing Viewer's employee-read permission invalidated its existing session; after re-login the directory returned 403. Restoring the permission used the same isolated fixture. Logout and account switching returned to login without a persistent prior-user view. [Browser proof](security-browser-proof.png) shows the synthetic approved request.

Existing checks: attendance hardening **8 passed**, lifecycle **4 passed**, permission consistency **25 keys synchronized**. Production build passed. Lint passed with **0 errors and 15 warnings** in unchanged React files.

## Limits and decisions needed

The matrix inventories all routed API families, but runtime coverage selects representative operations. Bulk account operations, every settings mutation, all import variants, mass DTR PDF, and every section field remain untested combinations. The automated tests do not control a real biometric device or production scheduling; they deliberately block those integrations in isolation. Browser approval used a synthetic unpaid leave request, so it verifies route/role behavior rather than HR policy.

Confirm with HR/deployment owners before changing: whether own leave filing and own record reads should continue when self-service permission is removed; whether `employees.read` should permit downloading other employees' generated documents; whether Viewers should see biometric device metadata; whether automatic movement posting is intended; and whether public `/api/health` should reveal the schema name and export dependency status. ADMS source-IP matching is the current trust model and should be reviewed for the hospital network. No new policy was encoded for these questions.
