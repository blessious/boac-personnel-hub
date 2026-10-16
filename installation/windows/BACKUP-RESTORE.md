# HRIS backup and restore notes

Use `backup-control.bat` to select the backup location and make a backup. `backup-now.bat` is the non-interactive version for Windows Task Scheduler. It reads the database connection from `server\.env.local`, writes a full MySQL SQL dump, and retains the last seven days of `hris-backup-*.sql` files.

Use `restore-test-control.bat` to safely test one selected backup. It restores into a unique temporary database, confirms the `users` and `employees` tables exist, writes the result to `hris-restore-test.log`, and deletes only that temporary database. It refuses backups outside the selected backup folder and checks that the live database name is not present in the rewritten restore commands.

## Restore safely

Never restore directly over the live HRIS database without first stopping HRIS and taking a current backup. Test a backup in a separate temporary database first.

In MySQL Workbench:

1. Create a test schema such as `hris_restore_test`.
2. Open the SQL backup file and change the `CREATE DATABASE` / `USE` database name at the top to `hris_restore_test`, or import it into that test schema.
3. Run the import.
4. Confirm the `users` and `employees` tables exist and the expected records are present.
5. Delete the temporary test schema when verification is complete.

For a real recovery, hospital IT should stop HRIS, preserve a copy of the current database, restore the chosen verified backup, start HRIS, and confirm login and a report export. Do not use a restore procedure until it has been tested with a non-production database.
