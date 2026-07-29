import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import mysql from "mysql2/promise";

const execFileAsync = promisify(execFile);

const workbookPath = path.resolve(
  "artifacts",
  "LGU Boac_HRMO-AND-PLANTILLA as of March 18, 2026 with office.xlsx",
);

function loadEnv() {
  const env = {};
  for (const fileName of ["server/.env.local", "server/.env", "server/.env.defaults"]) {
    if (!fs.existsSync(fileName)) continue;
    for (const line of fs.readFileSync(fileName, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index < 1) continue;
      const key = trimmed.slice(0, index).trim();
      if (key in env) continue;
      env[key] = trimmed
        .slice(index + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

function slug(value) {
  const code = String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 72);
  return code || "REF";
}

function uniqueCodes(names) {
  const used = new Map();
  return names.map((name) => {
    const base = slug(name);
    const next = (used.get(base) || 0) + 1;
    used.set(base, next);
    return next === 1 ? base : `${base}_${next}`.slice(0, 80);
  });
}

function titleCase(value) {
  const smallWords = new Set(["and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to"]);
  const romanNumerals = new Set(["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]);
  const acronyms = new Set(["BP", "COS", "GSIS", "HRMO", "IP", "JO", "PWD", "SB", "TIN"]);
  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b[\p{L}\p{N}']+\b/gu, (word, index, text) => {
      const original = value.slice(index, index + word.length);
      const upper = word.toUpperCase();
      if (romanNumerals.has(upper)) return upper;
      if (acronyms.has(original)) return original;
      const previous = text[index - 1] || "";
      const forceCap = index === 0 || previous === "(" || previous === "-" || previous === "/";
      if (!forceCap && smallWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
}

function uniqueNormalized(values) {
  return [...new Map(values.map((value) => [value.toLocaleLowerCase(), value])).values()];
}

async function readWorkbook(pythonExe) {
  const script = String.raw`
import json
import sys
from openpyxl import load_workbook

path = sys.argv[1]
workbook = load_workbook(path, data_only=True, read_only=True)
sheet = workbook["PLANTILLA"]
offices = []
positions = []
rows = 0
employee_rows = 0
blank_employee_rows = 0

for row in sheet.iter_rows(min_row=2, values_only=True):
    office = str(row[0]).strip() if row[0] is not None else ""
    position = str(row[2]).strip() if row[2] is not None else ""
    if not position:
        continue
    rows += 1
    if office and office not in offices:
        offices.append(office)
    if position and position not in positions:
        positions.append(position)
    last = str(row[10]).strip() if len(row) > 10 and row[10] is not None else ""
    first = str(row[11]).strip() if len(row) > 11 and row[11] is not None else ""
    if last or first:
        employee_rows += 1
    else:
        blank_employee_rows += 1

print(json.dumps({
    "rows": rows,
    "employeeRows": employee_rows,
    "blankEmployeeRows": blank_employee_rows,
    "offices": offices,
    "positions": positions,
}, ensure_ascii=False))
`;
  const { stdout } = await execFileAsync(pythonExe, ["-c", script, workbookPath], {
    maxBuffer: 1024 * 1024 * 8,
  });
  return JSON.parse(stdout.trim().split(/\r?\n/).at(-1));
}

async function tableExists(connection, table) {
  const [rows] = await connection.execute(
    `SELECT 1
       FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = :table
      LIMIT 1`,
    { table },
  );
  return rows.length > 0;
}

async function clearTable(connection, table, before) {
  if (!(await tableExists(connection, table))) return;
  const [[row]] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
  before[table] = Number(row.count || 0);
  await connection.query(`DELETE FROM \`${table}\``);
}

const env = loadEnv();
const pythonExe =
  env.HRIS_PYTHON_EXE && fs.existsSync(env.HRIS_PYTHON_EXE) ? env.HRIS_PYTHON_EXE : "python";
const data = await readWorkbook(pythonExe);
data.offices = uniqueNormalized(data.offices.map(titleCase));
data.positions = uniqueNormalized(data.positions.map(titleCase));
const officeCodes = uniqueCodes(data.offices);

const connection = await mysql.createConnection({
  host: env.HRIS_DB_HOST || "localhost",
  port: Number(env.HRIS_DB_PORT || 3306),
  user: env.HRIS_DB_USER || "root",
  password: env.HRIS_DB_PASSWORD || "",
  database: env.HRIS_DB_NAME || "hris_muni",
  namedPlaceholders: true,
  multipleStatements: false,
});

const before = {};
try {
  await connection.beginTransaction();

  await connection.query("UPDATE users SET employee_id = NULL WHERE employee_id IS NOT NULL");

  for (const table of [
    "personnel_movement_events",
    "temporary_assignments",
    "non_plantilla_engagements",
    "plantilla_reconciliations",
    "plantilla_occupancies",
    "plantilla_item_history",
    "personnel_movements",
    "plantilla_items",
    "salary_adjustment_results",
    "document_export_jobs",
    "dtr_correction_events",
    "dtr_correction_requests",
    "dtr_entries",
    "dtr_export_jobs",
    "attendance_logs",
    "leave_credit_ledger",
    "leave_adjustments",
    "leave_applications",
    "leave_balances",
    "employee_schedule_overrides",
    "employee_shift_assignments",
    "employee_family_records",
    "employee_child_records",
    "employee_education_records",
    "employee_civil_service_records",
    "employee_work_records",
    "employee_organization_records",
    "employee_training_records",
    "employee_salary_records",
    "employee_service_records",
    "employee_ipcr_records",
  ]) {
    await clearTable(connection, table, before);
  }

  await clearTable(connection, "employees", before);
  await clearTable(connection, "positions", before);

  await connection.query(
    `UPDATE hr_reference_values
        SET parent_id = NULL
      WHERE parent_id IN (
        SELECT id FROM (
          SELECT id FROM hr_reference_values WHERE category = 'offices'
        ) office_ids
      )`,
  );
  const [[officeBefore]] = await connection.query(
    "SELECT COUNT(*) AS count FROM hr_reference_values WHERE category = 'offices'",
  );
  before["hr_reference_values.offices"] = Number(officeBefore.count || 0);
  await connection.query("DELETE FROM hr_reference_values WHERE category = 'offices'");

  for (const [index, title] of data.positions.entries()) {
    await connection.execute(
      `INSERT INTO positions (title, sort_order)
       VALUES (:title, :sortOrder)`,
      { title, sortOrder: index + 1 },
    );
  }

  for (const [index, name] of data.offices.entries()) {
    await connection.execute(
      `INSERT INTO hr_reference_values
         (category, code, name, description, parent_id, is_active, sort_order)
       VALUES
         ('offices', :code, :name, NULL, NULL, 1, :sortOrder)`,
      { code: officeCodes[index], name, sortOrder: index + 1 },
    );
  }

  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}

console.log(
  JSON.stringify(
    {
      database: env.HRIS_DB_NAME || "hris_muni",
      workbook: workbookPath,
      source: {
        plantillaRows: data.rows,
        employeeRows: data.employeeRows,
        blankEmployeeRows: data.blankEmployeeRows,
      },
      deleted: before,
      inserted: {
        offices: data.offices.length,
        positions: data.positions.length,
      },
    },
    null,
    2,
  ),
);
