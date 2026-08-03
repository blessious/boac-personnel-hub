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
