# HRIS installation on one Windows host

This procedure uses the repository checkout as the application folder. All Windows installation files are in `installation\windows`. Hospital IT supplies Windows, MySQL, a dedicated task account, and the hospital SQL dump. Run the installation batch files from `installation\windows`. Do not use the root `run.bat` for this installation; it starts the development server. This procedure does not install or import MySQL and does not create user accounts.

## 1. Prepare the host

Install Node.js 20.19+ or 22.12+ (prefer a current LTS release), Python 3, MySQL, and LibreOffice. Put HRIS in a fixed folder that the task account can read. Grant that account write access to a separate runtime folder, such as `C:\HRIS-runtime`. Ensure it can connect to MySQL. Use a dedicated MySQL account with the permissions the current application needs for startup schema initialization and normal operation. Do not use the committed `.env.defaults` values as hospital credentials.

Run `installation\windows\setup-hospital.bat` once. It uses `npm ci`, installs the Python export packages in `.venv`, builds the frontend, and copies `installation\windows\.env.hospital.example` to `server/.env.local` only if the latter does not exist. It does not overwrite an existing local configuration. Fill in every `CHANGE_ME` value in `server/.env.local`; use the actual `.venv\Scripts\python.exe`, LibreOffice `soffice.com`, and runtime directory paths. Keep that file out of backups or archives shared outside hospital IT.

Import the supplied `.sql` file into the configured MySQL database **manually** and verify the `users` and `employees` tables exist. Back up an existing database before replacing or reimporting it. Running the API may create or update schema objects, so first startup belongs after SQL import and backup. The diagnostic command only reads the database.

Run `installation\windows\diagnose.bat`. Resolve every `FAIL` before startup. A `WARN` that the app is not running is expected at this stage. Run `installation\windows\start-installed.bat` in a console for the first startup, then run `installation\windows\diagnose.bat` again. The launcher waits for MySQL, starts the API, checks `/api/health`, starts the built frontend, and checks `/login` and the frontend `/api` route. Logs are in the configured runtime folder. Use `installation\windows\stop-installed.bat` for a clean stop. The development `run.bat` and `stop.bat` remain separate.

If the imported database has no accounts, the first visit to `/login` presents **Create Super Admin**. Hospital IT should create the first account there only after access is restricted to the authorized installer. If accounts already exist, sign in with an authorized existing account; never create a second bootstrap account or use development credentials.

## 2. Schedule startup

After manual startup and stop succeed, open Windows **Task Scheduler** as an administrator and create a task named `HRIS Installed`. Use the hospital IT–supplied dedicated account, **Run whether user is logged on or not**, and an **At startup** trigger with a 30-second delay. Set the action to **Start a program**:

- Program: `C:\Windows\System32\cmd.exe`
- Arguments: `/c "C:\path\to\HRIS\installation\windows\start-installed.bat"` (replace with the actual path)
- Start in: the HRIS folder, without quotes

Enable **Restart every 1 minute** if the task fails (three retries), **Do not start a new instance** when already running, and uncheck the default **Stop the task if it runs longer than 3 days** limit. The launcher itself waits up to five minutes for MySQL at boot. Store the account password through Task Scheduler's normal prompt, not in a script or config file. Use **Run** in Task Scheduler, then check `installation\windows\diagnose.bat`, the task result, and runtime logs. To stop: run `installation\windows\stop-installed.bat`, then end or disable the scheduled task if it would restart. To restart: stop, then use Task Scheduler **Run**. Do not kill every `node.exe` process on the machine.

## 3. LAN access and go-live

The installed frontend and API bind to loopback. Hospital IT must provide an HTTPS hostname, certificate, and reverse proxy that forwards both app pages and `/api` (including realtime events) to the local frontend port `47101`; the frontend forwards `/api` to local API port `47102`. Set `HRIS_ALLOWED_ORIGINS` to the exact HTTPS origin. Do not expose ports `47101`, `47102`, or biometric port `6000` directly to staff networks. Open biometric connectivity only after IT approves the device network and configuration. Without HTTPS, the production `Secure` session cookie will not support normal staff sign-in. Hospital LAN go-live is blocked until HTTPS, firewall rules, and an actual browser login/logout and export test pass from another PC.

The diagnostic command does not test certificate trust or external routing. Hospital IT must verify these separately from a staff workstation, including an allowed HR edit and a representative export. The existing `/api/health` response contains internal dependency details; restrict its exposure at the reverse proxy before go-live. Backup scheduling, restore validation, and biometric device testing are separate deployment prerequisites.

## Troubleshooting and rollback

`installation\windows\diagnose.bat` reports missing dependencies, invalid configuration, database connection errors, missing tables, and app routing failures without displaying passwords or employee records. Inspect `api.err.log` and `frontend.err.log` in the runtime folder for startup errors. If a port is occupied, identify its owner before stopping it. If MySQL is unavailable, check its service, configured host/port, account, and imported schema. If `/login` works but `/api` fails, check the frontend proxy target and API log.

To roll back an application update, stop the scheduled task and app, restore the previous repository/application files and matching local configuration, then restart and run diagnostics. Preserve the runtime folder. **Do not roll back a changed database by copying application files**; restore a tested database backup using hospital IT's approved procedure. This installation workflow does not perform database restore or migrations beyond the application's existing startup behavior.
