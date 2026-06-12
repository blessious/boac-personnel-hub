import http from "node:http";
import crypto from "node:crypto";
import net from "node:net";
import { spawn } from "node:child_process";
import { URL } from "node:url";
import { createReadStream, readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
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

const PORT = Number(process.env.HRIS_API_PORT || 47101);
const DB_HOST = process.env.HRIS_DB_HOST || "localhost";
const DB_USER = process.env.HRIS_DB_USER || "root";
const DB_PASSWORD = process.env.HRIS_DB_PASSWORD || "";
const DB_NAME = process.env.HRIS_DB_NAME || "hris_db";
const SESSION_COOKIE = "hris_session";
const SESSION_HOURS = 8;
const BACKUP_DIR = path.join(process.cwd(), "server", "backups");
const EXPORT_DIR = path.join(process.cwd(), "server", "exports");
const PREVIEW_DIR = path.join(EXPORT_DIR, "previews");
const TEMPLATE_DIR = path.join(process.cwd(), "server", "templates");
const DTR_TEMPLATE_XLSX = path.join(TEMPLATE_DIR, "format.xlsx");
const DTR_EXCEL_SCRIPT = path.join(process.cwd(), "server", "dtr_excel.py");
const DTR_PDF_SCRIPT = path.join(process.cwd(), "server", "dtr_pdf.py");
const DTR_PARSE_SCRIPT = path.join(process.cwd(), "server", "dtr_parse.py");
const LEAVE_FORM6_TEMPLATE_XLSX = path.join(
  process.cwd(),
  "leave application",
  "CS Form No. 6, Revised 2020 (Application for Leave) (Fillable).xlsx",
);
const LEAVE_FORM6_EXCEL_SCRIPT = path.join(process.cwd(), "server", "leave_form6_excel.py");
const BIOMETRIC_FETCH_SCRIPT = path.join(process.cwd(), "server", "fetch_biometric.py");
const LIBREOFFICE_EXE =
  process.env.HRIS_LIBREOFFICE_EXE ||
  "C:\\Program Files\\LibreOffice\\program\\soffice.com";
const LIBREOFFICE_PROFILE_DIR = path.join(EXPORT_DIR, "lo-profile");
const PREVIEW_FILE_MAX_AGE_MS = 30 * 60 * 1000;
const PYTHON_CANDIDATES = [
  process.env.HRIS_PYTHON_EXE,
  process.env.PYTHON_EXE,
  process.env.USERPROFILE
    ? path.join(
        process.env.USERPROFILE,
        ".cache",
        "codex-runtimes",
        "codex-primary-runtime",
        "dependencies",
        "python",
        "python.exe",
      )
    : "",
  "python",
].filter(Boolean);
const PYTHON_EXE = PYTHON_CANDIDATES[0];
const BIOMETRIC_PYTHON_EXE = process.env.HRIS_BIOMETRIC_PYTHON_EXE || process.env.PYTHON_EXE || "python";

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

const DEFAULT_LEAVE_TYPES = [
  {
    code: "VL",
    name: "Vacation Leave",
    paid: true,
    creditBased: true,
    creditGroup: "VL",
    maxDays: null,
    advanceNoticeDays: 5,
    legalBasis: "Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292",
    filingRule: "File five days in advance whenever possible.",
    requirements: [
      "Indicate whether leave is within the Philippines or abroad.",
      "Secure travel authority and clearance from money/work accountabilities when applicable.",
    ],
    detailSchema: ["location", "commutation"],
    sortOrder: 1,
  },
  {
    code: "FL",
    name: "Mandatory/Forced Leave",
    paid: true,
    creditBased: true,
    creditGroup: "VL",
    maxDays: 5,
    advanceNoticeDays: null,
    legalBasis: "Sec. 25, Rule XVI, Omnibus Rules Implementing E.O. No. 292",
    filingRule:
      "Annual five-day vacation leave is forfeited if not taken during the year unless cancelled due to exigency of service.",
    requirements: [
      "One day or more Vacation Leave may count toward mandatory/forced leave compliance, subject to rules.",
    ],
    detailSchema: ["commutation"],
    sortOrder: 2,
  },
  {
    code: "SL",
    name: "Sick Leave",
    paid: true,
    creditBased: true,
    creditGroup: "SL",
    maxDays: null,
    advanceNoticeDays: null,
    legalBasis: "Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292",
    filingRule:
      "File immediately upon return. If filed in advance or exceeding five days, attach medical certificate or affidavit if no consultation was availed of.",
    requirements: [
      "Medical certificate if filed in advance or exceeding five days.",
      "Applicant affidavit if medical consultation was not availed of.",
    ],
    detailSchema: ["sick", "commutation"],
    sortOrder: 3,
  },
  {
    code: "ML",
    name: "Maternity Leave",
    paid: true,
    creditBased: false,
    creditGroup: null,
    maxDays: 105,
    advanceNoticeDays: null,
    legalBasis: "R.A. No. 11210 / IRR issued by CSC, DOLE and SSS",
    filingRule: "105 days, with proof of pregnancy and CS Form No. 6a if needed.",
    requirements: [
      "Proof of pregnancy, such as ultrasound or doctor's certificate on expected delivery date.",
      "Accomplished Notice of Allocation of Maternity Leave Credits (CS Form No. 6a), if needed.",
    ],
    detailSchema: ["commutation"],
    sortOrder: 4,
  },
  {
    code: "PL",
    name: "Paternity Leave",
    paid: true,
    creditBased: false,
    creditGroup: null,
    maxDays: 7,
    advanceNoticeDays: null,
    legalBasis: "R.A. No. 8187 / CSC MC No. 71, s. 1998, as amended",
    filingRule: "Seven days with proof of child's delivery and marriage contract.",
    requirements: [
      "Proof of child's delivery, such as birth certificate or medical certificate.",
      "Marriage contract.",
    ],
    detailSchema: ["commutation"],
    sortOrder: 5,
  },
  {
    code: "SPL",
    name: "Special Privilege Leave",
    paid: true,
    creditBased: false,
    creditGroup: null,
    maxDays: 3,
    advanceNoticeDays: 7,
    legalBasis: "Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292",
    filingRule: "File/approve at least one week before availment, except emergency cases.",
    requirements: [
      "Indicate whether leave is within the Philippines or abroad.",
      "Secure travel authority and clearance from money/work accountabilities when applicable.",
    ],
    detailSchema: ["location", "commutation"],
    sortOrder: 6,
  },
  {
    code: "SP",
    name: "Solo Parent Leave",
    paid: true,
    creditBased: false,
    creditGroup: null,
    maxDays: 7,
    advanceNoticeDays: 5,
    legalBasis: "RA No. 8972 / CSC MC No. 8, s. 2004",
    filingRule: "File in advance or whenever possible five days before leave.",
    requirements: ["Updated Solo Parent Identification Card."],
    detailSchema: ["commutation"],
    sortOrder: 7,
  },
  {
    code: "STUDY",
    name: "Study Leave",
    paid: true,
    creditBased: false,
    creditGroup: null,
    maxDays: 132,
    advanceNoticeDays: null,
    legalBasis: "Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292",
    filingRule: "Up to six months, subject to agency internal requirements and contract.",
    requirements: [
      "Agency internal requirements, if any.",
      "Contract between agency head or authorized representative and employee.",
    ],
    detailSchema: ["study", "commutation"],
    sortOrder: 8,
  },
  {
    code: "VAWC",
    name: "10-Day VAWC Leave",
    paid: true,
    creditBased: false,
    creditGroup: null,
    maxDays: 10,
    advanceNoticeDays: null,
    legalBasis: "RA No. 9262 / CSC MC No. 15, s. 2005",
    filingRule: "File in advance or immediately upon return.",
    requirements: [
      "Barangay Protection Order, Temporary/Permanent Protection Order, filing certification, or police report with medical certificate as allowed.",
    ],
    detailSchema: ["commutation"],
    sortOrder: 9,
  },
  {
    code: "REHAB",
    name: "Rehabilitation Privilege",
    paid: true,
    creditBased: false,
    creditGroup: null,
    maxDays: 132,
    advanceNoticeDays: 7,
    legalBasis: "Sec. 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292",
    filingRule: "Apply within one week from accident except when a longer period is warranted.",
    requirements: [
      "Letter request supported by relevant reports, such as police report if any.",
      "Medical certificate on injuries, treatment, and need for rest, recuperation, and rehabilitation.",
      "Government physician concurrence if attending physician is private, especially on duration.",
    ],
    detailSchema: ["commutation"],
    sortOrder: 10,
  },
  {
    code: "SLBW",
    name: "Special Leave Benefits for Women",
    paid: true,
    creditBased: false,
    creditGroup: null,
    maxDays: 44,
    advanceNoticeDays: 5,
    legalBasis: "RA No. 9710 / CSC MC No. 25, s. 2010",
    filingRule:
      "May be filed at least five days before gynecological surgery; emergency cases are filed upon return with agency notification during confinement.",
    requirements: [
      "Medical certificate and clinical summary from proper medical authorities.",
      "Histopathological report.",
      "Operative technique used, surgery duration, peri-operative period, and estimated recuperation period.",
    ],
    detailSchema: ["women", "commutation"],
    sortOrder: 11,
  },
  {
    code: "CALAMITY",
    name: "Special Emergency (Calamity) Leave",
    paid: true,
    creditBased: false,
    creditGroup: null,
    maxDays: 5,
    advanceNoticeDays: null,
    legalBasis: "CSC MC No. 2, s. 2012, as amended",
    filingRule:
      "Maximum of five straight working days or staggered basis within thirty days from actual calamity/disaster; once per year.",
    requirements: [
      "Verification of residence based on latest records.",
      "Verification that residence is covered by calamity area declaration.",
      "Other proofs as necessary.",
    ],
    detailSchema: ["commutation"],
    sortOrder: 12,
  },
  {
    code: "ADOPTION",
    name: "Adoption Leave",
    paid: true,
    creditBased: false,
    creditGroup: null,
    maxDays: null,
    advanceNoticeDays: null,
    legalBasis: "R.A. No. 8552",
    filingRule: "File with authenticated Pre-Adoptive Placement Authority issued by DSWD.",
    requirements: ["Authenticated Pre-Adoptive Placement Authority issued by DSWD."],
    detailSchema: ["commutation"],
    sortOrder: 13,
  },
  {
    code: "MONETIZATION",
    name: "Monetization of Leave Credits",
    paid: true,
    creditBased: true,
    creditGroup: "VL_SL",
    maxDays: null,
    advanceNoticeDays: null,
    legalBasis: "",
    filingRule:
      "Application for monetization of 50% or more of accumulated leave credits requires a letter request stating valid and justifiable reasons.",
    requirements: [
      "Letter request to the head of agency stating valid and justifiable reasons when monetizing 50% or more.",
    ],
    detailSchema: ["otherPurpose"],
    sortOrder: 14,
  },
  {
    code: "TERMINAL",
    name: "Terminal Leave",
    paid: true,
    creditBased: true,
    creditGroup: "VL_SL",
    maxDays: null,
    advanceNoticeDays: null,
    legalBasis: "",
    filingRule: "Requires proof of resignation, retirement, or separation from service.",
    requirements: [
      "Proof of resignation, retirement, or separation from service.",
      "Clearance from money, property, and work-related accountabilities.",
    ],
    detailSchema: ["otherPurpose"],
    sortOrder: 15,
  },
  {
    code: "OTHERS",
    name: "Others",
    paid: true,
    creditBased: false,
    creditGroup: null,
    maxDays: null,
    advanceNoticeDays: null,
    legalBasis: "",
    filingRule: "Use only when the leave purpose does not match the standard CS Form No. 6 options.",
    requirements: ["Specify the leave purpose and attach supporting documents required by HR."],
    detailSchema: ["otherPurpose", "commutation"],
    sortOrder: 16,
  },
  {
    code: "LWOP",
    name: "Leave Without Pay",
    paid: false,
    creditBased: false,
    creditGroup: null,
    maxDays: null,
    advanceNoticeDays: null,
    legalBasis: "",
    filingRule: "Internal unpaid leave tracking type.",
    requirements: [],
    detailSchema: ["commutation"],
    sortOrder: 99,
  },
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
  const extension = path.extname(fileName).toLowerCase();
  const contentType =
    extension === ".xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : extension === ".pdf"
        ? "application/pdf"
        : "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "no-store",
  });
  createReadStream(filePath).pipe(res);
}

function sendInlinePdfAndDelete(res, filePath, fileName, deleteAfterMs = 5000) {
  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${fileName}"`,
    "Cache-Control": "no-store",
  });
  const stream = createReadStream(filePath);
  stream.on("end", () => {
    setTimeout(() => fs.rm(filePath, { force: true }).catch(() => {}), deleteAfterMs);
  });
  stream.on("error", () => {
    if (!res.headersSent) json(res, 500, { error: "Failed to read DTR PDF" });
  });
  stream.pipe(res);
}

async function cleanupPreviewFiles(maxAgeMs = PREVIEW_FILE_MAX_AGE_MS) {
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const files = await fs.readdir(PREVIEW_DIR, { withFileTypes: true });
  const cutoff = Date.now() - maxAgeMs;
  await Promise.all(
    files
      .filter((file) => file.isFile())
      .filter((file) => [".pdf", ".json"].includes(path.extname(file.name).toLowerCase()))
      .map(async (file) => {
        const filePath = path.join(PREVIEW_DIR, file.name);
        const stats = await fs.stat(filePath).catch(() => null);
        if (stats && stats.mtimeMs < cutoff) await fs.rm(filePath, { force: true }).catch(() => {});
      }),
  );
}

function sendCsv(res, fileName, csv) {
  res.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "no-store",
  });
  res.end(csv);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 15 * 1024 * 1024) {
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
    employeeId: row.employee_id || "",
    employeeNo: row.employee_no || "",
    biometricId: row.biometric_id || "",
    employeeName: row.employee_name || "",
  };
}

function adminUser(row) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    employeeId: row.employee_id || "",
    employeeNo: row.employee_no || "",
    biometricId: row.biometric_id || "",
    employeeName: row.employee_name || "",
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
    biometricId: row.biometric_id || "",
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
    scheduleAmIn: formatTime(row.schedule_am_in) || "08:00",
    scheduleAmOut: formatTime(row.schedule_am_out) || "12:00",
    schedulePmIn: formatTime(row.schedule_pm_in) || "13:00",
    schedulePmOut: formatTime(row.schedule_pm_out) || "17:00",
    dtrSignatory: row.dtr_signatory || "",
    dtrNoterId: row.dtr_noter_id ? String(row.dtr_noter_id) : "",
    isDtrNoter: Boolean(row.is_dtr_noter),
    regular: row.regular === null || row.regular === undefined ? row.status !== "Job Order" : Boolean(row.regular),
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
    scheduleAmIn: normalizeTimeInput(body.scheduleAmIn ?? body.schedule_am_in ?? existing.scheduleAmIn ?? "08:00"),
    scheduleAmOut: normalizeTimeInput(body.scheduleAmOut ?? body.schedule_am_out ?? existing.scheduleAmOut ?? "12:00"),
    schedulePmIn: normalizeTimeInput(body.schedulePmIn ?? body.schedule_pm_in ?? existing.schedulePmIn ?? "13:00"),
    schedulePmOut: normalizeTimeInput(body.schedulePmOut ?? body.schedule_pm_out ?? existing.schedulePmOut ?? "17:00"),
    dtrSignatory: String(body.dtrSignatory ?? body.dtr_signatory ?? existing.dtrSignatory ?? "").trim(),
    dtrNoterId: body.dtrNoterId || body.dtr_noter_id || existing.dtrNoterId || null,
    isDtrNoter: Boolean(body.isDtrNoter ?? body.is_dtr_noter ?? existing.isDtrNoter ?? false),
    regular:
      body.regular === undefined && existing.regular === undefined
        ? status !== "Job Order"
        : Boolean(body.regular ?? existing.regular),
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

function leaveTypeRow(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    isPaid: Boolean(row.is_paid),
    isCreditBased: Boolean(row.is_credit_based),
    creditGroup: row.credit_group || "",
    maxDays: row.max_days === null || row.max_days === undefined ? null : Number(row.max_days),
    advanceNoticeDays:
      row.advance_notice_days === null || row.advance_notice_days === undefined
        ? null
        : Number(row.advance_notice_days),
    legalBasis: row.legal_basis || "",
    filingRule: row.filing_rule || "",
    requirements: parseJson(row.requirements_json, []),
    detailSchema: parseJson(row.detail_schema_json, []),
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order || 0),
  };
}

function leaveBalanceRow(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    leaveTypeId: row.leave_type_id,
    code: row.code,
    name: row.name,
    balance: Number(row.balance || 0),
    earned: Number(row.earned || 0),
    used: Number(row.used || 0),
    adjusted: Number(row.adjusted || 0),
    updatedAt: row.updated_at,
  };
}

function leaveApplicationRow(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeNo: row.employee_no,
    employeeName: [row.lastname, row.firstname].filter(Boolean).join(", "),
    department: row.department || "",
    position: row.position || "",
    leaveTypeId: row.leave_type_id,
    leaveCode: row.leave_code,
    leaveName: row.leave_name,
    dateFrom: normalizeDate(row.date_from),
    dateTo: normalizeDate(row.date_to),
    daysRequested: Number(row.days_requested || 0),
    reason: row.reason || "",
    salarySnapshot:
      row.salary_snapshot === null || row.salary_snapshot === undefined
        ? null
        : Number(row.salary_snapshot),
    detailLocationType: row.detail_location_type || "",
    detailLocationText: row.detail_location_text || "",
    detailSickType: row.detail_sick_type || "",
    detailIllness: row.detail_illness || "",
    detailStudyPurpose: row.detail_study_purpose || "",
    detailOtherPurpose: row.detail_other_purpose || "",
    detailOtherText: row.detail_other_text || "",
    commutationRequested: Boolean(row.commutation_requested),
    requirementsPayload: parseJson(row.requirements_payload, {}),
    formPayload: parseJson(row.form_payload, {}),
    recommendationStatus: row.recommendation_status || "",
    recommendationReason: row.recommendation_reason || "",
    recommendedByName: row.recommended_by_name || "",
    recommendedAt: row.recommended_at,
    approvedDaysWithPay:
      row.approved_days_with_pay === null || row.approved_days_with_pay === undefined
        ? null
        : Number(row.approved_days_with_pay),
    approvedDaysWithoutPay:
      row.approved_days_without_pay === null || row.approved_days_without_pay === undefined
        ? null
        : Number(row.approved_days_without_pay),
    approvedDaysOther:
      row.approved_days_other === null || row.approved_days_other === undefined
        ? null
        : Number(row.approved_days_other),
    approvedDaysOtherText: row.approved_days_other_text || "",
    finalDisapprovalReason: row.final_disapproval_reason || "",
    status: row.status,
    approverName: row.approver_name || "",
    decisionRemarks: row.decision_remarks || "",
    decidedAt: row.decided_at,
    createdAt: row.created_at,
  };
}

function formatTime(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(11, 16);
  const text = String(value);
  if (text === "00:00:00" || text === "00:00") return "";
  return text.slice(0, 5);
}

function normalizeTimeInput(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text || text === "00:00" || text === "00:00:00") return null;
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) throw new Error("Invalid time format. Use HH:mm.");
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new Error("Invalid time format. Use HH:mm.");
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

function minutesFromTime(value) {
  if (!value) return null;
  const [hours, minutes] = String(value).split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function calculateAttendanceStats(entry) {
  const amIn = minutesFromTime(entry.amIn);
  const amOut = minutesFromTime(entry.amOut);
  const pmIn = minutesFromTime(entry.pmIn);
  const pmOut = minutesFromTime(entry.pmOut);
  const scheduledAmIn = minutesFromTime(entry.scheduleAmIn || "08:00");
  const scheduledPmOut = minutesFromTime(entry.schedulePmOut || "17:00");
  const punches = [amIn, amOut, pmIn, pmOut].filter((value) => value !== null);

  let status = "Absent";
  if (punches.length > 0 && punches.length < 4) status = "Incomplete";
  if (punches.length === 4) status = "Present";

  const lateMinutes = amIn !== null && scheduledAmIn !== null ? Math.max(0, amIn - scheduledAmIn) : 0;
  const undertimeMinutes =
    pmOut !== null && scheduledPmOut !== null ? Math.max(0, scheduledPmOut - pmOut) : 0;
  if (status === "Present" && lateMinutes > 0) status = "Late";
  return { status, lateMinutes, undertimeMinutes };
}

function attendanceDtrRow(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeNo: row.employee_no || "",
    biometricId: row.biometric_id || "",
    employeeName: row.employee_name || "",
    department: row.department || "",
    position: row.position || "",
    workDate: normalizeDate(row.work_date),
    amIn: formatTime(row.am_in),
    amOut: formatTime(row.am_out),
    pmIn: formatTime(row.pm_in),
    pmOut: formatTime(row.pm_out),
    status: row.status || "Incomplete",
    lateMinutes: Number(row.late_minutes || 0),
    undertimeMinutes: Number(row.undertime_minutes || 0),
    source: row.source || "Imported",
    remarks: row.remarks || "",
    locked: Boolean(row.locked),
    importId: row.import_id || "",
    editedByName: row.edited_by_name || "",
    editedAt: row.edited_at || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function attendanceImportRow(row) {
  return {
    id: row.id,
    source: row.source,
    fileName: row.file_name || "",
    periodFrom: normalizeDate(row.period_from),
    periodTo: normalizeDate(row.period_to),
    rowCount: Number(row.row_count || 0),
    status: row.status,
    notes: row.notes || "",
    importedByName: row.imported_by_name || "",
    importedAt: row.imported_at,
  };
}

async function requireLeaveRead(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!["Admin", "HR", "Viewer"].includes(user.role)) {
    json(res, 403, { error: "Leave Management access required" });
    return null;
  }
  return user;
}

async function requireLeaveWrite(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!["Admin", "HR"].includes(user.role)) {
    json(res, 403, { error: "HR access required" });
    return null;
  }
  return user;
}

async function ensureLeaveBalance(employeeId, leaveTypeId) {
  await pool.execute(
    `INSERT INTO leave_balances (employee_id, leave_type_id)
     VALUES (:employeeId, :leaveTypeId)
     ON DUPLICATE KEY UPDATE employee_id = employee_id`,
    { employeeId, leaveTypeId },
  );
}

async function changeLeaveBalance(employeeId, leaveTypeId, amount, column, balanceDelta = amount) {
  if (!["earned", "used", "adjusted"].includes(column)) throw new Error("Invalid balance column");
  await ensureLeaveBalance(employeeId, leaveTypeId);
  await pool.execute(
    `UPDATE leave_balances
     SET ${column} = ${column} + :amount,
         balance = balance + :balanceDelta
     WHERE employee_id = :employeeId AND leave_type_id = :leaveTypeId`,
    { employeeId, leaveTypeId, amount, balanceDelta },
  );
}

async function readLeaveApplication(id) {
  const [rows] = await pool.execute(
    `SELECT la.*, lt.code AS leave_code, lt.name AS leave_name,
            e.employee_no, e.firstname, e.lastname, e.department, e.position,
            u.name AS approver_name,
            ru.name AS recommended_by_name
     FROM leave_applications la
     INNER JOIN leave_types lt ON lt.id = la.leave_type_id
     INNER JOIN employees e ON e.id = la.employee_id
     LEFT JOIN users u ON u.id = la.approver_id
     LEFT JOIN users ru ON ru.id = la.recommended_by
     WHERE la.id = :id
     LIMIT 1`,
    { id },
  );
  return rows[0] ? leaveApplicationRow(rows[0]) : null;
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

async function requireAttendanceRead(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!["Admin", "HR", "Viewer", "Employee"].includes(user.role)) {
    json(res, 403, { error: "Attendance access required" });
    return null;
  }
  return user;
}

async function requireAttendanceWrite(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!["Admin", "HR"].includes(user.role)) {
    json(res, 403, { error: "HR attendance access required" });
    return null;
  }
  return user;
}

function canReadEmployeeAttendance(user, employeeId) {
  return ["Admin", "HR", "Viewer"].includes(user.role) || user.employeeId === employeeId;
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

  await ensureColumn("employees", "schedule_am_in", "TIME NULL DEFAULT '08:00:00'");
  await ensureColumn("employees", "schedule_am_out", "TIME NULL DEFAULT '12:00:00'");
  await ensureColumn("employees", "schedule_pm_in", "TIME NULL DEFAULT '13:00:00'");
  await ensureColumn("employees", "schedule_pm_out", "TIME NULL DEFAULT '17:00:00'");
  await ensureColumn("employees", "biometric_id", "VARCHAR(80) NULL");
  await ensureColumn("employees", "dtr_signatory", "VARCHAR(200) NULL");
  await ensureColumn("employees", "dtr_noter_id", "BIGINT UNSIGNED NULL");
  await ensureColumn("employees", "is_dtr_noter", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn("employees", "regular", "TINYINT(1) NOT NULL DEFAULT 1");
  await ensureIndex(
    "employees",
    "idx_employees_biometric_id",
    "INDEX idx_employees_biometric_id (biometric_id)",
  );

  const employeeIdDefinition = await getEmployeeIdDefinition();
  const nullableEmployeeIdDefinition = employeeIdDefinition.replace(/\s+NOT NULL$/i, " NULL");

  await ensureColumn("users", "employee_id", nullableEmployeeIdDefinition);
  await ensureIndex(
    "users",
    "uniq_users_employee_id",
    "UNIQUE KEY uniq_users_employee_id (employee_id)",
  );
  await ensureForeignKey(
    "users",
    "fk_users_employee_id",
    "FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL",
  );

  for (const { table, single } of Object.values(EMPLOYEE_SECTION_TABLES)) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`${table}\` (
        id CHAR(36) NOT NULL PRIMARY KEY,
        employee_id ${employeeIdDefinition},
        payload JSON NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_${table}_employee_id (employee_id),
        ${single ? `UNIQUE KEY uniq_${table}_employee_id (employee_id),` : ""}
        CONSTRAINT fk_${table}_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS leave_types (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(20) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      is_paid TINYINT(1) NOT NULL DEFAULT 1,
      is_credit_based TINYINT(1) NOT NULL DEFAULT 1,
      credit_group VARCHAR(30) NULL,
      max_days DECIMAL(8,3) NULL,
      advance_notice_days INT NULL,
      legal_basis TEXT NULL,
      filing_rule TEXT NULL,
      requirements_json JSON NULL,
      detail_schema_json JSON NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);
  await ensureColumn("leave_types", "is_credit_based", "TINYINT(1) NOT NULL DEFAULT 1");
  await ensureColumn("leave_types", "credit_group", "VARCHAR(30) NULL");
  await ensureColumn("leave_types", "max_days", "DECIMAL(8,3) NULL");
  await ensureColumn("leave_types", "advance_notice_days", "INT NULL");
  await ensureColumn("leave_types", "legal_basis", "TEXT NULL");
  await ensureColumn("leave_types", "filing_rule", "TEXT NULL");
  await ensureColumn("leave_types", "requirements_json", "JSON NULL");
  await ensureColumn("leave_types", "detail_schema_json", "JSON NULL");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS leave_balances (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      employee_id ${employeeIdDefinition},
      leave_type_id INT UNSIGNED NOT NULL,
      balance DECIMAL(8,3) NOT NULL DEFAULT 0,
      earned DECIMAL(8,3) NOT NULL DEFAULT 0,
      used DECIMAL(8,3) NOT NULL DEFAULT 0,
      adjusted DECIMAL(8,3) NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_leave_balance_employee_type (employee_id, leave_type_id),
      INDEX idx_leave_balances_employee_id (employee_id),
      CONSTRAINT fk_leave_balances_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      CONSTRAINT fk_leave_balances_leave_type_id FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS leave_applications (
      id CHAR(36) NOT NULL PRIMARY KEY,
      employee_id ${employeeIdDefinition},
      leave_type_id INT UNSIGNED NOT NULL,
      date_from DATE NOT NULL,
      date_to DATE NOT NULL,
      days_requested DECIMAL(8,3) NOT NULL,
      reason TEXT NULL,
      salary_snapshot DECIMAL(12,2) NULL,
      detail_location_type VARCHAR(30) NULL,
      detail_location_text VARCHAR(255) NULL,
      detail_sick_type VARCHAR(30) NULL,
      detail_illness TEXT NULL,
      detail_study_purpose VARCHAR(50) NULL,
      detail_other_purpose VARCHAR(50) NULL,
      detail_other_text TEXT NULL,
      commutation_requested TINYINT(1) NOT NULL DEFAULT 0,
      requirements_payload JSON NULL,
      form_payload JSON NULL,
      recommendation_status VARCHAR(30) NULL,
      recommendation_reason TEXT NULL,
      recommended_by INT UNSIGNED NULL,
      recommended_at DATETIME NULL,
      approved_days_with_pay DECIMAL(8,3) NULL,
      approved_days_without_pay DECIMAL(8,3) NULL,
      approved_days_other DECIMAL(8,3) NULL,
      approved_days_other_text TEXT NULL,
      final_disapproval_reason TEXT NULL,
      status ENUM('Pending', 'Approved', 'Disapproved', 'Cancelled') NOT NULL DEFAULT 'Pending',
      approver_id INT UNSIGNED NULL,
      decision_remarks TEXT NULL,
      decided_at DATETIME NULL,
      created_by INT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_leave_applications_employee_id (employee_id),
      INDEX idx_leave_applications_status (status),
      INDEX idx_leave_applications_dates (date_from, date_to),
      CONSTRAINT fk_leave_applications_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      CONSTRAINT fk_leave_applications_leave_type_id FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
      CONSTRAINT fk_leave_applications_approver_id FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_leave_applications_recommended_by FOREIGN KEY (recommended_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_leave_applications_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);
  await ensureColumn("leave_applications", "salary_snapshot", "DECIMAL(12,2) NULL");
  await ensureColumn("leave_applications", "detail_location_type", "VARCHAR(30) NULL");
  await ensureColumn("leave_applications", "detail_location_text", "VARCHAR(255) NULL");
  await ensureColumn("leave_applications", "detail_sick_type", "VARCHAR(30) NULL");
  await ensureColumn("leave_applications", "detail_illness", "TEXT NULL");
  await ensureColumn("leave_applications", "detail_study_purpose", "VARCHAR(50) NULL");
  await ensureColumn("leave_applications", "detail_other_purpose", "VARCHAR(50) NULL");
  await ensureColumn("leave_applications", "detail_other_text", "TEXT NULL");
  await ensureColumn(
    "leave_applications",
    "commutation_requested",
    "TINYINT(1) NOT NULL DEFAULT 0",
  );
  await ensureColumn("leave_applications", "requirements_payload", "JSON NULL");
  await ensureColumn("leave_applications", "form_payload", "JSON NULL");
  await ensureColumn("leave_applications", "recommendation_status", "VARCHAR(30) NULL");
  await ensureColumn("leave_applications", "recommendation_reason", "TEXT NULL");
  await ensureColumn("leave_applications", "recommended_by", "INT UNSIGNED NULL");
  await ensureColumn("leave_applications", "recommended_at", "DATETIME NULL");
  await ensureColumn("leave_applications", "approved_days_with_pay", "DECIMAL(8,3) NULL");
  await ensureColumn("leave_applications", "approved_days_without_pay", "DECIMAL(8,3) NULL");
  await ensureColumn("leave_applications", "approved_days_other", "DECIMAL(8,3) NULL");
  await ensureColumn("leave_applications", "approved_days_other_text", "TEXT NULL");
  await ensureColumn("leave_applications", "final_disapproval_reason", "TEXT NULL");
  await ensureForeignKey(
    "leave_applications",
    "fk_leave_applications_recommended_by",
    "FOREIGN KEY (recommended_by) REFERENCES users(id) ON DELETE SET NULL",
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS leave_adjustments (
      id CHAR(36) NOT NULL PRIMARY KEY,
      employee_id ${employeeIdDefinition},
      leave_type_id INT UNSIGNED NOT NULL,
      amount DECIMAL(8,3) NOT NULL,
      reason TEXT NULL,
      created_by INT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_leave_adjustments_employee_id (employee_id),
      CONSTRAINT fk_leave_adjustments_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      CONSTRAINT fk_leave_adjustments_leave_type_id FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
      CONSTRAINT fk_leave_adjustments_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_imports (
      id CHAR(36) NOT NULL PRIMARY KEY,
      source ENUM('CSV', 'Manual', 'Biometric', 'Legacy') NOT NULL DEFAULT 'CSV',
      file_name VARCHAR(255) NULL,
      period_from DATE NULL,
      period_to DATE NULL,
      row_count INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('Processing', 'Completed', 'Failed') NOT NULL DEFAULT 'Completed',
      notes TEXT NULL,
      imported_by INT UNSIGNED NULL,
      imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_attendance_imports_period (period_from, period_to),
      CONSTRAINT fk_attendance_imports_imported_by FOREIGN KEY (imported_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dtr_noters (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      position VARCHAR(200) NOT NULL,
      office VARCHAR(200) NULL,
      signatory VARCHAR(200) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_dtr_noters_active (is_active),
      INDEX idx_dtr_noters_office (office)
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS biometric_devices (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      ip_address VARCHAR(80) NOT NULL,
      port INT UNSIGNED NOT NULL DEFAULT 4370,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_schedule_overrides (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      employee_id ${employeeIdDefinition},
      work_date DATE NOT NULL,
      am_in TIME NULL,
      am_out TIME NULL,
      pm_in TIME NULL,
      pm_out TIME NULL,
      created_by INT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_employee_schedule_date (employee_id, work_date),
      INDEX idx_employee_schedule_work_date (work_date),
      CONSTRAINT fk_employee_schedule_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      CONSTRAINT fk_employee_schedule_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_logs (
      id CHAR(36) NOT NULL PRIMARY KEY,
      employee_id ${employeeIdDefinition},
      punch_at DATETIME NOT NULL,
      punch_date DATE GENERATED ALWAYS AS (DATE(punch_at)) STORED,
      source ENUM('CSV', 'Manual', 'Biometric', 'Legacy') NOT NULL DEFAULT 'CSV',
      source_device VARCHAR(120) NULL,
      import_id CHAR(36) NULL,
      raw_payload JSON NULL,
      created_by INT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_attendance_logs_employee_punch (employee_id, punch_at),
      INDEX idx_attendance_logs_employee_date (employee_id, punch_date),
      INDEX idx_attendance_logs_import_id (import_id),
      CONSTRAINT fk_attendance_logs_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      CONSTRAINT fk_attendance_logs_import_id FOREIGN KEY (import_id) REFERENCES attendance_imports(id) ON DELETE SET NULL,
      CONSTRAINT fk_attendance_logs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dtr_entries (
      id CHAR(36) NOT NULL PRIMARY KEY,
      employee_id ${employeeIdDefinition},
      work_date DATE NOT NULL,
      am_in TIME NULL,
      am_out TIME NULL,
      pm_in TIME NULL,
      pm_out TIME NULL,
      status ENUM('Present', 'Late', 'Absent', 'Incomplete', 'Leave', 'Official Business', 'Rest Day', 'Holiday') NOT NULL DEFAULT 'Incomplete',
      late_minutes INT UNSIGNED NOT NULL DEFAULT 0,
      undertime_minutes INT UNSIGNED NOT NULL DEFAULT 0,
      source ENUM('Imported', 'Manual', 'Adjusted') NOT NULL DEFAULT 'Imported',
      remarks TEXT NULL,
      locked TINYINT(1) NOT NULL DEFAULT 0,
      import_id CHAR(36) NULL,
      edited_by INT UNSIGNED NULL,
      edited_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_dtr_entries_employee_date (employee_id, work_date),
      INDEX idx_dtr_entries_date (work_date),
      INDEX idx_dtr_entries_status (status),
      CONSTRAINT fk_dtr_entries_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      CONSTRAINT fk_dtr_entries_import_id FOREIGN KEY (import_id) REFERENCES attendance_imports(id) ON DELETE SET NULL,
      CONSTRAINT fk_dtr_entries_edited_by FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dtr_export_jobs (
      id CHAR(36) NOT NULL PRIMARY KEY,
      scope ENUM('Single', 'Mass') NOT NULL,
      employee_id ${nullableEmployeeIdDefinition},
      period_from DATE NOT NULL,
      period_to DATE NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      row_count INT UNSIGNED NOT NULL DEFAULT 0,
      created_by INT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dtr_export_jobs_period (period_from, period_to),
      CONSTRAINT fk_dtr_export_jobs_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
      CONSTRAINT fk_dtr_export_jobs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

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

async function ensureIndex(table, indexName, definition) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = :table AND INDEX_NAME = :indexName`,
    { schema: DB_NAME, table, indexName },
  );
  if (Number(rows[0].count) === 0) {
    await pool.query(`ALTER TABLE \`${table}\` ADD ${definition}`);
  }
}

async function ensureForeignKey(table, constraintName, definition) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = :table AND CONSTRAINT_NAME = :constraintName`,
    { schema: DB_NAME, table, constraintName },
  );
  if (Number(rows[0].count) === 0) {
    await pool.query(`ALTER TABLE \`${table}\` ADD CONSTRAINT \`${constraintName}\` ${definition}`);
  }
}

async function getEmployeeIdDefinition() {
  const [rows] = await pool.execute(
    `SELECT COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'employees' AND COLUMN_NAME = 'id'
     LIMIT 1`,
    { schema: DB_NAME },
  );
  const column = rows[0];
  if (!column) return "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL";

  const columnType = String(column.COLUMN_TYPE || "CHAR(36)");
  const charset = column.CHARACTER_SET_NAME ? ` CHARACTER SET ${column.CHARACTER_SET_NAME}` : "";
  const collation = column.COLLATION_NAME ? ` COLLATE ${column.COLLATION_NAME}` : "";
  return `${columnType}${charset}${collation} NOT NULL`;
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

  for (const leaveType of DEFAULT_LEAVE_TYPES) {
    await pool.execute(
      `INSERT INTO leave_types (
         code, name, is_paid, is_credit_based, credit_group, max_days, advance_notice_days,
         legal_basis, filing_rule, requirements_json, detail_schema_json, sort_order
       )
       VALUES (
         :code, :name, :paid, :creditBased, :creditGroup, :maxDays, :advanceNoticeDays,
         :legalBasis, :filingRule, :requirementsJson, :detailSchemaJson, :sortOrder
       )
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         is_paid = VALUES(is_paid),
         is_credit_based = VALUES(is_credit_based),
         credit_group = VALUES(credit_group),
         max_days = VALUES(max_days),
         advance_notice_days = VALUES(advance_notice_days),
         legal_basis = VALUES(legal_basis),
         filing_rule = VALUES(filing_rule),
         requirements_json = VALUES(requirements_json),
         detail_schema_json = VALUES(detail_schema_json),
         sort_order = VALUES(sort_order)`,
      {
        ...leaveType,
        requirementsJson: JSON.stringify(leaveType.requirements || []),
        detailSchemaJson: JSON.stringify(leaveType.detailSchema || []),
      },
    );
  }
}

async function getSessionUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;

  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.name, u.role, u.photo_url, u.must_change_password, u.employee_id,
            e.employee_no, CONCAT(e.lastname, ', ', e.firstname) AS employee_name
     FROM sessions s
     INNER JOIN users u ON u.id = s.user_id
     LEFT JOIN employees e ON e.id = u.employee_id
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
    `SELECT u.id, u.username, u.password_hash, u.name, u.role, u.photo_url, u.must_change_password, u.employee_id,
            e.employee_no, CONCAT(e.lastname, ', ', e.firstname) AS employee_name
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     WHERE u.username = :username AND u.is_active = 1
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
    `SELECT u.id, u.username, u.name, u.role, u.photo_url, u.must_change_password, u.employee_id,
            e.employee_no, CONCAT(e.lastname, ', ', e.firstname) AS employee_name
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     WHERE u.id = :id LIMIT 1`,
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
    `SELECT u.id, u.username, u.name, u.role, u.photo_url, u.must_change_password, u.employee_id,
            e.employee_no, CONCAT(e.lastname, ', ', e.firstname) AS employee_name
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     WHERE u.id = :id LIMIT 1`,
    { id: user.id },
  );
  return json(res, 200, { user: publicUser(updated[0]) });
}

async function handleListUsers(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.name, u.role, u.is_active, u.must_change_password, u.employee_id,
            u.created_at, u.updated_at, e.employee_no, CONCAT(e.lastname, ', ', e.firstname) AS employee_name
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     ORDER BY u.name ASC, u.username ASC`,
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
  const employeeId = body.employeeId ? String(body.employeeId).trim() : null;
  const temporaryPassword = generateTemporaryPassword();

  if (!username || !/^[a-z0-9._-]{3,50}$/.test(username)) {
    return json(res, 400, {
      error: "Username must be 3-50 characters using letters, numbers, dot, underscore, or dash",
    });
  }
  if (!name || name.length > 150) return json(res, 400, { error: "Full name is required" });
  if (!ROLES.includes(role)) return json(res, 400, { error: "Invalid role" });
  if (employeeId) {
    const employee = await readEmployeeById(employeeId);
    if (!employee) return json(res, 400, { error: "Linked employee not found" });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO users (username, password_hash, name, role, employee_id, must_change_password)
       VALUES (:username, :passwordHash, :name, :role, :employeeId, 1)`,
      { username, passwordHash: hashPassword(temporaryPassword), name, role, employeeId },
    );
    await logAudit(
      admin.id,
      "users.create",
      { userId: result.insertId, username, role, employeeId },
      req,
    );
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.name, u.role, u.is_active, u.must_change_password, u.employee_id,
              u.created_at, u.updated_at, e.employee_no, CONCAT(e.lastname, ', ', e.firstname) AS employee_name
       FROM users u
       LEFT JOIN employees e ON e.id = u.employee_id
       WHERE u.id = :id LIMIT 1`,
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
  const employeeId = body.employeeId ? String(body.employeeId).trim() : null;
  const isActive = body.isActive === false ? 0 : 1;

  if (!name || name.length > 150) return json(res, 400, { error: "Full name is required" });
  if (!ROLES.includes(role)) return json(res, 400, { error: "Invalid role" });
  if (employeeId) {
    const employee = await readEmployeeById(employeeId);
    if (!employee) return json(res, 400, { error: "Linked employee not found" });
  }
  if (Number(id) === admin.id && isActive === 0)
    return json(res, 400, { error: "You cannot deactivate your own account" });

  await pool.execute(
    `UPDATE users SET name = :name, role = :role, employee_id = :employeeId, is_active = :isActive WHERE id = :id`,
    { id, name, role, employeeId, isActive },
  );
  await logAudit(
    admin.id,
    "users.update",
    { userId: id, role, employeeId, isActive: Boolean(isActive) },
    req,
  );
  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.name, u.role, u.is_active, u.must_change_password, u.employee_id,
            u.created_at, u.updated_at, e.employee_no, CONCAT(e.lastname, ', ', e.firstname) AS employee_name
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     WHERE u.id = :id LIMIT 1`,
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
    SELECT COALESCE(NULLIF(TRIM(department), ''), 'Unspecified') AS department,
           SUM(level = 'First Level') AS firstLevel,
           SUM(level = 'Second Level') AS secondLevel,
           SUM(level = 'Third Level' OR level = 'Executive') AS thirdLevel,
           SUM(LOWER(TRIM(gender)) = 'male') AS male,
           SUM(LOWER(TRIM(gender)) = 'female') AS female,
           COUNT(*) AS total
    FROM employees
    GROUP BY COALESCE(NULLIF(TRIM(department), ''), 'Unspecified')
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
        WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) < 30 THEN 'Under 30'
        WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 30 AND 39 THEN '30-39'
        WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 40 AND 49 THEN '40-49'
        WHEN TIMESTAMPDIFF(YEAR, birthday, CURDATE()) BETWEEN 50 AND 59 THEN '50-59'
        ELSE '60+'
      END AS ageGroup,
      COUNT(*) AS total
    FROM employees
    WHERE birthday IS NOT NULL
    GROUP BY ageGroup
    ORDER BY FIELD(ageGroup, 'Under 30', '30-39', '40-49', '50-59', '60+')
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

async function readAttendanceRows({ employeeId, from, to, q = "", limit = 500 }) {
  const where = [];
  const params = {};
  if (employeeId) {
    where.push("d.employee_id = :employeeId");
    params.employeeId = employeeId;
  }
  if (from) {
    where.push("d.work_date >= :from");
    params.from = from;
  }
  if (to) {
    where.push("d.work_date <= :to");
    params.to = to;
  }
  if (q) {
    where.push(
      `(e.employee_no LIKE :q OR e.firstname LIKE :q OR e.lastname LIKE :q OR e.department LIKE :q)`,
    );
    params.q = `%${q}%`;
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [rows] = await pool.execute(
    `SELECT d.*, e.employee_no, e.biometric_id, e.department, e.position,
            CONCAT(e.lastname, ', ', e.firstname) AS employee_name,
            u.name AS edited_by_name
     FROM dtr_entries d
     INNER JOIN employees e ON e.id = d.employee_id
     LEFT JOIN users u ON u.id = d.edited_by
     ${whereSql}
     ORDER BY d.work_date DESC, e.lastname ASC, e.firstname ASC
     LIMIT ${Math.min(2000, Math.max(1, Number(limit || 500)))}`,
    params,
  );
  return rows.map(attendanceDtrRow);
}

function defaultAttendanceRange(url) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return {
    from: String(url.searchParams.get("from") || first).slice(0, 10),
    to: String(url.searchParams.get("to") || last).slice(0, 10),
  };
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function dtrRowsToCsv(rows) {
  const headers = [
    "Employee No",
    "Employee Name",
    "Department",
    "Date",
    "AM In",
    "AM Out",
    "PM In",
    "PM Out",
    "Status",
    "Late Minutes",
    "Undertime Minutes",
    "Source",
    "Remarks",
  ];
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.employeeNo,
        row.employeeName,
        row.department,
        row.workDate,
        row.amIn,
        row.amOut,
        row.pmIn,
        row.pmOut,
        row.status,
        row.lateMinutes,
        row.undertimeMinutes,
        row.source,
        row.remarks,
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return lines.join("\r\n");
}

async function resolveAttendanceEmployee(row) {
  const employeeDbId = String(row.employeeDbId || "").trim();
  const employeeValue = String(row.employeeId || row.employeeNo || "").trim();
  if (!employeeDbId && !employeeValue) throw new Error("Employee ID is required");

  const [rows] = await pool.execute(
    `SELECT id, employee_no, firstname, lastname
     FROM employees
     WHERE id = :employeeDbId OR employee_no = :employeeValue OR biometric_id = :employeeValue
     LIMIT 1`,
    { employeeDbId, employeeValue },
  );
  if (!rows[0]) throw new Error(`Employee not found: ${employeeValue || employeeDbId}`);
  return rows[0];
}

async function insertAttendancePunches(
  connection,
  entry,
  source,
  importId,
  userId,
  rawPayload = null,
) {
  const punches = [
    entry.amIn ? `${entry.workDate} ${entry.amIn}` : null,
    entry.amOut ? `${entry.workDate} ${entry.amOut}` : null,
    entry.pmIn ? `${entry.workDate} ${entry.pmIn}` : null,
    entry.pmOut ? `${entry.workDate} ${entry.pmOut}` : null,
  ].filter(Boolean);

  for (const punchAt of punches) {
    await connection.execute(
      `INSERT INTO attendance_logs (id, employee_id, punch_at, source, import_id, raw_payload, created_by)
       VALUES (:id, :employeeId, :punchAt, :source, :importId, :rawPayload, :createdBy)
       ON DUPLICATE KEY UPDATE import_id = COALESCE(import_id, VALUES(import_id))`,
      {
        id: crypto.randomUUID(),
        employeeId: entry.employeeId,
        punchAt,
        source,
        importId,
        rawPayload: rawPayload ? JSON.stringify(rawPayload) : null,
        createdBy: userId,
      },
    );
  }
}

async function upsertDtrEntry(connection, entry, userId, preserveAdjusted = true) {
  const stats = calculateAttendanceStats(entry);
  const source = entry.source || "Imported";
  const params = {
    id: entry.id || crypto.randomUUID(),
    employeeId: entry.employeeId,
    workDate: entry.workDate,
    amIn: entry.amIn || null,
    amOut: entry.amOut || null,
    pmIn: entry.pmIn || null,
    pmOut: entry.pmOut || null,
    status: entry.status || stats.status,
    lateMinutes: stats.lateMinutes,
    undertimeMinutes: stats.undertimeMinutes,
    source,
    remarks: entry.remarks || null,
    importId: entry.importId || null,
    editedBy: source === "Imported" ? null : userId,
  };
  const protectedUpdate = preserveAdjusted
    ? `am_in = IF(source = 'Imported' AND locked = 0, VALUES(am_in), am_in),
       am_out = IF(source = 'Imported' AND locked = 0, VALUES(am_out), am_out),
       pm_in = IF(source = 'Imported' AND locked = 0, VALUES(pm_in), pm_in),
       pm_out = IF(source = 'Imported' AND locked = 0, VALUES(pm_out), pm_out),
       status = IF(source = 'Imported' AND locked = 0, VALUES(status), status),
       late_minutes = IF(source = 'Imported' AND locked = 0, VALUES(late_minutes), late_minutes),
       undertime_minutes = IF(source = 'Imported' AND locked = 0, VALUES(undertime_minutes), undertime_minutes),
       import_id = IF(source = 'Imported' AND locked = 0, VALUES(import_id), import_id)`
    : `am_in = VALUES(am_in),
       am_out = VALUES(am_out),
       pm_in = VALUES(pm_in),
       pm_out = VALUES(pm_out),
       status = VALUES(status),
       late_minutes = VALUES(late_minutes),
       undertime_minutes = VALUES(undertime_minutes),
       source = VALUES(source),
       remarks = VALUES(remarks),
       import_id = VALUES(import_id),
       edited_by = VALUES(edited_by),
       edited_at = NOW()`;

  await connection.execute(
    `INSERT INTO dtr_entries (
       id, employee_id, work_date, am_in, am_out, pm_in, pm_out, status,
       late_minutes, undertime_minutes, source, remarks, import_id, edited_by, edited_at
     ) VALUES (
       :id, :employeeId, :workDate, :amIn, :amOut, :pmIn, :pmOut, :status,
       :lateMinutes, :undertimeMinutes, :source, :remarks, :importId, :editedBy,
       IF(:editedBy IS NULL, NULL, NOW())
     )
     ON DUPLICATE KEY UPDATE ${protectedUpdate}`,
    params,
  );
}

function deriveDtrFromPunchTimes(times, schedule = {}) {
  const sorted = [...new Set(times)].sort();
  const toMinutes = (value) => minutesFromTime(value);
  const scheduleAmOut = toMinutes(schedule.scheduleAmOut || "12:00") ?? 12 * 60;
  const schedulePmIn = toMinutes(schedule.schedulePmIn || "13:00") ?? 13 * 60;
  const schedulePmOut = toMinutes(schedule.schedulePmOut || "17:00") ?? 17 * 60;
  const morning = [];
  const lunch = [];
  const afternoon = [];

  for (const time of sorted) {
    const minutes = toMinutes(time);
    if (minutes === null) continue;
    if (minutes < scheduleAmOut) morning.push(time);
    else if (minutes < schedulePmIn) lunch.push(time);
    else afternoon.push(time);
  }

  let amIn = "";
  let amOut = "";
  let pmIn = "";
  let pmOut = "";

  if (morning.length) {
    amIn = morning[0];
    if (lunch.length) {
      amOut = lunch[0];
    } else if (morning.length > 1) {
      for (const scan of [...morning].reverse()) {
        if (toMinutes(scan) - toMinutes(amIn) > 1) {
          amOut = scan;
          break;
        }
      }
    }
  }

  if (morning.length) {
    if (lunch.length > 1) pmIn = lunch[lunch.length - 1];
    else if (afternoon.length > 1) pmIn = afternoon[0];
    else if (afternoon.length === 1) {
      const value = toMinutes(afternoon[0]);
      pmIn = Math.abs(value - schedulePmIn) < Math.abs(value - schedulePmOut) ? afternoon[0] : "";
      pmOut = pmIn ? "" : afternoon[0];
    }
  } else if (lunch.length > 1) {
    amOut = lunch[0];
    pmIn = lunch[lunch.length - 1];
  } else if (lunch.length === 1) {
    pmIn = lunch[0];
  } else if (afternoon.length > 1) {
    pmIn = afternoon[0];
  } else if (afternoon.length === 1) {
    const value = toMinutes(afternoon[0]);
    const distanceToIn = Math.abs(value - schedulePmIn);
    const distanceToOut = Math.abs(value - schedulePmOut);
    pmIn = distanceToIn <= 4 * 60 && distanceToIn < distanceToOut ? afternoon[0] : "";
    pmOut = pmIn ? "" : afternoon[0];
  }

  if (!pmOut && afternoon.length) {
    const candidate = afternoon[afternoon.length - 1];
    if (!pmIn || candidate > pmIn) pmOut = candidate;
  }
  if (pmIn && pmOut && pmIn === pmOut && sorted.length > 1) pmOut = "";

  return {
    amIn: amIn ? normalizeTimeInput(amIn) : null,
    amOut: amOut ? normalizeTimeInput(amOut) : null,
    pmIn: pmIn ? normalizeTimeInput(pmIn) : null,
    pmOut: pmOut ? normalizeTimeInput(pmOut) : null,
  };
}

async function refreshDtrEntries({ employeeId, from, to, userId }) {
  const where = [];
  const params = {};
  if (employeeId) {
    where.push("employee_id = :employeeId");
    params.employeeId = employeeId;
  }
  if (from) {
    where.push("punch_date >= :from");
    params.from = from;
  }
  if (to) {
    where.push("punch_date <= :to");
    params.to = to;
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [logs] = await pool.execute(
    `SELECT al.employee_id, DATE_FORMAT(al.punch_date, '%Y-%m-%d') AS work_date,
            TIME_FORMAT(al.punch_at, '%H:%i:%s') AS punch_time,
            TIME_FORMAT(COALESCE(eso.am_in, e.schedule_am_in), '%H:%i:%s') AS schedule_am_in,
            TIME_FORMAT(COALESCE(eso.am_out, e.schedule_am_out), '%H:%i:%s') AS schedule_am_out,
            TIME_FORMAT(COALESCE(eso.pm_in, e.schedule_pm_in), '%H:%i:%s') AS schedule_pm_in,
            TIME_FORMAT(COALESCE(eso.pm_out, e.schedule_pm_out), '%H:%i:%s') AS schedule_pm_out
     FROM attendance_logs al
     INNER JOIN employees e ON e.id = al.employee_id
     LEFT JOIN employee_schedule_overrides eso
       ON eso.employee_id = al.employee_id AND eso.work_date = al.punch_date
     ${whereSql.replaceAll("employee_id", "al.employee_id").replaceAll("punch_date", "al.punch_date")}
     ORDER BY al.employee_id, al.punch_at`,
    params,
  );

  const grouped = new Map();
  for (const log of logs) {
    const key = `${log.employee_id}:${log.work_date}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        employeeId: log.employee_id,
        workDate: log.work_date,
        scheduleAmIn: log.schedule_am_in,
        scheduleAmOut: log.schedule_am_out,
        schedulePmIn: log.schedule_pm_in,
        schedulePmOut: log.schedule_pm_out,
        times: [],
      });
    }
    grouped.get(key).times.push(log.punch_time);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const group of grouped.values()) {
      const entry = deriveDtrFromPunchTimes(group.times, group);
      await upsertDtrEntry(
        connection,
        { employeeId: group.employeeId, workDate: group.workDate, ...entry, ...group, source: "Imported" },
        userId,
        true,
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return { recordsProcessed: grouped.size, punchesProcessed: logs.length };
}

async function handleListDtrEntries(req, res, url) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return;
  const { from, to } = defaultAttendanceRange(url);
  let employeeId = String(url.searchParams.get("employeeId") || "").trim();
  const q = String(url.searchParams.get("q") || "").trim();

  if (user.role === "Employee") {
    if (!user.employeeId)
      return json(res, 400, { error: "No employee record linked to this user" });
    employeeId = user.employeeId;
  }
  if (employeeId && !canReadEmployeeAttendance(user, employeeId)) {
    return json(res, 403, { error: "You can only view your own DTR" });
  }

  const rows = await readAttendanceRows({ employeeId, from, to, q });
  const [imports] = await pool.execute(
    `SELECT ai.*, u.name AS imported_by_name
     FROM attendance_imports ai
     LEFT JOIN users u ON u.id = ai.imported_by
     ORDER BY ai.imported_at DESC
     LIMIT 8`,
  );

  return json(res, 200, {
    entries: rows,
    imports: imports.map(attendanceImportRow),
    summary: {
      total: rows.length,
      present: rows.filter((row) => row.status === "Present" || row.status === "Late").length,
      incomplete: rows.filter((row) => row.status === "Incomplete").length,
      lateMinutes: rows.reduce((sum, row) => sum + row.lateMinutes, 0),
    },
  });
}

function dtrNoterRow(row) {
  return {
    id: String(row.id ?? row.noter_id),
    name: row.name || "",
    position: row.position || "",
    office: row.office || "",
    signatory: row.signatory || row.name || "",
    isActive: row.is_active === undefined ? true : Boolean(row.is_active),
  };
}

async function handleListDtrNoters(req, res) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return;
  const [rows] = await pool.query(
    `SELECT
       CONCAT('noter-', id) AS id,
       name,
       position,
       COALESCE(office, '') AS office,
       signatory,
       is_active
     FROM dtr_noters
     WHERE is_active = 1
     UNION ALL
     SELECT
       CONCAT('employee-', id) AS id,
       TRIM(CONCAT_WS(' ', firstname, middlename, lastname, name_ext)) AS name,
       position,
       department AS office,
       COALESCE(NULLIF(dtr_signatory, ''), TRIM(CONCAT_WS(' ', firstname, middlename, lastname, name_ext))) AS signatory,
       1 AS is_active
     FROM employees
     WHERE is_dtr_noter = 1 AND emp_status = 'Active'
     ORDER BY office ASC, signatory ASC, name ASC`,
  );
  return json(res, 200, { noters: rows.map(dtrNoterRow) });
}

async function handleCreateDtrNoter(req, res) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const name = String(body.name || body.signatory || "").trim();
  const position = String(body.position || "").trim();
  const office = String(body.office || "").trim();
  const signatory = String(body.signatory || name).trim();
  if (!name || !position || !signatory) {
    return json(res, 400, { error: "Name, signatory, and position are required" });
  }
  const [result] = await pool.execute(
    `INSERT INTO dtr_noters (name, position, office, signatory)
     VALUES (:name, :position, :office, :signatory)`,
    { name, position, office: office || null, signatory },
  );
  await logAudit(user.id, "attendance.noter_create", { id: result.insertId }, req);
  return json(res, 201, {
    noter: dtrNoterRow({ id: result.insertId, name, position, office, signatory, is_active: 1 }),
  });
}

async function handleDeleteDtrNoter(req, res, id) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  await pool.execute(`UPDATE dtr_noters SET is_active = 0 WHERE id = :id`, { id });
  await logAudit(user.id, "attendance.noter_delete", { id }, req);
  return json(res, 200, { ok: true });
}

function biometricDeviceRow(row) {
  return {
    id: String(row.id),
    biometric_id: Number(row.id),
    name: row.name || "",
    ip_address: row.ip_address || "",
    port: Number(row.port || 4370),
    active: Boolean(row.is_active),
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function validateBiometricDevicePayload(body, existing = {}) {
  const name = String(body.name ?? existing.name ?? "").trim();
  const ipAddress = String(body.ip_address ?? body.ipAddress ?? existing.ip_address ?? "").trim();
  const port = Number(body.port ?? existing.port ?? 4370);
  const active =
    body.active === undefined && body.is_active === undefined
      ? existing.is_active === undefined
        ? true
        : Boolean(existing.is_active)
      : Boolean(body.active ?? body.is_active);
  const ipPattern =
    /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

  if (!name || name.length < 2) throw new Error("Device name must be at least 2 characters");
  if (!ipAddress) throw new Error("IP address is required");
  if (!ipPattern.test(ipAddress)) throw new Error("Invalid IP address format");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Port must be between 1 and 65535");
  }

  return { name, ipAddress, port, active };
}

async function handleListBiometricDevices(req, res) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return;
  const [rows] = await pool.query(`SELECT * FROM biometric_devices ORDER BY name ASC`);
  return json(res, 200, { devices: rows.map(biometricDeviceRow) });
}

async function handleCreateBiometricDevice(req, res) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  let payload;
  try {
    payload = validateBiometricDevicePayload(body);
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
  const [result] = await pool.execute(
    `INSERT INTO biometric_devices (name, ip_address, port, is_active)
     VALUES (:name, :ipAddress, :port, :active)`,
    { ...payload, active: payload.active ? 1 : 0 },
  );
  await logAudit(user.id, "attendance.biometric_create", { id: result.insertId }, req);
  return json(res, 201, {
    device: biometricDeviceRow({
      id: result.insertId,
      name: payload.name,
      ip_address: payload.ipAddress,
      port: payload.port,
      is_active: payload.active ? 1 : 0,
    }),
  });
}

async function handleUpdateBiometricDevice(req, res, id) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const [[existing]] = await pool.execute(`SELECT * FROM biometric_devices WHERE id = :id LIMIT 1`, {
    id,
  });
  if (!existing) return json(res, 404, { error: "Biometric device not found" });
  const body = await readBody(req);
  let payload;
  try {
    payload = validateBiometricDevicePayload(body, existing);
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
  await pool.execute(
    `UPDATE biometric_devices
     SET name = :name, ip_address = :ipAddress, port = :port, is_active = :active
     WHERE id = :id`,
    { id, ...payload, active: payload.active ? 1 : 0 },
  );
  await logAudit(user.id, "attendance.biometric_update", { id }, req);
  return json(res, 200, {
    device: biometricDeviceRow({
      id,
      name: payload.name,
      ip_address: payload.ipAddress,
      port: payload.port,
      is_active: payload.active ? 1 : 0,
    }),
  });
}

async function handleDeleteBiometricDevice(req, res, id) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  await pool.execute(`DELETE FROM biometric_devices WHERE id = :id`, { id });
  await logAudit(user.id, "attendance.biometric_delete", { id }, req);
  return json(res, 200, { ok: true });
}

function checkTcpDevice(ipAddress, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: ipAddress, port, timeout }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(false));
  });
}

async function handleCheckBiometricStatus(req, res) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return;
  const body = await readBody(req);
  const ipAddress = String(body.ip_address || body.ipAddress || "").trim();
  const port = Number(body.port || 4370);
  if (!ipAddress || !Number.isInteger(port)) {
    return json(res, 400, { error: "IP address and port are required" });
  }
  const online = await checkTcpDevice(ipAddress, port);
  return json(res, 200, { online, status: online ? "online" : "offline" });
}

async function handleCheckUnimportedDtrs(req, res, employeeId) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return;
  if (!canReadEmployeeAttendance(user, employeeId)) {
    return json(res, 403, { error: "You can only view your own DTR" });
  }
  const [[row]] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM attendance_logs al
     LEFT JOIN dtr_entries d ON d.employee_id = al.employee_id AND d.work_date = al.punch_date
     WHERE al.employee_id = :employeeId AND d.id IS NULL`,
    { employeeId },
  );
  return json(res, 200, { count: Number(row?.count || 0) });
}

function parseDateTimeText(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})[ T]+(\d{1,2}:\d{2}(?::\d{2})?)$/);
  if (!match) return null;
  return `${match[1]} ${normalizeTimeInput(match[2])}`;
}

function dateInRange(date, from, to) {
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function parseLegacyAttendanceText(text, fileName) {
  const extension = path.extname(fileName).toLowerCase();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const punches = [];

  if (extension === ".dat") {
    for (const line of lines) {
      const parts = line.split(/\s+/);
      const punchAt = parseDateTimeText(`${parts[1] || ""} ${parts[2] || ""}`);
      if (parts[0] && punchAt) punches.push({ employeeNo: parts[0], punchAt, raw: line });
    }
    return punches;
  }

  if (extension === ".csv") {
    const first = splitCsvLine(lines[0] || "").map((item) => item.trim().toLowerCase());
    const hasHeader = first.some((item) =>
      ["employee", "employeeno", "employeeid", "date", "datetime", "time"].includes(item),
    );
    const headers = hasHeader ? first : ["employeeNo", "date", "time", "amIn", "amOut", "pmIn", "pmOut"].map((item) => item.toLowerCase());
    const dataLines = hasHeader ? lines.slice(1) : lines;
    for (const line of dataLines) {
      const values = splitCsvLine(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header.replace(/[^a-z0-9]/g, "")] = values[index]?.trim() || "";
      });
      const employeeNo = row.employeeno || row.employeeid || row.employee || row.id;
      const date = normalizeDate(row.date || row.workdate);
      const direct = parseDateTimeText(row.datetime || row.punchat || row.createdat);
      if (employeeNo && direct) punches.push({ employeeNo, punchAt: direct, raw: line });
      for (const key of ["amin", "amout", "pmin", "pmout", "time"]) {
        if (employeeNo && date && row[key]) {
          punches.push({ employeeNo, punchAt: `${date} ${normalizeTimeInput(row[key])}`, raw: line });
        }
      }
    }
    return punches;
  }

  for (const [index, line] of lines.entries()) {
    if (index === 0 && /employee|userid|date/i.test(line)) continue;
    const parts = line.split(/\s+/);
    if (parts.length >= 7) {
      const punchAt = parseDateTimeText(`${parts[5]} ${parts[6]}`);
      if (parts[2] && punchAt) punches.push({ employeeNo: parts[2], punchAt, raw: line });
      continue;
    }
    if (parts.length >= 3) {
      const punchAt = parseDateTimeText(`${parts[1]} ${parts[2]}`);
      if (parts[0] && punchAt) punches.push({ employeeNo: parts[0], punchAt, raw: line });
    }
  }
  return punches;
}

async function parseUploadedDtrFile(fileName, fileBase64) {
  const extension = path.extname(fileName).toLowerCase();
  const buffer = Buffer.from(fileBase64, "base64");
  if ([".txt", ".csv", ".dat"].includes(extension)) {
    return parseLegacyAttendanceText(buffer.toString("utf8"), fileName);
  }
  if (extension === ".xlsx") {
    await fs.mkdir(PREVIEW_DIR, { recursive: true });
    const tempPath = path.join(PREVIEW_DIR, `dtr-import-${crypto.randomUUID()}.xlsx`);
    await fs.writeFile(tempPath, buffer);
    try {
      const output = await runPython([DTR_PARSE_SCRIPT, tempPath]);
      return JSON.parse(output || "[]");
    } finally {
      await fs.unlink(tempPath).catch(() => {});
    }
  }
  if (extension === ".xls") {
    throw new Error("Legacy .xls files must be saved as .xlsx before import");
  }
  throw new Error("Only .txt, .csv, .dat, and .xlsx DTR files are supported for import");
}

async function importParsedPunches({ user, req, body, fileName, parsed, employeeId, from, to, source, sourceDevice }) {
  let employeeNoOverride = "";
  if (employeeId) {
    const [[employee]] = await pool.execute(`SELECT id, employee_no FROM employees WHERE id = :employeeId`, {
      employeeId,
    });
    if (!employee) return json(res, 404, { error: "Employee not found" });
    employeeNoOverride = employee.employee_no;
  }

  const importId = crypto.randomUUID();
  let imported = 0;
  const errors = [];
  const dates = [];
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO attendance_imports (id, source, file_name, row_count, status, notes, imported_by)
       VALUES (:id, :source, :fileName, 0, 'Processing', :notes, :importedBy)`,
      {
        id: importId,
        source,
        fileName: fileName.slice(0, 255),
        notes: body.notes || null,
        importedBy: user.id,
      },
    );

    for (const [index, punch] of parsed.entries()) {
      try {
        const employeeNo = employeeNoOverride || punch.employeeNo;
        const [[employee]] = await connection.execute(
          `SELECT id FROM employees WHERE employee_no = :employeeNo OR biometric_id = :employeeNo LIMIT 1`,
          { employeeNo },
        );
        if (!employee) throw new Error(`Employee not found: ${employeeNo}`);
        await connection.execute(
          `INSERT INTO attendance_logs (id, employee_id, punch_at, source, source_device, import_id, raw_payload, created_by)
           VALUES (:id, :employeeId, :punchAt, :source, :sourceDevice, :importId, :rawPayload, :createdBy)
           ON DUPLICATE KEY UPDATE import_id = COALESCE(import_id, VALUES(import_id))`,
          {
            id: crypto.randomUUID(),
            employeeId: employee.id,
            punchAt: punch.punchAt,
            source,
            sourceDevice,
            importId,
            rawPayload: JSON.stringify({ fileName, raw: punch.raw }),
            createdBy: user.id,
          },
        );
        dates.push(punch.punchAt.slice(0, 10));
        imported++;
      } catch (error) {
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    }

    await connection.execute(
      `UPDATE attendance_imports
       SET row_count = :rowCount, status = :status, period_from = :periodFrom, period_to = :periodTo, notes = :notes
       WHERE id = :id`,
      {
        id: importId,
        rowCount: imported,
        status: imported ? "Completed" : "Failed",
        periodFrom: dates.length ? dates.sort()[0] : null,
        periodTo: dates.length ? dates.sort()[dates.length - 1] : null,
        notes: errors.length ? errors.slice(0, 10).join("\n") : body.notes || null,
      },
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const refreshed = await refreshDtrEntries({
    employeeId: employeeId || "",
    from: from || (dates.length ? dates.sort()[0] : ""),
    to: to || (dates.length ? dates.sort()[dates.length - 1] : ""),
    userId: user.id,
  });
  await logAudit(user.id, "attendance.import_file", { importId, imported, errors: errors.length }, req);
  return { importId, imported, errors, refreshed, dates };
}

async function handleImportDtrFile(req, res) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const fileName = String(body.fileName || "DTR import").trim();
  const fileBase64 = String(body.fileBase64 || "");
  const employeeId = String(body.employeeId || "").trim();
  const from = normalizeDate(body.from || body.startDate);
  const to = normalizeDate(body.to || body.endDate);
  if (!fileBase64) return json(res, 400, { error: "A DTR file is required" });

  let parsed;
  try {
    parsed = (await parseUploadedDtrFile(fileName, fileBase64)).filter((punch) =>
      dateInRange(String(punch.punchAt || "").slice(0, 10), from, to),
    );
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
  if (!parsed.length) return json(res, 400, { error: "No valid DTR punches found in the selected range" });

  const result = await importParsedPunches({
    user,
    req,
    body,
    fileName,
    parsed,
    employeeId,
    from,
    to,
    source: "Legacy",
    sourceDevice: String(body.origin || body.source || "File").slice(0, 120),
  });
  return json(res, result.imported ? 200 : 400, result);
}

async function handleImportSingleDtr(req, res) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const source = String(body.source || "file").toLowerCase();
  const employeeId = String(body.employeeId || body.employee_id || "").trim();
  const from = normalizeDate(body.from || body.startDate || body.start_date);
  const to = normalizeDate(body.to || body.endDate || body.end_date);
  if (!employeeId) return json(res, 400, { error: "Select an employee first" });
  if (!from || !to) return json(res, 400, { error: "Start date and end date are required" });
  const [[employee]] = await pool.execute(`SELECT id, employee_no, biometric_id FROM employees WHERE id = :employeeId LIMIT 1`, {
    employeeId,
  });
  if (!employee) return json(res, 404, { error: "Employee not found" });

  if (source === "biometric") {
    const biometricId = String(body.biometricId || body.biometric_id || "").trim();
    const [[device]] = await pool.execute(`SELECT * FROM biometric_devices WHERE id = :id LIMIT 1`, {
      id: biometricId,
    });
    if (!device) return json(res, 404, { error: "Biometric device not found" });
    if (!device.is_active) return json(res, 400, { error: "Selected biometric device is inactive" });
    // NOTE: Skipping TCP pre-check â€” ZK devices often ignore raw TCP socket probes
    // on port 4370 even when fully reachable via the ZK protocol. The Python script
    // handles connectivity and will throw a clear error if the device is truly offline.

    let parsed;
    try {
      const employeeKeys = new Set(
        [employee.employee_no, employee.biometric_id].map((value) => String(value || "").trim()).filter(Boolean),
      );
      parsed = (await fetchBiometricPunches(device, from, to)).filter((punch) =>
        employeeKeys.has(String(punch.employeeNo || "").trim()),
      );
    } catch (error) {
      return json(res, 500, { error: `Failed to fetch biometric data: ${error.message}` });
    }
    if (!parsed.length) {
      return json(res, 400, { error: "No biometric punches found for the selected employee and date range" });
    }

    const result = await importParsedPunches({
      user,
      req,
      body,
      fileName: `Biometric ${device.name || device.ip_address}`,
      parsed,
      employeeId,
      from,
      to,
      source: "Biometric",
      sourceDevice: String(device.name || device.ip_address || "Biometric").slice(0, 120),
    });
    return json(res, result.imported ? 200 : 400, {
      message: `Imported ${result.imported} biometric punch(es)`,
      importId: result.importId,
      records_imported: result.imported,
      imported: result.imported,
      errors: result.errors,
      refreshed: result.refreshed,
      source: "biometric",
      origin: device.ip_address,
      employee_id: employeeId,
      start_date: from,
      end_date: to,
    });
  }

  const fileName = String(body.fileName || "DTR import").trim();
  const fileBase64 = String(body.fileBase64 || "");
  if (!fileBase64) return json(res, 400, { error: "A DTR file is required" });
  let parsed;
  try {
    parsed = (await parseUploadedDtrFile(fileName, fileBase64)).filter((punch) =>
      dateInRange(String(punch.punchAt || "").slice(0, 10), from, to),
    );
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
  if (!parsed.length) return json(res, 400, { error: "No valid DTR punches found in the selected range" });

  const result = await importParsedPunches({
    user,
    req,
    body,
    fileName,
    parsed,
    employeeId,
    from,
    to,
    source: "Legacy",
    sourceDevice: "File",
  });
  return json(res, result.imported ? 200 : 400, {
    message: `Imported ${result.imported} DTR punch(es)`,
    importId: result.importId,
    records_imported: result.imported,
    imported: result.imported,
    errors: result.errors,
    refreshed: result.refreshed,
    source: "file",
    file_type: path.extname(fileName).replace(".", "").toLowerCase(),
    origin: "File",
    employee_id: employeeId,
    start_date: from,
    end_date: to,
  });
}

async function handleImportAllDtr(req, res) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const source = String(body.source || "file").toLowerCase();
  const from = normalizeDate(body.from || body.startDate || body.start_date);
  const to = normalizeDate(body.to || body.endDate || body.end_date);
  if (!from || !to) return json(res, 400, { error: "Start date and end date are required" });

  if (source === "biometric") {
    const biometricId = String(body.biometricId || body.biometric_id || "").trim();
    if (!biometricId) return json(res, 400, { error: "Select a biometric device first" });
    const [[device]] = await pool.execute(`SELECT * FROM biometric_devices WHERE id = :id LIMIT 1`, { id: biometricId });
    if (!device) return json(res, 404, { error: "Biometric device not found" });
    if (!device.is_active) return json(res, 400, { error: "Selected biometric device is inactive" });
    // NOTE: Skipping TCP pre-check â€” ZK devices often ignore raw TCP socket probes
    // on port 4370 even when fully reachable via the ZK protocol. The Python script
    // handles connectivity and will throw a clear error if the device is truly offline.

    let parsed;
    try {
      // Fetch ALL punches (no employee filter â€” mass import for all employees)
      parsed = (await fetchBiometricPunches(device, from, to)).filter((punch) =>
        dateInRange(String(punch.punchAt || "").slice(0, 10), from, to),
      );
    } catch (error) {
      return json(res, 500, { error: `Failed to fetch biometric data: ${error.message}` });
    }
    if (!parsed.length) {
      return json(res, 400, { error: "No biometric punches found for the selected date range" });
    }

    const result = await importParsedPunches({
      user,
      req,
      body,
      fileName: `Biometric ${device.name || device.ip_address}`,
      parsed,
      employeeId: "", // empty = all employees
      from,
      to,
      source: "Biometric",
      sourceDevice: String(device.name || device.ip_address || "Biometric").slice(0, 120),
    });
    return json(res, result.imported ? 200 : 400, {
      message: `Mass import: ${result.imported} biometric punch(es) imported and DTR refreshed`,
      importId: result.importId,
      imported: result.imported,
      errors: result.errors,
      refreshed: result.refreshed,
      source: "biometric",
      origin: device.ip_address,
      start_date: from,
      end_date: to,
    });
  }

  // File source
  const fileName = String(body.fileName || "DTR import").trim();
  const fileBase64 = String(body.fileBase64 || "");
  if (!fileBase64) return json(res, 400, { error: "A DTR file is required" });
  let parsed;
  try {
    parsed = (await parseUploadedDtrFile(fileName, fileBase64)).filter((punch) =>
      dateInRange(String(punch.punchAt || "").slice(0, 10), from, to),
    );
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
  if (!parsed.length) return json(res, 400, { error: "No valid DTR punches found in the selected range" });

  const result = await importParsedPunches({
    user,
    req,
    body,
    fileName,
    parsed,
    employeeId: "", // empty = all employees
    from,
    to,
    source: "Legacy",
    sourceDevice: "File",
  });
  return json(res, result.imported ? 200 : 400, {
    message: `Mass import: ${result.imported} DTR punch(es) imported and DTR refreshed`,
    importId: result.importId,
    imported: result.imported,
    errors: result.errors,
    refreshed: result.refreshed,
    source: "file",
    file_type: path.extname(fileName).replace(".", "").toLowerCase(),
    origin: "File",
    start_date: from,
    end_date: to,
  });
}

async function handleImportDtr(req, res) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (!rows.length) return json(res, 400, { error: "No DTR rows found to import" });

  const importId = crypto.randomUUID();
  const source = ["CSV", "Legacy"].includes(body.source) ? body.source : "CSV";
  let imported = 0;
  const errors = [];
  const dates = [];
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO attendance_imports (id, source, file_name, row_count, status, notes, imported_by)
       VALUES (:id, :source, :fileName, 0, 'Processing', :notes, :importedBy)`,
      {
        id: importId,
        source,
        fileName: String(body.fileName || "DTR import").slice(0, 255),
        notes: body.notes ? String(body.notes) : null,
        importedBy: user.id,
      },
    );

    for (const [index, row] of rows.entries()) {
      try {
        const employee = await resolveAttendanceEmployee(row);
        const workDate = normalizeDate(row.workDate || row.date);
        if (!workDate) throw new Error("Date is required");
        const entry = {
          employeeId: employee.id,
          workDate,
          amIn: normalizeTimeInput(row.amIn || row.am_in),
          amOut: normalizeTimeInput(row.amOut || row.am_out),
          pmIn: normalizeTimeInput(row.pmIn || row.pm_in),
          pmOut: normalizeTimeInput(row.pmOut || row.pm_out),
          remarks: row.remarks || "",
          source: "Imported",
          importId,
        };
        await insertAttendancePunches(connection, entry, source, importId, user.id, row);
        await upsertDtrEntry(connection, entry, user.id, true);
        dates.push(workDate);
        imported++;
      } catch (error) {
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    }

    await connection.execute(
      `UPDATE attendance_imports
       SET row_count = :rowCount,
           status = :status,
           period_from = :periodFrom,
           period_to = :periodTo,
           notes = :notes
       WHERE id = :id`,
      {
        id: importId,
        rowCount: imported,
        status: errors.length && !imported ? "Failed" : "Completed",
        periodFrom: dates.length ? dates.sort()[0] : null,
        periodTo: dates.length ? dates.sort()[dates.length - 1] : null,
        notes: errors.length ? errors.slice(0, 10).join("\n") : body.notes || null,
      },
    );

    await connection.commit();
    await logAudit(
      user.id,
      "attendance.import",
      { importId, imported, errors: errors.length },
      req,
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return json(res, imported ? 200 : 400, { importId, imported, errors });
}

async function handleRefreshDtr(req, res) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const employeeId = String(body.employeeId || "").trim();
  const from = normalizeDate(body.from);
  const to = normalizeDate(body.to);
  const result = await refreshDtrEntries({
    employeeId: employeeId || "",
    from,
    to,
    userId: user.id,
  });
  await logAudit(user.id, "attendance.refresh", { employeeId, from, to, ...result }, req);
  return json(res, 200, result);
}

async function handleBulkEmployeeSchedule(req, res, overrides = false) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const employeeIds = Array.isArray(body.employeeIds) ? body.employeeIds.map(String).filter(Boolean) : [];
  const schedule = body.schedule || {};
  if (!employeeIds.length) return json(res, 400, { error: "Select at least one employee" });
  const values = {
    amIn: normalizeTimeInput(schedule.amIn || schedule.am_in || "08:00"),
    amOut: normalizeTimeInput(schedule.amOut || schedule.am_out || "12:00"),
    pmIn: normalizeTimeInput(schedule.pmIn || schedule.pm_in || "13:00"),
    pmOut: normalizeTimeInput(schedule.pmOut || schedule.pm_out || "17:00"),
  };

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (!overrides) {
      for (const employeeId of employeeIds) {
        await connection.execute(
          `UPDATE employees
           SET schedule_am_in = :amIn, schedule_am_out = :amOut, schedule_pm_in = :pmIn, schedule_pm_out = :pmOut
           WHERE id = :employeeId`,
          { employeeId, ...values },
        );
      }
    } else {
      const startDate = normalizeDate(body.startDate || body.from);
      const endDate = normalizeDate(body.endDate || body.to);
      if (!startDate || !endDate) throw new Error("Start and end dates are required");
      const skipWeekends = body.skipWeekends !== false;
      const cursor = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);
      for (; cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        const day = cursor.getDay();
        if (skipWeekends && (day === 0 || day === 6)) continue;
        const workDate = cursor.toISOString().slice(0, 10);
        for (const employeeId of employeeIds) {
          await connection.execute(
            `INSERT INTO employee_schedule_overrides
             (employee_id, work_date, am_in, am_out, pm_in, pm_out, created_by)
             VALUES (:employeeId, :workDate, :amIn, :amOut, :pmIn, :pmOut, :createdBy)
             ON DUPLICATE KEY UPDATE
               am_in = VALUES(am_in), am_out = VALUES(am_out), pm_in = VALUES(pm_in), pm_out = VALUES(pm_out),
               created_by = VALUES(created_by)`,
            { employeeId, workDate, ...values, createdBy: user.id },
          );
        }
      }
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    return json(res, 400, { error: error.message });
  } finally {
    connection.release();
  }
  await logAudit(
    user.id,
    overrides ? "attendance.schedule_override_bulk" : "attendance.schedule_bulk",
    { employeeIds: employeeIds.length },
    req,
  );
  return json(res, 200, { ok: true, updated: employeeIds.length });
}

function monthPeriodBounds(period) {
  const from = normalizeDate(period.from || period.startDate || period.dateFrom);
  const to = normalizeDate(period.to || period.endDate || period.dateTo);
  if (from || to) {
    if (!from || !to) throw new Error("Start and end dates are required");
    if (from > to) throw new Error("Start date cannot be after end date");
    return { from, to };
  }
  const month = Number(period.month);
  const year = Number(period.year);
  const cut = String(period.cut || "full");
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    throw new Error("Month and year are required");
  }
  const last = new Date(year, month, 0).getDate();
  if (cut === "first") return { from: `${year}-${String(month).padStart(2, "0")}-01`, to: `${year}-${String(month).padStart(2, "0")}-15` };
  if (cut === "last") return { from: `${year}-${String(month).padStart(2, "0")}-16`, to: `${year}-${String(month).padStart(2, "0")}-${last}` };
  return { from: `${year}-${String(month).padStart(2, "0")}-01`, to: `${year}-${String(month).padStart(2, "0")}-${last}` };
}

function splitSameMonthDtrRange(period) {
  const from = normalizeDate(period.from || period.startDate || period.dateFrom);
  const to = normalizeDate(period.to || period.endDate || period.dateTo);
  if (!from || !to) return [period];
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  if (fromYear === toYear && fromMonth === toMonth && fromDay <= 15 && toDay > 15) {
    const monthPrefix = `${fromYear}-${String(fromMonth).padStart(2, "0")}`;
    return [
      { from, to: `${monthPrefix}-15` },
      { from: `${monthPrefix}-16`, to },
    ];
  }
  return [{ from, to }];
}

function normalizeDtrExportPeriods(periods) {
  if (periods.length !== 1) return periods;
  return splitSameMonthDtrRange(periods[0]);
}

function dtrExportPeriodsFromBody(body) {
  if (Array.isArray(body.periods) && body.periods.length) return normalizeDtrExportPeriods(body.periods);

  const firstFrom = body.firstStartDate || body.first_start_date || body.startDate || body.from;
  const firstTo = body.firstEndDate || body.first_end_date || body.endDate || body.to;
  if (firstFrom || firstTo) {
    const periods = [{ from: firstFrom, to: firstTo }];
    const secondFrom = body.secondStartDate || body.second_start_date;
    const secondTo = body.secondEndDate || body.second_end_date;
    if (secondFrom || secondTo) periods.push({ from: secondFrom, to: secondTo });
    return normalizeDtrExportPeriods(periods);
  }

  const periods = [
    {
      month: Number(body.firstMonth || body.month),
      year: Number(body.firstYear || body.year),
      cut: String(body.firstCut || body.cut || "full"),
    },
  ];
  if (body.secondMonth && Number(body.secondMonth) > 0) {
    periods.push({
      month: Number(body.secondMonth),
      year: Number(body.secondYear || body.firstYear || body.year),
      cut: String(body.secondCut || "full"),
    });
  }
  return periods;
}

async function runPython(args) {
  let lastError = null;
  for (const executable of PYTHON_CANDIDATES) {
    try {
      return await runPythonWith(executable, args);
    } catch (error) {
      lastError = error;
      if (error?.code !== "ENOENT") throw error;
    }
  }
  throw lastError || new Error("Python executable not found");
}

async function runPythonWith(executable, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd: process.cwd(), windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || stdout.trim() || `Python exited with code ${code}`));
    });
  });
}

function truncateTimestampToMinute(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})[ T]+(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return "";
  return `${match[1]} ${String(match[2]).padStart(2, "0")}:${match[3]}:00`;
}

async function fetchBiometricPunches(device, from, to) {
  const output = await runPythonWith(BIOMETRIC_PYTHON_EXE, [
    BIOMETRIC_FETCH_SCRIPT,
    device.ip_address,
    String(device.port || 4370),
    from || "",
    to || "",
  ]);
  const rows = JSON.parse(output || "[]");
  const seen = new Set();
  return rows
    .map((row) => ({
      employeeNo: String(row.user_id || row.employee_id || "").trim(),
      punchAt: truncateTimestampToMinute(row.timestamp || `${row.date || ""} ${row.time || ""}`),
      raw: row,
    }))
    .filter((row) => {
      if (!row.employeeNo || !row.punchAt) return false;
      const key = `${row.employeeNo}|${row.punchAt}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return dateInRange(row.punchAt.slice(0, 10), from, to);
    })
    .sort((a, b) => a.punchAt.localeCompare(b.punchAt));
}

async function prepareDtrExport(req, res) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return null;
  const body = await readBody(req);
  let employeeId = String(body.employeeId || "").trim();
  if (user.role === "Employee") employeeId = user.employeeId || "";
  if (!employeeId) {
    json(res, 400, { error: "Employee is required" });
    return null;
  }
  if (!canReadEmployeeAttendance(user, employeeId)) {
    json(res, 403, { error: "You can only export your own DTR" });
    return null;
  }

  const periods = dtrExportPeriodsFromBody(body);
  let bounds;
  let ranges;
  try {
    ranges = periods.map(monthPeriodBounds);
    bounds = {
      from: ranges.map((range) => range.from).sort()[0],
      to: ranges.map((range) => range.to).sort().at(-1),
    };
  } catch (error) {
    json(res, 400, { error: error.message });
    return null;
  }

  const [[employeeRowData]] = await pool.execute(
    `SELECT * FROM employees WHERE id = :employeeId LIMIT 1`,
    { employeeId },
  );
  if (!employeeRowData) {
    json(res, 404, { error: "Employee not found" });
    return null;
  }
  const employee = employeeRow(employeeRowData);
  const rows = await readAttendanceRows({ employeeId, from: bounds.from, to: bounds.to, limit: 1000 });
  const noter = {
    signatory: String(body.noterSignatory || body.noter_signatory || employee.dtrSignatory || employee.lastname || "").trim(),
    position: String(body.noterPosition || body.noter_position || "Immediate Supervisor").trim(),
  };
  const payload = {
    employee: {
      id: employee.id,
      name: [employee.firstname, employee.middlename, employee.lastname, employee.nameExt].filter(Boolean).join(" "),
      position: employee.position,
      department: employee.department,
      signatory: employee.dtrSignatory || [employee.firstname, employee.middlename, employee.lastname, employee.nameExt].filter(Boolean).join(" "),
      scheduleAmIn: employee.scheduleAmIn,
      scheduleAmOut: employee.scheduleAmOut,
      schedulePmIn: employee.schedulePmIn,
      schedulePmOut: employee.schedulePmOut,
    },
    noter,
    periods: periods.map((period, index) => ({
      ...ranges[index],
      month: period.month ? Number(period.month) : undefined,
      year: period.year ? Number(period.year) : undefined,
      cut: period.cut ? String(period.cut) : undefined,
    })),
    entries: rows,
  };

  return { user, employeeId, employee, rows, bounds, payload };
}

async function handleGenerateDtrExcel(req, res) {
  const exportData = await prepareDtrExport(req, res);
  if (!exportData) return;
  const { user, employeeId, employee, rows, bounds, payload } = exportData;

  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeName = `${employee.lastname || "employee"}-${employee.firstname || ""}`.replace(/[^A-Za-z0-9_-]+/g, "-");
  const fileName = `dtr-${safeName}-${stamp}.xlsx`;
  const inputPath = path.join(PREVIEW_DIR, `${fileName}.json`);
  const outputPath = path.join(PREVIEW_DIR, fileName);
  await fs.writeFile(inputPath, JSON.stringify(payload), "utf8");
  try {
    await runPython([DTR_EXCEL_SCRIPT, inputPath, outputPath, DTR_TEMPLATE_XLSX]);
  } catch (error) {
    return json(res, 500, { error: error.message });
  } finally {
    await fs.rm(inputPath, { force: true }).catch(() => {});
  }

  await pool.execute(
    `INSERT INTO dtr_export_jobs (id, scope, employee_id, period_from, period_to, file_name, row_count, created_by)
     VALUES (:id, 'Single', :employeeId, :from, :to, :fileName, :rowCount, :createdBy)`,
    {
      id: crypto.randomUUID(),
      employeeId,
      from: bounds.from,
      to: bounds.to,
      fileName,
      rowCount: rows.length,
      createdBy: user.id,
    },
  );
  return json(res, 200, {
    fileName,
    downloadUrl: `/api/attendance/dtr/excel/${encodeURIComponent(fileName)}`,
    rowCount: rows.length,
  });
}

async function handleDownloadDtrExcel(req, res, fileName) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return;
  const decoded = decodeURIComponent(fileName);
  if (!/^dtr-[A-Za-z0-9_.-]+\.xlsx$/.test(decoded)) {
    return json(res, 400, { error: "Invalid DTR Excel file name" });
  }
  const resolved = path.resolve(PREVIEW_DIR, decoded);
  if (!resolved.startsWith(path.resolve(PREVIEW_DIR))) {
    return json(res, 400, { error: "Invalid DTR Excel path" });
  }
  try {
    await fs.access(resolved);
  } catch {
    return json(res, 404, { error: "DTR Excel file not found" });
  }
  return sendFile(res, resolved, decoded);
}

async function handleGenerateDtrPdf(req, res) {
  const exportData = await prepareDtrExport(req, res);
  if (!exportData) return;
  const { user, employeeId, employee, rows, bounds, payload } = exportData;

  await cleanupPreviewFiles().catch(() => {});
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeName = `${employee.lastname || "employee"}-${employee.firstname || ""}`.replace(/[^A-Za-z0-9_-]+/g, "-");
  const fileName = `dtr-${safeName}-${stamp}.pdf`;
  const inputPath = path.join(PREVIEW_DIR, `${fileName}.json`);
  const outputPath = path.join(PREVIEW_DIR, fileName);

  await fs.writeFile(inputPath, JSON.stringify(payload), "utf8");
  try {
    await runPython([DTR_PDF_SCRIPT, inputPath, outputPath, TEMPLATE_DIR]);
  } catch (error) {
    return json(res, 500, { error: error.message });
  } finally {
    await fs.rm(inputPath, { force: true }).catch(() => {});
  }

  await pool.execute(
    `INSERT INTO dtr_export_jobs (id, scope, employee_id, period_from, period_to, file_name, row_count, created_by)
     VALUES (:id, 'Single', :employeeId, :from, :to, :fileName, :rowCount, :createdBy)`,
    {
      id: crypto.randomUUID(),
      employeeId,
      from: bounds.from,
      to: bounds.to,
      fileName,
      rowCount: rows.length,
      createdBy: user.id,
    },
  );

  return json(res, 200, {
    fileName,
    previewUrl: `/api/attendance/dtr/pdf/${encodeURIComponent(fileName)}`,
    rowCount: rows.length,
  });
}

async function handlePreviewDtrPdf(req, res, fileName) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return;
  const decoded = decodeURIComponent(fileName);
  if (!/^dtr-[A-Za-z0-9_.-]+\.pdf$/.test(decoded)) {
    return json(res, 400, { error: "Invalid DTR PDF file name" });
  }
  const resolved = path.resolve(PREVIEW_DIR, decoded);
  if (!resolved.startsWith(path.resolve(PREVIEW_DIR))) {
    return json(res, 400, { error: "Invalid DTR PDF path" });
  }
  try {
    await fs.access(resolved);
  } catch {
    return json(res, 404, { error: "DTR PDF file not found" });
  }
  return sendInlinePdfAndDelete(res, resolved, decoded);
}

async function handleCreateDtrEntry(req, res) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const employee = await resolveAttendanceEmployee(body);
  const workDate = normalizeDate(body.workDate || body.date);
  if (!workDate) return json(res, 400, { error: "Date is required" });

  const entry = {
    employeeId: employee.id,
    workDate,
    amIn: normalizeTimeInput(body.amIn || body.am_in),
    amOut: normalizeTimeInput(body.amOut || body.am_out),
    pmIn: normalizeTimeInput(body.pmIn || body.pm_in),
    pmOut: normalizeTimeInput(body.pmOut || body.pm_out),
    status: body.status,
    remarks: body.remarks || "",
    source: "Manual",
  };
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await upsertDtrEntry(connection, entry, user.id, false);
    await insertAttendancePunches(connection, entry, "Manual", null, user.id, body);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const [rows] = await readAttendanceRows({
    employeeId: employee.id,
    from: workDate,
    to: workDate,
    limit: 1,
  });
  await logAudit(user.id, "attendance.dtr.create", { employeeId: employee.id, workDate }, req);
  return json(res, 201, { entry: rows });
}

async function handleUpdateDtrEntry(req, res, id) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const [existingRows] = await pool.execute(`SELECT * FROM dtr_entries WHERE id = :id LIMIT 1`, {
    id,
  });
  if (!existingRows[0]) return json(res, 404, { error: "DTR entry not found" });
  if (existingRows[0].locked)
    return json(res, 409, { error: "Locked DTR entries cannot be edited" });

  const existing = existingRows[0];
  const entry = {
    employeeId: existing.employee_id,
    workDate: normalizeDate(body.workDate || body.date || existing.work_date),
    amIn: normalizeTimeInput(body.amIn ?? body.am_in ?? existing.am_in),
    amOut: normalizeTimeInput(body.amOut ?? body.am_out ?? existing.am_out),
    pmIn: normalizeTimeInput(body.pmIn ?? body.pm_in ?? existing.pm_in),
    pmOut: normalizeTimeInput(body.pmOut ?? body.pm_out ?? existing.pm_out),
  };
  const stats = calculateAttendanceStats(entry);
  await pool.execute(
    `UPDATE dtr_entries
     SET work_date = :workDate, am_in = :amIn, am_out = :amOut, pm_in = :pmIn, pm_out = :pmOut,
         status = :status, late_minutes = :lateMinutes, undertime_minutes = :undertimeMinutes,
         source = 'Adjusted', remarks = :remarks, edited_by = :editedBy, edited_at = NOW()
     WHERE id = :id`,
    {
      id,
      ...entry,
      status: body.status || stats.status,
      lateMinutes: stats.lateMinutes,
      undertimeMinutes: stats.undertimeMinutes,
      remarks: body.remarks || "",
      editedBy: user.id,
    },
  );
  await logAudit(user.id, "attendance.dtr.update", { id }, req);
  const [rows] = await readAttendanceRows({
    employeeId: existing.employee_id,
    from: entry.workDate,
    to: entry.workDate,
    limit: 1,
  });
  return json(res, 200, { entry: rows });
}

async function handleDeleteDtrEntry(req, res, id) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const [existingRows] = await pool.execute(`SELECT * FROM dtr_entries WHERE id = :id LIMIT 1`, {
    id,
  });
  if (!existingRows[0]) return json(res, 404, { error: "DTR entry not found" });
  if (existingRows[0].locked)
    return json(res, 409, { error: "Locked DTR entries cannot be deleted" });
  await pool.execute(`DELETE FROM dtr_entries WHERE id = :id`, { id });
  await logAudit(user.id, "attendance.dtr.delete", { id }, req);
  return json(res, 200, { ok: true });
}

async function handleExportDtr(req, res, url, mass = false) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return;
  const { from, to } = defaultAttendanceRange(url);
  let employeeId = String(url.searchParams.get("employeeId") || "").trim();

  if (user.role === "Employee") {
    if (!user.employeeId)
      return json(res, 400, { error: "No employee record linked to this user" });
    employeeId = user.employeeId;
  }
  if (mass && user.role === "Employee")
    return json(res, 403, { error: "Mass export requires HR access" });
  if (employeeId && !canReadEmployeeAttendance(user, employeeId)) {
    return json(res, 403, { error: "You can only export your own DTR" });
  }

  const rows = await readAttendanceRows({
    employeeId: mass ? "" : employeeId,
    from,
    to,
    limit: 2000,
  });
  const fileName = `${mass ? "mass-dtr" : "dtr"}-${from}-to-${to}.csv`;
  await pool.execute(
    `INSERT INTO dtr_export_jobs (id, scope, employee_id, period_from, period_to, file_name, row_count, created_by)
     VALUES (:id, :scope, :employeeId, :from, :to, :fileName, :rowCount, :createdBy)`,
    {
      id: crypto.randomUUID(),
      scope: mass ? "Mass" : "Single",
      employeeId: mass ? null : employeeId || null,
      from,
      to,
      fileName,
      rowCount: rows.length,
      createdBy: user.id,
    },
  );
  return sendCsv(res, fileName, dtrRowsToCsv(rows));
}

async function handleListEmployeeAccountCandidates(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const [rows] = await pool.query(
    `SELECT e.*
     FROM employees e
     LEFT JOIN users u ON u.employee_id = e.id
     WHERE u.id IS NULL
     ORDER BY e.lastname ASC, e.firstname ASC, e.employee_no ASC
     LIMIT 500`,
  );

  return json(res, 200, { employees: rows.map(employeeRow) });
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
        email, cellphone_no, photo_url, schedule_am_in, schedule_am_out, schedule_pm_in, schedule_pm_out,
        dtr_signatory, dtr_noter_id, is_dtr_noter, regular, profile_json
      ) VALUES (
        :id, :employeeNo, :firstname, :middlename, :lastname, :nameExt, :department, :position, :status, :level,
        :statusClass, :dateHired, :dateEmployed, :itemNo, :empStatus, :birthday, :gender, :civilStatus,
        :email, :cellphoneNo, :photoUrl, :scheduleAmIn, :scheduleAmOut, :schedulePmIn, :schedulePmOut,
        :dtrSignatory, :dtrNoterId, :isDtrNoter, :regular, :profileJson
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
  const user = await requireUser(req, res);
  if (!user) return;
  if (!["Admin", "HR", "Viewer"].includes(user.role) && user.employeeId !== id) {
    return json(res, 403, { error: "You can only view your own employee record" });
  }

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
        schedule_am_in = :scheduleAmIn,
        schedule_am_out = :scheduleAmOut,
        schedule_pm_in = :schedulePmIn,
        schedule_pm_out = :schedulePmOut,
        dtr_signatory = :dtrSignatory,
        dtr_noter_id = :dtrNoterId,
        is_dtr_noter = :isDtrNoter,
        regular = :regular,
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

async function handleListLeaveTypes(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const [rows] = await pool.query(`SELECT * FROM leave_types ORDER BY sort_order ASC, name ASC`);
  return json(res, 200, { leaveTypes: rows.map(leaveTypeRow) });
}

async function handleCreateLeaveType(req, res) {
  const user = await requireLeaveWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const code = String(body.code || "")
    .trim()
    .toUpperCase();
  const name = String(body.name || "").trim();
  const isPaid = body.isPaid === false ? 0 : 1;
  const isCreditBased = body.isCreditBased === false ? 0 : 1;
  const creditGroup = String(body.creditGroup || "").trim() || null;
  const maxDays =
    body.maxDays === null || body.maxDays === undefined || body.maxDays === ""
      ? null
      : Number(body.maxDays);
  const advanceNoticeDays =
    body.advanceNoticeDays === null ||
    body.advanceNoticeDays === undefined ||
    body.advanceNoticeDays === ""
      ? null
      : Number(body.advanceNoticeDays);
  const legalBasis = String(body.legalBasis || "").trim();
  const filingRule = String(body.filingRule || "").trim();
  const requirements = Array.isArray(body.requirements) ? body.requirements : [];
  const detailSchema = Array.isArray(body.detailSchema) ? body.detailSchema : [];
  if (!code || !name) return json(res, 400, { error: "Code and name are required" });
  try {
    const [result] = await pool.execute(
      `INSERT INTO leave_types (
         code, name, is_paid, is_credit_based, credit_group, max_days, advance_notice_days,
         legal_basis, filing_rule, requirements_json, detail_schema_json, sort_order
       )
       VALUES (
         :code, :name, :isPaid, :isCreditBased, :creditGroup, :maxDays, :advanceNoticeDays,
         :legalBasis, :filingRule, :requirementsJson, :detailSchemaJson, :sortOrder
       )`,
      {
        code,
        name,
        isPaid,
        isCreditBased,
        creditGroup,
        maxDays,
        advanceNoticeDays,
        legalBasis,
        filingRule,
        requirementsJson: JSON.stringify(requirements),
        detailSchemaJson: JSON.stringify(detailSchema),
        sortOrder: Number(body.sortOrder || 0),
      },
    );
    await logAudit(user.id, "leave.type_create", { code, name }, req);
    return json(res, 201, {
      leaveType: {
        id: result.insertId,
        code,
        name,
        isPaid: Boolean(isPaid),
        isCreditBased: Boolean(isCreditBased),
        creditGroup: creditGroup || "",
        maxDays,
        advanceNoticeDays,
        legalBasis,
        filingRule,
        requirements,
        detailSchema,
        isActive: true,
        sortOrder: Number(body.sortOrder || 0),
      },
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY")
      return json(res, 409, { error: "Leave type already exists" });
    throw error;
  }
}

async function handleDeleteLeaveType(req, res, id) {
  const user = await requireLeaveWrite(req, res);
  if (!user) return;
  await pool.execute(`UPDATE leave_types SET is_active = 0 WHERE id = :id`, { id });
  await logAudit(user.id, "leave.type_deactivate", { id }, req);
  return json(res, 200, { ok: true });
}

async function handleEmployeeLeave(req, res, employeeId) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!["Admin", "HR", "Viewer"].includes(user.role) && user.employeeId !== employeeId) {
    return json(res, 403, { error: "Leave Management access required" });
  }
  const employee = await readEmployeeById(employeeId);
  if (!employee) return json(res, 404, { error: "Employee not found" });

  const [types] = await pool.query(`SELECT id FROM leave_types WHERE is_active = 1`);
  for (const type of types) {
    await ensureLeaveBalance(employeeId, type.id);
  }

  const [balanceRows] = await pool.execute(
    `SELECT lb.*, lt.code, lt.name
     FROM leave_balances lb
     INNER JOIN leave_types lt ON lt.id = lb.leave_type_id
     WHERE lb.employee_id = :employeeId AND lt.is_active = 1
     ORDER BY lt.sort_order ASC, lt.name ASC`,
    { employeeId },
  );
  const [applicationRows] = await pool.execute(
    `SELECT la.*, lt.code AS leave_code, lt.name AS leave_name,
            e.employee_no, e.firstname, e.lastname, e.department, e.position,
            u.name AS approver_name,
            ru.name AS recommended_by_name
     FROM leave_applications la
     INNER JOIN leave_types lt ON lt.id = la.leave_type_id
     INNER JOIN employees e ON e.id = la.employee_id
     LEFT JOIN users u ON u.id = la.approver_id
     LEFT JOIN users ru ON ru.id = la.recommended_by
     WHERE la.employee_id = :employeeId
     ORDER BY la.date_from DESC, la.created_at DESC`,
    { employeeId },
  );
  const [adjustmentRows] = await pool.execute(
    `SELECT adj.id, adj.amount, adj.reason, adj.created_at, lt.code, lt.name, u.name AS created_by_name
     FROM leave_adjustments adj
     INNER JOIN leave_types lt ON lt.id = adj.leave_type_id
     LEFT JOIN users u ON u.id = adj.created_by
     WHERE adj.employee_id = :employeeId
     ORDER BY adj.created_at DESC
     LIMIT 100`,
    { employeeId },
  );

  return json(res, 200, {
    employee,
    balances: balanceRows.map(leaveBalanceRow),
    applications: applicationRows.map(leaveApplicationRow),
    adjustments: adjustmentRows.map((row) => ({
      id: row.id,
      amount: Number(row.amount || 0),
      reason: row.reason || "",
      createdAt: row.created_at,
      code: row.code,
      name: row.name,
      createdByName: row.created_by_name || "",
    })),
  });
}

async function handleCreateLeaveAdjustment(req, res, employeeId) {
  const user = await requireLeaveWrite(req, res);
  if (!user) return;
  const employee = await readEmployeeById(employeeId);
  if (!employee) return json(res, 404, { error: "Employee not found" });
  const body = await readBody(req);
  const leaveTypeId = Number(body.leaveTypeId);
  const amount = Number(body.amount);
  const reason = String(body.reason || "").trim();
  if (!Number.isInteger(leaveTypeId) || !Number.isFinite(amount) || amount === 0) {
    return json(res, 400, { error: "Leave type and non-zero amount are required" });
  }
  const id = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO leave_adjustments (id, employee_id, leave_type_id, amount, reason, created_by)
     VALUES (:id, :employeeId, :leaveTypeId, :amount, :reason, :createdBy)`,
    { id, employeeId, leaveTypeId, amount, reason, createdBy: user.id },
  );
  await changeLeaveBalance(employeeId, leaveTypeId, amount, "adjusted");
  await logAudit(user.id, "leave.adjustment_create", { employeeId, leaveTypeId, amount }, req);
  return handleEmployeeLeave(req, res, employeeId);
}

function normalizeOptionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeChoice(value, allowed) {
  const text = String(value || "").trim();
  return allowed.includes(text) ? text : "";
}

async function handleListLeaveApplications(req, res, url) {
  const user = await requireLeaveRead(req, res);
  if (!user) return;
  const status = String(url.searchParams.get("status") || "").trim();
  const q = String(url.searchParams.get("q") || "").trim();
  const where = [];
  const params = {};
  if (status && status !== "all") {
    where.push(`la.status = :status`);
    params.status = status;
  }
  if (q) {
    where.push(
      `(e.employee_no LIKE :q OR e.firstname LIKE :q OR e.lastname LIKE :q OR e.department LIKE :q)`,
    );
    params.q = `%${q}%`;
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [rows] = await pool.execute(
    `SELECT la.*, lt.code AS leave_code, lt.name AS leave_name,
            e.employee_no, e.firstname, e.lastname, e.department, e.position,
            u.name AS approver_name,
            ru.name AS recommended_by_name
     FROM leave_applications la
     INNER JOIN leave_types lt ON lt.id = la.leave_type_id
     INNER JOIN employees e ON e.id = la.employee_id
     LEFT JOIN users u ON u.id = la.approver_id
     LEFT JOIN users ru ON ru.id = la.recommended_by
     ${whereSql}
     ORDER BY FIELD(la.status, 'Pending', 'Approved', 'Disapproved', 'Cancelled'), la.created_at DESC
     LIMIT 300`,
    params,
  );
  const [[summary]] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'Pending') AS pending,
      SUM(status = 'Approved') AS approved,
      SUM(status = 'Disapproved') AS disapproved,
      SUM(status = 'Cancelled') AS cancelled
    FROM leave_applications
  `);
  return json(res, 200, {
    applications: rows.map(leaveApplicationRow),
    summary: {
      total: Number(summary.total || 0),
      pending: Number(summary.pending || 0),
      approved: Number(summary.approved || 0),
      disapproved: Number(summary.disapproved || 0),
      cancelled: Number(summary.cancelled || 0),
    },
  });
}

async function handleCreateLeaveApplication(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const body = await readBody(req);
  const employeeId = String(body.employeeId || "").trim();
  const leaveTypeId = Number(body.leaveTypeId);
  const dateFrom = String(body.dateFrom || "").trim();
  const dateTo = String(body.dateTo || "").trim();
  const daysRequested = Number(body.daysRequested);
  const reason = String(body.reason || "").trim();
  const salarySnapshot = normalizeOptionalNumber(body.salarySnapshot);
  const detailLocationType = normalizeChoice(body.detailLocationType, [
    "Philippines",
    "Abroad",
    "NotApplicable",
  ]);
  const detailLocationText = String(body.detailLocationText || "").trim();
  const detailSickType = normalizeChoice(body.detailSickType, [
    "Hospital",
    "OutPatient",
    "NotApplicable",
  ]);
  const detailIllness = String(body.detailIllness || "").trim();
  const detailStudyPurpose = normalizeChoice(body.detailStudyPurpose, [
    "MastersDegree",
    "BarBoardReview",
    "NotApplicable",
  ]);
  const detailOtherPurpose = normalizeChoice(body.detailOtherPurpose, [
    "Monetization",
    "TerminalLeave",
    "Other",
    "NotApplicable",
  ]);
  const detailOtherText = String(body.detailOtherText || "").trim();
  const commutationRequested = body.commutationRequested ? 1 : 0;
  const requirementsPayload =
    body.requirementsPayload && typeof body.requirementsPayload === "object"
      ? body.requirementsPayload
      : {};
  const formPayload = body.formPayload && typeof body.formPayload === "object" ? body.formPayload : {};
  if (
    !employeeId ||
    !Number.isInteger(leaveTypeId) ||
    !dateFrom ||
    !dateTo ||
    !Number.isFinite(daysRequested) ||
    daysRequested <= 0
  ) {
    return json(res, 400, {
      error: "Employee, leave type, dates, and days requested are required",
    });
  }
  if (!["Admin", "HR"].includes(user.role) && user.employeeId !== employeeId) {
    return json(res, 403, { error: "You can only file leave for your own employee record" });
  }
  const employee = await readEmployeeById(employeeId);
  if (!employee) return json(res, 404, { error: "Employee not found" });
  const [[leaveType]] = await pool.execute(`SELECT * FROM leave_types WHERE id = :leaveTypeId`, {
    leaveTypeId,
  });
  if (!leaveType) return json(res, 404, { error: "Leave type not found" });

  const leaveCode = String(leaveType.code || "");
  const requiresLocation = ["VL", "SPL"].includes(leaveCode);
  if (requiresLocation && !["Philippines", "Abroad"].includes(detailLocationType)) {
    return json(res, 400, { error: "Please indicate whether the leave is local or abroad" });
  }
  if (detailLocationType === "Abroad" && !detailLocationText) {
    return json(res, 400, { error: "Please specify the abroad location" });
  }
  if (leaveCode === "SL" && !["Hospital", "OutPatient"].includes(detailSickType)) {
    return json(res, 400, { error: "Please indicate whether sick leave is in hospital or outpatient" });
  }
  if ((leaveCode === "SL" || leaveCode === "SLBW") && !detailIllness) {
    return json(res, 400, { error: "Please specify the illness or medical detail" });
  }
  if (leaveCode === "STUDY" && !["MastersDegree", "BarBoardReview"].includes(detailStudyPurpose)) {
    return json(res, 400, { error: "Please select the study leave purpose" });
  }
  if (["MONETIZATION", "TERMINAL", "OTHERS"].includes(leaveCode)) {
    const validOtherPurpose = ["Monetization", "TerminalLeave", "Other"].includes(detailOtherPurpose);
    if (!validOtherPurpose || (detailOtherPurpose === "Other" && !detailOtherText)) {
      return json(res, 400, { error: "Please specify the other leave purpose" });
    }
  }
  if (leaveType.max_days !== null && Number(leaveType.max_days) > 0 && daysRequested > Number(leaveType.max_days)) {
    return json(res, 400, {
      error: `${leaveType.name} can be filed for up to ${Number(leaveType.max_days)} days`,
    });
  }

  const id = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO leave_applications (
       id, employee_id, leave_type_id, date_from, date_to, days_requested, reason,
       salary_snapshot, detail_location_type, detail_location_text, detail_sick_type,
       detail_illness, detail_study_purpose, detail_other_purpose, detail_other_text,
       commutation_requested, requirements_payload, form_payload, created_by
     )
     VALUES (
       :id, :employeeId, :leaveTypeId, :dateFrom, :dateTo, :daysRequested, :reason,
       :salarySnapshot, :detailLocationType, :detailLocationText, :detailSickType,
       :detailIllness, :detailStudyPurpose, :detailOtherPurpose, :detailOtherText,
       :commutationRequested, :requirementsPayload, :formPayload, :createdBy
     )`,
    {
      id,
      employeeId,
      leaveTypeId,
      dateFrom,
      dateTo,
      daysRequested,
      reason,
      salarySnapshot,
      detailLocationType: detailLocationType || null,
      detailLocationText,
      detailSickType: detailSickType || null,
      detailIllness,
      detailStudyPurpose: detailStudyPurpose || null,
      detailOtherPurpose: detailOtherPurpose || null,
      detailOtherText,
      commutationRequested,
      requirementsPayload: JSON.stringify(requirementsPayload),
      formPayload: JSON.stringify(formPayload),
      createdBy: user.id,
    },
  );
  await ensureLeaveBalance(employeeId, leaveTypeId);
  await logAudit(user.id, "leave.application_create", { id, employeeId, leaveTypeId }, req);
  return json(res, 201, { application: await readLeaveApplication(id) });
}

async function handleDecideLeaveApplication(req, res, id) {
  const user = await requireLeaveWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const status = String(body.status || "").trim();
  const remarks = String(body.remarks || "").trim();
  const approvedDaysWithPay = normalizeOptionalNumber(body.approvedDaysWithPay);
  const approvedDaysWithoutPay = normalizeOptionalNumber(body.approvedDaysWithoutPay);
  const approvedDaysOther = normalizeOptionalNumber(body.approvedDaysOther);
  const approvedDaysOtherText = String(body.approvedDaysOtherText || "").trim();
  const finalDisapprovalReason = String(body.finalDisapprovalReason || "").trim();
  if (!["Approved", "Disapproved", "Cancelled"].includes(status)) {
    return json(res, 400, { error: "Decision must be Approved, Disapproved, or Cancelled" });
  }
  const [[existing]] = await pool.execute(`SELECT * FROM leave_applications WHERE id = :id`, {
    id,
  });
  if (!existing) return json(res, 404, { error: "Leave application not found" });
  if (existing.status === "Approved" && status !== "Approved") {
    await changeLeaveBalance(
      existing.employee_id,
      existing.leave_type_id,
      -Number(existing.days_requested),
      "used",
      Number(existing.days_requested),
    );
  }
  if (existing.status !== "Approved" && status === "Approved") {
    await changeLeaveBalance(
      existing.employee_id,
      existing.leave_type_id,
      Number(existing.days_requested),
      "used",
      -Number(existing.days_requested),
    );
  }
  await pool.execute(
    `UPDATE leave_applications
     SET status = :status,
         approver_id = :approverId,
         decision_remarks = :remarks,
         approved_days_with_pay = :approvedDaysWithPay,
         approved_days_without_pay = :approvedDaysWithoutPay,
         approved_days_other = :approvedDaysOther,
         approved_days_other_text = :approvedDaysOtherText,
         final_disapproval_reason = :finalDisapprovalReason,
         decided_at = NOW()
     WHERE id = :id`,
    {
      id,
      status,
      approverId: user.id,
      remarks,
      approvedDaysWithPay,
      approvedDaysWithoutPay,
      approvedDaysOther,
      approvedDaysOtherText,
      finalDisapprovalReason,
    },
  );
  await logAudit(user.id, "leave.application_decide", { id, status }, req);
  return json(res, 200, { application: await readLeaveApplication(id) });
}

async function handleDeleteLeaveApplication(req, res, id) {
  const user = await requireLeaveWrite(req, res);
  if (!user) return;
  const [[existing]] = await pool.execute(`SELECT * FROM leave_applications WHERE id = :id`, {
    id,
  });
  if (!existing) return json(res, 404, { error: "Leave application not found" });
  if (existing.status === "Approved") {
    await changeLeaveBalance(
      existing.employee_id,
      existing.leave_type_id,
      -Number(existing.days_requested),
      "used",
      Number(existing.days_requested),
    );
  }
  await pool.execute(`DELETE FROM leave_applications WHERE id = :id`, { id });
  await logAudit(user.id, "leave.application_delete", { id }, req);
  return json(res, 200, { ok: true });
}

async function handleGenerateLeaveForm6Excel(req, res, id) {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const { fileName } = await generateLeaveForm6ExcelFile(id, user, req);
    return json(res, 200, {
      fileName,
      downloadUrl: `/api/leave/forms/form6/excel/${encodeURIComponent(fileName)}`,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return json(res, status, { error: error.message });
  }
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function buildLeaveForm6Payload(id, user) {
  const application = await readLeaveApplication(id);
  if (!application) throw httpError(404, "Leave application not found");
  if (!["Admin", "HR", "Viewer"].includes(user.role) && user.employeeId !== application.employeeId) {
    throw httpError(403, "You can only export your own leave application");
  }
  try {
    await fs.access(LEAVE_FORM6_TEMPLATE_XLSX);
  } catch {
    throw httpError(500, "CS Form No. 6 Excel template was not found");
  }

  const employee = await readEmployeeById(application.employeeId);
  const [[agency]] = await pool.query(
    `SELECT name, tagline FROM agency_settings WHERE id = 1 LIMIT 1`,
  );
  const [balanceRows] = await pool.execute(
    `SELECT lt.code, lb.balance, lb.earned, lb.used, lb.adjusted
     FROM leave_balances lb
     INNER JOIN leave_types lt ON lt.id = lb.leave_type_id
     WHERE lb.employee_id = :employeeId AND lt.code IN ('VL', 'SL')`,
    { employeeId: application.employeeId },
  );
  const balances = {};
  for (const row of balanceRows) {
    const currentBalance = Number(row.balance || 0);
    const less =
      (application.status !== "Approved" && application.leaveCode === row.code) ||
      (application.status !== "Approved" && application.leaveCode === "FL" && row.code === "VL")
        ? application.daysRequested
        : 0;
    balances[row.code] = {
      earned: Number(row.earned || 0) + Number(row.adjusted || 0),
      less,
      balance: currentBalance - less,
    };
  }

  return {
    agency: agency || {},
    employee: employee || {},
    application,
    balances,
    asOfDate: new Date().toLocaleDateString("en-CA"),
  };
}

async function generateLeaveForm6ExcelFile(id, user, req) {
  const payload = await buildLeaveForm6Payload(id, user);
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeName = `${payload.application.employeeName || "employee"}`.replace(
    /[^A-Za-z0-9_-]+/g,
    "-",
  );
  const fileName = `leave-form6-${safeName}-${stamp}.xlsx`;
  const inputPath = path.join(PREVIEW_DIR, `${fileName}.json`);
  const outputPath = path.join(PREVIEW_DIR, fileName);

  await fs.writeFile(inputPath, JSON.stringify(payload), "utf8");
  try {
    await runPython([LEAVE_FORM6_EXCEL_SCRIPT, inputPath, outputPath, LEAVE_FORM6_TEMPLATE_XLSX]);
  } finally {
    await fs.rm(inputPath, { force: true }).catch(() => {});
  }

  await logAudit(user.id, "leave.form6_excel_generate", { id, fileName }, req);
  return { fileName, outputPath, payload };
}

async function convertSpreadsheetToPdf(inputPath) {
  await fs.access(LIBREOFFICE_EXE);
  await fs.mkdir(LIBREOFFICE_PROFILE_DIR, { recursive: true });
  const profileUri = `file:///${LIBREOFFICE_PROFILE_DIR.replace(/\\/g, "/")}`;
  await runProcess(LIBREOFFICE_EXE, [
    "--headless",
    "--nologo",
    "--nofirststartwizard",
    "--norestore",
    `-env:UserInstallation=${profileUri}`,
    "--convert-to",
    "pdf",
    "--outdir",
    PREVIEW_DIR,
    inputPath,
  ]);
  const pdfPath = inputPath.replace(/\.xlsx$/i, ".pdf");
  await fs.access(pdfPath);
  return pdfPath;
}

async function runProcess(executable, args, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd: process.cwd(), windowsHide: true });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      child.kill();
      reject(new Error("External process timed out"));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || stdout.trim() || `Process exited with code ${code}`));
    });
  });
}

async function handleGenerateLeaveForm6Pdf(req, res, id) {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const { fileName, outputPath } = await generateLeaveForm6ExcelFile(id, user, req);
    const pdfPath = await convertSpreadsheetToPdf(outputPath);
    const pdfFileName = fileName.replace(/\.xlsx$/i, ".pdf");
    await logAudit(user.id, "leave.form6_pdf_generate", { id, fileName: pdfFileName }, req);
    return json(res, 200, {
      fileName: pdfFileName,
      previewUrl: `/api/leave/forms/form6/pdf/${encodeURIComponent(pdfFileName)}`,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return json(res, status, { error: error.message });
  }
}

async function handleDownloadLeaveForm6Excel(req, res, fileName) {
  const user = await requireUser(req, res);
  if (!user) return;
  const decoded = decodeURIComponent(fileName);
  if (!/^leave-form6-[A-Za-z0-9_.-]+\.xlsx$/.test(decoded)) {
    return json(res, 400, { error: "Invalid leave form file name" });
  }
  const resolved = path.resolve(PREVIEW_DIR, decoded);
  if (!resolved.startsWith(path.resolve(PREVIEW_DIR))) {
    return json(res, 400, { error: "Invalid leave form path" });
  }
  try {
    await fs.access(resolved);
  } catch {
    return json(res, 404, { error: "Leave form file not found" });
  }
  await logAudit(user.id, "leave.form6_excel_download", { fileName: decoded }, req);
  return sendFile(res, resolved, decoded);
}

async function handlePreviewLeaveForm6Pdf(req, res, fileName) {
  const user = await requireUser(req, res);
  if (!user) return;
  const decoded = decodeURIComponent(fileName);
  if (!/^leave-form6-[A-Za-z0-9_.-]+\.pdf$/.test(decoded)) {
    return json(res, 400, { error: "Invalid leave form PDF file name" });
  }
  const resolved = path.resolve(PREVIEW_DIR, decoded);
  if (!resolved.startsWith(path.resolve(PREVIEW_DIR))) {
    return json(res, 400, { error: "Invalid leave form PDF path" });
  }
  try {
    await fs.access(resolved);
  } catch {
    return json(res, 404, { error: "Leave form PDF not found" });
  }
  await logAudit(user.id, "leave.form6_pdf_preview", { fileName: decoded }, req);
  return sendInlinePdfAndDelete(res, resolved, decoded);
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
    "leave_types",
    "leave_balances",
    "leave_applications",
    "leave_adjustments",
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
  const employeeLeaveMatch = url.pathname.match(/^\/api\/employees\/([A-Za-z0-9-]+)\/leave$/);
  const employeeLeaveAdjustmentMatch = url.pathname.match(
    /^\/api\/employees\/([A-Za-z0-9-]+)\/leave\/adjustments$/,
  );
  const leaveTypeMatch = url.pathname.match(/^\/api\/leave\/types\/(\d+)$/);
  const leaveApplicationMatch = url.pathname.match(/^\/api\/leave\/applications\/([A-Za-z0-9-]+)$/);
  const leaveDecisionMatch = url.pathname.match(
    /^\/api\/leave\/applications\/([A-Za-z0-9-]+)\/decision$/,
  );
  const leaveForm6ExcelGenerateMatch = url.pathname.match(
    /^\/api\/leave\/applications\/([A-Za-z0-9-]+)\/form6\/excel$/,
  );
  const leaveForm6ExcelDownloadMatch = url.pathname.match(
    /^\/api\/leave\/forms\/form6\/excel\/([^/]+)$/,
  );
  const leaveForm6PdfGenerateMatch = url.pathname.match(
    /^\/api\/leave\/applications\/([A-Za-z0-9-]+)\/form6\/pdf$/,
  );
  const leaveForm6PdfPreviewMatch = url.pathname.match(
    /^\/api\/leave\/forms\/form6\/pdf\/([^/]+)$/,
  );
  const dtrEntryMatch = url.pathname.match(/^\/api\/attendance\/dtr\/([A-Za-z0-9-]+)$/);
  const dtrExcelMatch = url.pathname.match(/^\/api\/attendance\/dtr\/excel\/([^/]+)$/);
  const dtrPdfMatch = url.pathname.match(/^\/api\/attendance\/dtr\/pdf\/([^/]+)$/);
  const dtrNoterMatch = url.pathname.match(/^\/api\/attendance\/noters\/(\d+)$/);
  const biometricDeviceMatch = url.pathname.match(/^\/api\/attendance\/biometrics\/(\d+)$/);
  const unimportedDtrMatch = url.pathname.match(/^\/api\/attendance\/check-unimported-dtrs\/([A-Za-z0-9-]+)$/);
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

  if (req.method === "GET" && url.pathname === "/api/admin/employee-account-candidates")
    return handleListEmployeeAccountCandidates(req, res);
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
  if (req.method === "GET" && employeeLeaveMatch)
    return handleEmployeeLeave(req, res, employeeLeaveMatch[1]);
  if (req.method === "POST" && employeeLeaveAdjustmentMatch)
    return handleCreateLeaveAdjustment(req, res, employeeLeaveAdjustmentMatch[1]);

  if (req.method === "GET" && url.pathname === "/api/leave/types")
    return handleListLeaveTypes(req, res);
  if (req.method === "POST" && url.pathname === "/api/leave/types")
    return handleCreateLeaveType(req, res);
  if (req.method === "DELETE" && leaveTypeMatch)
    return handleDeleteLeaveType(req, res, leaveTypeMatch[1]);
  if (req.method === "GET" && url.pathname === "/api/leave/applications")
    return handleListLeaveApplications(req, res, url);
  if (req.method === "POST" && url.pathname === "/api/leave/applications")
    return handleCreateLeaveApplication(req, res);
  if (req.method === "POST" && leaveDecisionMatch)
    return handleDecideLeaveApplication(req, res, leaveDecisionMatch[1]);
  if (req.method === "POST" && leaveForm6ExcelGenerateMatch)
    return handleGenerateLeaveForm6Excel(req, res, leaveForm6ExcelGenerateMatch[1]);
  if (req.method === "GET" && leaveForm6ExcelDownloadMatch)
    return handleDownloadLeaveForm6Excel(req, res, leaveForm6ExcelDownloadMatch[1]);
  if (req.method === "POST" && leaveForm6PdfGenerateMatch)
    return handleGenerateLeaveForm6Pdf(req, res, leaveForm6PdfGenerateMatch[1]);
  if (req.method === "GET" && leaveForm6PdfPreviewMatch)
    return handlePreviewLeaveForm6Pdf(req, res, leaveForm6PdfPreviewMatch[1]);
  if (req.method === "DELETE" && leaveApplicationMatch)
    return handleDeleteLeaveApplication(req, res, leaveApplicationMatch[1]);

  if (req.method === "GET" && url.pathname === "/api/attendance/dtr")
    return handleListDtrEntries(req, res, url);
  if (req.method === "POST" && url.pathname === "/api/attendance/dtr")
    return handleCreateDtrEntry(req, res);
  if (req.method === "PATCH" && dtrEntryMatch)
    return handleUpdateDtrEntry(req, res, dtrEntryMatch[1]);
  if (req.method === "DELETE" && dtrEntryMatch)
    return handleDeleteDtrEntry(req, res, dtrEntryMatch[1]);
  if (req.method === "POST" && url.pathname === "/api/attendance/import")
    return handleImportDtr(req, res);
  if (req.method === "POST" && url.pathname === "/api/attendance/import-file")
    return handleImportDtrFile(req, res);
  if (req.method === "POST" && url.pathname === "/api/attendance/import-single-dtr")
    return handleImportSingleDtr(req, res);
  if (req.method === "POST" && url.pathname === "/api/attendance/import-all-dtr")
    return handleImportAllDtr(req, res);
  if (req.method === "GET" && unimportedDtrMatch)
    return handleCheckUnimportedDtrs(req, res, unimportedDtrMatch[1]);
  if (req.method === "POST" && url.pathname === "/api/attendance/refresh")
    return handleRefreshDtr(req, res);
  if (req.method === "POST" && url.pathname === "/api/attendance/schedule/bulk")
    return handleBulkEmployeeSchedule(req, res, false);
  if (req.method === "POST" && url.pathname === "/api/attendance/schedule/overrides")
    return handleBulkEmployeeSchedule(req, res, true);
  if (req.method === "GET" && url.pathname === "/api/attendance/noters")
    return handleListDtrNoters(req, res);
  if (req.method === "POST" && url.pathname === "/api/attendance/noters")
    return handleCreateDtrNoter(req, res);
  if (req.method === "DELETE" && dtrNoterMatch)
    return handleDeleteDtrNoter(req, res, dtrNoterMatch[1]);
  if (req.method === "GET" && url.pathname === "/api/attendance/biometrics")
    return handleListBiometricDevices(req, res);
  if (req.method === "POST" && url.pathname === "/api/attendance/biometrics")
    return handleCreateBiometricDevice(req, res);
  if (req.method === "PUT" && biometricDeviceMatch)
    return handleUpdateBiometricDevice(req, res, biometricDeviceMatch[1]);
  if (req.method === "PATCH" && biometricDeviceMatch)
    return handleUpdateBiometricDevice(req, res, biometricDeviceMatch[1]);
  if (req.method === "DELETE" && biometricDeviceMatch)
    return handleDeleteBiometricDevice(req, res, biometricDeviceMatch[1]);
  if (req.method === "POST" && url.pathname === "/api/attendance/biometrics/check-status")
    return handleCheckBiometricStatus(req, res);
  if (req.method === "POST" && url.pathname === "/api/attendance/dtr/excel")
    return handleGenerateDtrExcel(req, res);
  if (req.method === "GET" && dtrExcelMatch)
    return handleDownloadDtrExcel(req, res, dtrExcelMatch[1]);
  if (req.method === "POST" && url.pathname === "/api/attendance/dtr/pdf")
    return handleGenerateDtrPdf(req, res);
  if (req.method === "GET" && dtrPdfMatch)
    return handlePreviewDtrPdf(req, res, dtrPdfMatch[1]);
  if (req.method === "GET" && url.pathname === "/api/attendance/export")
    return handleExportDtr(req, res, url, false);
  if (req.method === "GET" && url.pathname === "/api/attendance/export/mass")
    return handleExportDtr(req, res, url, true);

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
await cleanupPreviewFiles().catch(() => {});
setInterval(() => cleanupPreviewFiles().catch(() => {}), 10 * 60 * 1000).unref();

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
