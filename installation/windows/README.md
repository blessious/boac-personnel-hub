# HRIS Windows installation — quick guide

Use this guide when you are installing HRIS on one Windows computer. Keep the whole HRIS project folder in one fixed location, for example `C:\HRIS`. Do not move only this `installation\windows` folder; the scripts need the rest of the project.

## Before you start

Install these programs on the Windows computer:

1. Node.js 20.19+ or 22.12+ (use an LTS version).
2. Python 3.
3. MySQL Server and MySQL Workbench.
4. LibreOffice, needed for PDF and Excel exports.

You also need the HRIS `.sql` database file and the MySQL username and password that will be used by HRIS.

## Install HRIS

1. Open the HRIS project folder.
2. Open `installation\windows`.
3. Right-click `setup-hospital.bat` and choose **Run as administrator** if Windows asks for permission. Wait until it says setup completed. This installs the app dependencies and builds HRIS. It does **not** import your SQL file.
4. Create a runtime folder. For example, create `C:\HRIS-runtime`.
5. Open MySQL Workbench. Connect to your local MySQL server, then create an empty database for HRIS, for example `hris_hospital`.
6. Import your `.sql` file into that database:
   - In MySQL Workbench, select the database.
   - Choose **Server** → **Data Import**.
   - Select **Import from Self-Contained File** and choose the HRIS `.sql` file.
   - Select your `hris_hospital` database under **Default Target Schema**.
   - Click **Start Import** and wait for it to finish.
7. Open `server\.env.local` in Notepad. This file is created by the setup script. Replace every `CHANGE_ME` value using this example:

```ini
HRIS_DB_HOST=127.0.0.1
HRIS_DB_PORT=3306
HRIS_DB_USER=your_mysql_user
HRIS_DB_PASSWORD=your_mysql_password
HRIS_DB_NAME=hris_hospital
HRIS_API_PORT=47102
HRIS_CLIENT_PORT=47101
HRIS_ADMS_PORT=0
HRIS_RUNTIME_DIR=C:\HRIS-runtime
HRIS_PYTHON_EXE=C:\HRIS\.venv\Scripts\python.exe
HRIS_LIBREOFFICE_EXE=C:\Program Files\LibreOffice\program\soffice.com
HRIS_DEV_AUTO_BOOTSTRAP=0
```

If your HRIS folder is somewhere else, change the Python path. Do not share or commit `server\.env.local`; it contains the database password.

## Check and start

1. Double-click `diagnose.bat` inside `installation\windows`.
2. Fix every line marked `FAIL`. A warning that HRIS is not running is normal before the first startup.
3. Double-click `start-installed.bat` and leave its window running during this first test.
4. Run `diagnose.bat` again. The API, frontend, and frontend `/api` route should all show `OK`.
5. Open [http://localhost:47101/login](http://localhost:47101/login).
6. If the imported database has no users, create the first Super Admin on this page. If it already has users, log in with an existing authorized account.
7. Test a normal sign-in and one report export before using real staff data.

To stop HRIS, run `stop-installed.bat`. Do not end every `node.exe` process in Task Manager.

## Database backup

Use `backup-control.bat` to manage backups. Choose **option 1** to select the backup folder using a folder picker, then choose **option 2** to create a backup immediately. The selected folder is saved locally in `backup-settings.json`; you do not need to type the path every time.

`backup-now.bat` creates an SQL backup without opening the menu. Use it for Task Scheduler. It keeps backups for seven days and removes only old files that begin with `hris-backup-`. It never imports or overwrites the HRIS database.

To schedule daily backup, create another Task Scheduler task:

1. Trigger: **Daily**, at a time when HRIS is lightly used.
2. Program: `C:\Windows\System32\cmd.exe`
3. Arguments: `/c "C:\HRIS\installation\windows\backup-now.bat"`
4. Start in: `C:\HRIS`
5. Set **Do not start a new instance** if the previous backup is still running.

Check the selected backup folder after the first scheduled run. Each successful backup is an `.sql` file, and `hris-backup.log` records success or failure.

To verify that a backup can be recovered, run `restore-test-control.bat`. Choose an `hris-backup-*.sql` file from your selected backup folder. The script restores it into a temporary database, checks the `users` and `employees` tables, then deletes only that temporary database. It never writes to or replaces `hris_db`.

## Start automatically after restart

Only do this after manual start and stop work.

1. Open **Task Scheduler** as administrator and choose **Create Task**.
2. Name it `HRIS Installed`.
3. On **General**, choose the hospital IT service account and select **Run whether user is logged on or not**.
4. On **Triggers**, add **At startup**, with a 30-second delay.
5. On **Actions**, choose **Start a program**:
   - Program: `C:\Windows\System32\cmd.exe`
   - Arguments: `/c "C:\HRIS\installation\windows\start-installed.bat"`
   - Start in: `C:\HRIS`
6. On **Settings**, select **Restart the task if it fails** every one minute, up to three times. Set “If the task is already running” to **Do not start a new instance**.
7. Click **Run** in Task Scheduler, then run `diagnose.bat` again to confirm HRIS started.

## Important before hospital LAN use

This setup is for the local computer first. For other hospital computers to use HRIS, hospital IT must set up the HTTPS hostname, certificate, firewall rules, and reverse proxy. Do not expose the local HRIS ports directly to the staff network.

For full troubleshooting and rollback instructions, read [hospital-installation.md](hospital-installation.md).
