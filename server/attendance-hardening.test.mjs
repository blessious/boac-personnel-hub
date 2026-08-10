import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const serverSource = readFileSync(new URL("./index.mjs", import.meta.url), "utf8");
const authSource = readFileSync(new URL("../src/lib/auth.tsx", import.meta.url), "utf8");
const attendanceApiSource = readFileSync(
  new URL("../src/lib/attendance-api.ts", import.meta.url),
  "utf8",
);
const schedulesApiSource = readFileSync(
  new URL("../src/lib/schedules-api.ts", import.meta.url),
  "utf8",
);
const attendanceRouteSource = readFileSync(
  new URL("../src/routes/attendance.tsx", import.meta.url),
  "utf8",
);
const migrationSource = readFileSync(
  new URL("./migrations/2026-08-03_attendance_import_exceptions.sql", import.meta.url),
  "utf8",
);
const fieldLockMigrationSource = readFileSync(
  new URL("./migrations/2026-08-10_dtr_field_locks.sql", import.meta.url),
  "utf8",
);

test("DTR correction approval uses the configurable attendance permission", () => {
  assert.match(serverSource, /key:\s*"attendance\.corrections\.approve"/);
  assert.match(authSource, /"attendance\.corrections\.approve"/);
  assert.match(serverSource, /hasPermission\(user,\s*"attendance\.corrections\.approve"\)/);
  assert.doesNotMatch(serverSource, /canApproveCorrections\s*=\s*await hasPermission\(user,\s*"approvals\.manage"\)/);
  assert.match(attendanceRouteSource, /hasPermission\("attendance\.corrections\.approve"\)/);
});

test("unmatched attendance punches have an import-exception quarantine contract", () => {
  assert.match(serverSource, /CREATE TABLE IF NOT EXISTS attendance_import_exceptions/);
  assert.match(migrationSource, /CREATE TABLE IF NOT EXISTS attendance_import_exceptions/);
  assert.match(serverSource, /insertAttendanceImportException/);
  assert.match(serverSource, /handleListAttendanceImportExceptions/);
  assert.match(serverSource, /handleMapAttendanceImportException/);
  assert.match(serverSource, /handleReprocessAttendanceImportExceptions/);
  assert.match(attendanceApiSource, /type AttendanceImportException/);
  assert.match(attendanceRouteSource, /Quarantined Punches/);
});

test("schedule mutations return refresh counts and warnings", () => {
  assert.match(serverSource, /attendance\.schedule_refresh/);
  assert.match(serverSource, /attendance\.schedule_override_refresh/);
  assert.match(serverSource, /warnings:\s*refreshed\.warnings/);
  assert.match(schedulesApiSource, /type ScheduleMutationResponse/);
  assert.match(schedulesApiSource, /refreshed:\s*\{\s*recordsProcessed:\s*number/);
  assert.match(attendanceApiSource, /bulkUpdateSchedule\(payload:\s*\{/);
  assert.match(attendanceApiSource, /from:\s*string;\s*\n\s*to:\s*string;/);
});

test("attendance bulk operations enforce bounded date ranges", () => {
  assert.match(serverSource, /const ATTENDANCE_MAX_RANGE_DAYS = 62/);
  assert.match(serverSource, /validateAttendanceRange\(from,\s*to,\s*"Import date range"\)/);
  assert.match(serverSource, /validateAttendanceRange\(from,\s*to,\s*"Refresh date range"\)/);
  assert.match(serverSource, /validateAttendanceRange\(startDate,\s*endDate,\s*"Schedule override range"\)/);
  assert.match(serverSource, /validateAttendanceRange\(from,\s*to,\s*"Biometric sync range"\)/);
});

test("DTR edit locks are tracked per time slot and exposed through the API", () => {
  for (const column of ["am_in_locked", "am_out_locked", "pm_in_locked", "pm_out_locked"]) {
    assert.match(serverSource, new RegExp(`${column} TINYINT\\(1\\) NOT NULL DEFAULT 0`));
    assert.match(serverSource, new RegExp(`ensureColumn\\("dtr_entries", "${column}"`));
    assert.match(fieldLockMigrationSource, new RegExp(column));
  }
  assert.match(serverSource, /lockFields:\s*\{\s*amIn:\s*Boolean\(row\.am_in_locked\)/);
  assert.match(attendanceApiSource, /lockFields:\s*\{\s*amIn:\s*boolean;/);
  assert.match(attendanceApiSource, /lockDtr\?:\s*boolean/);
});

test("DTR refresh merges locked slots and recomputes attendance stats", () => {
  assert.match(serverSource, /const existingLocks = dtrLockFields\(existing\)/);
  assert.match(serverSource, /amIn:\s*existingLocks\.amIn \? formatTime\(existing\.am_in\) : params\.amIn/);
  assert.match(serverSource, /calculateAttendanceStatsForShift\(mergedEntry,\s*entry\.shift \|\| null\)/);
  assert.match(serverSource, /locked or labeled DTR row\(s\) were partially preserved/);
  assert.doesNotMatch(serverSource, /source <> 'Imported'\)/);
});

test("DTR correction audit includes all employees and direct admin edits", () => {
  assert.match(
    attendanceRouteSource,
    /employeeId:\s*isEmployee \|\| selectedEmployeeId === "all" \? undefined : selectedEmployeeId/,
  );
  assert.match(serverSource, /Direct admin DTR edit/);
  assert.match(serverSource, /INSERT INTO dtr_correction_requests \(/);
  assert.match(serverSource, /insertDtrCorrectionEvent\(connection,\s*\{\s*requestId,\s*eventType:\s*"Approved"/);
});
