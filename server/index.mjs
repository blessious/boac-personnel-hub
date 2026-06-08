import http from "node:http";
import crypto from "node:crypto";
import { URL } from "node:url";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const PORT = Number(process.env.HRIS_API_PORT || 3001);
const DB_HOST = process.env.HRIS_DB_HOST || "localhost";
const DB_USER = process.env.HRIS_DB_USER || "root";
const DB_PASSWORD = process.env.HRIS_DB_PASSWORD || "";
const DB_NAME = process.env.HRIS_DB_NAME || "hris_db";
const SESSION_COOKIE = "hris_session";
const SESSION_HOURS = 8;
const BACKUP_DIR = path.join(process.cwd(), "server", "backups");

const ROLES = ["Admin", "HR", "Employee", "Viewer"];
const DEFAULT_AGENCY = {
  name: "STRH - HRIS",
  tagline: "DOH Southern Tagalog Regional Hospital",
  logoUrl: "",
  iconUrl: "",
  bannerUrl: "",
};
const DEFAULT_DEPARTMENTS = [
  "Hospital Operation and Patient Support Division",
  "Medical Division",
  "Nursing Division",
];
const DEFAULT_POSITIONS = [
  "Accountant II",
  "Accountant III",
  "Administrative Aide III",
  "Administrative Aide III (Utility Worker II)",
  "Administrative Aide IV",
  "Administrative Aide IV (Driver II)",
  "Administrative Aide VI (Clerk III)",
  "Administrative Aide VI (Clerk III) (SAO)",
  "Administrative Aide VI (Disbursing Officer I)",
  "Administrative Aide VI (Utility Foreman)",
  "Administrative Assistant I (Computer Operator I)",
  "Administrative Assistant I (Computer Operator I) (MM)",
  "Administrative Assistant I (Computer Operator I) (Proc)",
  "Administrative Assistant I (Pharmacy)",
  "Administrative Assistant I (Records)",
  "Administrative Assistant I (Secretary I)",
  "Administrative Assistant II (Accounting Clerk III)",
  "Administrative Assistant II (Administrative Assistant)",
  "Administrative Assistant II (Budgeting Assistant)",
  "Administrative Assistant II (Cash Clerk III)",
  "Administrative Assistant III (Buyer III)",
  "Administrative Assistant III (Secretary II)",
  "Administrative Officer I (Cashier I)",
  "Administrative Officer I (Records Officer I)",
  "Administrative Officer II (Budget Officer I)",
  "Administrative Officer II (HRMO I)",
  "Administrative Officer II (Information Officer I)",
  "Administrative Officer III (Supply Officer II)",
  "Administrative Officer IV (Financial Analyst II)",
  "Administrative Officer IV (HRMO II)",
  "Administrative Officer IV (Information Officer II)",
  "Administrative Officer V (Administrative Officer III)",
  "Administrative Officer V (Budget Officer III)",
  "Administrative Officer V (Cashier III)",
  "Administrative Officer V (HRMO III)",
  "Administrative Officer V (Supply Officer III)",
  "Chemist II",
  "Chief of Medical professional Staff II",
  "Computer Maintenance Technologist I",
  "Computer Maintenance Technologist II",
  "Cook II",
  "Data Controller II",
  "Dental Aide",
  "Dentist II",
  "Dentist IV",
  "Engineer II",
  "Engineer III",
  "Health Education and Promotion Officer II",
  "Hospital Housekeeper",
  "Laboratory Aide II",
  "Laundry Worker II",
  "Medical Center Chief II",
  "Medical Equipment Technician I",
  "Medical Equipment Technician II",
  "Medical Officer III",
  "Medical Officer III (ER)",
  "Medical Officer III (IM)",
  "Medical Officer III (OB)",
  "Medical Officer III (Pedia)",
  "Medical Officer III (Surgeon)",
  "Medical Officer IV",
  "Medical Specialist II (Anesthesiologist)",
  "Medical Specialist II (Internist)",
  "Medical Specialist II (Obstretician)",
  "Medical Specialist II (OPD)",
  "Medical Specialist II (Pathologist)",
  "Medical Specialist II (Pediatrician)",
  "Medical Specialist II (Radiologist)",
  "Medical Specialist II (Surgeon)",
  "Medical Specialist III (Anesthesiologist)",
  "Medical Specialist III (ER)",
  "Medical Specialist III (Internal Medicine)",
  "Medical Specialist III (Obstetrician)",
  "Medical Specialist III (Part-time) (Cardiologist)",
  "Medical Specialist III (Part-time) (IDS)",
  "Medical Specialist III (Part-time) (Neonatologist)",
  "Medical Specialist III (Part-time) (Nephrologist)",
  "Medical Specialist III (Part-time) (Neurologist)",
  "Medical Specialist III (Part-time) (Pediatric Intensivist)",
  "Medical Specialist III (Part-time) (Pulmonolgist)",
  "Medical Specialist III (Part-time) (Sonologist)",
  "Medical Specialist III (Pathologist)",
  "Medical Specialist III (Pediatrician)",
  "Medical Specialist III (Surgeon)",
  "Medical Technologist I",
  "Medical Technologist II",
  "Medical Technologist III",
  "Midwife I",
  "Nurse I",
  "Nurse II",
  "Nurse III",
  "Nurse IV",
  "Nurse V",
  "Nurse VI",
  "Nursing Attendant I",
  "Nursing Attendant II",
  "Nutritionist-Dietitian I",
  "Nutritionist-Dietitian III",
  "Pharmacist I",
  "Pharmacist III",
  "Psychologist II",
  "Radiologic Technologist I",
  "Radiologic Technologist II",
  "Radiologic Technologist III",
  "Respiratory Therapist I",
  "Respiratory Therapist II",
  "Seamstress",
  "Social Welfare Assistant",
  "Social Welfare Officer I",
  "Social Welfare Officer III",
  "Statistician II",
  "Supervising Administrative Officer",
  "Warehouseman II",
];

const EMPLOYEE_SECTION_TABLES = {
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

const EMPLOYEE_PROFILE_FIELDS = [
  "citizenship",
  "placeOfBirth",
  "height",
  "heightUnit",
  "weight",
  "weightUnit",
  "bloodType",
  "sss",
  "gsis",
  "pagibig",
  "tin",
  "philhealth",
  "ctcNo",
  "ctcPlaceIssued",
  "ctcDateIssued",
  "residentialAddress",
  "residentialZipcode",
  "residentialTelNo",
  "permanentAddress",
  "permanentZipcode",
  "permanentTelNo",
  "agency",
  "dateSeparated",
  "veteransCode",
  "bankAccountId",
  "cardSerialNo",
];

let pool;

function json(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function sendFile(res, filePath, fileName) {
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "no-store",
  });
  createReadStream(filePath).pipe(res);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const index = item.indexOf("=");
        return [item.slice(0, index), decodeURIComponent(item.slice(index + 1))];
      }),
  );
}

function sessionCookie(token, expiresAt) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Expires=${expiresAt.toUTCString()}${secure}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 210000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(password, salt, 210000, 32, "sha256");
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && crypto.timingSafeEqual(expected, candidate);
}

function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    photoUrl: row.photo_url || undefined,
    mustChangePassword: Boolean(row.must_change_password),
  };
}

function adminUser(row) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    isActive: Boolean(row.is_active),
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

function normalizeDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function employeeRow(row) {
  const profile = parseJson(row.profile_json, {});
  return {
    id: row.id,
    employeeId: row.employee_no,
    firstname: row.firstname || "",
    middlename: row.middlename || "",
    lastname: row.lastname || "",
    nameExt: row.name_ext || "",
    department: row.department || "",
    position: row.position || "",
    status: row.status || "Permanent",
    level: row.level || "",
    statusClass: row.status_class || "",
    dateHired: normalizeDate(row.date_hired),
    dateEmployed: normalizeDate(row.date_employed),
    itemNo: row.item_no || "",
    empStatus: row.emp_status || "Active",
    birthday: normalizeDate(row.birthday),
    gender: row.gender || "",
    civilStatus: row.civil_status || "",
    email: row.email || "",
    cellphoneNo: row.cellphone_no || "",
    photoUrl: row.photo_url || "",
    citizenship: profile.citizenship || "",
    placeOfBirth: profile.placeOfBirth || "",
    height: profile.height || "",
    heightUnit: profile.heightUnit || "M",
    weight: profile.weight || "",
    weightUnit: profile.weightUnit || "KL",
    bloodType: profile.bloodType || "",
    sss: profile.sss || "",
    gsis: profile.gsis || "",
    pagibig: profile.pagibig || "",
    tin: profile.tin || "",
    philhealth: profile.philhealth || "",
    ctcNo: profile.ctcNo || "",
    ctcPlaceIssued: profile.ctcPlaceIssued || "",
    ctcDateIssued: profile.ctcDateIssued || "",
    residentialAddress: profile.residentialAddress || "",
    residentialZipcode: profile.residentialZipcode || "",
    residentialTelNo: profile.residentialTelNo || "",
    permanentAddress: profile.permanentAddress || "",
    permanentZipcode: profile.permanentZipcode || "",
    permanentTelNo: profile.permanentTelNo || "",
    agency: profile.agency || "",
    dateSeparated: profile.dateSeparated || "",
    veteransCode: profile.veteransCode || "",
    bankAccountId: profile.bankAccountId || "",
    cardSerialNo: profile.cardSerialNo || "",
  };
}

function employeeDbPayload(body, existing = {}) {
  const firstname = String(body.firstname ?? existing.firstname ?? "").trim();
  const lastname = String(body.lastname ?? existing.lastname ?? "").trim();
  const department = String(body.department ?? existing.department ?? "").trim();
  const position = String(body.position ?? existing.position ?? "").trim();
  const status = String(body.status ?? existing.status ?? "Permanent").trim();

  if (!firstname) throw new Error("First name is required");
  if (!lastname) throw new Error("Last name is required");
  if (!department) throw new Error("Department is required");
  if (!position) throw new Error("Position is required");
  if (!status) throw new Error("Employment status is required");

  const profile = {};
  for (const field of EMPLOYEE_PROFILE_FIELDS) {
    profile[field] = String(body[field] ?? existing[field] ?? "").trim();
  }

  return {
    employeeNo: String(body.employeeId ?? existing.employeeId ?? "").trim(),
    firstname,
    middlename: String(body.middlename ?? existing.middlename ?? "").trim(),
    lastname,
    nameExt: String(body.nameExt ?? existing.nameExt ?? "").trim(),
    department,
    position,
    status,
    level: String(body.level ?? existing.level ?? "").trim(),
    statusClass: String(body.statusClass ?? existing.statusClass ?? "").trim(),
    dateHired: body.dateHired || existing.dateHired || null,
    dateEmployed: body.dateEmployed || existing.dateEmployed || null,
    itemNo: String(body.itemNo ?? existing.itemNo ?? "").trim(),
    empStatus: String(body.empStatus ?? existing.empStatus ?? "Active").trim() || "Active",
    birthday: body.birthday || existing.birthday || null,
    gender: String(body.gender ?? existing.gender ?? "").trim(),
    civilStatus: String(body.civilStatus ?? existing.civilStatus ?? "").trim(),
    email: String(body.email ?? existing.email ?? "").trim(),
    cellphoneNo: String(body.cellphoneNo ?? existing.cellphoneNo ?? "").trim(),
    photoUrl: body.photoUrl ? String(body.photoUrl) : existing.photoUrl || "",
    profileJson: JSON.stringify(profile),
  };
}

function sectionRow(row) {
  return {
    id: row.id,
    payload: parseJson(row.payload, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateSection(section) {
  return EMPLOYEE_SECTION_TABLES[section] || null;
}

async function requireEmployeeRead(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!["Admin", "HR", "Viewer"].includes(user.role)) {
    json(res, 403, { error: "Employee Management access required" });
    return null;
  }
  return user;
}

async function requireEmployeeWrite(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!["Admin", "HR"].includes(user.role)) {
    json(res, 403, { error: "HR access required" });
    return null;
  }
  return user;
}

async function readEmployeeById(id) {
  const [rows] = await pool.execute(`SELECT * FROM employees WHERE id = :id LIMIT 1`, { id });
  return rows[0] ? employeeRow(rows[0]) : null;
}

function generateTemporaryPassword() {
  return `STRH-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.end();

  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(150) NOT NULL,
      role ENUM('Admin', 'HR', 'Employee', 'Viewer') NOT NULL,
      photo_url LONGTEXT NULL,
      must_change_password TINYINT(1) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await ensureColumn("users", "must_change_password", "TINYINT(1) NOT NULL DEFAULT 0");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id CHAR(64) NOT NULL PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sessions_user_id (user_id),
      INDEX idx_sessions_expires_at (expires_at),
      CONSTRAINT fk_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NULL,
      action VARCHAR(120) NOT NULL,
      details JSON NULL,
      ip_address VARCHAR(64) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_user_id (user_id),
      CONSTRAINT fk_audit_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS agency_settings (
      id TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
      name VARCHAR(200) NOT NULL,
      tagline VARCHAR(255) NOT NULL,
      logo_url LONGTEXT NULL,
      icon_url LONGTEXT NULL,
      banner_url LONGTEXT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS departments (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL UNIQUE,
      sort_order INT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS positions (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL UNIQUE,
      sort_order INT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS salary_grades (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      ordinance VARCHAR(120) NOT NULL,
      grade INT UNSIGNED NOT NULL,
      step INT UNSIGNED NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_salary_grade_step (ordinance, grade, step)
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id CHAR(36) NOT NULL PRIMARY KEY,
      employee_no VARCHAR(80) NOT NULL UNIQUE,
      firstname VARCHAR(120) NOT NULL,
      middlename VARCHAR(120) NULL,
      lastname VARCHAR(120) NOT NULL,
      name_ext VARCHAR(30) NULL,
      department VARCHAR(200) NOT NULL,
      position VARCHAR(200) NOT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'Permanent',
      level VARCHAR(40) NULL,
      status_class VARCHAR(80) NULL,
      date_hired DATE NULL,
      date_employed DATE NULL,
      item_no VARCHAR(120) NULL,
      emp_status VARCHAR(20) NOT NULL DEFAULT 'Active',
      birthday DATE NULL,
      gender VARCHAR(20) NULL,
      civil_status VARCHAR(40) NULL,
      email VARCHAR(180) NULL,
      cellphone_no VARCHAR(80) NULL,
      photo_url LONGTEXT NULL,
      profile_json JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_employees_department (department),
      INDEX idx_employees_status (status),
      INDEX idx_employees_emp_status (emp_status),
      INDEX idx_employees_name (lastname, firstname)
    ) ENGINE=InnoDB;
  `);

  for (const { table, single } of Object.values(EMPLOYEE_SECTION_TABLES)) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`${table}\` (
        id CHAR(36) NOT NULL PRIMARY KEY,
        employee_id CHAR(36) NOT NULL,
        payload JSON NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_${table}_employee_id (employee_id),
        ${single ? `UNIQUE KEY uniq_${table}_employee_id (employee_id),` : ""}
        CONSTRAINT fk_${table}_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
  }

  await seedConfigTables();

  const seeds = [
    ["admin", "admin", "System Administrator", "Admin"],
    ["hr", "hr", "Maria Santos", "HR"],
    ["employee", "employee", "Juan dela Cruz", "Employee"],
    ["viewer", "viewer", "Pedro Cruz", "Viewer"],
  ];

  for (const [username, password, name, role] of seeds) {
    await pool.execute(
      `INSERT INTO users (username, password_hash, name, role)
       VALUES (:username, :passwordHash, :name, :role)
       ON DUPLICATE KEY UPDATE username = username`,
      { username, passwordHash: hashPassword(password), name, role },
    );
  }
}

async function ensureColumn(table, column, definition) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
    { schema: DB_NAME, table, column },
  );
  if (Number(rows[0].count) === 0) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

async function seedConfigTables() {
  await pool.execute(
    `INSERT INTO agency_settings (id, name, tagline, logo_url, icon_url, banner_url)
     VALUES (1, :name, :tagline, :logoUrl, :iconUrl, :bannerUrl)
     ON DUPLICATE KEY UPDATE id = id`,
    DEFAULT_AGENCY,
  );

  for (const [index, name] of DEFAULT_DEPARTMENTS.entries()) {
    await pool.execute(
      `INSERT INTO departments (name, sort_order)
       VALUES (:name, :sortOrder)
       ON DUPLICATE KEY UPDATE name = name`,
      { name, sortOrder: index + 1 },
    );
  }

  for (const [index, title] of DEFAULT_POSITIONS.entries()) {
    await pool.execute(
      `INSERT INTO positions (title, sort_order)
       VALUES (:title, :sortOrder)
       ON DUPLICATE KEY UPDATE title = title`,
      { title, sortOrder: index + 1 },
    );
  }

  const [salaryRows] = await pool.query(`SELECT COUNT(*) AS count FROM salary_grades`);
  if (Number(salaryRows[0].count) === 0) {
    for (let grade = 1; grade <= 33; grade += 1) {
      const base = 13000 + grade * 1850;
      for (let step = 1; step <= 8; step += 1) {
        await pool.execute(
          `INSERT INTO salary_grades (ordinance, grade, step, amount)
           VALUES ('Annex 1', :grade, :step, :amount)`,
          { grade, step, amount: Math.round(base * (1 + (step - 1) * 0.018)) },
        );
      }
    }
  }
}

async function getSessionUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;

  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.name, u.role, u.photo_url, u.must_change_password
     FROM sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.id = :token AND s.expires_at > NOW() AND u.is_active = 1
     LIMIT 1`,
    { token },
  );

  return rows[0] ? publicUser(rows[0]) : null;
}

async function requireUser(req, res) {
  const user = await getSessionUser(req);
  if (!user) {
    json(res, 401, { error: "Not authenticated" });
    return null;
  }
  return user;
}

async function requireAdmin(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (user.role !== "Admin") {
    json(res, 403, { error: "Admin access required" });
    return null;
  }
  return user;
}

async function logAudit(userId, action, details, req) {
  await pool.execute(
    `INSERT INTO audit_logs (user_id, action, details, ip_address)
     VALUES (:userId, :action, :details, :ip)`,
    {
      userId,
      action,
      details: details ? JSON.stringify(details) : null,
      ip: req.socket.remoteAddress || null,
    },
  );
}

async function handleLogin(req, res) {
  const body = await readBody(req);
  const username = String(body.username || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  const expectedRole = body.role ? String(body.role) : "";

  if (!username || !password) {
    return json(res, 400, { error: "Username and password are required" });
  }

  if (expectedRole && !ROLES.includes(expectedRole)) {
    return json(res, 400, { error: "Invalid role selected" });
  }

  const [rows] = await pool.execute(
    `SELECT id, username, password_hash, name, role, photo_url, must_change_password
     FROM users
     WHERE username = :username AND is_active = 1
     LIMIT 1`,
    { username },
  );
  const user = rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    return json(res, 401, { error: "Invalid username or password" });
  }

  if (expectedRole && user.role !== expectedRole) {
    return json(res, 403, { error: "Selected role does not match this account" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await pool.execute(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES (:token, :userId, :expiresAt)`,
    { token, userId: user.id, expiresAt },
  );
  await logAudit(user.id, "auth.login", { username }, req);

  return json(
    res,
    200,
    { user: publicUser(user) },
    { "Set-Cookie": sessionCookie(token, expiresAt) },
  );
}

async function handleLogout(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) {
    await pool.execute(`DELETE FROM sessions WHERE id = :token`, { token });
  }
  return json(res, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
}

async function handleProfileUpdate(req, res) {
  const user = await getSessionUser(req);
  if (!user) return json(res, 401, { error: "Not authenticated" });

  const body = await readBody(req);
  const name = String(body.name || "").trim();
  const photoUrl = body.photoUrl ? String(body.photoUrl) : null;

  if (!name) return json(res, 400, { error: "Name is required" });
  if (name.length > 150) return json(res, 400, { error: "Name is too long" });

  await pool.execute(`UPDATE users SET name = :name, photo_url = :photoUrl WHERE id = :id`, {
    id: user.id,
    name,
    photoUrl,
  });
  await logAudit(user.id, "users.profile_update", { fields: ["name", "photoUrl"] }, req);

  const [rows] = await pool.execute(
    `SELECT id, username, name, role, photo_url, must_change_password FROM users WHERE id = :id LIMIT 1`,
    { id: user.id },
  );
  return json(res, 200, { user: publicUser(rows[0]) });
}

async function handleChangePassword(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  const body = await readBody(req);
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (newPassword.length < 8)
    return json(res, 400, { error: "New password must be at least 8 characters" });

  const [rows] = await pool.execute(
    `SELECT id, username, password_hash, name, role, photo_url, must_change_password
     FROM users WHERE id = :id AND is_active = 1 LIMIT 1`,
    { id: user.id },
  );
  const row = rows[0];
  if (!row || !verifyPassword(currentPassword, row.password_hash)) {
    return json(res, 401, { error: "Current password is incorrect" });
  }

  await pool.execute(
    `UPDATE users SET password_hash = :passwordHash, must_change_password = 0 WHERE id = :id`,
    { id: user.id, passwordHash: hashPassword(newPassword) },
  );
  await logAudit(user.id, "auth.change_password", null, req);

  const [updated] = await pool.execute(
    `SELECT id, username, name, role, photo_url, must_change_password FROM users WHERE id = :id LIMIT 1`,
    { id: user.id },
  );
  return json(res, 200, { user: publicUser(updated[0]) });
}

async function handleListUsers(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const [rows] = await pool.query(
    `SELECT id, username, name, role, is_active, must_change_password, created_at, updated_at
     FROM users
     ORDER BY name ASC, username ASC`,
  );
  return json(res, 200, { users: rows.map(adminUser) });
}

async function handleCreateUser(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const body = await readBody(req);
  const username = String(body.username || "")
    .trim()
    .toLowerCase();
  const name = String(body.name || "").trim();
  const role = String(body.role || "");
  const temporaryPassword = generateTemporaryPassword();

  if (!username || !/^[a-z0-9._-]{3,50}$/.test(username)) {
    return json(res, 400, {
      error: "Username must be 3-50 characters using letters, numbers, dot, underscore, or dash",
    });
  }
  if (!name || name.length > 150) return json(res, 400, { error: "Full name is required" });
  if (!ROLES.includes(role)) return json(res, 400, { error: "Invalid role" });

  try {
    const [result] = await pool.execute(
      `INSERT INTO users (username, password_hash, name, role, must_change_password)
       VALUES (:username, :passwordHash, :name, :role, 1)`,
      { username, passwordHash: hashPassword(temporaryPassword), name, role },
    );
    await logAudit(admin.id, "users.create", { userId: result.insertId, username, role }, req);
    const [rows] = await pool.execute(
      `SELECT id, username, name, role, is_active, must_change_password, created_at, updated_at
       FROM users WHERE id = :id LIMIT 1`,
      { id: result.insertId },
    );
    return json(res, 201, { user: adminUser(rows[0]), temporaryPassword });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") return json(res, 409, { error: "Username already exists" });
    throw error;
  }
}

async function handleUpdateUser(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const body = await readBody(req);
  const name = String(body.name || "").trim();
  const role = String(body.role || "");
  const isActive = body.isActive === false ? 0 : 1;

  if (!name || name.length > 150) return json(res, 400, { error: "Full name is required" });
  if (!ROLES.includes(role)) return json(res, 400, { error: "Invalid role" });
  if (Number(id) === admin.id && isActive === 0)
    return json(res, 400, { error: "You cannot deactivate your own account" });

  await pool.execute(
    `UPDATE users SET name = :name, role = :role, is_active = :isActive WHERE id = :id`,
    { id, name, role, isActive },
  );
  await logAudit(admin.id, "users.update", { userId: id, role, isActive: Boolean(isActive) }, req);
  const [rows] = await pool.execute(
    `SELECT id, username, name, role, is_active, must_change_password, created_at, updated_at
     FROM users WHERE id = :id LIMIT 1`,
    { id },
  );
  return rows[0]
    ? json(res, 200, { user: adminUser(rows[0]) })
    : json(res, 404, { error: "User not found" });
}

async function handleDeleteUser(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (Number(id) === admin.id)
    return json(res, 400, { error: "You cannot delete your own account" });

  const [result] = await pool.execute(`DELETE FROM users WHERE id = :id`, { id });
  if (result.affectedRows === 0) return json(res, 404, { error: "User not found" });
  await logAudit(admin.id, "users.delete", { userId: id }, req);
  return json(res, 200, { ok: true });
}

async function handleResetUserPassword(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const temporaryPassword = generateTemporaryPassword();
  const [result] = await pool.execute(
    `UPDATE users SET password_hash = :passwordHash, must_change_password = 1 WHERE id = :id`,
    { id, passwordHash: hashPassword(temporaryPassword) },
  );
  if (result.affectedRows === 0) return json(res, 404, { error: "User not found" });
  await pool.execute(`DELETE FROM sessions WHERE user_id = :id`, { id });
  await logAudit(admin.id, "users.reset_password", { userId: id }, req);
  return json(res, 200, { temporaryPassword });
}

async function handleDashboard(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  const [[totals]] = await pool.query(`
    SELECT
      COUNT(*) AS totalEmployees,
      SUM(status = 'Permanent' OR status = 'Regular') AS regularEmployees,
      SUM(status LIKE '%Job Order%' OR status LIKE '%COS%' OR status LIKE '%Contract%') AS jobOrderEmployees
    FROM employees
  `);

  const [byDivision] = await pool.query(`
    SELECT department,
           SUM(emp_status = 'Active') AS filled,
           SUM(emp_status <> 'Active') AS unfilled,
           COUNT(*) AS total
    FROM employees
    GROUP BY department
    ORDER BY department ASC
  `);

  const [bySexLevel] = await pool.query(`
    SELECT department,
           SUM(level = 'First Level') AS firstLevel,
           SUM(level = 'Second Level') AS secondLevel,
           SUM(level = 'Third Level' OR level = 'Executive') AS thirdLevel,
           SUM(gender = 'Male') AS male,
           SUM(gender = 'Female') AS female,
           COUNT(*) AS total
    FROM employees
    GROUP BY department
    ORDER BY department ASC
  `);

  const [byPosition] = await pool.query(`
    SELECT department, position,
           SUM(emp_status = 'Active') AS filled,
           SUM(emp_status <> 'Active') AS unfilled,
           COUNT(*) AS total
    FROM employees
    GROUP BY department, position
    ORDER BY department ASC, position ASC
  `);

  const [byEmploymentStatus] = await pool.query(`
    SELECT status,
           SUM(emp_status = 'Active') AS active,
           SUM(emp_status <> 'Active') AS inactive,
           COUNT(*) AS total
    FROM employees
    GROUP BY status
    ORDER BY total DESC, status ASC
  `);

  const [byAgeGroup] = await pool.query(`
    SELECT
      CASE
        WHEN birthday IS NULL THEN 'Unspecified'
        WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) < 30 THEN 'Under 30'
        WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 30 AND 39 THEN '30-39'
        WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 40 AND 49 THEN '40-49'
        WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 50 AND 59 THEN '50-59'
        ELSE '60+'
      END AS ageGroup,
      COUNT(*) AS total
    FROM employees
    GROUP BY ageGroup
    ORDER BY FIELD(ageGroup, 'Under 30', '30-39', '40-49', '50-59', '60+', 'Unspecified')
  `);

  const [hiringTrend] = await pool.query(`
    SELECT YEAR(COALESCE(date_hired, date_employed)) AS year,
           COUNT(*) AS hired
    FROM employees
    WHERE COALESCE(date_hired, date_employed) IS NOT NULL
    GROUP BY year
    ORDER BY year DESC
    LIMIT 10
  `);

  const byCadre = byPosition.map((row) => ({
    department: row.department,
    cadre: String(row.position || "").split(" ")[0] || "Unspecified",
    filled: Number(row.filled || 0),
    unfilled: Number(row.unfilled || 0),
    total: Number(row.total || 0),
  }));

  return json(res, 200, {
    totalEmployees: Number(totals.totalEmployees || 0),
    regularEmployees: Number(totals.regularEmployees || 0),
    jobOrderEmployees: Number(totals.jobOrderEmployees || 0),
    byDivision: byDivision.map((row) => ({
      department: row.department,
      filled: Number(row.filled || 0),
      unfilled: Number(row.unfilled || 0),
      total: Number(row.total || 0),
    })),
    bySexLevel: bySexLevel.map((row) => ({
      department: row.department,
      firstLevel: Number(row.firstLevel || 0),
      secondLevel: Number(row.secondLevel || 0),
      thirdLevel: Number(row.thirdLevel || 0),
      male: Number(row.male || 0),
      female: Number(row.female || 0),
      total: Number(row.total || 0),
    })),
    byPosition: byPosition.map((row) => ({
      department: row.department,
      position: row.position,
      filled: Number(row.filled || 0),
      unfilled: Number(row.unfilled || 0),
      total: Number(row.total || 0),
    })),
    byCadre,
    byEmploymentStatus: byEmploymentStatus.map((row) => ({
      status: row.status || "Unspecified",
      active: Number(row.active || 0),
      inactive: Number(row.inactive || 0),
      total: Number(row.total || 0),
    })),
    byAgeGroup: byAgeGroup.map((row) => ({
      ageGroup: row.ageGroup,
      total: Number(row.total || 0),
    })),
    hiringTrend: hiringTrend
      .map((row) => ({
        year: String(row.year),
        hired: Number(row.hired || 0),
      }))
      .reverse(),
    generatedAt: new Date().toISOString(),
  });
}

async function handleListEmployees(req, res, url) {
  const user = await requireEmployeeRead(req, res);
  if (!user) return;

  const q = String(url.searchParams.get("q") || "").trim();
  const department = String(url.searchParams.get("department") || "").trim();
  const status = String(url.searchParams.get("status") || "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 10)));
  const offset = (page - 1) * pageSize;
  const where = [];
  const params = {};

  if (q) {
    where.push(
      `(employee_no LIKE :q OR firstname LIKE :q OR middlename LIKE :q OR lastname LIKE :q OR email LIKE :q)`,
    );
    params.q = `%${q}%`;
  }
  if (department) {
    where.push(`department = :department`);
    params.department = department;
  }
  if (status) {
    where.push(`status = :status`);
    params.status = status;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [[countRow]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM employees ${whereSql}`,
    params,
  );
  const [rows] = await pool.execute(
    `SELECT * FROM employees ${whereSql}
     ORDER BY lastname ASC, firstname ASC, employee_no ASC
     LIMIT ${pageSize} OFFSET ${offset}`,
    params,
  );

  return json(res, 200, {
    employees: rows.map(employeeRow),
    total: Number(countRow.total || 0),
    page,
    pageSize,
  });
}

async function handleCreateEmployee(req, res) {
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;

  const body = await readBody(req);
  let data;
  try {
    data = employeeDbPayload(body);
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
  const id = crypto.randomUUID();
  const employeeNo = data.employeeNo || `EMP-${Date.now()}`;

  try {
    await pool.execute(
      `INSERT INTO employees (
        id, employee_no, firstname, middlename, lastname, name_ext, department, position, status, level,
        status_class, date_hired, date_employed, item_no, emp_status, birthday, gender, civil_status,
        email, cellphone_no, photo_url, profile_json
      ) VALUES (
        :id, :employeeNo, :firstname, :middlename, :lastname, :nameExt, :department, :position, :status, :level,
        :statusClass, :dateHired, :dateEmployed, :itemNo, :empStatus, :birthday, :gender, :civilStatus,
        :email, :cellphoneNo, :photoUrl, :profileJson
      )`,
      { id, ...data, employeeNo },
    );
    await logAudit(user.id, "employees.create", { employeeId: id, employeeNo }, req);
    return json(res, 201, { employee: await readEmployeeById(id) });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY")
      return json(res, 409, { error: "Employee ID already exists" });
    throw error;
  }
}

async function handleGetEmployee(req, res, id) {
  const user = await requireEmployeeRead(req, res);
  if (!user) return;

  const employee = await readEmployeeById(id);
  if (!employee) return json(res, 404, { error: "Employee not found" });

  const sections = {};
  for (const [key, config] of Object.entries(EMPLOYEE_SECTION_TABLES)) {
    const [rows] = await pool.execute(
      `SELECT id, payload, created_at, updated_at FROM \`${config.table}\` WHERE employee_id = :id ORDER BY created_at ASC, id ASC`,
      { id },
    );
    sections[key] = rows.map(sectionRow);
  }

  return json(res, 200, { employee, sections });
}

async function handleUpdateEmployee(req, res, id) {
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;

  const existing = await readEmployeeById(id);
  if (!existing) return json(res, 404, { error: "Employee not found" });
  const body = await readBody(req);
  let data;
  try {
    data = employeeDbPayload(body, existing);
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
  const employeeNo = data.employeeNo || existing.employeeId || `EMP-${Date.now()}`;

  try {
    await pool.execute(
      `UPDATE employees SET
        employee_no = :employeeNo,
        firstname = :firstname,
        middlename = :middlename,
        lastname = :lastname,
        name_ext = :nameExt,
        department = :department,
        position = :position,
        status = :status,
        level = :level,
        status_class = :statusClass,
        date_hired = :dateHired,
        date_employed = :dateEmployed,
        item_no = :itemNo,
        emp_status = :empStatus,
        birthday = :birthday,
        gender = :gender,
        civil_status = :civilStatus,
        email = :email,
        cellphone_no = :cellphoneNo,
        photo_url = :photoUrl,
        profile_json = :profileJson
       WHERE id = :id`,
      { id, ...data, employeeNo },
    );
    await logAudit(user.id, "employees.update", { employeeId: id }, req);
    return json(res, 200, { employee: await readEmployeeById(id) });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY")
      return json(res, 409, { error: "Employee ID already exists" });
    throw error;
  }
}

async function handleDeleteEmployee(req, res, id) {
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;

  const [result] = await pool.execute(`DELETE FROM employees WHERE id = :id`, { id });
  if (result.affectedRows === 0) return json(res, 404, { error: "Employee not found" });
  await logAudit(user.id, "employees.delete", { employeeId: id }, req);
  return json(res, 200, { ok: true });
}

async function handleCreateSectionRow(req, res, employeeId, section) {
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;
  const config = validateSection(section);
  if (!config) return json(res, 404, { error: "Section not found" });
  const employee = await readEmployeeById(employeeId);
  if (!employee) return json(res, 404, { error: "Employee not found" });

  const body = await readBody(req);
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
  const id = crypto.randomUUID();

  if (config.single) {
    const [[existing]] = await pool.execute(
      `SELECT id FROM \`${config.table}\` WHERE employee_id = :employeeId LIMIT 1`,
      { employeeId },
    );
    if (existing)
      return handleUpdateSectionRow(req, res, employeeId, section, existing.id, payload);
  }

  await pool.execute(
    `INSERT INTO \`${config.table}\` (id, employee_id, payload) VALUES (:id, :employeeId, :payload)`,
    { id, employeeId, payload: JSON.stringify(payload) },
  );
  await logAudit(user.id, "employees.section_create", { employeeId, section, rowId: id }, req);
  const [[row]] = await pool.execute(
    `SELECT id, payload, created_at, updated_at FROM \`${config.table}\` WHERE id = :id`,
    { id },
  );
  return json(res, 201, { row: sectionRow(row) });
}

async function handleUpdateSectionRow(req, res, employeeId, section, rowId, suppliedPayload) {
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;
  const config = validateSection(section);
  if (!config) return json(res, 404, { error: "Section not found" });
  const body = suppliedPayload ? { payload: suppliedPayload } : await readBody(req);
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};

  const [result] = await pool.execute(
    `UPDATE \`${config.table}\` SET payload = :payload WHERE id = :rowId AND employee_id = :employeeId`,
    { rowId, employeeId, payload: JSON.stringify(payload) },
  );
  if (result.affectedRows === 0) return json(res, 404, { error: "Record not found" });
  await logAudit(user.id, "employees.section_update", { employeeId, section, rowId }, req);
  const [[row]] = await pool.execute(
    `SELECT id, payload, created_at, updated_at FROM \`${config.table}\` WHERE id = :rowId`,
    { rowId },
  );
  return json(res, 200, { row: sectionRow(row) });
}

async function handleDeleteSectionRow(req, res, employeeId, section, rowId) {
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;
  const config = validateSection(section);
  if (!config) return json(res, 404, { error: "Section not found" });

  const [result] = await pool.execute(
    `DELETE FROM \`${config.table}\` WHERE id = :rowId AND employee_id = :employeeId`,
    { rowId, employeeId },
  );
  if (result.affectedRows === 0) return json(res, 404, { error: "Record not found" });
  await logAudit(user.id, "employees.section_delete", { employeeId, section, rowId }, req);
  return json(res, 200, { ok: true });
}

async function handleGetConfig(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  const [[agency]] = await pool.query(
    `SELECT name, tagline, logo_url, icon_url, banner_url FROM agency_settings WHERE id = 1`,
  );
  const [departments] = await pool.query(
    `SELECT id, name FROM departments ORDER BY sort_order ASC, name ASC`,
  );
  const [positions] = await pool.query(
    `SELECT id, title FROM positions ORDER BY sort_order ASC, title ASC`,
  );
  const [salaryGrades] = await pool.query(
    `SELECT id, ordinance, grade, step, amount FROM salary_grades ORDER BY grade ASC, step ASC, ordinance ASC`,
  );

  return json(res, 200, {
    agency: {
      name: agency.name,
      tagline: agency.tagline,
      logoUrl: agency.logo_url || "",
      iconUrl: agency.icon_url || "",
      bannerUrl: agency.banner_url || "",
    },
    departments,
    positions,
    salaryGrades: salaryGrades.map((row) => ({ ...row, amount: Number(row.amount) })),
  });
}

async function handlePublicAgencySettings(req, res) {
  const [[agency]] = await pool.query(
    `SELECT name, tagline, logo_url, icon_url, banner_url FROM agency_settings WHERE id = 1`,
  );

  return json(res, 200, {
    agency: {
      name: agency?.name || DEFAULT_AGENCY.name,
      tagline: agency?.tagline || DEFAULT_AGENCY.tagline,
      logoUrl: agency?.logo_url || "",
      iconUrl: agency?.icon_url || "",
      bannerUrl: agency?.banner_url || "",
    },
  });
}

async function handleUpdateAgency(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const body = await readBody(req);
  const agency = {
    name: String(body.name || "").trim(),
    tagline: String(body.tagline || "").trim(),
    logoUrl: body.logoUrl ? String(body.logoUrl) : "",
    iconUrl: body.iconUrl ? String(body.iconUrl) : "",
    bannerUrl: body.bannerUrl ? String(body.bannerUrl) : "",
  };

  if (!agency.name) return json(res, 400, { error: "Agency name is required" });
  await pool.execute(
    `UPDATE agency_settings SET name = :name, tagline = :tagline, logo_url = :logoUrl, icon_url = :iconUrl, banner_url = :bannerUrl WHERE id = 1`,
    agency,
  );
  await logAudit(admin.id, "config.agency_update", null, req);
  return json(res, 200, { agency });
}

async function handleCreateDepartment(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const body = await readBody(req);
  const name = String(body.name || "").trim();
  if (!name) return json(res, 400, { error: "Department name is required" });
  try {
    const [result] = await pool.execute(`INSERT INTO departments (name) VALUES (:name)`, { name });
    await logAudit(admin.id, "config.department_create", { name }, req);
    return json(res, 201, { department: { id: result.insertId, name } });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY")
      return json(res, 409, { error: "Department already exists" });
    throw error;
  }
}

async function handleDeleteDepartment(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  await pool.execute(`DELETE FROM departments WHERE id = :id`, { id });
  await logAudit(admin.id, "config.department_delete", { id }, req);
  return json(res, 200, { ok: true });
}

async function handleCreatePosition(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const body = await readBody(req);
  const title = String(body.title || "").trim();
  if (!title) return json(res, 400, { error: "Position title is required" });
  try {
    const [result] = await pool.execute(`INSERT INTO positions (title) VALUES (:title)`, { title });
    await logAudit(admin.id, "config.position_create", { title }, req);
    return json(res, 201, { position: { id: result.insertId, title } });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") return json(res, 409, { error: "Position already exists" });
    throw error;
  }
}

async function handleDeletePosition(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  await pool.execute(`DELETE FROM positions WHERE id = :id`, { id });
  await logAudit(admin.id, "config.position_delete", { id }, req);
  return json(res, 200, { ok: true });
}

async function handleCreateSalaryGrade(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const body = await readBody(req);
  const ordinance = String(body.ordinance || "").trim();
  const grade = Number(body.grade);
  const step = Number(body.step);
  const amount = Number(body.amount);
  if (
    !ordinance ||
    !Number.isInteger(grade) ||
    !Number.isInteger(step) ||
    !Number.isFinite(amount)
  ) {
    return json(res, 400, { error: "Ordinance, grade, step, and amount are required" });
  }
  try {
    const [result] = await pool.execute(
      `INSERT INTO salary_grades (ordinance, grade, step, amount)
       VALUES (:ordinance, :grade, :step, :amount)`,
      { ordinance, grade, step, amount },
    );
    await logAudit(admin.id, "config.salary_grade_create", { ordinance, grade, step }, req);
    return json(res, 201, { salaryGrade: { id: result.insertId, ordinance, grade, step, amount } });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY")
      return json(res, 409, { error: "Salary grade already exists" });
    throw error;
  }
}

async function handleDeleteSalaryGrade(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  await pool.execute(`DELETE FROM salary_grades WHERE id = :id`, { id });
  await logAudit(admin.id, "config.salary_grade_delete", { id }, req);
  return json(res, 200, { ok: true });
}

async function handleListAuditLogs(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const [rows] = await pool.query(
    `SELECT al.id, al.action, al.details, al.ip_address, al.created_at,
            u.username, u.name, u.role
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC, al.id DESC
     LIMIT 200`,
  );

  const logs = rows.map((row) => ({
    id: row.id,
    action: row.action,
    details: typeof row.details === "string" ? JSON.parse(row.details || "null") : row.details,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
    user: row.username ? { username: row.username, name: row.name, role: row.role } : null,
  }));

  return json(res, 200, { logs });
}

async function handleListBackups(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true });
  const backups = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const filePath = path.join(BACKUP_DIR, entry.name);
        const stat = await fs.stat(filePath);
        return {
          fileName: entry.name,
          size: stat.size,
          createdAt: stat.birthtime,
          modifiedAt: stat.mtime,
        };
      }),
  );

  backups.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
  return json(res, 200, { backups });
}

async function handleCreateBackup(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const tables = [
    "users",
    "audit_logs",
    "agency_settings",
    "departments",
    "positions",
    "salary_grades",
    "employees",
    ...Object.values(EMPLOYEE_SECTION_TABLES).map((config) => config.table),
  ];
  const data = {};

  for (const table of tables) {
    const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
    data[table] = rows;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `hris_db_backup_${stamp}.json`;
  const backup = {
    schema: DB_NAME,
    createdAt: new Date().toISOString(),
    createdBy: { id: admin.id, username: admin.username, name: admin.name },
    tables,
    data,
  };

  const filePath = path.join(BACKUP_DIR, fileName);
  await fs.writeFile(filePath, JSON.stringify(backup, null, 2), "utf8");
  const stat = await fs.stat(filePath);
  await logAudit(admin.id, "backup.create", { fileName, size: stat.size }, req);

  return json(res, 201, {
    backup: {
      fileName,
      size: stat.size,
      createdAt: stat.birthtime,
      modifiedAt: stat.mtime,
    },
  });
}

async function handleDownloadBackup(req, res, fileName) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const decoded = decodeURIComponent(fileName);
  if (!/^hris_db_backup_[A-Za-z0-9_.-]+\.json$/.test(decoded)) {
    return json(res, 400, { error: "Invalid backup file name" });
  }

  const filePath = path.join(BACKUP_DIR, decoded);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(BACKUP_DIR))) {
    return json(res, 400, { error: "Invalid backup path" });
  }

  try {
    await fs.access(resolved);
  } catch {
    return json(res, 404, { error: "Backup not found" });
  }

  await logAudit(admin.id, "backup.download", { fileName: decoded }, req);
  return sendFile(res, resolved, decoded);
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const userMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)$/);
  const resetPasswordMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/reset-password$/);
  const backupDownloadMatch = url.pathname.match(/^\/api\/admin\/backups\/([^/]+)\/download$/);
  const employeeMatch = url.pathname.match(/^\/api\/employees\/([A-Za-z0-9-]+)$/);
  const employeeSectionMatch = url.pathname.match(
    /^\/api\/employees\/([A-Za-z0-9-]+)\/sections\/([A-Za-z0-9-]+)$/,
  );
  const employeeSectionRowMatch = url.pathname.match(
    /^\/api\/employees\/([A-Za-z0-9-]+)\/sections\/([A-Za-z0-9-]+)\/([A-Za-z0-9-]+)$/,
  );
  const departmentMatch = url.pathname.match(/^\/api\/settings\/departments\/(\d+)$/);
  const positionMatch = url.pathname.match(/^\/api\/settings\/positions\/(\d+)$/);
  const salaryGradeMatch = url.pathname.match(/^\/api\/settings\/salary-grades\/(\d+)$/);

  if (req.method === "GET" && url.pathname === "/api/health") {
    return json(res, 200, { ok: true, database: DB_NAME });
  }

  if (req.method === "GET" && url.pathname === "/api/dashboard") return handleDashboard(req, res);

  if (req.method === "POST" && url.pathname === "/api/auth/login") return handleLogin(req, res);
  if (req.method === "GET" && url.pathname === "/api/public/agency")
    return handlePublicAgencySettings(req, res);
  if (req.method === "POST" && url.pathname === "/api/auth/logout") return handleLogout(req, res);
  if (req.method === "POST" && url.pathname === "/api/auth/change-password")
    return handleChangePassword(req, res);

  if (req.method === "GET" && url.pathname === "/api/auth/me") {
    const user = await getSessionUser(req);
    return user ? json(res, 200, { user }) : json(res, 401, { error: "Not authenticated" });
  }

  if (req.method === "PATCH" && url.pathname === "/api/users/me")
    return handleProfileUpdate(req, res);
  if (req.method === "GET" && url.pathname === "/api/admin/users") return handleListUsers(req, res);
  if (req.method === "POST" && url.pathname === "/api/admin/users")
    return handleCreateUser(req, res);
  if (req.method === "PATCH" && userMatch) return handleUpdateUser(req, res, userMatch[1]);
  if (req.method === "DELETE" && userMatch) return handleDeleteUser(req, res, userMatch[1]);
  if (req.method === "POST" && resetPasswordMatch)
    return handleResetUserPassword(req, res, resetPasswordMatch[1]);
  if (req.method === "GET" && url.pathname === "/api/admin/audit-logs")
    return handleListAuditLogs(req, res);
  if (req.method === "GET" && url.pathname === "/api/admin/backups")
    return handleListBackups(req, res);
  if (req.method === "POST" && url.pathname === "/api/admin/backups")
    return handleCreateBackup(req, res);
  if (req.method === "GET" && backupDownloadMatch)
    return handleDownloadBackup(req, res, backupDownloadMatch[1]);

  if (req.method === "GET" && url.pathname === "/api/employees")
    return handleListEmployees(req, res, url);
  if (req.method === "POST" && url.pathname === "/api/employees")
    return handleCreateEmployee(req, res);
  if (req.method === "GET" && employeeMatch) return handleGetEmployee(req, res, employeeMatch[1]);
  if (req.method === "PATCH" && employeeMatch)
    return handleUpdateEmployee(req, res, employeeMatch[1]);
  if (req.method === "DELETE" && employeeMatch)
    return handleDeleteEmployee(req, res, employeeMatch[1]);
  if (req.method === "POST" && employeeSectionMatch)
    return handleCreateSectionRow(req, res, employeeSectionMatch[1], employeeSectionMatch[2]);
  if (req.method === "PATCH" && employeeSectionRowMatch) {
    return handleUpdateSectionRow(
      req,
      res,
      employeeSectionRowMatch[1],
      employeeSectionRowMatch[2],
      employeeSectionRowMatch[3],
    );
  }
  if (req.method === "DELETE" && employeeSectionRowMatch) {
    return handleDeleteSectionRow(
      req,
      res,
      employeeSectionRowMatch[1],
      employeeSectionRowMatch[2],
      employeeSectionRowMatch[3],
    );
  }

  if (req.method === "GET" && url.pathname === "/api/settings") return handleGetConfig(req, res);
  if (req.method === "PUT" && url.pathname === "/api/settings/agency")
    return handleUpdateAgency(req, res);
  if (req.method === "POST" && url.pathname === "/api/settings/departments")
    return handleCreateDepartment(req, res);
  if (req.method === "DELETE" && departmentMatch)
    return handleDeleteDepartment(req, res, departmentMatch[1]);
  if (req.method === "POST" && url.pathname === "/api/settings/positions")
    return handleCreatePosition(req, res);
  if (req.method === "DELETE" && positionMatch)
    return handleDeletePosition(req, res, positionMatch[1]);
  if (req.method === "POST" && url.pathname === "/api/settings/salary-grades")
    return handleCreateSalaryGrade(req, res);
  if (req.method === "DELETE" && salaryGradeMatch)
    return handleDeleteSalaryGrade(req, res, salaryGradeMatch[1]);

  return json(res, 404, { error: "Not found" });
}

await initializeDatabase();

const server = http.createServer(async (req, res) => {
  try {
    await route(req, res);
  } catch (error) {
    console.error(error);
    json(res, 500, { error: "Internal server error" });
  }
});

server.listen(PORT, () => {
  console.log(`HRIS API listening on http://localhost:${PORT}`);
  console.log(`Using MySQL schema ${DB_NAME} at ${DB_HOST}`);
});
