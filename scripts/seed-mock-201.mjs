import { readFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import mysql from "mysql2/promise";

function loadServerEnv() {
  try {
    const envPath = path.join(process.cwd(), "server", ".env");
    const text = readFileSync(envPath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index < 1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed
        .slice(index + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // Environment variables can still be supplied by the host process.
  }
}

loadServerEnv();

const DB_HOST = process.env.HRIS_DB_HOST || "localhost";
const DB_USER = process.env.HRIS_DB_USER || "root";
const DB_PASSWORD = process.env.HRIS_DB_PASSWORD || "";
const DB_NAME = process.env.HRIS_DB_NAME || "hris_db";

const SECTION_TABLES = {
  family: { table: "employee_family_records", single: true },
  children: { table: "employee_child_records" },
  education: { table: "employee_education_records" },
  civilService: { table: "employee_civil_service_records" },
  work: { table: "employee_work_records" },
  organization: { table: "employee_organization_records" },
  training: { table: "employee_training_records" },
  salary: { table: "employee_salary_records" },
  service: { table: "employee_service_records" },
  ipcr: { table: "employee_ipcr_records" },
};

const FIRST_NAMES = ["Mikaela", "Paolo", "Angela", "Rafael", "Clarissa", "Miguel", "Sophia"];
const LAST_NAMES = ["Reyes", "Santos", "Garcia", "Ramos", "Mendoza", "Torres", "Aquino"];
const MIDDLE_NAMES = ["Dizon", "Mercado", "Villanueva", "Castillo", "Navarro", "Bautista"];
const BARANGAYS = ["Tampus", "Bunganay", "Isok I", "Balaring", "Cawit", "Bantay"];
const SCHOOLS = [
  "Marinduque National High School",
  "Marinduque State University",
  "Southern Luzon State University",
  "University of the Philippines Manila",
  "Philippine Christian University",
];
const DEGREES = [
  "Bachelor of Science in Nursing",
  "Bachelor of Science in Accountancy",
  "Bachelor of Science in Information Technology",
  "Bachelor of Science in Medical Technology",
  "Master in Public Administration",
];
const TRAININGS = [
  "Basic Life Support and Standard First Aid",
  "Records Management and Data Privacy Orientation",
  "Government Procurement Reform Act Seminar",
  "Gender and Development Planning Workshop",
  "Quality Management System Awareness Training",
  "Workplace Safety and Infection Prevention",
];

function pick(list, index) {
  return list[index % list.length];
}

function pad(number, length = 2) {
  return String(number).padStart(length, "0");
}

function date(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function money(value) {
  return String(value.toFixed(2));
}

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function profileFor(employee, index) {
  const city = index % 2 === 0 ? "Boac, Marinduque" : "Mogpog, Marinduque";
  const barangay = pick(BARANGAYS, index);
  const serial = pad(index + 21, 2);
  return {
    citizenship: "Filipino",
    placeOfBirth: city,
    height: (1.55 + (index % 7) * 0.03).toFixed(2),
    heightUnit: "M",
    weight: String(54 + index * 4),
    weightUnit: "KG",
    bloodType: pick(["O+", "A+", "B+", "AB+", "O-"], index),
    sss: `03-${pad(1200000 + index * 731, 7)}-${pad(index + 1, 1)}`,
    gsis: `BP-${new Date().getFullYear()}-${pad(41000 + index * 137, 6)}`,
    pagibig: `1214-${pad(1000 + index * 31, 4)}-${pad(3000 + index * 43, 4)}`,
    tin: `${pad(210 + index, 3)}-${pad(450 + index * 3, 3)}-${pad(700 + index * 5, 3)}-000`,
    philhealth: `02-${pad(123456789 + index * 9731, 9)}-${pad(index + 1, 1)}`,
    ctcNo: `CTC-${new Date().getFullYear()}-${pad(7000 + index * 19, 5)}`,
    ctcPlaceIssued: city,
    ctcDateIssued: date(2026, 1 + (index % 4), 8 + index),
    residentialAddress: `${100 + index} ${barangay}, ${city}`,
    residentialZipcode: index % 2 === 0 ? "4900" : "4901",
    residentialTelNo: `(042) 332-${pad(1000 + index * 17, 4)}`,
    permanentAddress: `${100 + index} ${barangay}, ${city}`,
    permanentZipcode: index % 2 === 0 ? "4900" : "4901",
    permanentTelNo: `(042) 332-${pad(1000 + index * 17, 4)}`,
    agency: "DOH Southern Tagalog Regional Hospital",
    dateSeparated: "",
    veteransCode: `VET-${serial}`,
    bankAccountId: `LBP-${pad(3000000000 + index * 12345, 10)}`,
    cardSerialNo: `CARD-${pad(800000 + index * 211, 6)}`,
  };
}

function mockSections(employee, index) {
  const baseYear = 2000 + (index % 8);
  const spouseLast = pick(LAST_NAMES, index + 2);
  const spouseFirst = pick(FIRST_NAMES, index + 3);
  const childLast = employee.lastname || pick(LAST_NAMES, index);
  const collegeDegree = pick(DEGREES, index + 1);
  const currentSalary = 31000 + index * 3500;
  const started = 2016 + (index % 5);

  return {
    family: [
      {
        spouseLastname: spouseLast,
        spouseFirstname: spouseFirst,
        spouseMiddlename: pick(MIDDLE_NAMES, index + 1),
        spouseOccupation: pick(["Teacher", "Registered Nurse", "Accountant", "Entrepreneur"], index),
        spouseEmployer: pick(["DepEd Marinduque", "STRH", "Provincial Government", "Self-employed"], index),
        spouseBusinessTel: `0917${pad(2200000 + index * 913, 7)}`,
        spouseBusinessAddress: `${pick(BARANGAYS, index + 1)}, Boac, Marinduque`,
        fatherLastname: employee.lastname || pick(LAST_NAMES, index),
        fatherFirstname: pick(["Roberto", "Antonio", "Jose", "Manuel", "Eduardo"], index),
        fatherMiddlename: pick(MIDDLE_NAMES, index + 2),
        motherLastname: pick(LAST_NAMES, index + 4),
        motherFirstname: pick(["Lourdes", "Teresita", "Rosalinda", "Cecilia", "Maribel"], index),
        motherMiddlename: pick(MIDDLE_NAMES, index + 3),
      },
    ],
    children: [
      {
        lastname: childLast,
        firstname: pick(FIRST_NAMES, index + 1),
        middlename: spouseLast,
        gender: index % 2 === 0 ? "Female" : "Male",
        birthday: date(2012 + (index % 5), 2 + (index % 8), 6 + index),
      },
      {
        lastname: childLast,
        firstname: pick(FIRST_NAMES, index + 4),
        middlename: spouseLast,
        gender: index % 2 === 0 ? "Male" : "Female",
        birthday: date(2016 + (index % 4), 3 + (index % 7), 12 + index),
      },
    ],
    education: [
      {
        level: "Elementary",
        school: `${pick(BARANGAYS, index)} Elementary School`,
        degree: "Primary Education",
        yearFrom: String(baseYear - 12),
        yearTo: String(baseYear - 6),
        yearGraduated: String(baseYear - 6),
        scholarship: "With Honors",
      },
      {
        level: "Secondary",
        school: "Marinduque National High School",
        degree: "Secondary Education",
        yearFrom: String(baseYear - 6),
        yearTo: String(baseYear - 2),
        yearGraduated: String(baseYear - 2),
        scholarship: "Academic Excellence Award",
      },
      {
        level: "College",
        school: pick(SCHOOLS, index + 1),
        degree: collegeDegree,
        yearFrom: String(baseYear - 2),
        yearTo: String(baseYear + 2),
        yearGraduated: String(baseYear + 2),
        scholarship: "Dean's Lister",
      },
      {
        level: "Graduate Studies",
        school: pick(SCHOOLS, index + 3),
        degree: "Master in Public Administration",
        yearFrom: String(baseYear + 5),
        yearTo: String(baseYear + 7),
        yearGraduated: String(baseYear + 7),
        scholarship: "Completed Academic Requirements",
      },
    ],
    civilService: [
      {
        type: "Career Service Professional",
        place: "Boac, Marinduque",
        date: date(baseYear + 3, 8, 12),
        rating: String(82.5 + index),
        license: `CSC-${baseYear + 3}-${pad(10000 + index * 37, 5)}`,
        dateRelease: date(baseYear + 3, 10, 20),
        licenseValidity: "",
      },
      {
        type: "RA 1080 / Board Licensure",
        place: "Manila",
        date: date(baseYear + 4, 11, 5),
        rating: "Passed",
        license: `PRC-${pad(450000 + index * 83, 6)}`,
        dateRelease: date(baseYear + 4, 12, 15),
        licenseValidity: date(2028, 12, 31),
      },
    ],
    work: [
      {
        position: "Administrative Assistant II",
        company: "Provincial Government of Marinduque",
        status: "Contractual",
        dateFrom: date(started - 4, 1, 2),
        dateTo: date(started - 2, 12, 31),
        salary: money(currentSalary - 9000),
        govEmp: "YES",
      },
      {
        position: employee.position || "Administrative Officer I",
        company: "DOH Southern Tagalog Regional Hospital",
        status: employee.status || "Permanent",
        dateFrom: date(started, 1, 1),
        dateTo: "Present",
        salary: money(currentSalary),
        govEmp: "YES",
      },
    ],
    organization: [
      {
        name: "STRH Employees Association",
        position: "Member",
        address: "Boac, Marinduque",
        yearFrom: String(started),
        yearTo: "Present",
        hours: 48 + index * 4,
      },
      {
        name: "Community Health Outreach Volunteers",
        position: "Volunteer",
        address: "Marinduque",
        yearFrom: String(started + 1),
        yearTo: String(started + 2),
        hours: 72 + index * 3,
      },
    ],
    training: TRAININGS.slice(index % 2, index % 2 + 4).map((name, trainingIndex) => ({
      name,
      conductedBy: trainingIndex % 2 === 0 ? "Civil Service Commission" : "DOH Center for Health Development IV-B",
      yearFrom: date(2021 + trainingIndex, 3 + trainingIndex, 10 + index),
      yearTo: date(2021 + trainingIndex, 3 + trainingIndex, 11 + index),
      hours: trainingIndex === 0 ? 16 : 8,
      file: `${name.replace(/[^A-Za-z0-9]+/g, "-").toLowerCase()}-certificate.pdf`,
    })),
    salary: [
      {
        date: date(2024, 1, 1),
        description: "Annual salary adjustment",
        ordinance: "SSL V",
        grade: 11 + (index % 6),
        step: 1,
        tax: "Standard",
        amount: money(currentSalary - 1500),
        gross: money(currentSalary - 1500 + 2000),
        type: "Not Step Increment",
        pera: 2000,
        rata: 0,
        cata: 0,
      },
      {
        date: date(2025, 1, 1),
        description: "Step increment and salary adjustment",
        ordinance: "SSL V",
        grade: 11 + (index % 6),
        step: 2,
        tax: "Standard",
        amount: money(currentSalary),
        gross: money(currentSalary + 2000),
        type: "Step Increment",
        pera: 2000,
        rata: 0,
        cata: 0,
      },
    ],
    service: [
      {
        from: date(started - 4, 1, 2),
        to: date(started - 2, 12, 31),
        status: "Contractual",
        salary: money(currentSalary - 9000),
        designation: "Administrative Assistant II",
        department: "Administrative Division",
        assignment: "Records Unit",
        branch: "National",
        leave: "N/A",
        sepDate: date(started - 2, 12, 31),
        sepCause: "End of contract",
      },
      {
        from: date(started, 1, 1),
        to: "Present",
        status: employee.status || "Permanent",
        salary: money(currentSalary),
        designation: employee.position || "Administrative Officer I",
        department: employee.department || "Hospital Operation and Patient Support Division",
        assignment: employee.department || "Hospital Operation and Patient Support Division",
        branch: "National",
        leave: "With pay",
        sepDate: "",
        sepCause: "",
      },
    ],
    ipcr: [
      {
        month: "January-June 2025",
        from: date(2025, 1, 1),
        to: date(2025, 6, 30),
        grades: "Very Satisfactory",
        remarks: "Met performance targets and documentation requirements.",
        file: "ipcr-jan-jun-2025.pdf",
      },
      {
        month: "July-December 2025",
        from: date(2025, 7, 1),
        to: date(2025, 12, 31),
        grades: "Outstanding",
        remarks: "Exceeded service quality and timeliness targets.",
        file: "ipcr-jul-dec-2025.pdf",
      },
    ],
  };
}

async function insertSectionRows(connection, employeeId, section, rows) {
  const config = SECTION_TABLES[section];
  await connection.execute(`DELETE FROM \`${config.table}\` WHERE employee_id = ?`, [employeeId]);
  for (const row of rows) {
    await connection.execute(
      `INSERT INTO \`${config.table}\` (id, employee_id, payload) VALUES (?, ?, ?)`,
      [crypto.randomUUID(), employeeId, JSON.stringify(row)],
    );
  }
}

async function seedLeaveBalances(connection, employeeId, index) {
  const [types] = await connection.query(
    `SELECT id, code FROM leave_types WHERE is_active = 1 AND code IN ('VL', 'SL', 'SPL', 'FL')`,
  );
  const byCode = new Map(types.map((type) => [type.code, type.id]));
  const balances = [
    { code: "VL", earned: 14 + index, used: 2 + (index % 2), adjusted: 1, balance: 13 + index },
    { code: "SL", earned: 15 + index, used: 1, adjusted: 0, balance: 14 + index },
    { code: "SPL", earned: 3, used: index % 2, adjusted: 0, balance: 3 - (index % 2) },
    { code: "FL", earned: 5, used: 1, adjusted: 0, balance: 4 },
  ];

  for (const item of balances) {
    const leaveTypeId = byCode.get(item.code);
    if (!leaveTypeId) continue;
    await connection.execute(
      `INSERT INTO leave_balances (employee_id, leave_type_id, earned, used, adjusted, balance)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE earned = VALUES(earned), used = VALUES(used),
         adjusted = VALUES(adjusted), balance = VALUES(balance)`,
      [employeeId, leaveTypeId, item.earned, item.used, item.adjusted, item.balance],
    );
    await connection.execute(
      `DELETE FROM leave_credit_ledger
       WHERE employee_id = ? AND leave_type_id = ? AND source_type = 'mock_201_seed'`,
      [employeeId, leaveTypeId],
    );
    await connection.execute(
      `INSERT INTO leave_credit_ledger (
         id, employee_id, leave_type_id, entry_type, column_changed, amount, balance_delta,
         balance_after, source_type, source_id, description, created_by
       )
       VALUES (?, ?, ?, 'OpeningBalance', 'earned', ?, ?, ?, 'mock_201_seed', ?, ?, NULL)`,
      [
        crypto.randomUUID(),
        employeeId,
        leaveTypeId,
        item.earned,
        item.earned,
        item.earned,
        crypto.randomUUID(),
        `Mock opening ${item.code} leave credits for completed 201 file`,
      ],
    );
    if (item.used > 0) {
      await connection.execute(
        `INSERT INTO leave_credit_ledger (
           id, employee_id, leave_type_id, entry_type, column_changed, amount, balance_delta,
           balance_after, source_type, source_id, description, created_by
         )
         VALUES (?, ?, ?, 'Used', 'used', ?, ?, ?, 'mock_201_seed', ?, ?, NULL)`,
        [
          crypto.randomUUID(),
          employeeId,
          leaveTypeId,
          item.used,
          -item.used,
          item.balance,
          crypto.randomUUID(),
          `Mock used ${item.code} leave credits for completed 201 file`,
        ],
      );
    }
  }
}

async function main() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  try {
    const requestedIds = process.argv.slice(2);
    const employeeSql = `SELECT id, employee_no, firstname, middlename, lastname, name_ext, department, position,
                               status, level, status_class, date_hired, date_employed, item_no, emp_status,
                               birthday, gender, civil_status, email, cellphone_no, profile_json
                        FROM employees
                        WHERE COALESCE(is_hidden, 0) = 0 AND COALESCE(emp_status, 'Active') = 'Active'`;
    const [employees] = requestedIds.length
      ? await connection.query(
          `${employeeSql} AND id IN (${requestedIds.map(() => "?").join(",")})
           ORDER BY FIELD(id, ${requestedIds.map(() => "?").join(",")})`,
          [...requestedIds, ...requestedIds],
        )
      : await connection.query(`${employeeSql} ORDER BY RAND() LIMIT 5`);

    if (employees.length < 5) {
      throw new Error(`Expected at least 5 active employees, found ${employees.length}`);
    }

    const selected = [];
    await connection.beginTransaction();
    for (const [index, employee] of employees.entries()) {
      const profile = {
        ...profileFor(employee, index),
        ...parseJson(employee.profile_json, {}),
        ...profileFor(employee, index),
      };
      const birthday = employee.birthday || date(1984 + index, 4 + (index % 6), 10 + index);
      const gender = employee.gender || (index % 2 === 0 ? "Female" : "Male");
      const civilStatus = employee.civil_status || pick(["Married", "Single", "Married", "Separated"], index);
      const email =
        employee.email ||
        `${String(employee.firstname || "employee").toLowerCase()}.${String(employee.lastname || index).toLowerCase()}@strh.example`;
      const cellphoneNo = employee.cellphone_no || `09${pad(170000000 + index * 34567, 9)}`;

      await connection.execute(
        `UPDATE employees
         SET birthday = ?, gender = ?, civil_status = ?, email = ?, cellphone_no = ?,
             level = COALESCE(NULLIF(level, ''), ?),
             status_class = COALESCE(NULLIF(status_class, ''), ?),
             date_hired = COALESCE(date_hired, ?),
             date_employed = COALESCE(date_employed, ?),
             item_no = COALESCE(NULLIF(item_no, ''), ?),
             profile_json = ?
         WHERE id = ?`,
        [
          birthday,
          gender,
          civilStatus,
          email,
          cellphoneNo,
          index % 2 === 0 ? "Second Level" : "First Level",
          "Filled",
          date(2016 + (index % 5), 1, 1),
          date(2016 + (index % 5), 1, 1),
          `STRH-${pad(2020 + index, 4)}-${pad(100 + index, 3)}`,
          JSON.stringify(profile),
          employee.id,
        ],
      );

      const sections = mockSections(employee, index);
      for (const [section, rows] of Object.entries(sections)) {
        await insertSectionRows(connection, employee.id, section, rows);
      }
      await seedLeaveBalances(connection, employee.id, index);

      selected.push({
        id: employee.id,
        employeeNo: employee.employee_no,
        name: [employee.lastname, employee.firstname].filter(Boolean).join(", "),
      });
    }
    await connection.commit();

    console.log(JSON.stringify({ seeded: selected }, null, 2));
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
