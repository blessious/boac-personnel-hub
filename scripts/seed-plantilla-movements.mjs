import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import mysql from "mysql2/promise";

function loadEnv() {
  const env = {};
  for (const fileName of ["server/.env.local", "server/.env"]) {
    if (!existsSync(fileName)) continue;
    const text = readFileSync(fileName, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index < 1) continue;
      env[trimmed.slice(0, index).trim()] = trimmed
        .slice(index + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const env = loadEnv();
const connection = await mysql.createConnection({
  host: env.HRIS_DB_HOST || "localhost",
  user: env.HRIS_DB_USER || "root",
  password: env.HRIS_DB_PASSWORD || "",
  database: env.HRIS_DB_NAME || "hris_db",
  multipleStatements: true,
});

async function single(sql, params = []) {
  const [rows] = await connection.execute(sql, params);
  return rows[0] || null;
}

async function idFrom(table, column, value) {
  const row = await single(`SELECT id FROM ${table} WHERE ${column} = ? LIMIT 1`, [value]);
  return row?.id || null;
}

async function refId(category, code) {
  const row = await single(
    "SELECT id FROM hr_reference_values WHERE category = ? AND code = ? LIMIT 1",
    [category, code],
  );
  return row?.id || null;
}

async function salaryGradeId(grade, step = 1) {
  const row =
    (await single(
      "SELECT id, amount FROM salary_grades WHERE grade = ? AND step = ? ORDER BY id LIMIT 1",
      [grade, step],
    )) || (await single("SELECT id, amount FROM salary_grades ORDER BY grade, step, id LIMIT 1"));
  return row ? { id: row.id, amount: Number(row.amount) } : null;
}

async function insertPlantillaItem(item) {
  const exists = await single("SELECT id FROM plantilla_items WHERE item_number = ? LIMIT 1", [
    item.itemNumber,
  ]);
  if (exists) return false;

  const positionId = await idFrom("positions", "title", item.positionTitle);
  const salaryGrade = await salaryGradeId(item.salaryGrade, item.step || 1);
  if (!positionId || !salaryGrade) return false;

  await connection.execute(
    `INSERT INTO plantilla_items (
       id, item_number, position_id, salary_grade_id,
       sector_ref_id, office_ref_id, division_ref_id, section_ref_id,
       plantilla_type_ref_id, budget_code_ref_id, authorized_salary,
       item_status, effective_from, notes
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', '2026-01-01', ?)`,
    [
      crypto.randomUUID(),
      item.itemNumber,
      positionId,
      salaryGrade.id,
      await refId("sectors", item.sector),
      await refId("offices", item.office),
      await refId("divisions", item.division),
      await refId("sections", item.section),
      await refId("plantilla-types", "PLANTILLA"),
      await refId("budget-codes", item.budgetCode || "PS"),
      salaryGrade.amount,
      "Starter visualization row. Replace with official PSIPOP/plantilla data.",
    ],
  );
  return true;
}

const plantillaItems = [
  {
    itemNumber: "OSEC-DOHB-MCC2-1-2026",
    positionTitle: "Medical Center Chief II",
    salaryGrade: 27,
    sector: "EXEC",
    office: "OMCC",
    division: "MCC-DIV",
    section: null,
  },
  {
    itemNumber: "OSEC-DOHB-MO3-1-2026",
    positionTitle: "Medical Officer III",
    salaryGrade: 21,
    sector: "MED",
    office: "MED-OFF",
    division: "MED-DIV",
    section: "ER",
  },
  {
    itemNumber: "OSEC-DOHB-NUR1-1-2026",
    positionTitle: "Nurse I",
    salaryGrade: 15,
    sector: "NURS",
    office: "NURS-OFF",
    division: "NURS-DIV",
    section: "WARD",
  },
  {
    itemNumber: "OSEC-DOHB-HRMO2-1-2026",
    positionTitle: "Administrative Officer IV (HRMO II)",
    salaryGrade: 15,
    sector: "ADMIN",
    office: "ADMIN-OFF",
    division: "ADMIN-DIV",
    section: "HR",
  },
  {
    itemNumber: "OSEC-DOHB-ACT2-1-2026",
    positionTitle: "Accountant II",
    salaryGrade: 16,
    sector: "ADMIN",
    office: "ADMIN-OFF",
    division: "FIN-DIV",
    section: "ACCOUNTING",
  },
  {
    itemNumber: "OSEC-DOHB-PHAR1-1-2026",
    positionTitle: "Pharmacist I",
    salaryGrade: 11,
    sector: "HOPSS",
    office: "HOPSS-OFF",
    division: "ANC-DIV",
    section: "PHARM",
  },
];

let insertedPlantilla = 0;
for (const item of plantillaItems) {
  if (await insertPlantillaItem(item)) insertedPlantilla += 1;
}

const existingMovement = await single("SELECT id FROM personnel_movements LIMIT 1");
let insertedMovement = false;
if (!existingMovement) {
  const employee = await single(
    `SELECT e.*
     FROM employees e
     WHERE e.emp_status = 'Active'
       AND NOT EXISTS (
         SELECT 1 FROM plantilla_occupancies po
         WHERE po.employee_id = e.id AND po.status = 'Active'
       )
     ORDER BY e.lastname, e.firstname
     LIMIT 1`,
  );
  const target = await single(
    `SELECT pi.*, p.title position_title, sg.grade, sg.step,
            COALESCE(sec.name, divi.name, off.name, s.name) organization_name
     FROM plantilla_items pi
     JOIN positions p ON p.id = pi.position_id
     LEFT JOIN salary_grades sg ON sg.id = pi.salary_grade_id
     LEFT JOIN hr_reference_values sec ON sec.id = pi.section_ref_id
     LEFT JOIN hr_reference_values divi ON divi.id = pi.division_ref_id
     LEFT JOIN hr_reference_values off ON off.id = pi.office_ref_id
     LEFT JOIN hr_reference_values s ON s.id = pi.sector_ref_id
     WHERE pi.item_status = 'Active'
       AND NOT EXISTS (
         SELECT 1 FROM plantilla_occupancies po
         WHERE po.plantilla_item_id = pi.id AND po.status = 'Active'
       )
     ORDER BY pi.item_number
     LIMIT 1`,
  );

  if (employee && target) {
    const sourceSnapshot = {
      employee: {
        id: employee.id,
        employeeNo: employee.employee_no,
        department: employee.department,
        position: employee.position,
        itemNo: employee.item_no,
        empStatus: employee.emp_status,
      },
      occupancy: null,
    };
    await connection.execute(
      `INSERT INTO personnel_movements (
         id, control_number, employee_id, action_type, status, effective_date,
         authority_number, target_plantilla_item_id, target_position_id,
         target_salary_grade_id, target_department, remarks,
         supporting_documents, source_snapshot_json
       )
       VALUES (?, 'MV-DEMO-0001', ?, 'Original Appointment', 'Draft', CURDATE(),
         'FOR ENCODING', ?, ?, ?, ?, ?,
         ?, ?)`,
      [
        crypto.randomUUID(),
        employee.id,
        target.id,
        target.position_id,
        target.salary_grade_id,
        target.organization_name || "",
        "Starter draft movement for visualization. Replace with actual approved personnel action.",
        JSON.stringify([{ name: "Appointment document", reference: "For encoding" }]),
        JSON.stringify(sourceSnapshot),
      ],
    );
    insertedMovement = true;
  }
}

const [plantillaSummary] = await connection.query(
  `SELECT COUNT(*) total,
          SUM(item_status = 'Active') active
   FROM plantilla_items`,
);
const [movementSummary] = await connection.query(
  `SELECT status, COUNT(*) count
   FROM personnel_movements
   GROUP BY status
   ORDER BY status`,
);

console.log(`Inserted plantilla items: ${insertedPlantilla}`);
console.log(`Inserted draft movement: ${insertedMovement ? "yes" : "no"}`);
console.table(plantillaSummary);
console.table(movementSummary);
await connection.end();
