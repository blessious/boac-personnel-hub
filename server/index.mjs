import http from "node:http";
import crypto from "node:crypto";
import net from "node:net";
import os from "node:os";
import { spawn } from "node:child_process";
import { URL } from "node:url";
import { createReadStream, readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { initializePlantillaSchema, createPlantillaHandlers } from "./plantilla.mjs";
import { initializeMovementSchema, createMovementHandlers } from "./movements.mjs";
import { initializeServiceRecordSchema, createServiceRecordHandlers } from "./service-records.mjs";
import { createReportHandlers } from "./reports.mjs";
import { initializeAssignmentSchema, createAssignmentHandlers } from "./assignments.mjs";
import { employeeLifecycleTransition } from "./employee-lifecycle.mjs";

const SERVER_DIR = path.join(process.cwd(), "server");
const SERVER_ENV_LOCAL_PATH = path.join(SERVER_DIR, ".env.local");

function parseEnvText(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      const quote = value[0];
      value = value.slice(1, -1);
      if (quote === '"') {
        value = value.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      }
    }
    values[key] = value;
  }
  return values;
}

function formatEnvValue(value) {
  const text = String(value ?? "");
  if (/^[A-Za-z0-9_@./:-]*$/.test(text)) return text;
  return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function loadServerEnv() {
  const candidates = [".env.local", ".env", ".env.defaults"];
  for (const fileName of candidates) {
    try {
      const envPath = path.join(SERVER_DIR, fileName);
      const text = readFileSync(envPath, "utf8");
      const values = parseEnvText(text);
      for (const [key, value] of Object.entries(values)) {
        if (!(key in process.env)) process.env[key] = value;
      }
    } catch {
      // Environment variables can still be supplied by the host process.
    }
  }
}

loadServerEnv();

const PORT = Number(process.env.HRIS_API_PORT || 47102);
const DB_HOST = process.env.HRIS_DB_HOST || "localhost";
const DB_USER = process.env.HRIS_DB_USER || "root";
const DB_PASSWORD = process.env.HRIS_DB_PASSWORD || "";
const DB_NAME = process.env.HRIS_DB_NAME || "hris_muni";
const DB_PORT = Number(process.env.HRIS_DB_PORT || 3306);
const SESSION_COOKIE = "hris_session";
const SESSION_HOURS = 8;
const MAX_FAILED_LOGIN_ATTEMPTS = 3;
const PASSWORD_HISTORY_LIMIT = 5;
const EXPORT_DIR = process.env.HRIS_RUNTIME_DIR || path.join(os.tmpdir(), "hris-runtime");
const PREVIEW_DIR = path.join(EXPORT_DIR, "previews");
const TEMPLATE_DIR = path.join(process.cwd(), "server", "templates");
const DTR_TEMPLATE_XLSX = path.join(TEMPLATE_DIR, "format.xlsx");
const DTR_EXCEL_SCRIPT = path.join(process.cwd(), "server", "dtr_excel.py");
const PDF_MERGE_SCRIPT = path.join(process.cwd(), "server", "merge_pdfs.py");
const DTR_PARSE_SCRIPT = path.join(process.cwd(), "server", "dtr_parse.py");
const LEAVE_FORM6_TEMPLATE_XLSX = path.join(
  process.cwd(),
  "leave application",
  "CS Form No. 6, Revised 2020 (Application for Leave) (Fillable).xlsx",
);
const LEAVE_FORM6_EXCEL_SCRIPT = path.join(process.cwd(), "server", "leave_form6_excel.py");
const PDF_WATERMARK_SCRIPT = path.join(process.cwd(), "server", "pdf_watermark.py");
const PDS_TEMPLATE_XLSX = path.join(
  process.cwd(),
  "Personal Data Sheet",
  "CS Form No. 212 Revised 2026 PDS.xlsx",
);
const PDS_EXCEL_SCRIPT = path.join(process.cwd(), "server", "pds_excel.py");
const WES_TEMPLATE_DOCX = path.join(process.cwd(), "WES", "Work Experience Sheet.docx");
const WES_DOCX_SCRIPT = path.join(process.cwd(), "server", "wes_docx.py");
const SERVICE_RECORD_EXPORT_SCRIPT = path.join(process.cwd(), "server", "service_record_export.py");
const PERSONNEL_PLANTILLA_REPORT_SCRIPT = path.join(
  process.cwd(),
  "server",
  "personnel_plantilla_report.py",
);
const BIOMETRIC_FETCH_SCRIPT = path.join(process.cwd(), "server", "fetch_biometric.py");
const ADMS_PORT = Number(process.env.HRIS_ADMS_PORT || 6000);
const CLIENT_PORT = Number(process.env.HRIS_CLIENT_PORT || 47101);
const ALLOWED_MUTATION_ORIGINS = new Set(
  String(process.env.HRIS_ALLOWED_ORIGINS || process.env.HRIS_CLIENT_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const LOCAL_MUTATION_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
for (const addresses of Object.values(os.networkInterfaces())) {
  for (const address of addresses || []) {
    if (!address.internal && address.address)
      LOCAL_MUTATION_HOSTS.add(address.address.toLowerCase());
  }
}
const LIBREOFFICE_CANDIDATES = [
  process.env.HRIS_LIBREOFFICE_EXE,
  "C:\\Program Files\\LibreOffice\\program\\soffice.com",
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com",
  "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  "soffice.com",
  "soffice",
].filter(Boolean);
const LIBREOFFICE_PROFILE_DIR = path.join(EXPORT_DIR, "lo-profile");
const PREVIEW_FILE_MAX_AGE_MS = 15 * 60 * 1000;
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
const BIOMETRIC_PYTHON_EXE =
  process.env.HRIS_BIOMETRIC_PYTHON_EXE || process.env.PYTHON_EXE || "python";
const BIOMETRIC_SYNC_LOG_LIMIT = 200;
const DTR_DUPLICATE_GAP_MINUTES = 1;
const DEFAULT_SHIFT_BUFFER_MINUTES = 240;
const EMPLOYEE_DISPLAY_NAME_SQL = `TRIM(CONCAT_WS(' ',
  NULLIF(TRIM(e.firstname), ''),
  CASE
    WHEN CHAR_LENGTH(TRIM(COALESCE(e.middlename, ''))) = 1
      THEN CONCAT(UPPER(TRIM(e.middlename)), '.')
    ELSE NULLIF(TRIM(e.middlename), '')
  END,
  NULLIF(TRIM(e.lastname), ''),
  NULLIF(TRIM(e.name_ext), '')
))`;
const HOSPITAL_SHIFT_TEMPLATES = [
  {
    code: "regular_8_5",
    name: "Regular 8-5",
    shiftType: "split",
    startTime: "08:00:00",
    endTime: "17:00:00",
    breakStart: "12:00:00",
    breakEnd: "13:00:00",
  },
  {
    code: "am_duty",
    name: "AM Duty 6-2",
    shiftType: "straight",
    startTime: "06:00:00",
    endTime: "14:00:00",
    breakStart: null,
    breakEnd: null,
  },
  {
    code: "pm_duty",
    name: "PM Duty 2-10",
    shiftType: "straight",
    startTime: "14:00:00",
    endTime: "22:00:00",
    breakStart: null,
    breakEnd: null,
  },
  {
    code: "night_duty",
    name: "Night Duty 10-6",
    shiftType: "night",
    startTime: "22:00:00",
    endTime: "06:00:00",
    breakStart: null,
    breakEnd: null,
  },
  {
    code: "twelve_hour_day",
    name: "12-Hour Day 6-6",
    shiftType: "straight",
    startTime: "06:00:00",
    endTime: "18:00:00",
    breakStart: null,
    breakEnd: null,
  },
  {
    code: "twelve_hour_night",
    name: "12-Hour Night 6-6",
    shiftType: "night",
    startTime: "18:00:00",
    endTime: "06:00:00",
    breakStart: null,
    breakEnd: null,
  },
  {
    code: "twenty_four_hour_duty",
    name: "24-Hour Duty",
    shiftType: "night",
    startTime: "08:00:00",
    endTime: "08:00:00",
    breakStart: null,
    breakEnd: null,
  },
];

const ROLES = ["Super Admin", "Admin", "HR", "Approver", "Employee", "Viewer"];
const HR_READ_ROLES = ["Super Admin", "HR", "Approver", "Viewer"];
const HR_WRITE_ROLES = ["Super Admin", "HR"];
const APPROVAL_ROLES = ["Super Admin", "Approver"];
const LEAVE_READ_ROLES = ["Super Admin", "HR", "Approver"];
const SYSTEM_ADMIN_ROLES = ["Super Admin", "Admin"];
const PERMISSIONS = [
  {
    key: "dashboard.view",
    label: "Dashboard",
    description: "Open the main HRIS dashboard.",
    group: "General",
  },
  {
    key: "employees.read",
    label: "View employee records",
    description: "Search and open employee records, including 201 file details.",
    group: "Employee Records",
  },
  {
    key: "employees.write",
    label: "Manage employee records",
    description: "Create, update, delete, and maintain employee record sections.",
    group: "Employee Records",
  },
  {
    key: "attendance.read",
    label: "View attendance",
    description: "View DTR entries, schedules, biometric status, and attendance exports.",
    group: "Attendance",
  },
  {
    key: "attendance.write",
    label: "Manage attendance",
    description: "Import, edit, refresh, and manage attendance setup.",
    group: "Attendance",
  },
  {
    key: "attendance.corrections.approve",
    label: "Approve DTR corrections",
    description: "Review, approve, disapprove, and reverse DTR correction requests.",
    group: "Attendance",
  },
  {
    key: "leave.read",
    label: "View leave",
    description: "View leave applications, balances, ledgers, and leave reports.",
    group: "Leave",
  },
  {
    key: "leave.write",
    label: "Manage leave",
    description: "Configure leave types, adjust balances, and maintain leave records.",
    group: "Leave",
  },
  {
    key: "approvals.manage",
    label: "Approvals",
    description: "Review, approve, reject, return, or reverse approval workflows.",
    group: "Approvals",
  },
  {
    key: "plantilla.read",
    label: "View plantilla",
    description: "View plantilla items, occupancy, vacancies, and history.",
    group: "Plantilla",
  },
  {
    key: "plantilla.write",
    label: "Manage plantilla",
    description: "Create, edit, delete, fill, and update plantilla items.",
    group: "Plantilla",
  },
  {
    key: "engagements.manage",
    label: "Manage non-Plantilla engagements",
    description:
      "Create, renew, schedule, and terminate JO, COS, casual, and contractual engagements.",
    group: "Employee Records",
  },
  {
    key: "movements.read",
    label: "View movements",
    description: "View employee movement drafts, queues, events, and posted actions.",
    group: "Movements",
  },
  {
    key: "movements.write",
    label: "Prepare movements",
    description: "Create, edit, submit, post, return, and reverse personnel movements.",
    group: "Movements",
  },
  {
    key: "service_records.read",
    label: "View service records",
    description: "View and export employee service records.",
    group: "Service Records",
  },
  {
    key: "service_records.write",
    label: "Manage service records",
    description: "Create, edit, and delete manual service record entries.",
    group: "Service Records",
  },
  {
    key: "reports.view",
    label: "Reports",
    description: "Open and export reports and analytics.",
    group: "Reports",
  },
  {
    key: "admin.users",
    label: "User management",
    description:
      "Create users, assign roles, reset passwords, unlock accounts, and print credentials.",
    group: "System Administration",
  },
  {
    key: "admin.audit",
    label: "Audit log",
    description: "View recorded privileged system actions.",
    group: "System Administration",
  },
  {
    key: "admin.errors",
    label: "Error log",
    description: "View system errors and centralized import logs.",
    group: "System Administration",
  },
  {
    key: "settings.manage",
    label: "Settings",
    description: "Manage agency branding, references, departments, positions, and salary grades.",
    group: "System Administration",
  },
  {
    key: "role_permissions.manage",
    label: "Role permissions",
    description: "View and change role permission checklists.",
    group: "System Administration",
  },
  {
    key: "my_profile.access",
    label: "My Profile",
    description: "Open the logged-in user's own employee profile.",
    group: "Self Service",
  },
  {
    key: "self_service.access",
    label: "Self-Service Portal",
    description: "Use employee self-service tools.",
    group: "Self Service",
  },
  {
    key: "requests.access",
    label: "My Requests",
    description: "Submit and track employee requests.",
    group: "Self Service",
  },
];
const PERMISSION_KEYS = new Set(PERMISSIONS.map((permission) => permission.key));
const LOCKED_SUPER_ADMIN_PERMISSIONS = new Set([
  "dashboard.view",
  "admin.users",
  "admin.audit",
  "admin.errors",
  "settings.manage",
  "role_permissions.manage",
]);
const DEFAULT_ROLE_PERMISSIONS = {
  "Super Admin": PERMISSIONS.map((permission) => permission.key),
  Admin: ["dashboard.view", "admin.users", "admin.audit", "admin.errors", "settings.manage"],
  HR: [
    "dashboard.view",
    "employees.read",
    "employees.write",
    "attendance.read",
    "attendance.write",
    "leave.read",
    "leave.write",
    "plantilla.read",
    "plantilla.write",
    "engagements.manage",
    "movements.read",
    "movements.write",
    "service_records.read",
    "service_records.write",
    "reports.view",
  ],
  Approver: [
    "dashboard.view",
    "employees.read",
    "attendance.read",
    "attendance.corrections.approve",
    "leave.read",
    "approvals.manage",
    "plantilla.read",
    "movements.read",
    "service_records.read",
    "reports.view",
  ],
  Employee: [
    "dashboard.view",
    "attendance.read",
    "my_profile.access",
    "self_service.access",
    "requests.access",
  ],
  Viewer: [
    "dashboard.view",
    "employees.read",
    "attendance.read",
    "plantilla.read",
    "movements.read",
    "service_records.read",
    "reports.view",
  ],
};
let rolePermissionCache = null;
const ROLE_ALIASES = new Map([
  ["super admin", "Super Admin"],
  ["super administrator", "Super Admin"],
  ["super-admin", "Super Admin"],
  ["superadmin", "Super Admin"],
  ["admin", "Admin"],
  ["administrator", "Admin"],
  ["system administrator", "Admin"],
  ["hr", "HR"],
  ["hr officer", "HR"],
  ["approver", "Approver"],
  ["employee", "Employee"],
  ["viewer", "Viewer"],
  ["read-only viewer", "Viewer"],
]);

function normalizeRole(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (ROLES.includes(raw)) return raw;
  return ROLE_ALIASES.get(raw.toLowerCase()) || raw;
}
const REFERENCE_LIBRARY_TYPES = {
  sectors: { label: "Sector" },
  offices: { label: "Office", parentCategory: "sectors" },
  divisions: { label: "Division", parentCategory: "offices" },
  sections: { label: "Section / Unit", parentCategory: "divisions" },
  eligibilities: { label: "Eligibility" },
  "employment-statuses": { label: "Employment Status" },
  "job-levels": { label: "Job Level" },
  "plantilla-types": { label: "Plantilla Classification" },
  "budget-codes": { label: "Budget Code" },
};
const ORGANIZATION_REFERENCE_CATEGORIES = ["sectors", "offices", "divisions", "sections"];
const DEFAULT_ORGANIZATION_HIERARCHY = {
  version: 1,
  levels: [
    {
      category: "sectors",
      label: "Sector",
      pluralLabel: "Sectors",
      enabled: true,
      assignable: false,
    },
    {
      category: "offices",
      label: "Office",
      pluralLabel: "Offices",
      enabled: true,
      assignable: true,
    },
    {
      category: "divisions",
      label: "Division",
      pluralLabel: "Divisions",
      enabled: true,
      assignable: true,
    },
    {
      category: "sections",
      label: "Section / Unit",
      pluralLabel: "Sections / Units",
      enabled: true,
      assignable: true,
    },
  ],
};
const DEFAULT_AGENCY = {
  name: "LGU BOAC",
  tagline: "Municipality of Boac Marinduque",
  logoUrl: "",
  iconUrl: "",
  bannerUrl: "",
};
const DEFAULT_DEPARTMENTS = [
  "Office of the Mayor",
  "Office of the Vice Mayor",
  "Sangguniang Bayan",
  "Municipal Administrator's Office",
  "Municipal Human Resource Management Office",
  "Municipal Budget Office",
  "Municipal Accounting Office",
  "Municipal Treasurer Office",
  "Municipal Assessor Office",
  "Municipal Planning and Development Office",
  "Municipal Civil Registrar's Office",
  "Municipal Engineering Office",
  "Municipal Health Office",
  "Municipal Social Welfare and Development Office",
  "Municipal Agriculture Office",
  "Municipal Disaster Risk Reduction and Management Office",
];
const DEFAULT_POSITIONS = [
  "Zoning Officer I",
  "Administrative Assistant II (Clerk IV)",
  "Administrative Aide VI (Clerk III)",
  "Administrative Aide III (Utility Worker II)",
  "Municipal Engineer",
  "Engineer III",
  "Draftsman I",
  "Administrative Aide IV (Clerk II)",
  "Administrative Aide IV (Driver II)",
  "Administrative Assistant II (Labor General Foreman)",
  "Administrative Aide III (Laborer II)",
  "Administrative Aide IV (Electrician I)",
  "Const. & Maintenance General Foreman",
  "Administrative Aide V (Carpenter II)",
  "Administrative Aide V (Mason II)",
  "Administrative Aide VI",
  "Administrative Aide V",
  "Meter Reader I",
  "Municipal Health Officer",
  "Rural Health Physician",
  "Dentist II",
  "Nurse II",
  "Medical Technologist II",
  "Midwife III",
  "Midwife II",
  "Sanitation Inspector I",
  "Dental Aide",
  "Barangay Health Aide",
  "Radiologic Technologist II",
  "Nutrition Officer II",
  "Municipal Civil Registrar",
  "Registration Officer II",
  "Administrative Assistant II (Assistant Registration Officer)",
  "Municipal Agricultural Officer",
  "Agricultural Technologist",
  "Municipal Government Department Head I (Municipal Social Welfare and Development Officer)",
  "Social Welfare Officer III",
  "Social Welfare Assistant",
  "Local Disaster Risk Reduction & Management Officer III",
  "Municipal Disaster Risk Reduction & Management Officer I",
  "Local Disaster Risk Reduction & Management Officer I",
  "Municipal Administrator",
  "Market Supervisor II",
  "Market Specialist I",
  "Market Inspector II",
  "Meat Inspector III",
];

const DEFAULT_REFERENCE_VALUES = [
  {
    category: "sectors",
    code: "EXEC_ADMIN",
    name: "Executive and Administrative Governance",
    description:
      "Office of the mayor, municipal administration, HR, records, ICT, and general services.",
    sortOrder: 1,
  },
  {
    category: "sectors",
    code: "LEGISLATIVE",
    name: "Legislative Services",
    description: "Office of the vice mayor, Sangguniang Bayan, and legislative support services.",
    sortOrder: 2,
  },
  {
    category: "sectors",
    code: "FINANCE",
    name: "Finance and Revenue Services",
    description: "Budget, accounting, treasury, assessment, and revenue administration.",
    sortOrder: 3,
  },
  {
    category: "sectors",
    code: "PLANNING_DEV",
    name: "Planning and Development Services",
    description:
      "Planning, development coordination, engineering, infrastructure, zoning, and public works.",
    sortOrder: 4,
  },
  {
    category: "sectors",
    code: "SOCIAL_HEALTH",
    name: "Social, Health, and Community Services",
    description:
      "Municipal health, nutrition, social welfare, civil registration, and community programs.",
    sortOrder: 5,
  },
  {
    category: "sectors",
    code: "ECONOMIC_PUBLIC",
    name: "Economic, Agriculture, and Public Safety Services",
    description:
      "Agriculture, market, licensing, traffic, disaster risk reduction, waterworks, and public order support.",
    sortOrder: 6,
  },
  {
    category: "sectors",
    code: "ATTACHED_AGENCIES",
    name: "Attached and National Agency Offices",
    description: "National or attached agency offices included in the local HR reference list.",
    sortOrder: 7,
  },
  {
    category: "offices",
    code: "OFFICE_OF_THE_MAYOR",
    name: "Office of the Mayor",
    description: "Chief executive office of the municipal government.",
    parentCategory: "sectors",
    parentCode: "EXEC_ADMIN",
    sortOrder: 1,
  },
  {
    category: "offices",
    code: "OFFICE_OF_THE_VICE_MAYOR",
    name: "Office of the Vice Mayor",
    description: "Office of the presiding officer of the Sangguniang Bayan.",
    parentCategory: "sectors",
    parentCode: "LEGISLATIVE",
    sortOrder: 2,
  },
  {
    category: "offices",
    code: "SB_LEGISLATIVE_OFFICE",
    name: "SB Legislative Office",
    description: "Legislative office and support for municipal council functions.",
    parentCategory: "sectors",
    parentCode: "LEGISLATIVE",
    sortOrder: 3,
  },
  {
    category: "offices",
    code: "MUNICIPAL_ADMINISTRATOR_S_OFFICE",
    name: "Municipal Administrator's Office",
    description: "Municipal administration, coordination, and executive support.",
    parentCategory: "sectors",
    parentCode: "EXEC_ADMIN",
    sortOrder: 4,
  },
  {
    category: "offices",
    code: "MUNICIPAL_ACCOUNTING_OFFICE",
    name: "Municipal Accounting Office",
    description: "Accounting and financial reporting office.",
    parentCategory: "sectors",
    parentCode: "FINANCE",
    sortOrder: 5,
  },
  {
    category: "offices",
    code: "MUNICIPAL_TREASURER_OFFICE",
    name: "Municipal Treasurer Office",
    description: "Treasury, collections, and revenue administration.",
    parentCategory: "sectors",
    parentCode: "FINANCE",
    sortOrder: 6,
  },
  {
    category: "offices",
    code: "MUNICIPAL_ASSESSOR_OFFICE",
    name: "Municipal Assessor Office",
    description: "Real property assessment and related services.",
    parentCategory: "sectors",
    parentCode: "FINANCE",
    sortOrder: 7,
  },
  {
    category: "offices",
    code: "MUNICIPAL_PLANNING_AND_DEVELOPMENT_OFFICE",
    name: "Municipal Planning and Development Office",
    description: "Planning, development coordination, and project monitoring.",
    parentCategory: "sectors",
    parentCode: "PLANNING_DEV",
    sortOrder: 8,
  },
  {
    category: "offices",
    code: "MUNICIPAL_ENGINEERING_OFFICE",
    name: "Municipal Engineering Office",
    description: "Engineering, infrastructure, facilities, roads, and related works.",
    parentCategory: "sectors",
    parentCode: "PLANNING_DEV",
    sortOrder: 9,
  },
  {
    category: "offices",
    code: "MUNICIPAL_HEALTH_OFFICE",
    name: "Municipal Health Office",
    description: "Local public health services and community health programs.",
    parentCategory: "sectors",
    parentCode: "SOCIAL_HEALTH",
    sortOrder: 10,
  },
  {
    category: "offices",
    code: "MUNICIPAL_SOCIAL_WELFARE_AND_DEVELOPMENT_OFFICE",
    name: "Municipal Social Welfare and Development Office",
    description: "Social welfare and development programs.",
    parentCategory: "sectors",
    parentCode: "SOCIAL_HEALTH",
    sortOrder: 11,
  },
  {
    category: "offices",
    code: "MUNICIPAL_CIVIL_REGISTRAR_S_OFFICE",
    name: "Municipal Civil Registrar's Office",
    description: "Civil registration services.",
    parentCategory: "sectors",
    parentCode: "SOCIAL_HEALTH",
    sortOrder: 12,
  },
  {
    category: "offices",
    code: "MUNICIPAL_AGRICULTURE_OFFICE",
    name: "Municipal Agriculture Office",
    description: "Agriculture, fisheries, and livelihood support services.",
    parentCategory: "sectors",
    parentCode: "ECONOMIC_PUBLIC",
    sortOrder: 13,
  },
  {
    category: "offices",
    code: "MUNICIPAL_DISASTER_RISK_REDUCTION_AND_MANAGEMENT_OFFICE",
    name: "Municipal Disaster Risk Reduction and Management Office",
    description: "Disaster risk reduction, preparedness, response, and resilience programs.",
    parentCategory: "sectors",
    parentCode: "ECONOMIC_PUBLIC",
    sortOrder: 14,
  },
  {
    category: "divisions",
    code: "EXEC_ADMIN_DIV",
    name: "Executive and Administrative Division",
    parentCategory: "offices",
    parentCode: "OFFICE_OF_THE_MAYOR",
    sortOrder: 1,
  },
  {
    category: "divisions",
    code: "FINANCE_DIV",
    name: "Finance and Revenue Division",
    parentCategory: "offices",
    parentCode: "MUNICIPAL_ACCOUNTING_OFFICE",
    sortOrder: 2,
  },
  {
    category: "divisions",
    code: "COMMUNITY_SERVICES_DIV",
    name: "Community Services Division",
    parentCategory: "offices",
    parentCode: "MUNICIPAL_SOCIAL_WELFARE_AND_DEVELOPMENT_OFFICE",
    sortOrder: 3,
  },
  {
    category: "divisions",
    code: "ENGINEERING_WORKS_DIV",
    name: "Engineering and Public Works Division",
    parentCategory: "offices",
    parentCode: "MUNICIPAL_ENGINEERING_OFFICE",
    sortOrder: 4,
  },
  {
    category: "sections",
    code: "HRMO",
    name: "Human Resource Management Section",
    parentCategory: "divisions",
    parentCode: "EXEC_ADMIN_DIV",
    sortOrder: 1,
  },
  {
    category: "sections",
    code: "RECORDS",
    name: "Records and Archives Section",
    parentCategory: "divisions",
    parentCode: "EXEC_ADMIN_DIV",
    sortOrder: 2,
  },
  {
    category: "sections",
    code: "ICT",
    name: "Information and Communications Technology Section",
    parentCategory: "divisions",
    parentCode: "EXEC_ADMIN_DIV",
    sortOrder: 3,
  },
  {
    category: "sections",
    code: "SUPPLY",
    name: "Supply and Property Section",
    parentCategory: "divisions",
    parentCode: "EXEC_ADMIN_DIV",
    sortOrder: 4,
  },
  {
    category: "sections",
    code: "BUDGET",
    name: "Budget Section",
    parentCategory: "divisions",
    parentCode: "FINANCE_DIV",
    sortOrder: 5,
  },
  {
    category: "sections",
    code: "ACCOUNTING",
    name: "Accounting Section",
    parentCategory: "divisions",
    parentCode: "FINANCE_DIV",
    sortOrder: 6,
  },
  {
    category: "sections",
    code: "CASH",
    name: "Cash and Collection Section",
    parentCategory: "divisions",
    parentCode: "FINANCE_DIV",
    sortOrder: 7,
  },
  {
    category: "sections",
    code: "SOCIAL_WELFARE",
    name: "Social Welfare Services Section",
    parentCategory: "divisions",
    parentCode: "COMMUNITY_SERVICES_DIV",
    sortOrder: 8,
  },
  {
    category: "sections",
    code: "NUTRITION",
    name: "Nutrition Services Section",
    parentCategory: "divisions",
    parentCode: "COMMUNITY_SERVICES_DIV",
    sortOrder: 9,
  },
  {
    category: "sections",
    code: "ROADS_BRIDGES",
    name: "Roads and Bridges Section",
    parentCategory: "divisions",
    parentCode: "ENGINEERING_WORKS_DIV",
    sortOrder: 10,
  },
  {
    category: "sections",
    code: "SOLID_WASTE",
    name: "Solid Waste and General Services Section",
    parentCategory: "divisions",
    parentCode: "ENGINEERING_WORKS_DIV",
    sortOrder: 11,
  },
  {
    category: "eligibilities",
    code: "CSP",
    name: "Career Service Professional",
    description: "Civil Service Professional eligibility.",
    sortOrder: 1,
  },
  {
    category: "eligibilities",
    code: "CSSP",
    name: "Career Service Subprofessional",
    description: "Civil Service Subprofessional eligibility.",
    sortOrder: 2,
  },
  {
    category: "eligibilities",
    code: "RA1080",
    name: "RA 1080 / Board or Bar Eligibility",
    description: "Professional license eligibility under Republic Act No. 1080.",
    sortOrder: 3,
  },
  {
    category: "eligibilities",
    code: "BAR",
    name: "Bar Eligibility",
    description: "Eligibility based on passing the Philippine Bar examination.",
    sortOrder: 4,
  },
  {
    category: "eligibilities",
    code: "BOARD",
    name: "Board / PRC License",
    description: "Eligibility based on a valid professional board or PRC license.",
    sortOrder: 5,
  },
  {
    category: "eligibilities",
    code: "NONE",
    name: "No Eligibility Recorded",
    description: "Temporary value when no eligibility has been encoded yet.",
    sortOrder: 99,
  },
  {
    category: "employment-statuses",
    code: "PERM",
    name: "Permanent",
    description: "Permanent appointment/status.",
    sortOrder: 1,
  },
  {
    category: "employment-statuses",
    code: "TEMP",
    name: "Temporary",
    description: "Temporary appointment/status.",
    sortOrder: 2,
  },
  {
    category: "employment-statuses",
    code: "COTER",
    name: "Coterminous",
    description: "Coterminous appointment/status.",
    sortOrder: 3,
  },
  {
    category: "employment-statuses",
    code: "COTERM",
    name: "Co-term",
    description: "Co-terminous employment status.",
    sortOrder: 4,
  },
  {
    category: "employment-statuses",
    code: "ELECTIVE",
    name: "Elective",
    description: "Elective official or elective appointment status.",
    sortOrder: 5,
  },
  {
    category: "employment-statuses",
    code: "CASUAL",
    name: "Casual",
    description: "Casual employment status.",
    sortOrder: 6,
  },
  {
    category: "employment-statuses",
    code: "CONTRACT",
    name: "Contractual",
    description: "Contractual employment status.",
    sortOrder: 7,
  },
  {
    category: "employment-statuses",
    code: "JO",
    name: "Job Order",
    description: "Job order engagement.",
    sortOrder: 8,
  },
  {
    category: "employment-statuses",
    code: "COS",
    name: "Contract of Service",
    description: "Contract of service engagement.",
    sortOrder: 9,
  },
  {
    category: "job-levels",
    code: "EXEC",
    name: "Executive",
    description: "Executive or head-of-office level.",
    sortOrder: 1,
  },
  {
    category: "job-levels",
    code: "DIVCHIEF",
    name: "Division Chief",
    description: "Division chief or equivalent management level.",
    sortOrder: 2,
  },
  {
    category: "job-levels",
    code: "SUP",
    name: "Supervisory",
    description: "Supervisory personnel.",
    sortOrder: 3,
  },
  {
    category: "job-levels",
    code: "TECH",
    name: "Technical / Professional",
    description: "Licensed, technical, or professional personnel.",
    sortOrder: 4,
  },
  {
    category: "job-levels",
    code: "ADMIN",
    name: "Administrative",
    description: "Administrative and clerical personnel.",
    sortOrder: 5,
  },
  {
    category: "job-levels",
    code: "SUPPORT",
    name: "Support Staff",
    description: "Operational and support staff.",
    sortOrder: 6,
  },
  {
    category: "plantilla-types",
    code: "PLANTILLA",
    name: "Permanent",
    description: "Regular approved plantilla item.",
    sortOrder: 1,
  },
  {
    category: "plantilla-types",
    code: "ELECTIVE",
    name: "Elective",
    description: "Elective plantilla item.",
    sortOrder: 2,
  },
  {
    category: "plantilla-types",
    code: "COTER",
    name: "Coterminous",
    description: "Coterminous plantilla item.",
    sortOrder: 3,
  },
  {
    category: "plantilla-types",
    code: "NON-PLANTILLA",
    name: "Non-Plantilla",
    description: "Position or engagement not tied to a plantilla item.",
    sortOrder: 4,
  },
  {
    category: "plantilla-types",
    code: "CASUAL",
    name: "Casual",
    description: "Casual item or engagement.",
    sortOrder: 5,
  },
  {
    category: "plantilla-types",
    code: "JO",
    name: "Job Order",
    description: "Job order classification.",
    sortOrder: 6,
  },
  {
    category: "plantilla-types",
    code: "COS",
    name: "Contract of Service",
    description: "Contract of service classification.",
    sortOrder: 7,
  },
  {
    category: "budget-codes",
    code: "PS",
    name: "Personnel Services",
    description: "Personnel Services funding source or allotment.",
    sortOrder: 1,
  },
  {
    category: "budget-codes",
    code: "MOOE",
    name: "Maintenance and Other Operating Expenses",
    description: "MOOE funding source or allotment.",
    sortOrder: 2,
  },
  {
    category: "budget-codes",
    code: "TRUST",
    name: "Trust Fund",
    description: "Trust fund source.",
    sortOrder: 3,
  },
  {
    category: "budget-codes",
    code: "GENERAL-FUND",
    name: "General Fund",
    description: "Municipal general fund source.",
    sortOrder: 4,
  },
  {
    category: "budget-codes",
    code: "SEF",
    name: "Special Education Fund",
    description: "Special Education Fund source, when applicable.",
    sortOrder: 5,
  },
];

const OBSOLETE_HOSPITAL_REFERENCE_VALUES = [
  ["sectors", "EXEC"],
  ["sectors", "MED"],
  ["sectors", "NURS"],
  ["sectors", "HOPSS"],
  ["sectors", "ADMIN"],
  ["offices", "OMCC"],
  ["offices", "MED-OFF"],
  ["offices", "NURS-OFF"],
  ["offices", "HOPSS-OFF"],
  ["offices", "ADMIN-OFF"],
  ["divisions", "MCC-DIV"],
  ["divisions", "MED-DIV"],
  ["divisions", "NURS-DIV"],
  ["divisions", "ANC-DIV"],
  ["divisions", "SUP-DIV"],
  ["divisions", "ADMIN-DIV"],
  ["divisions", "FIN-DIV"],
  ["sections", "ER"],
  ["sections", "OPD"],
  ["sections", "WARD"],
  ["sections", "PHARM"],
  ["sections", "LAB"],
  ["sections", "RAD"],
  ["sections", "HR"],
  ["sections", "GSS"],
  ["budget-codes", "INCOME"],
  ["budget-codes", "DOH-GAA"],
];

const OFFICE_SECTOR_PARENT_CODES = {
  EXEC_ADMIN: [
    "CAO",
    "MO_HUMAN_RESOURCE_AND_MANAGEMENT_SECTION",
    "MO_INFORMATION_AND_COMMUNICATIONS_TECHNOLOGY_SECTOR",
    "MO_MUNICIPAL_INFORMATION_AND_LIBRARY_SERVICES_SECTION",
    "MUNICIPAL_ADMINISTRATOR_S_OFFICE",
    "OFFICE_OF_THE_MAYOR",
  ],
  LEGISLATIVE: [
    "OFFICE_OF_THE_VICE_MAYOR",
    "SB_LEGISLATIVE_CAPITOL",
    "SB_LEGISLATIVE_OFFICE",
    "SB_LEGISLATIVE_OFFICE_LIGA",
    "SB_SECRETARIAT_OFFICE",
  ],
  FINANCE: [
    "BUDGET_OFFICE",
    "MUNICIPAL_ACCOUNTING_OFFICE",
    "MUNICIPAL_ASSESSOR_OFFICE",
    "MUNICIPAL_TREASURER_OFFICE",
  ],
  PLANNING_DEV: [
    "MEO_PLAZA_PARKS_AND_MONUMENT_SECTION",
    "MEO_GARBAGE_COLLECTION_SERVICES",
    "MEO_MAINT_OF_ROADS_AND_BRIDGES",
    "MEO_STREET_CLEANING_SERVICES",
    "MEO_STREET_LIGHTING_SERVICES",
    "MUNICIPAL_ENGINEERING_OFFICE",
    "MUNICIPAL_PLANNING_AND_DEVELOPMENT_OFFICE",
    "OPERATION_OF_WATERWORK_SYSTEM",
  ],
  SOCIAL_HEALTH: [
    "MO_NUTRITION_CENTER",
    "MO_SPORTS_AND_GAMES_SECTION",
    "MUNICIPAL_CIVIL_REGISTRAR_S_OFFICE",
    "MUNICIPAL_HEALTH_OFFICE",
    "MUNICIPAL_HEALTH_OFFICE_RHU_II",
    "MUNICIPAL_NUTRITION_OFFICE",
    "MUNICIPAL_SOCIAL_WELFARE_AND_DEVELOPMENT_OFFICE",
  ],
  ECONOMIC_PUBLIC: [
    "MO_BUSINESS_PRINTING_AND_LICENSING_SECTION",
    "MPOC_TRAFFIC_AIDE",
    "MUNICIPAL_AGRICULTURE_OFFICE",
    "MUNICIPAL_DISASTER_RISK_REDUCTION_AND_MANAGEMENT_OFFICE",
    "OPERATIONS_OF_MARKET",
    "SLAUGHTERHOUSE",
  ],
  ATTACHED_AGENCIES: [
    "COMMISSION_ON_ELECTIONS",
    "DEPARTMENT_OF_THE_INTERIOR_AND_LOCAL_GOVERNMENT",
    "PNP",
  ],
};

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
    filingRule:
      "Use only when the leave purpose does not match the standard CS Form No. 6 options.",
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

const EMPLOYEE_SECTION_FIELDS = {
  family: [
    "spouseLastname",
    "spouseFirstname",
    "spouseMiddlename",
    "spouseOccupation",
    "spouseEmployer",
    "spouseBusinessTel",
    "spouseBusinessAddress",
    "fatherLastname",
    "fatherFirstname",
    "fatherMiddlename",
    "motherLastname",
    "motherFirstname",
    "motherMiddlename",
  ],
  children: ["lastname", "firstname", "middlename", "gender", "birthday"],
  education: ["level", "school", "degree", "yearFrom", "yearTo", "yearGraduated", "scholarship"],
  civilService: ["type", "place", "date", "rating", "license", "dateRelease", "licenseValidity"],
  work: [
    "dateFrom",
    "dateTo",
    "position",
    "officeUnit",
    "immediateSupervisor",
    "agencyOrganizationLocation",
    "accomplishments",
    "actualDuties",
    "company",
    "status",
    "salary",
    "salaryGradeStep",
    "govEmp",
  ],
  organization: ["name", "position", "address", "yearFrom", "yearTo", "hours"],
  training: ["name", "conductedBy", "yearFrom", "yearTo", "hours", "file"],
  salary: [
    "date",
    "description",
    "ordinance",
    "grade",
    "step",
    "amount",
    "previousAmount",
    "tax",
    "gross",
    "type",
    "pera",
    "rata",
    "cata",
  ],
  service: [
    "from",
    "to",
    "status",
    "salary",
    "designation",
    "department",
    "assignment",
    "branch",
    "leave",
    "sepDate",
    "sepCause",
  ],
  ipcr: ["month", "from", "to", "grades", "remarks", "file"],
};
const EMPLOYEE_SECTION_DATE_FIELDS = new Set([
  "birthday",
  "date",
  "dateRelease",
  "licenseValidity",
  "dateFrom",
  "dateTo",
  "from",
  "to",
  "sepDate",
]);
const EMPLOYEE_SECTION_NUMBER_FIELDS = new Set([
  "hours",
  "grade",
  "step",
  "amount",
  "previousAmount",
  "gross",
  "pera",
  "rata",
  "cata",
]);
const EMPLOYEE_SECTION_FILE_FIELDS = new Set(["file"]);
const MAX_SECTION_TEXT_LENGTH = 5000;
const MAX_SECTION_FILE_BYTES = 8 * 1024 * 1024;
const MAX_PROFILE_IMAGE_BYTES = 50 * 1024 * 1024;
const MAX_BRANDING_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_LOGO_IMAGE_DIMENSIONS = { width: 2048, height: 2048 };
const MAX_ICON_IMAGE_DIMENSIONS = { width: 1024, height: 1024 };

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

// Employee self-service may maintain personal/contact details and supporting
// PDS/IPCR sections. Employment assignments, attendance controls, salary
// history, and official service records remain system- or HR-managed.
const EMPLOYEE_SELF_SERVICE_BASE_FIELDS = new Set([
  "firstname",
  "middlename",
  "lastname",
  "nameExt",
  "birthday",
  "gender",
  "civilStatus",
  "email",
  "cellphoneNo",
  "photoUrl",
]);
const EMPLOYEE_SELF_SERVICE_PROFILE_FIELDS = new Set([
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
]);
const EMPLOYEE_SELF_SERVICE_SECTIONS = new Set([
  "family",
  "children",
  "education",
  "civilService",
  "work",
  "organization",
  "training",
  "ipcr",
]);

function selfServiceSectionAccessError(section) {
  if (section === "salary") {
    return "Salary history is generated from posted appointments, movements, and salary updates";
  }
  if (section === "service") {
    return "Official service records are maintained through the Service Records workflow";
  }
  return "This 201 section is managed by HR";
}

let pool;
const biometricSyncLogs = [];
const DOCUMENT_EXPORT_TTL_MS = 15 * 60 * 1000;

async function registerDocumentExport(fileName, employeeId, userId, exportType) {
  const expiresAt = new Date(Date.now() + DOCUMENT_EXPORT_TTL_MS);
  await pool.execute(
    `INSERT INTO document_export_jobs
      (id, file_name, export_type, employee_id, created_by, expires_at)
     VALUES (:id, :fileName, :exportType, :employeeId, :userId, :expiresAt)`,
    {
      id: crypto.randomUUID(),
      fileName,
      exportType,
      employeeId: employeeId || null,
      userId,
      expiresAt,
    },
  );
}

async function authorizeDocumentExport(user, fileName, { singleUse = true } = {}) {
  const [[record]] = await pool.execute(
    `SELECT employee_id, created_by
       FROM document_export_jobs
      WHERE file_name=:fileName AND expires_at > NOW()
        ${singleUse ? "AND downloaded_at IS NULL" : ""}
      LIMIT 1`,
    { fileName },
  );
  if (!record) return false;
  const allowed =
    Number(record.created_by) === Number(user.id) ||
    user.employeeId === record.employeeId ||
    (await hasPermission(user, "employees.read"));
  if (!allowed) return false;
  const [result] = await pool.execute(
    `UPDATE document_export_jobs
        SET downloaded_at=COALESCE(downloaded_at, NOW()), download_count=download_count+1
      WHERE file_name=:fileName AND expires_at > NOW()
        ${singleUse ? "AND downloaded_at IS NULL" : ""}`,
    { fileName },
  );
  return result.affectedRows === 1 ? record : null;
}

async function cleanupDocumentExportJobs() {
  await pool.execute(
    `DELETE FROM document_export_jobs
      WHERE (downloaded_at IS NOT NULL AND downloaded_at < DATE_SUB(NOW(), INTERVAL 1 DAY))
         OR expires_at < DATE_SUB(NOW(), INTERVAL 1 DAY)`,
  );
}
const realtimeClients = new Map();
let realtimeSequence = 0;
const biometricRefreshQueue = new Map();
let biometricQueueRunning = false;
let biometricSyncStartedAt = null;
let biometricSyncStatus = {
  status: "idle",
  mode: "ADMS",
  admsPort: ADMS_PORT,
  lastSyncTime: null,
  syncStartTime: null,
  durationMs: null,
  recordsFetched: 0,
  recordsInserted: 0,
  devicesProcessed: 0,
  error: null,
};

function json(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function text(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(body);
}

function realtimeTopic(pathname) {
  if (pathname.startsWith("/api/attendance")) return "attendance";
  if (pathname.startsWith("/api/leave")) return "leave";
  if (pathname.startsWith("/api/employees")) return "employees";
  if (pathname.startsWith("/api/plantilla")) return "plantilla";
  if (pathname.startsWith("/api/movements")) return "movements";
  if (pathname.startsWith("/api/engagements") || pathname.startsWith("/api/assignments"))
    return "engagements";
  if (pathname.startsWith("/api/settings")) return "settings";
  if (pathname.startsWith("/api/admin")) return "admin";
  if (pathname.startsWith("/api/auth")) return "auth";
  return "system";
}

function publishRealtime(event) {
  const payload = {
    id: event.id || `${Date.now()}-${++realtimeSequence}`,
    kind: event.kind || "refresh",
    topic: event.topic || "system",
    title: event.title || "",
    message: event.message || "",
    path: event.path || "",
    sourceType: event.sourceType || "",
    sourceId: event.sourceId || "",
    readAt: event.readAt || null,
    createdAt: event.createdAt || new Date().toISOString(),
  };
  const encoded = `id: ${payload.id}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const [clientId, client] of realtimeClients) {
    if (event.excludeUserId && client.user.id === event.excludeUserId) continue;
    if (event.roles?.length && !event.roles.includes(client.user.role)) continue;
    if (event.userIds?.length && !event.userIds.includes(client.user.id)) continue;
    if (event.employeeIds?.length && !event.employeeIds.includes(client.user.employeeId)) continue;
    try {
      client.res.write(encoded);
    } catch {
      realtimeClients.delete(clientId);
    }
  }
}

function notificationRow(row) {
  return {
    id: row.id,
    topic: row.topic,
    title: row.title,
    message: row.message,
    path: row.path || "",
    sourceType: row.source_type || "",
    sourceId: row.source_id || "",
    readAt: row.read_at || null,
    createdAt: row.created_at,
  };
}

async function notifyUsers({ userIds, topic, title, message, path, sourceType, sourceId }) {
  const recipients = [...new Set((userIds || []).map(Number).filter(Number.isInteger))];
  if (!recipients.length) return [];
  const createdAt = new Date().toISOString();
  const notifications = await Promise.all(
    recipients.map(async (userId) => {
      const id = crypto.randomUUID();
      await pool.execute(
        `INSERT INTO notifications (
           id, user_id, topic, title, message, path, source_type, source_id
         ) VALUES (
           :id, :userId, :topic, :title, :message, :path, :sourceType, :sourceId
         )`,
        {
          id,
          userId,
          topic,
          title,
          message,
          path: path || null,
          sourceType: sourceType || null,
          sourceId: sourceId || null,
        },
      );
      const notification = {
        id,
        kind: "notification",
        topic,
        title,
        message,
        path: path || "",
        sourceType: sourceType || "",
        sourceId: sourceId || "",
        readAt: null,
        createdAt,
      };
      publishRealtime({ ...notification, userIds: [userId] });
      return notification;
    }),
  );
  return notifications;
}

async function notifyRoles({ roles, excludeUserId, ...notification }) {
  if (!roles?.length) return [];
  const placeholders = roles.map(() => "?").join(", ");
  const params = [...roles];
  let sql = `SELECT id FROM users WHERE is_active = 1 AND role IN (${placeholders})`;
  if (excludeUserId) {
    sql += " AND id <> ?";
    params.push(Number(excludeUserId));
  }
  const [rows] = await pool.query(sql, params);
  return notifyUsers({ ...notification, userIds: rows.map((row) => row.id) });
}

async function notifyPermission({ permission, excludeUserId, ...notification }) {
  if (!PERMISSION_KEYS.has(permission)) return [];
  const [rows] = await pool.query("SELECT id, role FROM users WHERE is_active = 1");
  const recipients = [];
  for (const row of rows) {
    if (excludeUserId && Number(row.id) === Number(excludeUserId)) continue;
    if (await hasPermission(row.role, permission)) recipients.push(row.id);
  }
  return notifyUsers({ ...notification, userIds: recipients });
}

async function notifyEmployees({ employeeIds, excludeUserId, ...notification }) {
  if (!employeeIds?.length) return [];
  const placeholders = employeeIds.map(() => "?").join(", ");
  const params = [...employeeIds];
  let sql = `SELECT id FROM users WHERE is_active = 1 AND employee_id IN (${placeholders})`;
  if (excludeUserId) {
    sql += " AND id <> ?";
    params.push(Number(excludeUserId));
  }
  const [rows] = await pool.query(sql, params);
  return notifyUsers({ ...notification, userIds: rows.map((row) => row.id) });
}

async function handleListNotifications(req, res, url) {
  const user = await requireUser(req, res);
  if (!user) return;
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 30));
  const [rows] = await pool.execute(
    `SELECT id, topic, title, message, path, source_type, source_id, read_at, created_at
     FROM notifications
     WHERE user_id = :userId
     ORDER BY created_at DESC
     LIMIT ${limit}`,
    { userId: user.id },
  );
  const [[summary]] = await pool.execute(
    `SELECT COUNT(*) AS unread FROM notifications WHERE user_id = :userId AND read_at IS NULL`,
    { userId: user.id },
  );
  return json(res, 200, {
    notifications: rows.map(notificationRow),
    unreadCount: Number(summary.unread || 0),
  });
}

async function handleReadNotification(req, res, id) {
  const user = await requireUser(req, res);
  if (!user) return;
  const [result] = await pool.execute(
    `UPDATE notifications SET read_at = COALESCE(read_at, NOW())
     WHERE id = :id AND user_id = :userId`,
    { id, userId: user.id },
  );
  if (!result.affectedRows) return json(res, 404, { error: "Notification not found" });
  publishRealtime({ kind: "refresh", topic: "notifications", userIds: [user.id] });
  return json(res, 200, { ok: true });
}

async function handleReadAllNotifications(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const [result] = await pool.execute(
    `UPDATE notifications SET read_at = NOW() WHERE user_id = :userId AND read_at IS NULL`,
    { userId: user.id },
  );
  publishRealtime({ kind: "refresh", topic: "notifications", userIds: [user.id] });
  return json(res, 200, { ok: true, updated: Number(result.affectedRows || 0) });
}

async function cleanupNotifications() {
  await pool.execute(
    `DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)`,
  );
}

async function handleRealtimeEvents(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const clientId = crypto.randomUUID();
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(`event: connected\ndata: {"ok":true}\n\n`);
  realtimeClients.set(clientId, { res, user });
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch {
      clearInterval(heartbeat);
      realtimeClients.delete(clientId);
    }
  }, 25000);
  heartbeat.unref();
  req.on("close", () => {
    clearInterval(heartbeat);
    realtimeClients.delete(clientId);
  });
}

function sendFile(res, filePath, fileName, { deleteAfterSend = false } = {}) {
  const extension = path.extname(fileName).toLowerCase();
  const contentType =
    extension === ".xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : extension === ".pdf"
        ? "application/pdf"
        : extension === ".docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "no-store",
  });
  const stream = createReadStream(filePath);
  const cleanup = () => {
    if (deleteAfterSend) fs.rm(filePath, { force: true }).catch(() => {});
  };
  stream.on("error", () => {
    cleanup();
    if (!res.headersSent) json(res, 500, { error: "Failed to read file" });
  });
  res.on("close", cleanup);
  stream.pipe(res);
}

function sendInlinePdfAndDelete(res, filePath, fileName) {
  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${fileName}"`,
    "Cache-Control": "no-store",
  });
  const stream = createReadStream(filePath);
  const cleanup = () => fs.rm(filePath, { force: true }).catch(() => {});
  stream.on("error", () => {
    cleanup();
    if (!res.headersSent) json(res, 500, { error: "Failed to read DTR PDF" });
  });
  res.on("close", cleanup);
  stream.pipe(res);
}

function sendInlinePdf(res, filePath, fileName) {
  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${fileName}"`,
    "Cache-Control": "no-store",
  });
  const stream = createReadStream(filePath);
  stream.on("error", () => {
    if (!res.headersSent) json(res, 500, { error: "Failed to read PDF" });
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
      .filter((file) =>
        [".pdf", ".json", ".xlsx", ".docx"].includes(path.extname(file.name).toLowerCase()),
      )
      .map(async (file) => {
        const filePath = path.join(PREVIEW_DIR, file.name);
        const stats = await fs.stat(filePath).catch(() => null);
        if (stats && stats.mtimeMs < cutoff) await fs.rm(filePath, { force: true }).catch(() => {});
      }),
  );
}

async function readServerEnvLocal() {
  try {
    const text = await fs.readFile(SERVER_ENV_LOCAL_PATH, "utf8");
    return { text, values: parseEnvText(text) };
  } catch (error) {
    if (error?.code === "ENOENT") return { text: "", values: {} };
    throw error;
  }
}

function currentDatabaseConfig() {
  return {
    host: process.env.HRIS_DB_HOST || DB_HOST,
    port: Number(process.env.HRIS_DB_PORT || DB_PORT || 3306),
    user: process.env.HRIS_DB_USER || DB_USER,
    password: process.env.HRIS_DB_PASSWORD ?? DB_PASSWORD,
    database: process.env.HRIS_DB_NAME || DB_NAME,
  };
}

function publicDatabaseConfig(config = currentDatabaseConfig(), sourceValues = {}) {
  return {
    host: config.host,
    port: Number(config.port || 3306),
    user: config.user,
    database: config.database,
    passwordSet: Boolean(config.password),
    source: Object.keys(sourceValues).some((key) => key.startsWith("HRIS_DB_"))
      ? "server/.env.local"
      : "process/defaults",
    restartRequired: false,
  };
}

function normalizeDatabaseConfig(body, existingPassword) {
  const host = String(body.host || "").trim();
  const user = String(body.user || "").trim();
  const database = String(body.database || "").trim();
  const port = Number(body.port || 3306);
  const password =
    body.password === undefined || body.password === null
      ? String(existingPassword || "")
      : String(body.password);

  if (!host) throw new Error("Database host is required");
  if (!user) throw new Error("Database user is required");
  if (!database) throw new Error("Database name is required");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Database port must be between 1 and 65535");
  }
  for (const [label, value] of [
    ["Database host", host],
    ["Database user", user],
    ["Database name", database],
    ["Database password", password],
  ]) {
    if (String(value).includes("\n") || String(value).includes("\r")) {
      throw new Error(`${label} cannot contain line breaks`);
    }
  }
  if (!/^[A-Za-z0-9_$-]+$/.test(database)) {
    throw new Error(
      "Database name can contain only letters, numbers, underscore, dollar, and dash",
    );
  }
  return { host, port, user, password, database };
}

async function testDatabaseConfig(config, { createDatabase = false } = {}) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      multipleStatements: true,
      connectTimeout: 8000,
    });
    if (createDatabase) {
      await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
    }
    const [schemas] = await connection.execute(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ? LIMIT 1`,
      [config.database],
    );
    if (!schemas.length) {
      return {
        ok: false,
        error: `Connected to MySQL, but database "${config.database}" does not exist`,
      };
    }
    await connection.changeUser({ database: config.database });
    await connection.query("SELECT 1");
    return { ok: true };
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}

async function writeDatabaseConfig(config) {
  const env = await readServerEnvLocal();
  const keys = new Set([
    "HRIS_DB_HOST",
    "HRIS_DB_PORT",
    "HRIS_DB_USER",
    "HRIS_DB_PASSWORD",
    "HRIS_DB_NAME",
  ]);
  const values = {
    HRIS_DB_HOST: config.host,
    HRIS_DB_PORT: String(config.port),
    HRIS_DB_USER: config.user,
    HRIS_DB_PASSWORD: config.password,
    HRIS_DB_NAME: config.database,
  };
  const lines = env.text ? env.text.split(/\r?\n/) : [];
  const output = [];
  const seen = new Set();

  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (!match || !keys.has(match[1])) {
      output.push(line);
      continue;
    }
    output.push(`${match[1]}=${formatEnvValue(values[match[1]])}`);
    seen.add(match[1]);
  }

  if (output.length && output[output.length - 1].trim() !== "") output.push("");
  for (const key of keys) {
    if (!seen.has(key)) output.push(`${key}=${formatEnvValue(values[key])}`);
  }

  await fs.mkdir(SERVER_DIR, { recursive: true });
  await fs.writeFile(SERVER_ENV_LOCAL_PATH, `${output.join("\n").replace(/\n+$/g, "")}\n`, "utf8");
}

function sendCsv(res, fileName, csv) {
  res.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "no-store",
  });
  res.end(csv);
}

function readBody(req, maxBytes = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (Number.isFinite(maxBytes) && raw.length > maxBytes) {
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

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 15 * 1024 * 1024) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => resolve(raw));
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

function normalizeOriginHost(hostname) {
  const normalized = String(hostname || "").toLowerCase();
  return LOCAL_MUTATION_HOSTS.has(normalized) ? "local-machine" : normalized;
}

function urlPort(url) {
  if (url.port) return Number(url.port);
  return url.protocol === "https:" ? 443 : 80;
}

function validateMutationOrigin(req, res) {
  const origin = String(req.headers.origin || "").trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "")
    .split(",")[0]
    .trim();
  if (!origin || !host || origin === "null") {
    json(res, 403, { error: "A same-origin request is required" });
    return false;
  }
  try {
    const parsed = new URL(origin);
    const hostUrl = new URL(`${parsed.protocol}//${host}`);
    const sameOrigin = parsed.host === host;
    const sameAppDevProxy =
      normalizeOriginHost(parsed.hostname) === normalizeOriginHost(hostUrl.hostname) &&
      urlPort(parsed) === CLIENT_PORT &&
      urlPort(hostUrl) === PORT;
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      (!sameOrigin && !sameAppDevProxy && !ALLOWED_MUTATION_ORIGINS.has(parsed.origin))
    ) {
      json(res, 403, { error: "Cross-site mutation blocked" });
      return false;
    }
  } catch {
    json(res, 403, { error: "Invalid request origin" });
    return false;
  }
  return true;
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

function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push("at least 8 characters");
  return errors;
}

function defaultPermissionsForRole(role) {
  return new Set(DEFAULT_ROLE_PERMISSIONS[role] || []);
}

async function loadRolePermissionCache() {
  const matrix = Object.fromEntries(ROLES.map((role) => [role, defaultPermissionsForRole(role)]));
  const [rows] = await pool.query(`SELECT role, permission_key, allowed FROM role_permissions`);
  for (const row of rows) {
    const role = normalizeRole(row.role);
    if (!ROLES.includes(role) || !PERMISSION_KEYS.has(row.permission_key)) continue;
    if (Number(row.allowed) === 1) matrix[role].add(row.permission_key);
    else matrix[role].delete(row.permission_key);
  }
  for (const key of LOCKED_SUPER_ADMIN_PERMISSIONS) {
    matrix["Super Admin"].add(key);
  }
  rolePermissionCache = matrix;
  return matrix;
}

async function permissionsForRole(role) {
  const normalizedRole = normalizeRole(role);
  if (!ROLES.includes(normalizedRole)) return [];
  const matrix = rolePermissionCache || (await loadRolePermissionCache());
  return Array.from(matrix[normalizedRole] || []).filter((key) => PERMISSION_KEYS.has(key));
}

async function hasPermission(userOrRole, permissionKey) {
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
  if (!PERMISSION_KEYS.has(permissionKey)) return false;
  return (await permissionsForRole(role)).includes(permissionKey);
}

function permissionMatrixResponse(matrix) {
  return {
    permissions: PERMISSIONS,
    roles: ROLES,
    locked: { "Super Admin": Array.from(LOCKED_SUPER_ADMIN_PERMISSIONS) },
    matrix: Object.fromEntries(
      ROLES.map((role) => [
        role,
        Object.fromEntries(
          PERMISSIONS.map((permission) => [
            permission.key,
            Boolean(matrix[role]?.has(permission.key)),
          ]),
        ),
      ]),
    ),
  };
}

function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    permissions: row.permissions || [],
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
    failedLoginAttempts: Number(row.failed_login_attempts || 0),
    lockedAt: row.locked_at || null,
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

function formatLocalDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeDate(value) {
  if (!value) return "";
  if (value instanceof Date) return formatLocalDate(value);
  return String(value).slice(0, 10);
}

function formatMiddleName(value) {
  const middleName = String(value || "").trim();
  if (!middleName) return "";
  return middleName.length === 1 && !middleName.endsWith(".")
    ? `${middleName.toUpperCase()}.`
    : middleName;
}

function formatEmployeeName(employee, fallback = "Employee") {
  const name = [
    employee?.firstname,
    formatMiddleName(employee?.middlename),
    employee?.lastname,
    employee?.nameExt ?? employee?.name_ext,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
  return name || fallback;
}

function formatDtrSignatoryName(employee, fallback = "") {
  const middleName = String(employee?.middlename || "").trim();
  const middleInitial = middleName ? `${middleName.charAt(0).toUpperCase()}.` : "";
  const name = [
    employee?.firstname,
    middleInitial,
    employee?.lastname,
    employee?.nameExt ?? employee?.name_ext,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
  return name || fallback;
}

function isNonPlantillaEmploymentStatus(status) {
  return ["JO", "COS", "JO/COS", "Job Order", "Contract of Service", "Contractual"].includes(
    String(status || "").trim(),
  );
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
    lifecycleState: row.lifecycle_state || "Active",
    currentOrganizationId: row.current_org_unit_ref_id ? Number(row.current_org_unit_ref_id) : null,
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
    isHidden: Boolean(row.is_hidden),
    regular:
      row.regular === null || row.regular === undefined
        ? !isNonPlantillaEmploymentStatus(row.status)
        : Boolean(row.regular),
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

function readImageDimensions(buffer, mime) {
  if (mime === "image/png" && buffer.length >= 24) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (mime === "image/gif" && buffer.length >= 10) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  if (mime === "image/jpeg") {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (length < 2) break;
      if (
        [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
          marker,
        )
      ) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      offset += 2 + length;
    }
  }
  if (mime === "image/webp" && buffer.length >= 30) {
    const chunk = buffer.subarray(12, 16).toString("ascii");
    if (chunk === "VP8X") {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
    if (chunk === "VP8 " && buffer.length >= 30) {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (chunk === "VP8L" && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
    }
  }
  return null;
}

function validateImageDataUrl(value, label, maxBytes, dimensions) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) {
    throw new Error(`${label} must be a PNG, JPEG, WebP, or GIF image`);
  }
  const mime = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
  const base64 = match[2].replace(/\s/g, "");
  let buffer;
  try {
    buffer = Buffer.from(base64, "base64");
  } catch {
    throw new Error(`${label} image data is invalid`);
  }
  if (!buffer.length) {
    throw new Error(`${label} image data is invalid`);
  }
  if (maxBytes && buffer.length > maxBytes) {
    throw new Error(`${label} must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller`);
  }
  const signatures = {
    "image/png": buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/jpeg":
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[buffer.length - 2] === 0xff &&
      buffer[buffer.length - 1] === 0xd9,
    "image/gif":
      buffer.subarray(0, 6).toString("ascii") === "GIF87a" ||
      buffer.subarray(0, 6).toString("ascii") === "GIF89a",
    "image/webp":
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  };
  if (!signatures[mime]) throw new Error(`${label} content does not match its image type`);
  if (dimensions) {
    const size = readImageDimensions(buffer, mime);
    if (!size) throw new Error(`${label} dimensions could not be verified`);
    if (size.width > dimensions.width || size.height > dimensions.height) {
      throw new Error(`${label} must be ${dimensions.width}x${dimensions.height}px or smaller`);
    }
  }
  return `data:${mime};base64,${base64}`;
}

function employeeDbPayload(body, existing = {}) {
  const firstname = String(body.firstname ?? existing.firstname ?? "").trim();
  const lastname = String(body.lastname ?? existing.lastname ?? "").trim();
  const department = String(body.department ?? existing.department ?? "").trim();
  const position = String(body.position ?? existing.position ?? "").trim();
  const status = String(body.status ?? existing.status ?? "Permanent").trim();
  const lifecycleState = String(body.lifecycleState ?? existing.lifecycleState ?? "Active").trim();
  const assignmentRequired = !["Personal Record", "Pre-Employment"].includes(lifecycleState);

  if (!firstname) throw new Error("First name is required");
  if (!lastname) throw new Error("Last name is required");
  if (assignmentRequired && !department) throw new Error("Department is required");
  if (assignmentRequired && !position) throw new Error("Position is required");
  if (!status) throw new Error("Employment status is required");

  const profile = {};
  for (const field of EMPLOYEE_PROFILE_FIELDS) {
    profile[field] = String(body[field] ?? existing[field] ?? "").trim();
  }

  return {
    employeeNo: String(body.employeeId ?? existing.employeeId ?? "").trim(),
    biometricId: String(body.biometricId ?? body.biometric_id ?? existing.biometricId ?? "").trim(),
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
    lifecycleState,
    currentOrganizationId: body.currentOrganizationId ?? existing.currentOrganizationId ?? null,
    birthday: body.birthday || existing.birthday || null,
    gender: String(body.gender ?? existing.gender ?? "").trim(),
    civilStatus: String(body.civilStatus ?? existing.civilStatus ?? "").trim(),
    email: String(body.email ?? existing.email ?? "").trim(),
    cellphoneNo: String(body.cellphoneNo ?? existing.cellphoneNo ?? "").trim(),
    photoUrl:
      body.photoUrl !== undefined
        ? validateImageDataUrl(body.photoUrl, "Employee photo", MAX_PROFILE_IMAGE_BYTES)
        : existing.photoUrl || "",
    scheduleAmIn: normalizeTimeInput(
      body.scheduleAmIn ?? body.schedule_am_in ?? existing.scheduleAmIn ?? "08:00",
    ),
    scheduleAmOut: normalizeTimeInput(
      body.scheduleAmOut ?? body.schedule_am_out ?? existing.scheduleAmOut ?? "12:00",
    ),
    schedulePmIn: normalizeTimeInput(
      body.schedulePmIn ?? body.schedule_pm_in ?? existing.schedulePmIn ?? "13:00",
    ),
    schedulePmOut: normalizeTimeInput(
      body.schedulePmOut ?? body.schedule_pm_out ?? existing.schedulePmOut ?? "17:00",
    ),
    dtrSignatory: String(body.dtrSignatory ?? body.dtr_signatory ?? existing.dtrSignatory ?? "")
      .trim()
      .toUpperCase(),
    dtrNoterId: body.dtrNoterId || body.dtr_noter_id || existing.dtrNoterId || null,
    isDtrNoter: Boolean(body.isDtrNoter ?? body.is_dtr_noter ?? existing.isDtrNoter ?? false),
    regular:
      body.regular === undefined && existing.regular === undefined
        ? !isNonPlantillaEmploymentStatus(status)
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

const AUDIT_REDACTED_FIELDS = new Set([
  "photoUrl",
  "fileData",
  "photoData",
  "attachmentData",
  "certificateData",
  "ipcrData",
]);

function sanitizeAuditValue(key, value) {
  if (value === undefined) return "";
  if (AUDIT_REDACTED_FIELDS.has(key) || key.endsWith("Data")) return "[redacted]";
  if (typeof value === "string" && value.startsWith("data:")) return "[redacted]";
  if (typeof value === "string" && value.length > 500) return `${value.slice(0, 500)}...`;
  return value ?? "";
}

function auditDiff(before = {}, after = {}) {
  const keys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));
  const changes = {};
  for (const key of keys) {
    const previous = sanitizeAuditValue(key, before?.[key]);
    const next = sanitizeAuditValue(key, after?.[key]);
    if (JSON.stringify(previous) !== JSON.stringify(next)) {
      changes[key] = { before: previous, after: next };
    }
  }
  return changes;
}

function auditChangedFields(changes) {
  return Object.keys(changes || {});
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

function leaveCreditLedgerRow(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    leaveTypeId: row.leave_type_id,
    code: row.code,
    name: row.name,
    entryType: row.entry_type,
    columnChanged: row.column_changed || "",
    amount: Number(row.amount || 0),
    balanceDelta: Number(row.balance_delta || 0),
    balanceAfter: Number(row.balance_after || 0),
    sourceType: row.source_type || "",
    sourceId: row.source_id || "",
    description: row.description || "",
    createdByName: row.created_by_name || "",
    createdAt: row.created_at,
  };
}

function leaveApplicationRow(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeNo: row.employee_no,
    employeeName: formatEmployeeName(row, ""),
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
    approvedCreditChargeDays:
      row.approved_credit_charge_days === null || row.approved_credit_charge_days === undefined
        ? null
        : Number(row.approved_credit_charge_days),
    chargedLeaveTypeId:
      row.charged_leave_type_id === null || row.charged_leave_type_id === undefined
        ? null
        : Number(row.charged_leave_type_id),
    status: row.status,
    approverName: row.approver_name || "",
    decisionRemarks: row.decision_remarks || "",
    decidedAt: row.decided_at,
    createdAt: row.created_at,
  };
}

function formatTime(value) {
  if (!value) return "";
  if (value instanceof Date) {
    return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
  }
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

function dateParts(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function parseLocalDateTime(value) {
  if (value instanceof Date) return value;
  const match = String(value || "").match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (!match) return null;
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] || 0),
    Number(match[5] || 0),
    Number(match[6] || 0),
  );
}

function formatLocalDateTime(value) {
  return `${formatLocalDate(value)} ${String(value.getHours()).padStart(2, "0")}:${String(
    value.getMinutes(),
  ).padStart(2, "0")}:${String(value.getSeconds()).padStart(2, "0")}`;
}

function addDaysToDateString(value, days) {
  const parts = dateParts(value);
  if (!parts) return value;
  const date = new Date(parts.year, parts.month - 1, parts.day);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

function eachDateString(from, to) {
  const start = dateParts(from);
  const end = dateParts(to);
  if (!start || !end) return [];
  const cursor = new Date(start.year, start.month - 1, start.day);
  const endDate = new Date(end.year, end.month - 1, end.day);
  const dates = [];
  while (cursor <= endDate) {
    dates.push(formatLocalDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function combineDateAndTime(dateValue, timeValue) {
  const parts = dateParts(dateValue);
  const minutes = minutesFromTime(timeValue);
  if (!parts || minutes === null) return null;
  return new Date(parts.year, parts.month - 1, parts.day, Math.floor(minutes / 60), minutes % 60);
}

function addMinutes(value, minutes) {
  return new Date(value.getTime() + minutes * 60 * 1000);
}

function minutesBetweenPositive(later, earlier) {
  if (!later || !earlier) return 0;
  return Math.max(0, Math.round((later.getTime() - earlier.getTime()) / 60000));
}

function punchKey(value) {
  return formatLocalDateTime(value).slice(0, 16);
}

function timeFromDate(value) {
  if (!value) return null;
  return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(
    2,
    "0",
  )}:00`;
}

function dedupePunches(punches) {
  const sorted = punches
    .map((punch) => (punch instanceof Date ? punch : punch.date))
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());
  const kept = [];
  for (const punch of sorted) {
    const previous = kept[kept.length - 1];
    if (
      previous &&
      Math.abs(punch.getTime() - previous.getTime()) < DTR_DUPLICATE_GAP_MINUTES * 60 * 1000
    ) {
      continue;
    }
    kept.push(punch);
  }
  return { punches: kept };
}

function detectLegacyShiftType(schedule) {
  const start = minutesFromTime(schedule.startTime);
  const end = minutesFromTime(schedule.endTime);
  if (start !== null && end !== null && (end <= start || start >= 18 * 60 || end <= 8 * 60)) {
    return "night";
  }
  if (!schedule.breakStart && !schedule.breakEnd) return "straight";
  return "split";
}

function normalizeShift(row, source) {
  if (!row) return null;
  const shift = {
    id: row.shift_template_id || row.id || null,
    code: row.shift_code || row.code || "",
    name: row.shift_name || row.name || "Schedule",
    type: row.shift_type || "",
    startTime: formatTime(row.start_time || row.startTime || row.am_in || row.schedule_am_in),
    endTime: formatTime(
      row.end_time || row.endTime || row.pm_out || row.schedule_pm_out || row.am_out,
    ),
    breakStart: formatTime(row.break_start || row.breakStart || row.am_out || row.schedule_am_out),
    breakEnd: formatTime(row.break_end || row.breakEnd || row.pm_in || row.schedule_pm_in),
    earlyBuffer: Number(
      row.early_buffer_minutes || row.earlyBuffer || DEFAULT_SHIFT_BUFFER_MINUTES,
    ),
    lateBuffer: Number(row.late_buffer_minutes || row.lateBuffer || DEFAULT_SHIFT_BUFFER_MINUTES),
    source,
  };
  shift.type = shift.type || detectLegacyShiftType(shift);
  if (shift.type !== "split") {
    shift.breakStart = null;
    shift.breakEnd = null;
  }
  return shift.startTime && shift.endTime ? shift : null;
}

function buildDutyWindow(dutyDate, shift) {
  const start = combineDateAndTime(dutyDate, shift.startTime);
  const end = combineDateAndTime(dutyDate, shift.endTime);
  if (!start || !end) return null;
  if (end <= start) end.setDate(end.getDate() + 1);
  return {
    start,
    end,
    windowStart: addMinutes(start, -shift.earlyBuffer),
    windowEnd: addMinutes(end, shift.lateBuffer),
    crossMidnight: formatLocalDate(start) !== formatLocalDate(end),
  };
}

function closestEventMatch(candidates, target, used, toleranceMinutes) {
  let best = null;
  let bestDistance = null;
  for (const punch of candidates) {
    const key = punchKey(punch);
    if (used.has(key)) continue;
    const distance = Math.abs(punch.getTime() - target.getTime()) / 60000;
    if (distance <= toleranceMinutes && (bestDistance === null || distance < bestDistance)) {
      best = punch;
      bestDistance = distance;
    }
  }
  if (best) used.add(punchKey(best));
  return best;
}

function earliestEventMatch(candidates, start, end, used) {
  const match = candidates.find((punch) => {
    const key = punchKey(punch);
    return !used.has(key) && punch >= start && punch <= end;
  });
  if (match) used.add(punchKey(match));
  return match || null;
}

function latestEventMatch(candidates, start, end, used) {
  const match = [...candidates].reverse().find((punch) => {
    const key = punchKey(punch);
    return !used.has(key) && punch >= start && punch <= end;
  });
  if (match) used.add(punchKey(match));
  return match || null;
}

function midpointDate(start, end) {
  return new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
}

function calculateAttendanceStats(entry) {
  if (entry.status || entry.lateMinutes !== undefined || entry.undertimeMinutes !== undefined) {
    return {
      status: entry.status || "Incomplete",
      lateMinutes: Math.max(0, Number(entry.lateMinutes || 0)),
      undertimeMinutes: Math.max(0, Number(entry.undertimeMinutes || 0)),
    };
  }
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

  const lateMinutes =
    amIn !== null && scheduledAmIn !== null ? Math.max(0, amIn - scheduledAmIn) : 0;
  const undertimeMinutes =
    pmOut !== null && scheduledPmOut !== null ? Math.max(0, scheduledPmOut - pmOut) : 0;
  if (status === "Present" && lateMinutes > 0) status = "Late";
  return { status, lateMinutes, undertimeMinutes };
}

function dtrLockFields(row = {}) {
  return {
    amIn: Boolean(row.amInLocked ?? row.am_in_locked),
    amOut: Boolean(row.amOutLocked ?? row.am_out_locked),
    pmIn: Boolean(row.pmInLocked ?? row.pm_in_locked),
    pmOut: Boolean(row.pmOutLocked ?? row.pm_out_locked),
  };
}

function dtrLockFieldsEqual(left = {}, right = {}) {
  return ["amIn", "amOut", "pmIn", "pmOut"].every(
    (key) => Boolean(left?.[key]) === Boolean(right?.[key]),
  );
}

function calculateAttendanceStatsForShift(entry, shift) {
  if (!shift) return calculateAttendanceStats(entry);
  const amIn = minutesFromTime(entry.amIn);
  const amOut = minutesFromTime(entry.amOut);
  const pmIn = minutesFromTime(entry.pmIn);
  const pmOut = minutesFromTime(entry.pmOut);
  const punches = [amIn, amOut, pmIn, pmOut].filter((value) => value !== null);
  let status = "Absent";
  if (punches.length > 0) status = "Incomplete";

  if (shift.type === "split" && shift.breakStart && shift.breakEnd) {
    const start = minutesFromTime(shift.startTime);
    const breakEnd = minutesFromTime(shift.breakEnd);
    const end = minutesFromTime(shift.endTime);
    const lateMinutes =
      (amIn !== null && start !== null ? Math.max(0, amIn - start) : 0) +
      (pmIn !== null && breakEnd !== null ? Math.max(0, pmIn - breakEnd) : 0);
    const undertimeMinutes =
      pmOut !== null && end !== null ? Math.max(0, end - pmOut) : 0;
    if (amIn !== null && amOut !== null && pmIn !== null && pmOut !== null) {
      status = lateMinutes > 0 ? "Late" : "Present";
    }
    return { status, lateMinutes, undertimeMinutes };
  }

  const actualIn = shift.type === "night" ? pmIn : amIn;
  const actualOut = shift.type === "night" ? amOut : pmOut;
  const start = minutesFromTime(shift.startTime);
  const end = minutesFromTime(shift.endTime);
  const lateMinutes =
    actualIn !== null && start !== null ? Math.max(0, actualIn - start) : 0;
  const undertimeMinutes =
    actualOut !== null && end !== null ? Math.max(0, end - actualOut) : 0;
  if (actualIn !== null && actualOut !== null) status = lateMinutes > 0 ? "Late" : "Present";
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
    displayLabel: row.display_label || "",
    displayLabelRequestId: row.display_label_request_id || "",
    shiftTemplateId: row.shift_template_id ? String(row.shift_template_id) : "",
    shiftCode: row.shift_code || "",
    shiftName: row.shift_name || "",
    shiftType: row.shift_type || "",
    reviewFlags: [],
    locked: Boolean(row.locked),
    lockFields: {
      amIn: Boolean(row.am_in_locked),
      amOut: Boolean(row.am_out_locked),
      pmIn: Boolean(row.pm_in_locked),
      pmOut: Boolean(row.pm_out_locked),
    },
    importId: row.import_id || "",
    editedByName: row.edited_by_name || "",
    editedAt: row.edited_at || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function dtrCorrectionRequestRow(row) {
  const applied = parseJson(row.applied_snapshot, {});
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeNo: row.employee_no || "",
    employeeName: row.employee_name || "",
    department: row.department || "",
    dtrEntryId: row.dtr_entry_id || "",
    workDate: normalizeDate(row.work_date),
    requestType: row.request_type,
    original: {
      amIn: formatTime(row.original_am_in),
      amOut: formatTime(row.original_am_out),
      pmIn: formatTime(row.original_pm_in),
      pmOut: formatTime(row.original_pm_out),
      label: row.original_label || "",
    },
    requested: {
      amIn: formatTime(row.requested_am_in),
      amOut: formatTime(row.requested_am_out),
      pmIn: formatTime(row.requested_pm_in),
      pmOut: formatTime(row.requested_pm_out),
      label: row.requested_label || "",
    },
    applied: {
      amIn: applied.amIn || "",
      amOut: applied.amOut || "",
      pmIn: applied.pmIn || "",
      pmOut: applied.pmOut || "",
      label: applied.displayLabel || "",
      status: applied.status || "",
      remarks: applied.remarks || "",
      lockFields: applied.lockFields || {},
    },
    reason: row.reason || "",
    status: row.status,
    createdByName: row.created_by_name || "",
    requestIp: row.request_ip || "",
    reviewRemarks: row.review_remarks || "",
    reviewedByName: row.reviewed_by_name || "",
    reviewIp: row.review_ip || "",
    reviewedAt: row.reviewed_at || "",
    reverseReason: row.reverse_reason || "",
    reversedByName: row.reversed_by_name || "",
    reversalIp: row.reversal_ip || "",
    reversedAt: row.reversed_at || "",
    events: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dtrAuditSnapshot(row) {
  if (!row) return { exists: false };
  return {
    exists: true,
    id: row.id,
    amIn: formatTime(row.am_in),
    amOut: formatTime(row.am_out),
    pmIn: formatTime(row.pm_in),
    pmOut: formatTime(row.pm_out),
    status: row.status || "Incomplete",
    lateMinutes: Number(row.late_minutes || 0),
    undertimeMinutes: Number(row.undertime_minutes || 0),
    source: row.source || "Imported",
    remarks: row.remarks || "",
    displayLabel: row.display_label || "",
    displayLabelRequestId: row.display_label_request_id || "",
    lockFields: {
      amIn: Boolean(row.am_in_locked),
      amOut: Boolean(row.am_out_locked),
      pmIn: Boolean(row.pm_in_locked),
      pmOut: Boolean(row.pm_out_locked),
    },
  };
}

function correctionOriginalStillMatches(request, existing) {
  if (request.request_type === "Label") {
    return String(existing?.display_label || "") === String(request.original_label || "");
  }
  return [
    ["am_in", "original_am_in"],
    ["am_out", "original_am_out"],
    ["pm_in", "original_pm_in"],
    ["pm_out", "original_pm_out"],
  ].every(([currentKey, originalKey]) => {
    return formatTime(existing?.[currentKey]) === formatTime(request[originalKey]);
  });
}

function dtrSnapshotsMatch(left, right) {
  if (Boolean(left?.exists) !== Boolean(right?.exists)) return false;
  if (!left?.exists) return true;
  const scalarMatch = [
    "id",
    "amIn",
    "amOut",
    "pmIn",
    "pmOut",
    "status",
    "lateMinutes",
    "undertimeMinutes",
    "source",
    "remarks",
    "displayLabel",
    "displayLabelRequestId",
  ].every((key) => String(left?.[key] ?? "") === String(right?.[key] ?? ""));
  return scalarMatch && dtrLockFieldsEqual(left?.lockFields, right?.lockFields);
}

async function insertDtrCorrectionEvent(connection, event) {
  await connection.execute(
    `INSERT INTO dtr_correction_events (
       id, request_id, event_type, from_status, to_status, actor_id, remarks, ip_address,
       original_json, requested_json, applied_json
     ) VALUES (
       :id, :requestId, :eventType, :fromStatus, :toStatus, :actorId, :remarks, :ipAddress,
       :originalJson, :requestedJson, :appliedJson
     )`,
    {
      id: crypto.randomUUID(),
      requestId: event.requestId,
      eventType: event.eventType,
      fromStatus: event.fromStatus || null,
      toStatus: event.toStatus,
      actorId: event.actorId || null,
      remarks: event.remarks || null,
      ipAddress: event.ipAddress || null,
      originalJson: event.original ? JSON.stringify(event.original) : null,
      requestedJson: event.requested ? JSON.stringify(event.requested) : null,
      appliedJson: event.applied ? JSON.stringify(event.applied) : null,
    },
  );
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
    logCount: Number(row.log_count || 0),
    errorCount: Number(row.error_count || 0),
    warningCount: Number(row.warning_count || 0),
    importedByName: row.imported_by_name || "",
    importedAt: row.imported_at,
  };
}

function attendanceImportLogRow(row) {
  return {
    id: String(row.id),
    level: row.level || "Info",
    rowNumber:
      row.source_row_number === null || row.source_row_number === undefined
        ? null
        : Number(row.source_row_number),
    employeeNo: row.employee_no || "",
    message: row.message || "",
    details: typeof row.details === "string" ? JSON.parse(row.details || "null") : row.details,
    createdAt: row.created_at,
  };
}

function cleanImportLogMessage(message) {
  return String(message || "Import event")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

async function insertAttendanceImportLogs(db, importId, logs) {
  const entries = logs.filter((log) => log && log.message);
  for (const log of entries) {
    await db.execute(
      `INSERT INTO attendance_import_logs
         (import_id, level, source_row_number, employee_no, message, details)
       VALUES
         (:importId, :level, :rowNumber, :employeeNo, :message, :details)`,
      {
        importId,
        level: ["Info", "Success", "Warning", "Error"].includes(log.level) ? log.level : "Info",
        rowNumber: log.rowNumber || null,
        employeeNo: log.employeeNo ? String(log.employeeNo).slice(0, 80) : null,
        message: cleanImportLogMessage(log.message),
        details: log.details ? JSON.stringify(log.details) : null,
      },
    );
  }
}

async function recordFailedAttendanceImport({
  user,
  source = "Legacy",
  fileName = "DTR import",
  from = null,
  to = null,
  notes = null,
  message,
  details = null,
}) {
  const importId = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO attendance_imports
       (id, source, file_name, row_count, status, period_from, period_to, notes, imported_by)
     VALUES
       (:id, :source, :fileName, 0, 'Failed', :periodFrom, :periodTo, :notes, :importedBy)`,
    {
      id: importId,
      source,
      fileName: String(fileName || "DTR import").slice(0, 255),
      periodFrom: from || null,
      periodTo: to || null,
      notes: notes || cleanImportLogMessage(message),
      importedBy: user.id,
    },
  );
  await insertAttendanceImportLogs(pool, importId, [
    {
      level: "Error",
      message,
      details,
    },
  ]);
  return importId;
}

async function requireLeaveRead(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!(await hasPermission(user, "leave.read"))) {
    json(res, 403, { error: "Leave Management access required" });
    return null;
  }
  return user;
}

async function requireLeaveWrite(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!(await hasPermission(user, "leave.write"))) {
    json(res, 403, { error: "HR access required" });
    return null;
  }
  return user;
}

async function requireApproval(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!(await hasPermission(user, "approvals.manage"))) {
    json(res, 403, { error: "Approval access required" });
    return null;
  }
  return user;
}

async function ensureLeaveBalance(employeeId, leaveTypeId, db = pool) {
  await db.execute(
    `INSERT INTO leave_balances (employee_id, leave_type_id)
     VALUES (:employeeId, :leaveTypeId)
     ON DUPLICATE KEY UPDATE employee_id = employee_id`,
    { employeeId, leaveTypeId },
  );
}

async function changeLeaveBalance(
  employeeId,
  leaveTypeId,
  amount,
  column,
  balanceDelta = amount,
  ledger = null,
  db = pool,
) {
  if (!["earned", "used", "adjusted"].includes(column)) throw new Error("Invalid balance column");
  await ensureLeaveBalance(employeeId, leaveTypeId, db);
  await db.execute(
    `UPDATE leave_balances
     SET ${column} = ${column} + :amount,
         balance = balance + :balanceDelta
     WHERE employee_id = :employeeId AND leave_type_id = :leaveTypeId`,
    { employeeId, leaveTypeId, amount, balanceDelta },
  );
  if (ledger) {
    const [[balance]] = await db.execute(
      `SELECT balance FROM leave_balances
       WHERE employee_id = :employeeId AND leave_type_id = :leaveTypeId
       LIMIT 1`,
      { employeeId, leaveTypeId },
    );
    await db.execute(
      `INSERT INTO leave_credit_ledger (
         id, employee_id, leave_type_id, entry_type, column_changed, amount, balance_delta,
         balance_after, source_type, source_id, description, created_by
       )
       VALUES (
         :id, :employeeId, :leaveTypeId, :entryType, :columnChanged, :amount, :balanceDelta,
         :balanceAfter, :sourceType, :sourceId, :description, :createdBy
       )`,
      {
        id: crypto.randomUUID(),
        employeeId,
        leaveTypeId,
        entryType: ledger.entryType || "Adjustment",
        columnChanged: column,
        amount,
        balanceDelta,
        balanceAfter: Number(balance?.balance || 0),
        sourceType: ledger.sourceType || "",
        sourceId: ledger.sourceId || "",
        description: ledger.description || "",
        createdBy: ledger.createdBy || null,
      },
    );
  }
}

async function readLeaveApplication(id) {
  const [rows] = await pool.execute(
    `SELECT la.*, lt.code AS leave_code, lt.name AS leave_name,
            e.employee_no, e.firstname, e.middlename, e.lastname, e.name_ext, e.department, e.position,
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
  if (!(await hasPermission(user, "employees.read"))) {
    json(res, 403, { error: "Employee Management access required" });
    return null;
  }
  return user;
}

async function requireEmployeeWrite(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!(await hasPermission(user, "employees.write"))) {
    json(res, 403, { error: "HR access required" });
    return null;
  }
  return user;
}

async function canManageEmployeeRecord(user) {
  return hasPermission(user, "employees.write");
}

function selfServiceEmployeePayload(body, existing, data, existingData) {
  const allowedData = new Set(EMPLOYEE_SELF_SERVICE_BASE_FIELDS);
  const safe = { ...data };
  for (const field of Object.keys(data)) {
    if (!allowedData.has(field) && field !== "profileJson") safe[field] = existingData[field];
  }

  const profile = Object.fromEntries(
    EMPLOYEE_PROFILE_FIELDS.map((field) => [field, String(existing[field] ?? "").trim()]),
  );
  for (const field of EMPLOYEE_SELF_SERVICE_PROFILE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      profile[field] = String(body[field] ?? "").trim();
    }
  }
  safe.profileJson = JSON.stringify(profile);
  return safe;
}

function selfServiceSectionPayload(section, payload, existingPayload = {}) {
  const allowedFields = new Set(EMPLOYEE_SECTION_FIELDS[section] || []);
  const allowedKeys = new Set(
    [...allowedFields].flatMap((field) => [field, `${field}Data`, `${field}Type`, `${field}Size`]),
  );
  const unknown = Object.keys(payload).filter((key) => !allowedKeys.has(key));
  if (unknown.length) {
    throw new Error(
      `Self-service ${section} records contain unsupported fields: ${unknown.join(", ")}`,
    );
  }
  return { ...existingPayload, ...payload };
}

function validateSectionPayload(section, payload, existingPayload = {}) {
  const allowedFields = EMPLOYEE_SECTION_FIELDS[section];
  if (!allowedFields) throw new Error("Section not found");
  const allowed = new Set(allowedFields);
  const normalized = {};
  const source = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const allowedKeys = new Set(
    allowedFields.flatMap((field) => [field, `${field}Data`, `${field}Type`, `${field}Size`]),
  );
  const unknown = Object.keys(source).filter((key) => !allowedKeys.has(key));
  if (unknown.length) throw new Error(`Unsupported ${section} field: ${unknown[0]}`);

  for (const field of allowedFields) {
    const value = Object.prototype.hasOwnProperty.call(source, field)
      ? source[field]
      : (existingPayload[field] ?? "");
    if (EMPLOYEE_SECTION_FILE_FIELDS.has(field)) {
      const fileName = String(value || "").trim();
      const fileData = Object.prototype.hasOwnProperty.call(source, `${field}Data`)
        ? String(source[`${field}Data`] || "").trim()
        : String(existingPayload[`${field}Data`] || "").trim();
      const fileType = Object.prototype.hasOwnProperty.call(source, `${field}Type`)
        ? String(source[`${field}Type`] || "").trim()
        : String(existingPayload[`${field}Type`] || "").trim();
      const fileSize = Object.prototype.hasOwnProperty.call(source, `${field}Size`)
        ? Number(source[`${field}Size`] || 0)
        : Number(existingPayload[`${field}Size`] || 0);
      if (fileData) {
        const match = fileData.match(
          /^data:([A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+);base64,([A-Za-z0-9+/=\s]+)$/,
        );
        if (!match) throw new Error(`${field} attachment data is invalid`);
        const byteLength = Buffer.from(match[2].replace(/\s/g, ""), "base64").length;
        if (byteLength > MAX_SECTION_FILE_BYTES)
          throw new Error(`${field} attachment must be 8 MB or smaller`);
        normalized[`${field}Data`] = fileData;
        normalized[`${field}Type`] = fileType || match[1];
        normalized[`${field}Size`] = String(fileSize || byteLength);
      }
      normalized[field] = fileName.slice(0, 255);
      continue;
    }
    if (EMPLOYEE_SECTION_NUMBER_FIELDS.has(field)) {
      if (value === "" || value === null || value === undefined) {
        normalized[field] = "";
        continue;
      }
      const numberValue = Number(value);
      if (!Number.isFinite(numberValue)) throw new Error(`${field} must be a valid number`);
      normalized[field] = numberValue;
      continue;
    }
    const textValue = String(value ?? "").trim();
    if (
      EMPLOYEE_SECTION_DATE_FIELDS.has(field) &&
      textValue &&
      !/^\d{4}-\d{2}-\d{2}$/.test(textValue)
    ) {
      throw new Error(`${field} must be a valid date`);
    }
    if (textValue.length > MAX_SECTION_TEXT_LENGTH) {
      throw new Error(`${field} must be ${MAX_SECTION_TEXT_LENGTH} characters or fewer`);
    }
    normalized[field] = textValue;
  }
  return normalized;
}

async function activeAssignmentOwnership(employeeId) {
  const [[plantilla]] = await pool.execute(
    `SELECT id FROM plantilla_occupancies WHERE employee_id = :employeeId AND status = 'Active' LIMIT 1`,
    { employeeId },
  );
  const [[engagement]] = await pool.execute(
    `SELECT id FROM non_plantilla_engagements WHERE employee_id = :employeeId AND status = 'Active' LIMIT 1`,
    { employeeId },
  );
  if (plantilla) return { kind: "Plantilla", id: plantilla.id };
  if (engagement) return { kind: "Non-Plantilla engagement", id: engagement.id };
  return null;
}

function assignmentOwnedFieldChanges(existing, data) {
  const fields = [
    ["department", "department"],
    ["position", "position"],
    ["itemNo", "item number"],
    ["status", "employment type"],
    ["empStatus", "employee active status"],
    ["lifecycleState", "lifecycle state"],
    ["currentOrganizationId", "organization"],
  ];
  return fields
    .filter(([field]) => String(data[field] ?? "") !== String(existing[field] ?? ""))
    .map(([, label]) => label);
}

async function requireAttendanceRead(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (
    !(await hasPermission(user, "attendance.read")) &&
    !(await hasPermission(user, "self_service.access"))
  ) {
    json(res, 403, { error: "Attendance access required" });
    return null;
  }
  return user;
}

async function requireAttendanceWrite(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!(await hasPermission(user, "attendance.write"))) {
    json(res, 403, { error: "HR attendance access required" });
    return null;
  }
  return user;
}

async function canReadAllAttendance(user) {
  if (await hasPermission(user, "attendance.write")) return true;
  if (!(await hasPermission(user, "attendance.read"))) return false;
  if (await hasPermission(user, "employees.read")) return true;
  return !(await hasPermission(user, "self_service.access"));
}

async function canReadEmployeeAttendance(user, employeeId) {
  if (!employeeId) return false;
  if (await canReadAllAttendance(user)) return true;
  return (await hasPermission(user, "self_service.access")) && user.employeeId === employeeId;
}

async function requireReportView(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!(await hasPermission(user, "reports.view"))) {
    json(res, 403, { error: "Reports access required" });
    return null;
  }
  return user;
}

async function requirePlantillaRead(req, res) {
  return requirePermission(req, res, "plantilla.read", "Plantilla access required");
}

async function requirePlantillaWrite(req, res) {
  return requirePermission(req, res, "plantilla.write", "Plantilla management access required");
}

async function requireAssignmentRead(req, res) {
  return requirePermission(req, res, "employees.read", "Employee assignment access required");
}

async function requireEngagementWrite(req, res) {
  return requirePermission(
    req,
    res,
    "engagements.manage",
    "Non-Plantilla engagement access required",
  );
}

async function requireMovementRead(req, res) {
  return requirePermission(req, res, "movements.read", "Employee movement access required");
}

async function requireMovementWrite(req, res) {
  return requirePermission(
    req,
    res,
    "movements.write",
    "Employee movement management access required",
  );
}

async function requireServiceRecordWrite(req, res) {
  return requirePermission(
    req,
    res,
    "service_records.write",
    "Service Records management access required",
  );
}

async function readEmployeeById(id) {
  const [rows] = await pool.execute(`SELECT * FROM employees WHERE id = :id LIMIT 1`, { id });
  return rows[0] ? employeeRow(rows[0]) : null;
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from({ length: 8 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
}

function usernamePart(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

async function generateEmployeeUsername(db, employee) {
  const first = usernamePart(employee.firstname);
  const last = usernamePart(employee.lastname);
  const base = [first, last].filter(Boolean).join(".").slice(0, 46);

  if (!/^[a-z0-9][a-z0-9._-]{1,48}[a-z0-9]$/.test(base)) {
    throw httpError(400, "Employee name cannot generate a valid username");
  }

  for (let index = 0; index < 100; index += 1) {
    const suffix = index === 0 ? "" : `.${index + 1}`;
    const username = `${base.slice(0, 50 - suffix.length)}${suffix}`;
    const [rows] = await db.execute(`SELECT id FROM users WHERE username = :username LIMIT 1`, {
      username,
    });
    if (!rows.length) return username;
  }

  throw httpError(409, "Unable to generate a unique username for this employee");
}

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
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
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    dateStrings: true,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(150) NOT NULL,
      role ENUM('Super Admin', 'Admin', 'HR', 'Approver', 'Employee', 'Viewer') NOT NULL,
      photo_url LONGTEXT NULL,
      must_change_password TINYINT(1) NOT NULL DEFAULT 0,
      failed_login_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
      locked_at DATETIME NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await ensureColumn("users", "must_change_password", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn("users", "failed_login_attempts", "TINYINT UNSIGNED NOT NULL DEFAULT 0");
  await ensureColumn("users", "locked_at", "DATETIME NULL");
  await pool.query(
    `ALTER TABLE users MODIFY role ENUM('Super Admin', 'Admin', 'HR', 'Approver', 'Employee', 'Viewer') NOT NULL`,
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_history (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_password_history_user_created (user_id, created_at),
      CONSTRAINT fk_password_history_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

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
    CREATE TABLE IF NOT EXISTS role_permissions (
      role ENUM('Super Admin', 'Admin', 'HR', 'Approver', 'Employee', 'Viewer') NOT NULL,
      permission_key VARCHAR(80) NOT NULL,
      allowed TINYINT(1) NOT NULL DEFAULT 0,
      updated_by INT UNSIGNED NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (role, permission_key),
      INDEX idx_role_permissions_updated_by (updated_by),
      CONSTRAINT fk_role_permissions_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id CHAR(36) NOT NULL PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      topic VARCHAR(40) NOT NULL,
      title VARCHAR(160) NOT NULL,
      message VARCHAR(600) NOT NULL,
      path VARCHAR(300) NULL,
      source_type VARCHAR(60) NULL,
      source_id VARCHAR(80) NULL,
      read_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notifications_user_created (user_id, created_at),
      INDEX idx_notifications_user_unread (user_id, read_at),
      INDEX idx_notifications_source (source_type, source_id),
      CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
    CREATE TABLE IF NOT EXISTS error_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NULL,
      method VARCHAR(12) NULL,
      path VARCHAR(500) NULL,
      message TEXT NOT NULL,
      stack MEDIUMTEXT NULL,
      ip_address VARCHAR(64) NULL,
      user_agent VARCHAR(500) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_error_logs_user_id (user_id),
      INDEX idx_error_logs_created_at (created_at),
      CONSTRAINT fk_error_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
      organization_hierarchy_json JSON NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);
  await ensureColumn("agency_settings", "organization_hierarchy_json", "JSON NULL");

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
      is_active TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_salary_grade_step (ordinance, grade, step),
      INDEX idx_salary_grades_active (is_active, ordinance)
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_reference_values (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(50) NOT NULL,
      code VARCHAR(80) NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT NULL,
      parent_id INT UNSIGNED NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      effective_from DATE NULL,
      effective_to DATE NULL,
      sort_order INT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_hr_reference_category_code (category, code),
      UNIQUE KEY uniq_hr_reference_category_name (category, name),
      INDEX idx_hr_reference_category_active (category, is_active, sort_order),
      INDEX idx_hr_reference_parent_id (parent_id),
      CONSTRAINT fk_hr_reference_parent_id FOREIGN KEY (parent_id)
        REFERENCES hr_reference_values(id) ON DELETE RESTRICT
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
      is_hidden TINYINT(1) NOT NULL DEFAULT 0,
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
  await ensureColumn("employees", "is_hidden", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn("salary_grades", "is_active", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureIndex(
    "salary_grades",
    "idx_salary_grades_active",
    "INDEX idx_salary_grades_active (is_active, ordinance)",
  );
  await ensureIndex(
    "employees",
    "idx_employees_biometric_id",
    "INDEX idx_employees_biometric_id (biometric_id)",
  );
  await ensureIndex(
    "employees",
    "idx_employees_is_hidden",
    "INDEX idx_employees_is_hidden (is_hidden)",
  );
  await ensureIndex(
    "employees",
    "idx_employees_dashboard_position",
    "INDEX idx_employees_dashboard_position (department, position, emp_status)",
  );
  await ensureIndex(
    "employees",
    "idx_employees_list_scope_name",
    "INDEX idx_employees_list_scope_name (is_hidden, lastname, firstname, employee_no)",
  );
  await ensureIndex(
    "employees",
    "idx_employees_list_filters",
    "INDEX idx_employees_list_filters (is_hidden, department, status, emp_status, gender)",
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

  await initializePlantillaSchema(pool, employeeIdDefinition);
  await initializeMovementSchema(pool, employeeIdDefinition);
  await initializeAssignmentSchema(pool, employeeIdDefinition);
  await initializeServiceRecordSchema(pool, employeeIdDefinition);

  for (const { table, single } of Object.values(EMPLOYEE_SECTION_TABLES)) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`${table}\` (
        id CHAR(36) NOT NULL PRIMARY KEY,
        employee_id ${employeeIdDefinition},
        payload JSON NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_${table}_employee_id (employee_id),
        INDEX idx_${table}_employee_created_id (employee_id, created_at, id),
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
      approved_credit_charge_days DECIMAL(8,3) NULL,
      charged_leave_type_id INT UNSIGNED NULL,
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
  await ensureColumn("leave_applications", "approved_credit_charge_days", "DECIMAL(8,3) NULL");
  await ensureColumn("leave_applications", "charged_leave_type_id", "INT UNSIGNED NULL");
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
    CREATE TABLE IF NOT EXISTS leave_credit_ledger (
      id CHAR(36) NOT NULL PRIMARY KEY,
      employee_id ${employeeIdDefinition},
      leave_type_id INT UNSIGNED NOT NULL,
      entry_type VARCHAR(40) NOT NULL,
      column_changed VARCHAR(20) NULL,
      amount DECIMAL(8,3) NOT NULL,
      balance_delta DECIMAL(8,3) NOT NULL,
      balance_after DECIMAL(8,3) NOT NULL,
      source_type VARCHAR(60) NULL,
      source_id CHAR(36) NULL,
      description TEXT NULL,
      created_by INT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_leave_credit_ledger_employee_id (employee_id),
      INDEX idx_leave_credit_ledger_type_date (leave_type_id, created_at),
      INDEX idx_leave_credit_ledger_source (source_type, source_id),
      CONSTRAINT fk_leave_credit_ledger_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      CONSTRAINT fk_leave_credit_ledger_leave_type_id FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
      CONSTRAINT fk_leave_credit_ledger_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
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
    CREATE TABLE IF NOT EXISTS attendance_import_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      import_id CHAR(36) NOT NULL,
      level ENUM('Info', 'Success', 'Warning', 'Error') NOT NULL DEFAULT 'Info',
      source_row_number INT UNSIGNED NULL,
      employee_no VARCHAR(80) NULL,
      message VARCHAR(500) NOT NULL,
      details JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_attendance_import_logs_import_id (import_id),
      INDEX idx_attendance_import_logs_level (level)
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_import_exceptions (
      id CHAR(36) NOT NULL PRIMARY KEY,
      import_id CHAR(36) NOT NULL,
      employee_no VARCHAR(80) NULL,
      punch_at DATETIME NULL,
      source VARCHAR(40) NOT NULL,
      source_device VARCHAR(120) NULL,
      raw_payload JSON NULL,
      status ENUM('Open', 'Mapped', 'Reprocessed', 'Ignored') NOT NULL DEFAULT 'Open',
      mapped_employee_id ${nullableEmployeeIdDefinition},
      resolved_by INT UNSIGNED NULL,
      resolved_at DATETIME NULL,
      resolution_notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_attendance_import_exceptions_import_id (import_id),
      INDEX idx_attendance_import_exceptions_status (status),
      INDEX idx_attendance_import_exceptions_employee_no (employee_no),
      CONSTRAINT fk_attendance_import_exceptions_import_id FOREIGN KEY (import_id) REFERENCES attendance_imports(id) ON DELETE CASCADE,
      CONSTRAINT fk_attendance_import_exceptions_mapped_employee_id FOREIGN KEY (mapped_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
      CONSTRAINT fk_attendance_import_exceptions_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
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
    CREATE TABLE IF NOT EXISTS shift_templates (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(80) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      shift_type ENUM('split', 'straight', 'night') NOT NULL DEFAULT 'split',
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      break_start TIME NULL,
      break_end TIME NULL,
      early_buffer_minutes INT UNSIGNED NOT NULL DEFAULT 240,
      late_buffer_minutes INT UNSIGNED NOT NULL DEFAULT 240,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_shift_templates_active (active)
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_shift_assignments (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      employee_id ${employeeIdDefinition},
      duty_date DATE NOT NULL,
      shift_template_id BIGINT UNSIGNED NOT NULL,
      created_by INT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_employee_shift_assignment (employee_id, duty_date),
      INDEX idx_employee_shift_assignments_date (duty_date),
      INDEX idx_employee_shift_assignments_template (shift_template_id),
      CONSTRAINT fk_employee_shift_assignment_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      CONSTRAINT fk_employee_shift_assignment_template FOREIGN KEY (shift_template_id) REFERENCES shift_templates(id) ON DELETE RESTRICT,
      CONSTRAINT fk_employee_shift_assignment_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  for (const template of HOSPITAL_SHIFT_TEMPLATES) {
    await pool.execute(
      `INSERT INTO shift_templates
         (code, name, shift_type, start_time, end_time, break_start, break_end,
          early_buffer_minutes, late_buffer_minutes, active)
       VALUES
         (:code, :name, :shiftType, :startTime, :endTime, :breakStart, :breakEnd,
          :earlyBuffer, :lateBuffer, 1)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         shift_type = VALUES(shift_type),
         start_time = VALUES(start_time),
         end_time = VALUES(end_time),
         break_start = VALUES(break_start),
         break_end = VALUES(break_end),
         early_buffer_minutes = VALUES(early_buffer_minutes),
         late_buffer_minutes = VALUES(late_buffer_minutes),
         active = 1`,
      {
        ...template,
        earlyBuffer: DEFAULT_SHIFT_BUFFER_MINUTES,
        lateBuffer: DEFAULT_SHIFT_BUFFER_MINUTES,
      },
    );
  }

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
      display_label VARCHAR(180) NULL,
      display_label_request_id CHAR(36) NULL,
      shift_template_id BIGINT UNSIGNED NULL,
      review_flags JSON NULL,
      locked TINYINT(1) NOT NULL DEFAULT 0,
      am_in_locked TINYINT(1) NOT NULL DEFAULT 0,
      am_out_locked TINYINT(1) NOT NULL DEFAULT 0,
      pm_in_locked TINYINT(1) NOT NULL DEFAULT 0,
      pm_out_locked TINYINT(1) NOT NULL DEFAULT 0,
      import_id CHAR(36) NULL,
      edited_by INT UNSIGNED NULL,
      edited_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_dtr_entries_employee_date (employee_id, work_date),
      INDEX idx_dtr_entries_date (work_date),
      INDEX idx_dtr_entries_status (status),
      INDEX idx_dtr_entries_shift_template (shift_template_id),
      CONSTRAINT fk_dtr_entries_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      CONSTRAINT fk_dtr_entries_shift_template FOREIGN KEY (shift_template_id) REFERENCES shift_templates(id) ON DELETE SET NULL,
      CONSTRAINT fk_dtr_entries_import_id FOREIGN KEY (import_id) REFERENCES attendance_imports(id) ON DELETE SET NULL,
      CONSTRAINT fk_dtr_entries_edited_by FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);
  await ensureColumn("dtr_entries", "display_label", "VARCHAR(180) NULL");
  await ensureColumn("dtr_entries", "display_label_request_id", "CHAR(36) NULL");
  await ensureColumn("dtr_entries", "shift_template_id", "BIGINT UNSIGNED NULL");
  await ensureColumn("dtr_entries", "review_flags", "JSON NULL");
  await ensureColumn("dtr_entries", "am_in_locked", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn("dtr_entries", "am_out_locked", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn("dtr_entries", "pm_in_locked", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn("dtr_entries", "pm_out_locked", "TINYINT(1) NOT NULL DEFAULT 0");
  await pool.query(`
    UPDATE dtr_entries
    SET am_in_locked = 1, am_out_locked = 1, pm_in_locked = 1, pm_out_locked = 1
    WHERE locked = 1
      AND am_in_locked = 0
      AND am_out_locked = 0
      AND pm_in_locked = 0
      AND pm_out_locked = 0
  `);
  await ensureIndex(
    "dtr_entries",
    "idx_dtr_entries_shift_template",
    "INDEX idx_dtr_entries_shift_template (shift_template_id)",
  );
  await ensureForeignKey(
    "dtr_entries",
    "fk_dtr_entries_shift_template",
    "FOREIGN KEY (shift_template_id) REFERENCES shift_templates(id) ON DELETE SET NULL",
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dtr_correction_requests (
      id CHAR(36) NOT NULL PRIMARY KEY,
      employee_id ${employeeIdDefinition},
      dtr_entry_id CHAR(36) NULL,
      work_date DATE NOT NULL,
      request_type ENUM('Times', 'Label') NOT NULL,
      original_am_in TIME NULL,
      original_am_out TIME NULL,
      original_pm_in TIME NULL,
      original_pm_out TIME NULL,
      original_label VARCHAR(180) NULL,
      requested_am_in TIME NULL,
      requested_am_out TIME NULL,
      requested_pm_in TIME NULL,
      requested_pm_out TIME NULL,
      requested_label VARCHAR(180) NULL,
      reason TEXT NOT NULL,
      status ENUM('Pending', 'Approved', 'Disapproved', 'Cancelled') NOT NULL DEFAULT 'Pending',
      reviewed_by INT UNSIGNED NULL,
      review_remarks TEXT NULL,
      reviewed_at DATETIME NULL,
      created_by INT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_dtr_corrections_employee_date (employee_id, work_date),
      INDEX idx_dtr_corrections_status_created (status, created_at),
      CONSTRAINT fk_dtr_corrections_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      CONSTRAINT fk_dtr_corrections_dtr_entry_id FOREIGN KEY (dtr_entry_id) REFERENCES dtr_entries(id) ON DELETE SET NULL,
      CONSTRAINT fk_dtr_corrections_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_dtr_corrections_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    ALTER TABLE dtr_correction_requests
    MODIFY status ENUM('Pending', 'Approved', 'Disapproved', 'Cancelled', 'Reversed')
      NOT NULL DEFAULT 'Pending'
  `);
  await ensureColumn("dtr_correction_requests", "pre_approval_snapshot", "JSON NULL");
  await ensureColumn("dtr_correction_requests", "applied_snapshot", "JSON NULL");
  await ensureColumn("dtr_correction_requests", "request_ip", "VARCHAR(64) NULL");
  await ensureColumn("dtr_correction_requests", "review_ip", "VARCHAR(64) NULL");
  await ensureColumn("dtr_correction_requests", "reversed_by", "INT UNSIGNED NULL");
  await ensureColumn("dtr_correction_requests", "reverse_reason", "TEXT NULL");
  await ensureColumn("dtr_correction_requests", "reversal_ip", "VARCHAR(64) NULL");
  await ensureColumn("dtr_correction_requests", "reversed_at", "DATETIME NULL");
  await ensureForeignKey(
    "dtr_correction_requests",
    "fk_dtr_corrections_reversed_by",
    "FOREIGN KEY (reversed_by) REFERENCES users(id) ON DELETE SET NULL",
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dtr_correction_events (
      id CHAR(36) NOT NULL PRIMARY KEY,
      request_id CHAR(36) NOT NULL,
      event_type ENUM('Filed', 'Approved', 'Disapproved', 'Cancelled', 'Reversed') NOT NULL,
      from_status VARCHAR(24) NULL,
      to_status VARCHAR(24) NOT NULL,
      actor_id INT UNSIGNED NULL,
      remarks TEXT NULL,
      ip_address VARCHAR(64) NULL,
      original_json JSON NULL,
      requested_json JSON NULL,
      applied_json JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dtr_correction_events_request_date (request_id, created_at),
      CONSTRAINT fk_dtr_correction_events_request_id
        FOREIGN KEY (request_id) REFERENCES dtr_correction_requests(id) ON DELETE CASCADE,
      CONSTRAINT fk_dtr_correction_events_actor_id
        FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
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
  await ensureIndex(
    "dtr_export_jobs",
    "idx_dtr_export_jobs_file_name",
    "INDEX idx_dtr_export_jobs_file_name (file_name)",
  );

  await ensureDocumentExportJobsTable();

  await seedConfigTables();

  await bootstrapAdministrator();
}

async function applyVersionedMigrations() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
    namedPlaceholders: true,
  });
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    const [appliedRows] = await connection.query("SELECT version FROM schema_migrations");
    const applied = new Set(appliedRows.map((row) => row.version));
    const migrationDir = path.join(process.cwd(), "server", "migrations");
    const files = (await fs.readdir(migrationDir)).filter((file) => file.endsWith(".sql")).sort();
    if (applied.size === 0) {
      const [[existingSchema]] = await connection.query(
        `SELECT COUNT(*) AS total FROM information_schema.tables
          WHERE table_schema=:schema AND table_name='users'`,
        { schema: DB_NAME },
      );
      if (Number(existingSchema.total || 0) > 0) {
        for (const file of files) {
          await connection.execute(
            "INSERT IGNORE INTO schema_migrations(version) VALUES(:version)",
            {
              version: file,
            },
          );
        }
        return;
      }
    }
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await fs.readFile(path.join(migrationDir, file), "utf8");
      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await connection.execute("INSERT INTO schema_migrations(version) VALUES(:version)", {
          version: file,
        });
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw new Error(`Migration ${file} failed: ${error.message}`);
      }
    }
  } finally {
    await connection.end();
  }
}

async function ensureDocumentExportJobsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_export_jobs (
      id CHAR(36) NOT NULL PRIMARY KEY,
      file_name VARCHAR(255) NOT NULL UNIQUE,
      export_type VARCHAR(40) NOT NULL,
      employee_id CHAR(36) NULL,
      created_by INT UNSIGNED NULL,
      expires_at DATETIME NOT NULL,
      downloaded_at DATETIME NULL,
      download_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_document_export_jobs_expiry (expires_at),
      INDEX idx_document_export_jobs_employee (employee_id),
      CONSTRAINT fk_document_export_jobs_employee
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      CONSTRAINT fk_document_export_jobs_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);
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

async function bootstrapAdministrator() {
  const [[{ count }]] = await pool.query(`SELECT COUNT(*) AS count FROM users`);
  if (Number(count) > 0) return;

  let username = String(process.env.HRIS_BOOTSTRAP_ADMIN_USERNAME || "")
    .trim()
    .toLowerCase();
  let password = String(process.env.HRIS_BOOTSTRAP_ADMIN_PASSWORD || "");
  const name = String(process.env.HRIS_BOOTSTRAP_ADMIN_NAME || "System Administrator").trim();

  if (!username || !password) {
    console.log("No system users exist. Open the login page to create the first Super Admin.");
    return;
  }
  if (!/^[a-z0-9._-]{3,50}$/.test(username)) {
    throw new Error("HRIS_BOOTSTRAP_ADMIN_USERNAME is invalid.");
  }
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length) {
    throw new Error(`HRIS_BOOTSTRAP_ADMIN_PASSWORD must contain ${passwordErrors.join(", ")}.`);
  }

  const passwordHash = hashPassword(password);
  const [result] = await pool.execute(
    `INSERT INTO users (username, password_hash, name, role, must_change_password)
     VALUES (:username, :passwordHash, :name, 'Super Admin', 1)`,
    { username, passwordHash, name },
  );
  await recordPasswordHistory(result.insertId, passwordHash);
}

async function recordPasswordHistory(userId, passwordHash, db = pool) {
  await db.execute(
    `INSERT INTO password_history (user_id, password_hash) VALUES (:userId, :passwordHash)`,
    { userId, passwordHash },
  );
  await db.execute(
    `DELETE FROM password_history
     WHERE user_id = :userId AND id NOT IN (
       SELECT id FROM (
         SELECT id FROM password_history WHERE user_id = :userId
         ORDER BY created_at DESC, id DESC LIMIT ${PASSWORD_HISTORY_LIMIT}
       ) recent
     )`,
    { userId },
  );
}

async function isPasswordReused(userId, password, currentHash) {
  if (verifyPassword(password, currentHash)) return true;
  const [rows] = await pool.execute(
    `SELECT password_hash FROM password_history
     WHERE user_id = :userId ORDER BY created_at DESC, id DESC LIMIT ${PASSWORD_HISTORY_LIMIT}`,
    { userId },
  );
  return rows.some((row) => verifyPassword(password, row.password_hash));
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
  await pool.execute(
    `UPDATE agency_settings
     SET organization_hierarchy_json = :hierarchy
     WHERE id = 1 AND organization_hierarchy_json IS NULL`,
    { hierarchy: JSON.stringify(DEFAULT_ORGANIZATION_HIERARCHY) },
  );

  const [[departmentCount]] = await pool.query(`SELECT COUNT(*) AS count FROM departments`);
  if (Number(departmentCount.count || 0) === 0) {
    for (const [index, name] of DEFAULT_DEPARTMENTS.entries()) {
      await pool.execute(
        `INSERT INTO departments (name, sort_order)
         VALUES (:name, :sortOrder)
         ON DUPLICATE KEY UPDATE name = name`,
        { name, sortOrder: index + 1 },
      );
    }
  }

  const [[positionCount]] = await pool.query(`SELECT COUNT(*) AS count FROM positions`);
  if (Number(positionCount.count || 0) === 0) {
    for (const [index, title] of DEFAULT_POSITIONS.entries()) {
      await pool.execute(
        `INSERT INTO positions (title, sort_order)
         VALUES (:title, :sortOrder)
         ON DUPLICATE KEY UPDATE title = title`,
        { title, sortOrder: index + 1 },
      );
    }
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

  const obsoleteConditions = OBSOLETE_HOSPITAL_REFERENCE_VALUES.map(
    () => "(category = ? AND code = ?)",
  ).join(" OR ");
  const obsoleteParams = OBSOLETE_HOSPITAL_REFERENCE_VALUES.flat();
  await pool.query(
    `UPDATE hr_reference_values
     SET parent_id = NULL
     WHERE parent_id IN (
       SELECT id FROM (
         SELECT id FROM hr_reference_values WHERE ${obsoleteConditions}
       ) obsolete
     )`,
    obsoleteParams,
  );
  await pool.query(
    `DELETE FROM hr_reference_values
     WHERE ${obsoleteConditions}`,
    obsoleteParams,
  );

  const [[referenceCount]] = await pool.query(`SELECT COUNT(*) AS count FROM hr_reference_values`);
  if (Number(referenceCount.count || 0) === 0) {
    for (const value of DEFAULT_REFERENCE_VALUES) {
      await pool.execute(
        `INSERT INTO hr_reference_values (
           category, code, name, description, is_active, effective_from, effective_to, sort_order
         )
         VALUES (
           :category, :code, :name, :description, 1, NULL, NULL, :sortOrder
         )`,
        {
          category: value.category,
          code: value.code,
          name: value.name,
          description: value.description || null,
          sortOrder: value.sortOrder || 0,
        },
      );
    }

    for (const value of DEFAULT_REFERENCE_VALUES.filter((item) => item.parentCode)) {
      await pool.execute(
        `UPDATE hr_reference_values child
         JOIN hr_reference_values parent
           ON parent.category = :parentCategory AND parent.code = :parentCode
         SET child.parent_id = parent.id
         WHERE child.category = :category
           AND child.code = :code`,
        {
          category: value.category,
          code: value.code,
          parentCategory: value.parentCategory,
          parentCode: value.parentCode,
        },
      );
    }

    for (const [sectorCode, officeCodes] of Object.entries(OFFICE_SECTOR_PARENT_CODES)) {
      await pool.query(
        `UPDATE hr_reference_values child
         JOIN hr_reference_values parent
           ON parent.category = 'sectors' AND parent.code = ?
         SET child.parent_id = parent.id
         WHERE child.category = 'offices'
           AND child.code IN (${officeCodes.map(() => "?").join(",")})`,
        [sectorCode, ...officeCodes],
      );
    }
  }
  await pool.execute(
    `UPDATE plantilla_items pi
     JOIN hr_reference_values office_ref ON office_ref.id = pi.office_ref_id
     SET pi.sector_ref_id = office_ref.parent_id
     WHERE pi.office_ref_id IS NOT NULL
       AND office_ref.parent_id IS NOT NULL`,
  );
  await pool.execute(
    `UPDATE plantilla_items pi
     LEFT JOIN hr_reference_values sector_ref ON sector_ref.id = pi.sector_ref_id
     SET pi.sector_ref_id = NULL
     WHERE pi.office_ref_id IS NULL
       AND sector_ref.category = 'sectors'
       AND sector_ref.code = 'MUNICIPAL'`,
  );
  await pool.execute(
    `UPDATE hr_reference_values
     SET is_active = 0
     WHERE category = 'sectors'
       AND code = 'MUNICIPAL'`,
  );

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
            e.employee_no, ${EMPLOYEE_DISPLAY_NAME_SQL} AS employee_name
     FROM sessions s
     INNER JOIN users u ON u.id = s.user_id
     LEFT JOIN employees e ON e.id = u.employee_id
     WHERE s.id = :token AND s.expires_at > NOW() AND u.is_active = 1
     LIMIT 1`,
    { token },
  );

  if (!rows[0]) return null;
  rows[0].permissions = await permissionsForRole(rows[0].role);
  return publicUser(rows[0]);
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
  if (!(await hasPermission(user, "admin.users"))) {
    json(res, 403, { error: "Admin access required" });
    return null;
  }
  return user;
}

async function requirePermission(req, res, permissionKey, message = "Access required") {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!(await hasPermission(user, permissionKey))) {
    json(res, 403, { error: message });
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

function getIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  return forwarded || req.socket.remoteAddress || null;
}

async function handleLogin(req, res) {
  const body = await readBody(req);
  const username = String(body.username || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  const expectedRole = normalizeRole(body.role);

  if (!username || !password) {
    return json(res, 400, { error: "Username and password are required" });
  }

  if (expectedRole && !ROLES.includes(expectedRole)) {
    return json(res, 400, { error: "Invalid role selected" });
  }

  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.password_hash, u.name, u.role, u.photo_url, u.must_change_password,
            u.failed_login_attempts, u.locked_at, u.employee_id,
            e.employee_no, ${EMPLOYEE_DISPLAY_NAME_SQL} AS employee_name
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     WHERE u.username = :username AND u.is_active = 1
     LIMIT 1`,
    { username },
  );
  const user = rows[0];

  if (!user) {
    await logAudit(null, "auth.login_failed", { username, reason: "invalid_credentials" }, req);
    return json(res, 401, { error: "Invalid username or password" });
  }

  if (user.locked_at) {
    await logAudit(user.id, "auth.login_blocked", { username, reason: "account_locked" }, req);
    return json(res, 423, { error: "Account is locked. Contact the system administrator." });
  }

  if (!verifyPassword(password, user.password_hash)) {
    const failedLoginAttempts = Math.min(
      MAX_FAILED_LOGIN_ATTEMPTS,
      Number(user.failed_login_attempts || 0) + 1,
    );
    const shouldLock = failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
    await pool.execute(
      `UPDATE users
       SET failed_login_attempts = :failedLoginAttempts,
           locked_at = CASE WHEN :shouldLock = 1 THEN NOW() ELSE locked_at END
       WHERE id = :id`,
      { id: user.id, failedLoginAttempts, shouldLock: shouldLock ? 1 : 0 },
    );
    if (shouldLock) await pool.execute(`DELETE FROM sessions WHERE user_id = :id`, { id: user.id });
    await logAudit(
      user.id,
      shouldLock ? "auth.account_locked" : "auth.login_failed",
      { username, failedLoginAttempts, reason: "invalid_credentials" },
      req,
    );
    return shouldLock
      ? json(res, 423, { error: "Account is locked. Contact the system administrator." })
      : json(res, 401, { error: "Invalid username or password" });
  }

  if (expectedRole && user.role !== expectedRole) {
    await logAudit(user.id, "auth.login_failed", { username, reason: "role_mismatch" }, req);
    return json(res, 403, { error: "Selected role does not match this account" });
  }

  await pool.execute(
    `UPDATE users SET failed_login_attempts = 0, locked_at = NULL WHERE id = :id`,
    { id: user.id },
  );

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await pool.execute(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES (:token, :userId, :expiresAt)`,
    { token, userId: user.id, expiresAt },
  );
  await logAudit(user.id, "auth.login", { username }, req);

  user.permissions = await permissionsForRole(user.role);
  return json(
    res,
    200,
    { user: publicUser(user) },
    { "Set-Cookie": sessionCookie(token, expiresAt) },
  );
}

async function handleBootstrapStatus(req, res) {
  const [[{ count }]] = await pool.query(`SELECT COUNT(*) AS count FROM users`);
  return json(res, 200, { setupRequired: Number(count || 0) === 0 });
}

async function handleBootstrapSuperAdmin(req, res) {
  const [[{ count }]] = await pool.query(`SELECT COUNT(*) AS count FROM users`);
  if (Number(count || 0) > 0) {
    return json(res, 409, { error: "Initial setup is already complete" });
  }

  const body = await readBody(req);
  const username = String(body.username || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  const confirmPassword = String(body.confirmPassword || "");
  const name = String(body.name || "System Administrator").trim();

  if (!/^[a-z0-9._-]{3,50}$/.test(username)) {
    return json(res, 400, {
      error: "Username must be 3-50 characters using letters, numbers, dot, dash, or underscore",
    });
  }
  if (!name || name.length > 150) {
    return json(res, 400, { error: "Full name is required and must be 150 characters or fewer" });
  }
  if (password !== confirmPassword) {
    return json(res, 400, { error: "Passwords do not match" });
  }
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length) {
    return json(res, 400, { error: `Password must contain ${passwordErrors.join(", ")}.` });
  }

  const passwordHash = hashPassword(password);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[current]] = await connection.query(`SELECT COUNT(*) AS count FROM users FOR UPDATE`);
    if (Number(current.count || 0) > 0) {
      await connection.rollback();
      return json(res, 409, { error: "Initial setup is already complete" });
    }
    const [result] = await connection.execute(
      `INSERT INTO users (username, password_hash, name, role, must_change_password)
       VALUES (:username, :passwordHash, :name, 'Super Admin', 0)`,
      { username, passwordHash, name },
    );
    await recordPasswordHistory(result.insertId, passwordHash, connection);
    await connection.commit();
    rolePermissionCache = null;
    await logAudit(result.insertId, "auth.bootstrap_super_admin", { username }, req);
    return json(res, 201, { ok: true, username });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // Ignore rollback errors from an already-finished transaction.
    }
    if (error?.code === "ER_DUP_ENTRY") {
      return json(res, 409, { error: "Username already exists" });
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function handleLogout(req, res) {
  const user = await getSessionUser(req);
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) {
    await pool.execute(`DELETE FROM sessions WHERE id = :token`, { token });
  }
  if (user) await logAudit(user.id, "auth.logout", null, req);
  return json(res, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
}

async function handleProfileUpdate(req, res) {
  const user = await getSessionUser(req);
  if (!user) return json(res, 401, { error: "Not authenticated" });

  const body = await readBody(req);
  const name = String(body.name || "").trim();
  let photoUrl;
  try {
    photoUrl =
      body.photoUrl !== undefined
        ? validateImageDataUrl(body.photoUrl, "Profile photo", MAX_PROFILE_IMAGE_BYTES) || null
        : user.photoUrl || null;
  } catch (error) {
    return json(res, 400, { error: error.message });
  }

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
            e.employee_no, ${EMPLOYEE_DISPLAY_NAME_SQL} AS employee_name
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     WHERE u.id = :id LIMIT 1`,
    { id: user.id },
  );
  rows[0].permissions = await permissionsForRole(rows[0].role);
  return json(res, 200, { user: publicUser(rows[0]) });
}

async function handleChangePassword(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  const body = await readBody(req);
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");
  if (newPassword !== confirmPassword) {
    return json(res, 400, { error: "New passwords do not match" });
  }

  const passwordErrors = validatePassword(newPassword);
  if (passwordErrors.length) {
    return json(res, 400, { error: `New password must contain ${passwordErrors.join(", ")}.` });
  }

  const [rows] = await pool.execute(
    `SELECT id, username, password_hash, name, role, photo_url, must_change_password
     FROM users WHERE id = :id AND is_active = 1 LIMIT 1`,
    { id: user.id },
  );
  const row = rows[0];
  if (!row) return json(res, 404, { error: "User not found" });
  if (!row.must_change_password)
    return json(res, 409, { error: "No temporary password change is required" });

  if (await isPasswordReused(user.id, newPassword, row.password_hash)) {
    return json(res, 400, { error: "New password cannot match your current or recent passwords" });
  }

  const passwordHash = hashPassword(newPassword);
  await recordPasswordHistory(user.id, row.password_hash);
  await pool.execute(
    `UPDATE users SET password_hash = :passwordHash, must_change_password = 0 WHERE id = :id`,
    { id: user.id, passwordHash },
  );
  await recordPasswordHistory(user.id, passwordHash);
  const currentToken = parseCookies(req)[SESSION_COOKIE];
  await pool.execute(`DELETE FROM sessions WHERE user_id = :id AND id <> :currentToken`, {
    id: user.id,
    currentToken: currentToken || "",
  });
  await logAudit(user.id, "auth.change_password", null, req);

  const [updated] = await pool.execute(
    `SELECT u.id, u.username, u.name, u.role, u.photo_url, u.must_change_password, u.employee_id,
            e.employee_no, ${EMPLOYEE_DISPLAY_NAME_SQL} AS employee_name
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     WHERE u.id = :id LIMIT 1`,
    { id: user.id },
  );
  updated[0].permissions = await permissionsForRole(updated[0].role);
  return json(res, 200, { user: publicUser(updated[0]) });
}

async function handleListUsers(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.name, u.role, u.is_active, u.must_change_password,
            u.failed_login_attempts, u.locked_at, u.employee_id,
            u.created_at, u.updated_at, e.employee_no, ${EMPLOYEE_DISPLAY_NAME_SQL} AS employee_name
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     ORDER BY u.name ASC, u.username ASC`,
  );
  return json(res, 200, { users: rows.map(adminUser) });
}

async function hasActiveSuperAdmin(excludeUserId = null) {
  const params = {};
  let excludeSql = "";
  if (excludeUserId !== null && excludeUserId !== undefined) {
    params.excludeUserId = excludeUserId;
    excludeSql = "AND id <> :excludeUserId";
  }
  const [[row]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM users WHERE role = 'Super Admin' AND is_active = 1 ${excludeSql}`,
    params,
  );
  return Number(row.total || 0) > 0;
}

async function handleCreateUser(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const body = await readBody(req);
  const username = String(body.username || "")
    .trim()
    .toLowerCase();
  const name = String(body.name || "").trim();
  const role = normalizeRole(body.role);
  const employeeId = body.employeeId ? String(body.employeeId).trim() : null;
  const temporaryPassword = generateTemporaryPassword();

  if (!username || !/^[a-z0-9._-]{3,50}$/.test(username)) {
    return json(res, 400, {
      error: "Username must be 3-50 characters using letters, numbers, dot, underscore, or dash",
    });
  }
  if (!name || name.length > 150) return json(res, 400, { error: "Full name is required" });
  if (!ROLES.includes(role)) return json(res, 400, { error: "Invalid role" });
  if (role === "Super Admin" && admin.role !== "Super Admin" && (await hasActiveSuperAdmin())) {
    return json(res, 403, { error: "Only a Super Admin can create more Super Admin accounts" });
  }
  if (employeeId) {
    const employee = await readEmployeeById(employeeId);
    if (!employee) return json(res, 400, { error: "Linked employee not found" });
  }

  try {
    const passwordHash = hashPassword(temporaryPassword);
    const [result] = await pool.execute(
      `INSERT INTO users (username, password_hash, name, role, employee_id, must_change_password)
       VALUES (:username, :passwordHash, :name, :role, :employeeId, 1)`,
      { username, passwordHash, name, role, employeeId },
    );
    await recordPasswordHistory(result.insertId, passwordHash);
    await logAudit(
      admin.id,
      "users.create",
      { userId: result.insertId, username, role, employeeId },
      req,
    );
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.name, u.role, u.is_active, u.must_change_password,
              u.failed_login_attempts, u.locked_at, u.employee_id,
              u.created_at, u.updated_at, e.employee_no, ${EMPLOYEE_DISPLAY_NAME_SQL} AS employee_name
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
  const role = normalizeRole(body.role);
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

  const connection = await pool.getConnection();
  let existing;
  try {
    await connection.beginTransaction();
    const [existingRows] = await connection.execute(
      `SELECT role, is_active FROM users WHERE id = :id LIMIT 1 FOR UPDATE`,
      { id },
    );
    existing = existingRows[0];
    if (!existing) {
      await connection.rollback();
      return json(res, 404, { error: "User not found" });
    }
    if (
      admin.role !== "Super Admin" &&
      (existing.role === "Super Admin" || role === "Super Admin")
    ) {
      await connection.rollback();
      return json(res, 403, { error: "Only a Super Admin can manage Super Admin accounts" });
    }
    if (existing.role === "Super Admin" && (role !== "Super Admin" || isActive === 0)) {
      const [activeSuperAdmins] = await connection.execute(
        `SELECT id FROM users WHERE role='Super Admin' AND is_active=1 FOR UPDATE`,
      );
      if (activeSuperAdmins.length <= 1) {
        await connection.rollback();
        return json(res, 409, { error: "At least one active Super Admin must remain" });
      }
    }

    await connection.execute(
      `UPDATE users SET name = :name, role = :role, employee_id = :employeeId, is_active = :isActive WHERE id = :id`,
      { id, name, role, employeeId, isActive },
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
  const accessChanged = existing.role !== role || Boolean(existing.is_active) !== Boolean(isActive);
  if (accessChanged) await pool.execute(`DELETE FROM sessions WHERE user_id = :id`, { id });
  await logAudit(
    admin.id,
    "users.update",
    { userId: id, role, employeeId, isActive: Boolean(isActive) },
    req,
  );
  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.name, u.role, u.is_active, u.must_change_password,
            u.failed_login_attempts, u.locked_at, u.employee_id,
            u.created_at, u.updated_at, e.employee_no, ${EMPLOYEE_DISPLAY_NAME_SQL} AS employee_name
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

  const connection = await pool.getConnection();
  let existing;
  try {
    await connection.beginTransaction();
    const [[row]] = await connection.execute(
      `SELECT role, is_active FROM users WHERE id = :id LIMIT 1 FOR UPDATE`,
      { id },
    );
    existing = row;
    if (!existing) {
      await connection.rollback();
      return json(res, 404, { error: "User not found" });
    }
    if (existing.role === "Super Admin" && admin.role !== "Super Admin") {
      await connection.rollback();
      return json(res, 403, { error: "Only a Super Admin can delete Super Admin accounts" });
    }
    if (existing.role === "Super Admin" && existing.is_active) {
      const [activeSuperAdmins] = await connection.execute(
        `SELECT id FROM users WHERE role='Super Admin' AND is_active=1 FOR UPDATE`,
      );
      if (activeSuperAdmins.length <= 1) {
        await connection.rollback();
        return json(res, 409, { error: "At least one active Super Admin must remain" });
      }
    }

    const [result] = await connection.execute(`DELETE FROM users WHERE id = :id`, { id });
    await connection.commit();
    if (result.affectedRows === 0) return json(res, 404, { error: "User not found" });
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
  await logAudit(admin.id, "users.delete", { userId: id }, req);
  return json(res, 200, { ok: true });
}

async function handleResetUserPassword(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const body = await readBody(req);
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");
  if (newPassword !== confirmPassword) {
    return json(res, 400, { error: "Passwords do not match" });
  }
  const passwordErrors = validatePassword(newPassword);
  if (passwordErrors.length) {
    return json(res, 400, { error: `New password must contain ${passwordErrors.join(", ")}.` });
  }
  const [existingRows] = await pool.execute(
    `SELECT password_hash, role FROM users WHERE id = :id LIMIT 1`,
    { id },
  );
  if (!existingRows[0]) return json(res, 404, { error: "User not found" });
  if (existingRows[0].role === "Super Admin" && admin.role !== "Super Admin") {
    return json(res, 403, { error: "Only a Super Admin can reset Super Admin passwords" });
  }
  if (await isPasswordReused(id, newPassword, existingRows[0].password_hash)) {
    return json(res, 400, { error: "New password cannot match the current or recent passwords" });
  }
  const passwordHash = hashPassword(newPassword);
  await recordPasswordHistory(id, existingRows[0].password_hash);
  await pool.execute(
    `UPDATE users
     SET password_hash = :passwordHash, must_change_password = 0,
         failed_login_attempts = 0, locked_at = NULL
     WHERE id = :id`,
    { id, passwordHash },
  );
  await recordPasswordHistory(id, passwordHash);
  await pool.execute(`DELETE FROM sessions WHERE user_id = :id`, { id });
  await logAudit(admin.id, "users.set_password", { userId: id }, req);
  const [updatedRows] = await pool.execute(
    `SELECT u.id, u.username, u.name, u.role, u.is_active, u.must_change_password,
            u.failed_login_attempts, u.locked_at, u.employee_id,
            u.created_at, u.updated_at, e.employee_no, ${EMPLOYEE_DISPLAY_NAME_SQL} AS employee_name
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     WHERE u.id = :id LIMIT 1`,
    { id },
  );
  return json(res, 200, { user: adminUser(updatedRows[0]) });
}

async function handleResetUserTemporaryPassword(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[existing]] = await connection.execute(
      `SELECT u.id, u.username, u.name, u.role, u.password_hash, u.employee_id,
              e.employee_no, e.lastname, e.firstname
       FROM users u
       LEFT JOIN employees e ON e.id = u.employee_id
       WHERE u.id = :id
       LIMIT 1
       FOR UPDATE`,
      { id },
    );
    if (!existing) {
      await connection.rollback();
      return json(res, 404, { error: "User not found" });
    }
    if (existing.role === "Super Admin" && admin.role !== "Super Admin") {
      await connection.rollback();
      return json(res, 403, {
        error: "Only a Super Admin can reset Super Admin passwords",
      });
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = hashPassword(temporaryPassword);
    await recordPasswordHistory(id, existing.password_hash, connection);
    await connection.execute(
      `UPDATE users
       SET password_hash = :passwordHash, must_change_password = 1,
           failed_login_attempts = 0, locked_at = NULL
       WHERE id = :id`,
      { id, passwordHash },
    );
    await recordPasswordHistory(id, passwordHash, connection);
    await connection.execute(`DELETE FROM sessions WHERE user_id = :id`, { id });
    await connection.commit();

    const [updatedRows] = await pool.execute(
      `SELECT u.id, u.username, u.name, u.role, u.is_active, u.must_change_password,
              u.failed_login_attempts, u.locked_at, u.employee_id,
              u.created_at, u.updated_at, e.employee_no, ${EMPLOYEE_DISPLAY_NAME_SQL} AS employee_name
       FROM users u
       LEFT JOIN employees e ON e.id = u.employee_id
       WHERE u.id = :id LIMIT 1`,
      { id },
    );
    await logAudit(admin.id, "users.reset_temporary_password", { userId: id }, req);
    return json(res, 200, {
      user: adminUser(updatedRows[0]),
      account: {
        userId: existing.id,
        employeeId: existing.employee_id || "",
        employeeNo: existing.employee_no || "",
        employeeName: formatEmployeeName(existing) || existing.name,
        username: existing.username,
        temporaryPassword,
      },
    });
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

async function handleUnlockUser(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const [[existing]] = await pool.execute(`SELECT role FROM users WHERE id = :id LIMIT 1`, { id });
  if (!existing) return json(res, 404, { error: "User not found" });
  if (existing.role === "Super Admin" && admin.role !== "Super Admin") {
    return json(res, 403, { error: "Only a Super Admin can unlock Super Admin accounts" });
  }

  const [result] = await pool.execute(
    `UPDATE users SET failed_login_attempts = 0, locked_at = NULL WHERE id = :id`,
    { id },
  );
  if (result.affectedRows === 0) return json(res, 404, { error: "User not found" });
  await logAudit(admin.id, "users.unlock", { userId: id }, req);
  return json(res, 200, { ok: true });
}

async function handleListRolePermissions(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (
    !(await hasPermission(user, "role_permissions.manage")) &&
    !(await hasPermission(user, "admin.users"))
  ) {
    return json(res, 403, { error: "Role permission access required" });
  }
  const matrix = rolePermissionCache || (await loadRolePermissionCache());
  return json(res, 200, permissionMatrixResponse(matrix));
}

async function handleUpdateRolePermissions(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!(await hasPermission(user, "role_permissions.manage"))) {
    return json(res, 403, { error: "Role permission management required" });
  }

  const body = await readBody(req);
  const role = normalizeRole(body.role);
  const permissions = Array.isArray(body.permissions) ? body.permissions.map(String) : null;
  if (!ROLES.includes(role)) return json(res, 400, { error: "Invalid role" });
  if (!permissions) return json(res, 400, { error: "Permissions must be an array" });
  const invalid = permissions.filter((permission) => !PERMISSION_KEYS.has(permission));
  if (invalid.length) {
    return json(res, 400, { error: `Invalid permission: ${invalid[0]}` });
  }

  const nextPermissions = new Set(permissions);
  if (role === "Super Admin") {
    for (const key of LOCKED_SUPER_ADMIN_PERMISSIONS) nextPermissions.add(key);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const permission of PERMISSIONS) {
      await connection.execute(
        `INSERT INTO role_permissions (role, permission_key, allowed, updated_by)
         VALUES (:role, :permissionKey, :allowed, :userId)
         ON DUPLICATE KEY UPDATE allowed = VALUES(allowed), updated_by = VALUES(updated_by)`,
        {
          role,
          permissionKey: permission.key,
          allowed: nextPermissions.has(permission.key) ? 1 : 0,
          userId: user.id,
        },
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  rolePermissionCache = null;
  await pool.execute(
    `DELETE s FROM sessions s
      INNER JOIN users u ON u.id = s.user_id
     WHERE u.role = :role AND u.id <> :currentUserId`,
    { role, currentUserId: user.id },
  );
  await logAudit(
    user.id,
    "roles.permissions_update",
    { role, permissions: Array.from(nextPermissions).sort() },
    req,
  );
  const matrix = await loadRolePermissionCache();
  return json(res, 200, permissionMatrixResponse(matrix));
}

async function handleDashboard(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!(await hasPermission(user, "dashboard.view"))) {
    return json(res, 403, { error: "Dashboard access required" });
  }
  if (!(await hasPermission(user, "employees.read"))) {
    return json(res, 403, { error: "Employee analytics access required" });
  }

  const [[totals]] = await pool.query(`
    SELECT
      COUNT(*) AS totalEmployees,
      SUM(status = 'Permanent' OR status = 'Regular') AS regularEmployees,
      SUM(status IN ('JO','COS','JO/COS','Job Order','Contract of Service','Contractual')) AS jobOrderEmployees
    FROM employees
    WHERE is_hidden = 0
  `);
  const [[assignmentTotals]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM plantilla_items WHERE item_status = 'Active') AS authorizedPlantilla,
      (SELECT COUNT(*) FROM plantilla_occupancies po JOIN employees e ON e.id=po.employee_id AND e.is_hidden=0 WHERE po.status = 'Active') AS filledPlantilla,
      (SELECT COUNT(DISTINCT ne.employee_id) FROM non_plantilla_engagements ne JOIN employees e ON e.id=ne.employee_id AND e.is_hidden=0 WHERE ne.status = 'Active') AS activeNonPlantilla,
      (SELECT COUNT(*) FROM personnel_movements pm JOIN employees e ON e.id=pm.employee_id AND e.is_hidden=0 WHERE pm.status = 'Scheduled') AS scheduledAppointments,
      (SELECT COUNT(*) FROM non_plantilla_engagements ne JOIN employees e ON e.id=ne.employee_id AND e.is_hidden=0 WHERE ne.status = 'Active' AND ne.date_to BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS expiringEngagements,
      (SELECT COUNT(*) FROM employees e WHERE e.is_hidden = 0 AND NOT EXISTS (SELECT 1 FROM plantilla_occupancies po WHERE po.employee_id=e.id AND po.status='Active') AND NOT EXISTS (SELECT 1 FROM non_plantilla_engagements ne WHERE ne.employee_id=e.id AND ne.status='Active')) AS awaitingAssignment
  `);

  const [byDivision] = await pool.query(`
    SELECT department,
           SUM(emp_status = 'Active') AS filled,
           SUM(emp_status <> 'Active') AS unfilled,
           COUNT(*) AS total
    FROM employees
    WHERE is_hidden = 0
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
    WHERE is_hidden = 0
    GROUP BY COALESCE(NULLIF(TRIM(department), ''), 'Unspecified')
    ORDER BY department ASC
  `);

  const [byPosition] = await pool.query(`
    SELECT department, position,
           SUM(emp_status = 'Active') AS filled,
           SUM(emp_status <> 'Active') AS unfilled,
           COUNT(*) AS total
    FROM employees
    WHERE is_hidden = 0
    GROUP BY department, position
    ORDER BY department ASC, position ASC
  `);

  const [byEmploymentStatus] = await pool.query(`
    SELECT status,
           SUM(emp_status = 'Active') AS active,
           SUM(emp_status <> 'Active') AS inactive,
           COUNT(*) AS total
    FROM employees
    WHERE is_hidden = 0
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
    WHERE is_hidden = 0 AND birthday IS NOT NULL
    GROUP BY ageGroup
    ORDER BY FIELD(ageGroup, 'Under 30', '30-39', '40-49', '50-59', '60+')
  `);

  const [hiringTrend] = await pool.query(`
    SELECT YEAR(COALESCE(date_hired, date_employed)) AS year,
           COUNT(*) AS hired
    FROM employees
    WHERE is_hidden = 0 AND COALESCE(date_hired, date_employed) IS NOT NULL
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
    assignmentTotals: {
      authorizedPlantilla: Number(assignmentTotals.authorizedPlantilla || 0),
      filledPlantilla: Number(assignmentTotals.filledPlantilla || 0),
      vacantPlantilla: Math.max(
        0,
        Number(assignmentTotals.authorizedPlantilla || 0) -
          Number(assignmentTotals.filledPlantilla || 0),
      ),
      activeNonPlantilla: Number(assignmentTotals.activeNonPlantilla || 0),
      scheduledAppointments: Number(assignmentTotals.scheduledAppointments || 0),
      expiringEngagements: Number(assignmentTotals.expiringEngagements || 0),
      awaitingAssignment: Number(assignmentTotals.awaitingAssignment || 0),
    },
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
  const empStatus = String(url.searchParams.get("empStatus") || "").trim();
  const gender = String(url.searchParams.get("gender") || "").trim();
  const archiveScope = String(url.searchParams.get("archive") || "active").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 10)));
  const offset = (page - 1) * pageSize;
  const where =
    archiveScope === "archived"
      ? [`is_hidden = 1`]
      : archiveScope === "all"
        ? []
        : [`is_hidden = 0`];
  const params = {};

  if (q) {
    where.push(
      `(employee_no LIKE :q OR biometric_id LIKE :q OR firstname LIKE :q OR middlename LIKE :q OR lastname LIKE :q OR email LIKE :q)`,
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
  if (empStatus) {
    where.push(`emp_status = :empStatus`);
    params.empStatus = empStatus;
  }
  if (gender) {
    where.push(`gender = :gender`);
    params.gender = gender;
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

function attendanceWhereClause({ employeeId, from, to, q = "", recordSearch = "" }) {
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
  if (recordSearch) {
    where.push(
      `(e.employee_no LIKE :recordSearch OR e.biometric_id LIKE :recordSearch OR e.firstname LIKE :recordSearch OR e.lastname LIKE :recordSearch OR e.department LIKE :recordSearch OR d.work_date LIKE :recordSearch OR d.am_in LIKE :recordSearch OR d.am_out LIKE :recordSearch OR d.pm_in LIKE :recordSearch OR d.pm_out LIKE :recordSearch OR d.status LIKE :recordSearch OR d.remarks LIKE :recordSearch OR d.display_label LIKE :recordSearch OR st.name LIKE :recordSearch OR st.code LIKE :recordSearch OR d.late_minutes LIKE :recordSearch)`,
    );
    params.recordSearch = `%${recordSearch}%`;
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { whereSql, params };
}

async function readAttendanceRows({
  employeeId,
  from,
  to,
  q = "",
  recordSearch = "",
  limit = 500,
  offset = 0,
}) {
  const { whereSql, params } = attendanceWhereClause({ employeeId, from, to, q, recordSearch });
  const safeLimit = Math.min(2000, Math.max(1, Number(limit || 500)));
  const safeOffset = Math.max(0, Number(offset || 0));
  const [rows] = await pool.execute(
    `SELECT d.*, e.employee_no, e.biometric_id, e.department, e.position,
            ${EMPLOYEE_DISPLAY_NAME_SQL} AS employee_name,
            st.code AS shift_code, st.name AS shift_name, st.shift_type,
            u.name AS edited_by_name
     FROM dtr_entries d
     INNER JOIN employees e ON e.id = d.employee_id
     LEFT JOIN shift_templates st ON st.id = d.shift_template_id
     LEFT JOIN users u ON u.id = d.edited_by
     ${whereSql}
     ORDER BY d.work_date DESC, e.lastname ASC, e.firstname ASC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params,
  );
  return rows.map(attendanceDtrRow);
}

async function readAttendancePage({
  employeeId,
  from,
  to,
  q = "",
  recordSearch = "",
  page,
  pageSize,
}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(200, Math.max(10, Number(pageSize) || 50));
  const offset = (safePage - 1) * safePageSize;
  const { whereSql, params } = attendanceWhereClause({ employeeId, from, to, q, recordSearch });
  const [[countRow]] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM dtr_entries d
     INNER JOIN employees e ON e.id = d.employee_id
     LEFT JOIN shift_templates st ON st.id = d.shift_template_id
     ${whereSql}`,
    params,
  );
  const [[summaryRow]] = await pool.execute(
    `SELECT
       SUM(CASE WHEN d.status IN ('Present', 'Late') THEN 1 ELSE 0 END) AS present,
       SUM(CASE WHEN d.status = 'Incomplete' THEN 1 ELSE 0 END) AS incomplete,
       COALESCE(SUM(d.late_minutes), 0) AS late_minutes
     FROM dtr_entries d
     INNER JOIN employees e ON e.id = d.employee_id
     LEFT JOIN shift_templates st ON st.id = d.shift_template_id
     ${whereSql}`,
    params,
  );
  const rows = await readAttendanceRows({
    employeeId,
    from,
    to,
    q,
    recordSearch,
    limit: safePageSize,
    offset,
  });

  return {
    rows,
    total: Number(countRow.total || 0),
    page: safePage,
    pageSize: safePageSize,
    summary: {
      present: Number(summaryRow.present || 0),
      incomplete: Number(summaryRow.incomplete || 0),
      lateMinutes: Number(summaryRow.late_minutes || 0),
    },
  };
}

function defaultAttendanceRange(url) {
  const now = new Date();
  const today = formatLocalDate(now);
  return {
    from: String(url.searchParams.get("from") || today).slice(0, 10),
    to: String(url.searchParams.get("to") || today).slice(0, 10),
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
    `SELECT id, employee_no, firstname, middlename, lastname, name_ext
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
  const source = entry.source || "Imported";
  const lockFields = entry.lockFields || {};
  const stats = calculateAttendanceStats(entry);
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
    shiftTemplateId: entry.shiftTemplateId || null,
    reviewFlags: JSON.stringify(entry.reviewFlags || []),
    amInLocked: lockFields.amIn ? 1 : 0,
    amOutLocked: lockFields.amOut ? 1 : 0,
    pmInLocked: lockFields.pmIn ? 1 : 0,
    pmOutLocked: lockFields.pmOut ? 1 : 0,
    editedBy: source === "Imported" ? null : userId,
  };

  if (preserveAdjusted) {
    const [[existing]] = await connection.execute(
      `SELECT * FROM dtr_entries
       WHERE employee_id = :employeeId AND work_date = :workDate
       LIMIT 1 FOR UPDATE`,
      { employeeId: entry.employeeId, workDate: entry.workDate },
    );
    if (existing) {
      if (existing.display_label) return;
      const existingLocks = dtrLockFields(existing);
      const hasLockedSlot = Object.values(existingLocks).some(Boolean);
      const mergedEntry = {
        ...entry,
        amIn: existingLocks.amIn ? formatTime(existing.am_in) : params.amIn,
        amOut: existingLocks.amOut ? formatTime(existing.am_out) : params.amOut,
        pmIn: existingLocks.pmIn ? formatTime(existing.pm_in) : params.pmIn,
        pmOut: existingLocks.pmOut ? formatTime(existing.pm_out) : params.pmOut,
      };
      const mergedStats = hasLockedSlot
        ? calculateAttendanceStatsForShift(mergedEntry, entry.shift || null)
        : stats;
      await connection.execute(
        `UPDATE dtr_entries
         SET am_in = :amIn, am_out = :amOut, pm_in = :pmIn, pm_out = :pmOut,
             status = :status, late_minutes = :lateMinutes, undertime_minutes = :undertimeMinutes,
             source = :source, import_id = :importId, shift_template_id = :shiftTemplateId,
             review_flags = :reviewFlags
         WHERE id = :id`,
        {
          id: existing.id,
          amIn: mergedEntry.amIn || null,
          amOut: mergedEntry.amOut || null,
          pmIn: mergedEntry.pmIn || null,
          pmOut: mergedEntry.pmOut || null,
          status: mergedStats.status,
          lateMinutes: mergedStats.lateMinutes,
          undertimeMinutes: mergedStats.undertimeMinutes,
          source: hasLockedSlot ? existing.source || "Adjusted" : "Imported",
          importId: entry.importId || null,
          shiftTemplateId: entry.shiftTemplateId || existing.shift_template_id || null,
          reviewFlags: JSON.stringify(entry.reviewFlags || []),
        },
      );
      return;
    }
  }

  const protectedUpdate = `am_in = VALUES(am_in),
       am_out = VALUES(am_out),
       pm_in = VALUES(pm_in),
       pm_out = VALUES(pm_out),
       status = VALUES(status),
       late_minutes = VALUES(late_minutes),
       undertime_minutes = VALUES(undertime_minutes),
       shift_template_id = VALUES(shift_template_id),
       review_flags = VALUES(review_flags),
       source = VALUES(source),
       remarks = VALUES(remarks),
       import_id = VALUES(import_id),
       am_in_locked = VALUES(am_in_locked),
       am_out_locked = VALUES(am_out_locked),
       pm_in_locked = VALUES(pm_in_locked),
       pm_out_locked = VALUES(pm_out_locked),
       edited_by = VALUES(edited_by),
       edited_at = NOW()`;

  await connection.execute(
    `INSERT INTO dtr_entries (
       id, employee_id, work_date, am_in, am_out, pm_in, pm_out, status,
       late_minutes, undertime_minutes, source, remarks, import_id, shift_template_id,
       review_flags, am_in_locked, am_out_locked, pm_in_locked, pm_out_locked, edited_by, edited_at
     ) VALUES (
       :id, :employeeId, :workDate, :amIn, :amOut, :pmIn, :pmOut, :status,
       :lateMinutes, :undertimeMinutes, :source, :remarks, :importId, :shiftTemplateId,
       :reviewFlags, :amInLocked, :amOutLocked, :pmInLocked, :pmOutLocked, :editedBy,
       IF(:editedBy IS NULL, NULL, NOW())
     )
     ON DUPLICATE KEY UPDATE ${protectedUpdate}`,
    params,
  );
}

async function resolveShiftTemplateIdByCode(code) {
  const shiftTemplateCode = String(code || "").trim();
  if (!shiftTemplateCode || shiftTemplateCode === "manual") return null;
  const [templateRows] = await pool.execute(
    `SELECT id FROM shift_templates WHERE code = :shiftTemplateCode AND active = 1 LIMIT 1`,
    { shiftTemplateCode },
  );
  if (!templateRows[0]) {
    const error = new Error("Selected shift template is invalid");
    error.statusCode = 400;
    throw error;
  }
  return templateRows[0].id;
}

function buildMatchedEntry(dutyDate, shift, allPunches, consumedPunches) {
  const duty = buildDutyWindow(dutyDate, shift);
  if (!duty) return null;

  const windowPunches = allPunches.filter(
    (punch) =>
      punch >= duty.windowStart && punch <= duty.windowEnd && !consumedPunches.has(punchKey(punch)),
  );
  const deduped = dedupePunches(windowPunches);
  const candidates = deduped.punches;
  if (!candidates.length) return null;

  const matchedKeys = new Set();
  let amIn = null;
  let amOut = null;
  let pmIn = null;
  let pmOut = null;
  let lateMinutes = 0;
  let undertimeMinutes = 0;
  let status = "Incomplete";

  if (shift.type === "split" && shift.breakStart && shift.breakEnd) {
    const breakStart = combineDateAndTime(dutyDate, shift.breakStart);
    const breakEnd = combineDateAndTime(dutyDate, shift.breakEnd);
    if (!breakStart || !breakEnd) return null;
    if (breakEnd < breakStart) breakEnd.setDate(breakEnd.getDate() + 1);

    const toleranceMinutes = Math.max(shift.earlyBuffer, shift.lateBuffer);
    const amInCutoff = midpointDate(duty.start, breakStart);

    amIn = earliestEventMatch(candidates, duty.windowStart, amInCutoff, matchedKeys);
    amOut = closestEventMatch(candidates, breakStart, matchedKeys, toleranceMinutes);
    pmIn = closestEventMatch(candidates, breakEnd, matchedKeys, toleranceMinutes);
    pmOut = latestEventMatch(
      candidates,
      pmIn || breakEnd,
      addMinutes(duty.end, shift.lateBuffer),
      matchedKeys,
    );

    if (!amIn && !pmIn) {
      amOut = null;
      pmOut = null;
      matchedKeys.clear();
    }

    lateMinutes += minutesBetweenPositive(amIn, duty.start);
    lateMinutes += minutesBetweenPositive(pmIn, breakEnd);
    undertimeMinutes = minutesBetweenPositive(duty.end, pmOut);
    if (amIn && amOut && pmIn && pmOut) status = lateMinutes > 0 ? "Late" : "Present";
  } else {
    const usable = [...candidates].sort((a, b) => a.getTime() - b.getTime());
    if (usable.length === 1) {
      const only = usable[0];
      const dutyMidpoint = midpointDate(duty.start, duty.end);
      if (only <= dutyMidpoint) {
        amIn = shift.type === "night" ? null : only;
        pmIn = shift.type === "night" ? only : null;
        matchedKeys.add(punchKey(only));
      } else {
        amOut = shift.type === "night" ? only : null;
        pmOut = shift.type === "night" ? null : only;
        matchedKeys.add(punchKey(only));
      }
    } else {
      const first = usable[0];
      const last = usable[usable.length - 1];
      if (shift.type === "night") {
        pmIn = first;
        amOut = last;
      } else {
        amIn = first;
        pmOut = last;
      }
      matchedKeys.add(punchKey(first));
      matchedKeys.add(punchKey(last));
    }

    const actualIn = shift.type === "night" ? pmIn : amIn;
    const actualOut = shift.type === "night" ? amOut : pmOut;
    lateMinutes = minutesBetweenPositive(actualIn, duty.start);
    undertimeMinutes = minutesBetweenPositive(duty.end, actualOut);
    if (actualIn && actualOut) status = lateMinutes > 0 ? "Late" : "Present";
  }

  for (const key of matchedKeys) consumedPunches.add(key);

  return {
    employeeId: null,
    workDate: dutyDate,
    amIn: timeFromDate(amIn),
    amOut: timeFromDate(amOut),
    pmIn: timeFromDate(pmIn),
    pmOut: timeFromDate(pmOut),
    status,
    lateMinutes,
    undertimeMinutes,
    shiftTemplateId: shift.id || null,
    reviewFlags: [],
    source: "Imported",
  };
}

function resolveShiftForDate(dutyDate, employee, assignments, overrides) {
  const employeeAssignments = assignments.get(String(employee.id)) || new Map();
  const assignedShift = employeeAssignments.get(dutyDate);
  if (assignedShift) return assignedShift;

  const employeeOverrides = overrides.get(String(employee.id)) || new Map();
  const override = employeeOverrides.get(dutyDate);
  if (override) return override;

  return normalizeShift(
    {
      name: "Employee Default Schedule",
      shift_type: "",
      schedule_am_in: employee.schedule_am_in,
      schedule_am_out: employee.schedule_am_out,
      schedule_pm_in: employee.schedule_pm_in,
      schedule_pm_out: employee.schedule_pm_out,
    },
    "default",
  );
}

async function loadScheduleContext(employeeIds, dutyDates) {
  const assignmentMap = new Map();
  const overrideMap = new Map();
  if (!employeeIds.length || !dutyDates.length) return { assignmentMap, overrideMap };

  const [assignments] = await pool.execute(
    `SELECT esa.employee_id, DATE_FORMAT(esa.duty_date, '%Y-%m-%d') AS duty_date,
            st.id, st.code, st.name, st.shift_type, st.start_time, st.end_time,
            st.break_start, st.break_end, st.early_buffer_minutes, st.late_buffer_minutes
     FROM employee_shift_assignments esa
     INNER JOIN shift_templates st ON st.id = esa.shift_template_id
     WHERE esa.employee_id IN (${employeeIds.map(() => "?").join(",")})
       AND esa.duty_date IN (${dutyDates.map(() => "?").join(",")})`,
    [...employeeIds, ...dutyDates],
  );
  for (const row of assignments) {
    const key = String(row.employee_id);
    if (!assignmentMap.has(key)) assignmentMap.set(key, new Map());
    assignmentMap.get(key).set(
      normalizeDate(row.duty_date),
      normalizeShift(
        {
          shift_template_id: row.id,
          shift_code: row.code,
          shift_name: row.name,
          shift_type: row.shift_type,
          start_time: row.start_time,
          end_time: row.end_time,
          break_start: row.break_start,
          break_end: row.break_end,
          early_buffer_minutes: row.early_buffer_minutes,
          late_buffer_minutes: row.late_buffer_minutes,
        },
        "assignment",
      ),
    );
  }

  const [overrides] = await pool.execute(
    `SELECT employee_id, DATE_FORMAT(work_date, '%Y-%m-%d') AS work_date,
            am_in, am_out, pm_in, pm_out
     FROM employee_schedule_overrides
     WHERE employee_id IN (${employeeIds.map(() => "?").join(",")})
       AND work_date IN (${dutyDates.map(() => "?").join(",")})`,
    [...employeeIds, ...dutyDates],
  );
  for (const row of overrides) {
    const key = String(row.employee_id);
    if (!overrideMap.has(key)) overrideMap.set(key, new Map());
    overrideMap.get(key).set(
      normalizeDate(row.work_date),
      normalizeShift(
        {
          name: "Schedule Override",
          am_in: row.am_in,
          am_out: row.am_out,
          pm_in: row.pm_in,
          pm_out: row.pm_out,
        },
        "override",
      ),
    );
  }

  return { assignmentMap, overrideMap };
}

async function refreshDtrEntries({ employeeId, from, to, userId }) {
  const employeeWhere = employeeId ? "WHERE id = :employeeId" : "";
  const [employees] = await pool.execute(
    `SELECT id, schedule_am_in, schedule_am_out, schedule_pm_in, schedule_pm_out
     FROM employees ${employeeWhere}`,
    employeeId ? { employeeId } : {},
  );
  if (!employees.length) return { recordsProcessed: 0, punchesProcessed: 0 };

  const employeeIds = employees.map((employee) => String(employee.id));
  const logWhere = [`al.employee_id IN (${employeeIds.map(() => "?").join(",")})`];
  const logParams = [...employeeIds];
  const normalizedFrom = normalizeDate(from);
  const normalizedTo = normalizeDate(to);
  if (normalizedFrom) {
    logWhere.push("al.punch_at >= ?");
    logParams.push(`${addDaysToDateString(normalizedFrom, -1)} 00:00:00`);
  }
  if (normalizedTo) {
    logWhere.push("al.punch_at <= ?");
    logParams.push(`${addDaysToDateString(normalizedTo, 2)} 23:59:59`);
  }

  const [logs] = await pool.execute(
    `SELECT al.employee_id, al.punch_at
     FROM attendance_logs al
     WHERE ${logWhere.join(" AND ")}
     ORDER BY al.employee_id, al.punch_at`,
    logParams,
  );
  const punchesByEmployee = new Map();
  for (const log of logs) {
    const punchAt = parseLocalDateTime(log.punch_at);
    if (!punchAt) continue;
    const key = String(log.employee_id);
    if (!punchesByEmployee.has(key)) punchesByEmployee.set(key, []);
    punchesByEmployee.get(key).push(punchAt);
  }

  let dutyDates = [];
  if (normalizedFrom || normalizedTo) {
    const first = normalizedFrom || normalizedTo;
    const last = normalizedTo || normalizedFrom;
    dutyDates = eachDateString(first, last);
  } else if (logs.length) {
    const allPunchDates = logs
      .map((log) => parseLocalDateTime(log.punch_at))
      .filter(Boolean)
      .sort((a, b) => a.getTime() - b.getTime());
    dutyDates = eachDateString(
      addDaysToDateString(formatLocalDate(allPunchDates[0]), -1),
      formatLocalDate(allPunchDates[allPunchDates.length - 1]),
    );
  }
  if (!dutyDates.length) return { recordsProcessed: 0, punchesProcessed: logs.length };

  const { assignmentMap, overrideMap } = await loadScheduleContext(employeeIds, dutyDates);
  const warnings = [];
  const [preservedRows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM dtr_entries
     WHERE employee_id IN (${employeeIds.map(() => "?").join(",")})
       AND work_date IN (${dutyDates.map(() => "?").join(",")})
       AND (am_in_locked = 1 OR am_out_locked = 1 OR pm_in_locked = 1 OR pm_out_locked = 1
            OR display_label IS NOT NULL)`,
    [...employeeIds, ...dutyDates],
  );
  const preservedCount = Number(preservedRows[0]?.count || 0);
  if (preservedCount) {
    warnings.push(`${preservedCount} locked or labeled DTR row(s) were partially preserved`);
  }
  const connection = await pool.getConnection();
  let recordsProcessed = 0;
  try {
    await connection.beginTransaction();
    for (const employee of employees) {
      const employeePunches = punchesByEmployee.get(String(employee.id)) || [];
      const consumedPunches = new Set();
      for (const dutyDate of dutyDates) {
        const shift = resolveShiftForDate(dutyDate, employee, assignmentMap, overrideMap);
        if (!shift) continue;
        const entry = buildMatchedEntry(dutyDate, shift, employeePunches, consumedPunches);
        if (!entry) continue;
        await upsertDtrEntry(
          connection,
          {
            ...entry,
            employeeId: employee.id,
            shift,
          },
          userId,
          true,
        );
        recordsProcessed += 1;
      }
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return { recordsProcessed, punchesProcessed: logs.length, warnings };
}

async function handleListDtrEntries(req, res, url) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return;
  const { from, to } = defaultAttendanceRange(url);
  let employeeId = String(url.searchParams.get("employeeId") || "").trim();
  const q = String(url.searchParams.get("q") || "").trim();
  const recordSearch = String(url.searchParams.get("recordSearch") || "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(200, Math.max(10, Number(url.searchParams.get("pageSize")) || 50));
  const canReadAll = await canReadAllAttendance(user);

  if (employeeId && !(await canReadEmployeeAttendance(user, employeeId))) {
    return json(res, 403, { error: "You can only view your own DTR" });
  }
  if (!employeeId && !canReadAll) {
    if (await hasPermission(user, "self_service.access")) {
      if (!user.employeeId)
        return json(res, 400, { error: "No employee record linked to this user" });
      employeeId = user.employeeId;
    } else {
      return json(res, 403, { error: "Attendance access required" });
    }
  }

  const pageResult = await readAttendancePage({
    employeeId,
    from,
    to,
    q,
    recordSearch,
    page,
    pageSize,
  });
  let imports = [];
  if (await hasPermission(user, "attendance.write")) {
    [imports] = await pool.execute(
      `SELECT ai.*, u.name AS imported_by_name,
              COALESCE(logs.log_count, 0) AS log_count,
              COALESCE(logs.error_count, 0) AS error_count,
              COALESCE(logs.warning_count, 0) AS warning_count
       FROM attendance_imports ai
       LEFT JOIN users u ON u.id = ai.imported_by
       LEFT JOIN (
         SELECT import_id,
                COUNT(*) AS log_count,
                SUM(level = 'Error') AS error_count,
                SUM(level = 'Warning') AS warning_count
         FROM attendance_import_logs
         GROUP BY import_id
       ) logs ON BINARY logs.import_id = BINARY ai.id
       ORDER BY ai.imported_at DESC
       LIMIT 12`,
    );
  }

  return json(res, 200, {
    entries: pageResult.rows,
    imports: imports.map(attendanceImportRow),
    pagination: {
      total: pageResult.total,
      page: pageResult.page,
      pageSize: pageResult.pageSize,
      totalPages: Math.max(1, Math.ceil(pageResult.total / pageResult.pageSize)),
    },
    summary: {
      total: pageResult.total,
      present: pageResult.summary.present,
      incomplete: pageResult.summary.incomplete,
      lateMinutes: pageResult.summary.lateMinutes,
    },
  });
}

async function handleListAttendanceImportLogs(req, res, importId) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;

  const [imports] = await pool.execute(
    `SELECT ai.*, u.name AS imported_by_name,
            COALESCE(logs.log_count, 0) AS log_count,
            COALESCE(logs.error_count, 0) AS error_count,
            COALESCE(logs.warning_count, 0) AS warning_count
     FROM attendance_imports ai
     LEFT JOIN users u ON u.id = ai.imported_by
     LEFT JOIN (
       SELECT import_id,
              COUNT(*) AS log_count,
              SUM(level = 'Error') AS error_count,
              SUM(level = 'Warning') AS warning_count
       FROM attendance_import_logs
       GROUP BY import_id
     ) logs ON BINARY logs.import_id = BINARY ai.id
     WHERE BINARY ai.id = BINARY :importId
     LIMIT 1`,
    { importId },
  );
  if (!imports[0]) return json(res, 404, { error: "Import log not found" });

  const [logs] = await pool.execute(
    `SELECT id, level, source_row_number, employee_no, message, details, created_at
     FROM attendance_import_logs
     WHERE BINARY import_id = BINARY :importId
     ORDER BY id ASC`,
    { importId },
  );

  return json(res, 200, {
    import: attendanceImportRow(imports[0]),
    logs: logs.map(attendanceImportLogRow),
  });
}

async function handleListAttendanceImportExceptions(req, res, url) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const status = String(url.searchParams.get("status") || "Open").trim();
  if (status && status !== "all" && !["Open", "Mapped", "Reprocessed", "Ignored"].includes(status)) {
    return json(res, 400, { error: "Invalid exception status" });
  }
  const exceptions = await readAttendanceImportExceptions({
    importId: String(url.searchParams.get("importId") || "").trim(),
    status,
  });
  return json(res, 200, { exceptions });
}

async function handleMapAttendanceImportException(req, res, id) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const employeeId = String(body.employeeId || "").trim();
  const notes = String(body.notes || "").trim();
  if (!employeeId) return json(res, 400, { error: "Employee mapping is required" });
  const [[employee]] = await pool.execute(`SELECT id FROM employees WHERE id = :employeeId LIMIT 1`, {
    employeeId,
  });
  if (!employee) return json(res, 404, { error: "Employee not found" });
  const [result] = await pool.execute(
    `UPDATE attendance_import_exceptions
     SET status = 'Mapped', mapped_employee_id = :employeeId,
         resolved_by = :resolvedBy, resolved_at = NOW(), resolution_notes = :notes
     WHERE id = :id AND status IN ('Open', 'Mapped')`,
    { id, employeeId, resolvedBy: user.id, notes: notes || null },
  );
  if (!result.affectedRows) return json(res, 404, { error: "Open import exception not found" });
  await logAudit(user.id, "attendance.import_exception.map", { id, employeeId }, req);
  const [rows] = await pool.execute(
    `SELECT aie.*, resolver.name AS resolved_by_name,
            ${EMPLOYEE_DISPLAY_NAME_SQL.replaceAll("e.", "mapped_employee.")} AS mapped_employee_name
     FROM attendance_import_exceptions aie
     LEFT JOIN employees mapped_employee ON mapped_employee.id = aie.mapped_employee_id
     LEFT JOIN users resolver ON resolver.id = aie.resolved_by
     WHERE aie.id = :id
     LIMIT 1`,
    { id },
  );
  return json(res, 200, {
    ok: true,
    exception: rows[0] ? attendanceImportExceptionRow(rows[0]) : null,
  });
}

async function handleReprocessAttendanceImportExceptions(req, res) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
  const where = ids.length
    ? `aie.id IN (${ids.map(() => "?").join(",")})`
    : "aie.status = 'Mapped'";
  const [rows] = await pool.query(
    `SELECT aie.*
     FROM attendance_import_exceptions aie
     WHERE ${where}
       AND aie.status = 'Mapped'
       AND aie.mapped_employee_id IS NOT NULL
     ORDER BY aie.created_at ASC
     LIMIT 500`,
    ids,
  );
  if (!rows.length) return json(res, 400, { error: "No mapped exceptions are ready to reprocess" });

  let reprocessed = 0;
  let skipped = 0;
  const affectedEmployees = new Map();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const row of rows) {
      if (!row.punch_at) {
        skipped++;
        continue;
      }
      const [result] = await connection.execute(
        `INSERT IGNORE INTO attendance_logs
           (id, employee_id, punch_at, source, source_device, import_id, raw_payload, created_by)
         VALUES
           (:id, :employeeId, :punchAt, :source, :sourceDevice, :importId, :rawPayload, :createdBy)`,
        {
          id: crypto.randomUUID(),
          employeeId: row.mapped_employee_id,
          punchAt: row.punch_at,
          source: ["CSV", "Manual", "Biometric", "Legacy"].includes(row.source)
            ? row.source
            : "Biometric",
          sourceDevice: row.source_device || "Mapped exception",
          importId: row.import_id,
          rawPayload: JSON.stringify({
            exceptionId: row.id,
            employeeNo: row.employee_no,
            raw: parseJson(row.raw_payload, null),
          }),
          createdBy: user.id,
        },
      );
      if (result.affectedRows > 0) {
        reprocessed++;
        const workDate = normalizeDate(row.punch_at);
        const existing = affectedEmployees.get(row.mapped_employee_id);
        affectedEmployees.set(row.mapped_employee_id, {
          from: existing?.from && existing.from < workDate ? existing.from : workDate,
          to: existing?.to && existing.to > workDate ? existing.to : workDate,
        });
      } else {
        skipped++;
      }
      await connection.execute(
        `UPDATE attendance_import_exceptions
         SET status = 'Reprocessed', resolved_by = :resolvedBy, resolved_at = NOW()
         WHERE id = :id`,
        { id: row.id, resolvedBy: user.id },
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const refreshed = { recordsProcessed: 0, punchesProcessed: 0 };
  for (const [employeeId, range] of affectedEmployees.entries()) {
    const result = await refreshDtrEntries({
      employeeId,
      from: range.from,
      to: range.to,
      userId: user.id,
    });
    refreshed.recordsProcessed += result.recordsProcessed;
    refreshed.punchesProcessed += result.punchesProcessed;
  }
  await logAudit(
    user.id,
    "attendance.import_exception.reprocess",
    { requested: ids.length || rows.length, reprocessed, skipped, refreshed },
    req,
  );
  return json(res, 200, { ok: true, reprocessed, skipped, refreshed });
}

function dtrNoterRow(row) {
  return {
    id: String(row.id ?? row.noter_id),
    name: row.name || "",
    position: row.position || "",
    office: row.office || "",
    signatory: String(row.signatory || row.name || "").toUpperCase(),
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
       TRIM(CONCAT_WS(' ',
         NULLIF(TRIM(firstname), ''),
         CASE
           WHEN CHAR_LENGTH(TRIM(COALESCE(middlename, ''))) = 1
             THEN CONCAT(UPPER(TRIM(middlename)), '.')
           ELSE NULLIF(TRIM(middlename), '')
         END,
         NULLIF(TRIM(lastname), ''),
         NULLIF(TRIM(name_ext), '')
       )) AS name,
       position,
       department AS office,
       COALESCE(NULLIF(dtr_signatory, ''), TRIM(CONCAT_WS(' ',
         NULLIF(TRIM(firstname), ''),
         CASE
           WHEN TRIM(COALESCE(middlename, '')) <> ''
             THEN CONCAT(UPPER(LEFT(TRIM(middlename), 1)), '.')
           ELSE NULL
         END,
         NULLIF(TRIM(lastname), ''),
         NULLIF(TRIM(name_ext), '')
       ))) AS signatory,
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
  const signatory = String(body.signatory || name)
    .trim()
    .toUpperCase();
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
  const [[existing]] = await pool.execute(
    `SELECT * FROM biometric_devices WHERE id = :id LIMIT 1`,
    {
      id,
    },
  );
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
  if (!(await canReadEmployeeAttendance(user, employeeId))) {
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
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
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
    const headers = hasHeader
      ? first
      : ["employeeNo", "date", "time", "amIn", "amOut", "pmIn", "pmOut"].map((item) =>
          item.toLowerCase(),
        );
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
          punches.push({
            employeeNo,
            punchAt: `${date} ${normalizeTimeInput(row[key])}`,
            raw: line,
          });
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

const ATTENDANCE_MAX_RANGE_DAYS = 62;

function dateRangeDaysInclusive(from, to) {
  const start = normalizeDate(from);
  const end = normalizeDate(to);
  if (!start || !end) return 0;
  return Math.floor((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000) + 1;
}

function validateAttendanceRange(from, to, label = "date range") {
  if (!from || !to) {
    const error = new Error("Start date and end date are required");
    error.statusCode = 400;
    throw error;
  }
  if (from > to) {
    const error = new Error("Start date cannot be after end date");
    error.statusCode = 400;
    throw error;
  }
  if (dateRangeDaysInclusive(from, to) > ATTENDANCE_MAX_RANGE_DAYS) {
    const error = new Error(`${label} cannot be longer than ${ATTENDANCE_MAX_RANGE_DAYS} days`);
    error.statusCode = 400;
    throw error;
  }
}

function attendanceImportExceptionRow(row) {
  return {
    id: String(row.id),
    importId: String(row.import_id || ""),
    employeeNo: row.employee_no || "",
    punchAt: row.punch_at || "",
    source: row.source || "",
    sourceDevice: row.source_device || "",
    status: row.status || "Open",
    mappedEmployeeId: row.mapped_employee_id || "",
    mappedEmployeeName: row.mapped_employee_name || "",
    resolvedByName: row.resolved_by_name || "",
    resolvedAt: row.resolved_at || "",
    resolutionNotes: row.resolution_notes || "",
    raw: parseJson(row.raw_payload, null),
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

async function insertAttendanceImportException(
  connection,
  { importId, employeeNo, punchAt, source, sourceDevice, raw, status = "Open" },
) {
  await connection.execute(
    `INSERT INTO attendance_import_exceptions (
       id, import_id, employee_no, punch_at, source, source_device, raw_payload, status
     ) VALUES (
       :id, :importId, :employeeNo, :punchAt, :source, :sourceDevice, :rawPayload, :status
     )`,
    {
      id: crypto.randomUUID(),
      importId,
      employeeNo: employeeNo || null,
      punchAt: punchAt || null,
      source,
      sourceDevice: sourceDevice || null,
      rawPayload: JSON.stringify(raw || null),
      status,
    },
  );
}

async function readAttendanceImportExceptions({ importId = "", status = "Open" } = {}) {
  const where = [];
  const params = {};
  if (importId) {
    where.push("aie.import_id = :importId");
    params.importId = importId;
  }
  if (status && status !== "all") {
    where.push("aie.status = :status");
    params.status = status;
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [rows] = await pool.execute(
    `SELECT aie.*, resolver.name AS resolved_by_name,
            ${EMPLOYEE_DISPLAY_NAME_SQL.replaceAll("e.", "mapped_employee.")} AS mapped_employee_name
     FROM attendance_import_exceptions aie
     LEFT JOIN employees mapped_employee ON mapped_employee.id = aie.mapped_employee_id
     LEFT JOIN users resolver ON resolver.id = aie.resolved_by
     ${whereSql}
     ORDER BY CASE aie.status WHEN 'Open' THEN 0 WHEN 'Mapped' THEN 1 ELSE 2 END,
              aie.created_at DESC
     LIMIT 500`,
    params,
  );
  return rows.map(attendanceImportExceptionRow);
}

async function importParsedPunches({
  user,
  req,
  body,
  fileName,
  parsed,
  employeeId,
  from,
  to,
  source,
  sourceDevice,
}) {
  let employeeNoOverride = "";
  if (employeeId) {
    const [[employee]] = await pool.execute(
      `SELECT id, employee_no FROM employees WHERE id = :employeeId`,
      {
        employeeId,
      },
    );
    if (!employee) throw new Error("Employee not found");
    employeeNoOverride = employee.employee_no;
  }

  const importId = crypto.randomUUID();
  let imported = 0;
  const errors = [];
  let exceptions = 0;
  const importLogs = [
    {
      level: "Info",
      message: `Import started from ${sourceDevice || source}: ${parsed.length} punch row(s) received`,
      details: { source, sourceDevice, from: from || null, to: to || null },
    },
  ];
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
      const employeeNo = String(employeeNoOverride || punch.employeeNo || "").trim();
      try {
        if (!employeeNo) throw new Error("Employee number or biometric ID is missing");
        const [[employee]] = await connection.execute(
          `SELECT id FROM employees WHERE employee_no = :employeeNo OR biometric_id = :employeeNo LIMIT 1`,
          { employeeNo },
        );
        if (!employee) {
          exceptions++;
          await insertAttendanceImportException(connection, {
            importId,
            employeeNo,
            punchAt: punch.punchAt,
            source,
            sourceDevice,
            raw: { fileName, raw: punch.raw },
          });
          importLogs.push({
            level: "Warning",
            rowNumber: index + 1,
            employeeNo,
            message: `Unmapped biometric/employee ID quarantined: ${employeeNo}`,
            details: { raw: punch.raw || null, punchAt: punch.punchAt || null },
          });
          continue;
        }
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
        const message = error.message || "Unable to import row";
        errors.push(`Row ${index + 1}: ${message}`);
        importLogs.push({
          level: "Error",
          rowNumber: index + 1,
          employeeNo,
          message,
          details: { raw: punch.raw || null, punchAt: punch.punchAt || null },
        });
      }
    }

    const sortedDates = dates.slice().sort();
    await connection.execute(
      `UPDATE attendance_imports
       SET row_count = :rowCount, status = :status, period_from = :periodFrom, period_to = :periodTo, notes = :notes
       WHERE id = :id`,
      {
        id: importId,
        rowCount: imported,
        status: imported ? "Completed" : "Failed",
        periodFrom: sortedDates[0] || null,
        periodTo: sortedDates[sortedDates.length - 1] || null,
        notes: errors.length
          ? `${errors.length} row(s) had errors`
          : exceptions
            ? `${exceptions} punch row(s) quarantined for mapping`
          : body.notes
            ? String(body.notes)
            : null,
      },
    );
    importLogs.push({
      level: errors.length || exceptions ? "Warning" : "Success",
      message: `Imported ${imported} punch(es); ${errors.length} row(s) had errors; ${exceptions} quarantined`,
      details: { imported, errors: errors.length, exceptions },
    });
    await insertAttendanceImportLogs(connection, importId, importLogs);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  let refreshed;
  const sortedDates = dates.slice().sort();
  try {
    refreshed = await refreshDtrEntries({
      employeeId: employeeId || "",
      from: from || sortedDates[0] || "",
      to: to || sortedDates[sortedDates.length - 1] || "",
      userId: user.id,
    });
    await insertAttendanceImportLogs(pool, importId, [
      {
        level: "Success",
        message: `DTR refreshed: ${refreshed.recordsProcessed} row(s); ${refreshed.punchesProcessed} punch(es) checked`,
        details: refreshed,
      },
    ]);
  } catch (error) {
    await insertAttendanceImportLogs(pool, importId, [
      {
        level: "Error",
        message: `DTR refresh failed: ${error.message}`,
      },
    ]);
    throw error;
  }
  await logAudit(
    user.id,
    "attendance.import_file",
    { importId, imported, errors: errors.length, exceptions },
    req,
  );
  return { importId, imported, errors, exceptions, refreshed, dates };
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
    const importId = await recordFailedAttendanceImport({
      user,
      source: "Legacy",
      fileName,
      from,
      to,
      notes: body.notes || null,
      message: `Unable to read DTR file: ${error.message}`,
      details: { fileName },
    });
    return json(res, 400, { error: error.message, importId });
  }
  if (!parsed.length) {
    const message = "No valid DTR punches found in the selected range";
    const importId = await recordFailedAttendanceImport({
      user,
      source: "Legacy",
      fileName,
      from,
      to,
      notes: body.notes || null,
      message,
      details: { fileName },
    });
    return json(res, 400, { error: message, importId });
  }

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
  try {
    validateAttendanceRange(from, to, "Import date range");
  } catch (error) {
    return json(res, error.statusCode || 400, { error: error.message });
  }
  const [[employee]] = await pool.execute(
    `SELECT id, employee_no, biometric_id FROM employees WHERE id = :employeeId LIMIT 1`,
    {
      employeeId,
    },
  );
  if (!employee) return json(res, 404, { error: "Employee not found" });

  if (source === "biometric") {
    const biometricId = String(body.biometricId || body.biometric_id || "").trim();
    const [[device]] = await pool.execute(
      `SELECT * FROM biometric_devices WHERE id = :id LIMIT 1`,
      {
        id: biometricId,
      },
    );
    if (!device) return json(res, 404, { error: "Biometric device not found" });
    if (!device.is_active)
      return json(res, 400, { error: "Selected biometric device is inactive" });
    // NOTE: Skipping TCP pre-check â€” ZK devices often ignore raw TCP socket probes
    // on port 4370 even when fully reachable via the ZK protocol. The Python script
    // handles connectivity and will throw a clear error if the device is truly offline.

    let parsed;
    try {
      const employeeKeys = new Set(
        [employee.employee_no, employee.biometric_id]
          .map((value) => String(value || "").trim())
          .filter(Boolean),
      );
      parsed = (await fetchBiometricPunches(device, from, to)).filter((punch) =>
        employeeKeys.has(String(punch.employeeNo || "").trim()),
      );
    } catch (error) {
      const importId = await recordFailedAttendanceImport({
        user,
        source: "Biometric",
        fileName: `Biometric ${device.name || device.ip_address}`,
        from,
        to,
        message: `Failed to fetch biometric data: ${error.message}`,
        details: { deviceId: device.id, ipAddress: device.ip_address },
      });
      return json(res, 500, {
        error: `Failed to fetch biometric data: ${error.message}`,
        importId,
      });
    }
    if (!parsed.length) {
      const message = "No biometric punches found for the selected employee and date range";
      const importId = await recordFailedAttendanceImport({
        user,
        source: "Biometric",
        fileName: `Biometric ${device.name || device.ip_address}`,
        from,
        to,
        message,
        details: { deviceId: device.id, ipAddress: device.ip_address, employeeId },
      });
      return json(res, 400, {
        error: message,
        importId,
      });
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
      exceptions: result.exceptions,
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
    const importId = await recordFailedAttendanceImport({
      user,
      source: "Legacy",
      fileName,
      from,
      to,
      message: `Unable to read DTR file: ${error.message}`,
      details: { fileName, employeeId },
    });
    return json(res, 400, { error: error.message, importId });
  }
  if (!parsed.length) {
    const message = "No valid DTR punches found in the selected range";
    const importId = await recordFailedAttendanceImport({
      user,
      source: "Legacy",
      fileName,
      from,
      to,
      message,
      details: { fileName, employeeId },
    });
    return json(res, 400, { error: message, importId });
  }

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
    exceptions: result.exceptions,
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
  try {
    validateAttendanceRange(from, to, "Import date range");
  } catch (error) {
    return json(res, error.statusCode || 400, { error: error.message });
  }

  if (source === "biometric") {
    const biometricId = String(body.biometricId || body.biometric_id || "").trim();
    if (!biometricId) return json(res, 400, { error: "Select a biometric device first" });
    const [[device]] = await pool.execute(
      `SELECT * FROM biometric_devices WHERE id = :id LIMIT 1`,
      { id: biometricId },
    );
    if (!device) return json(res, 404, { error: "Biometric device not found" });
    if (!device.is_active)
      return json(res, 400, { error: "Selected biometric device is inactive" });
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
      const importId = await recordFailedAttendanceImport({
        user,
        source: "Biometric",
        fileName: `Biometric ${device.name || device.ip_address}`,
        from,
        to,
        message: `Failed to fetch biometric data: ${error.message}`,
        details: { deviceId: device.id, ipAddress: device.ip_address },
      });
      return json(res, 500, {
        error: `Failed to fetch biometric data: ${error.message}`,
        importId,
      });
    }
    if (!parsed.length) {
      const message = "No biometric punches found for the selected date range";
      const importId = await recordFailedAttendanceImport({
        user,
        source: "Biometric",
        fileName: `Biometric ${device.name || device.ip_address}`,
        from,
        to,
        message,
        details: { deviceId: device.id, ipAddress: device.ip_address },
      });
      return json(res, 400, { error: message, importId });
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
      exceptions: result.exceptions,
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
    const importId = await recordFailedAttendanceImport({
      user,
      source: "Legacy",
      fileName,
      from,
      to,
      message: `Unable to read DTR file: ${error.message}`,
      details: { fileName },
    });
    return json(res, 400, { error: error.message, importId });
  }
  if (!parsed.length) {
    const message = "No valid DTR punches found in the selected range";
    const importId = await recordFailedAttendanceImport({
      user,
      source: "Legacy",
      fileName,
      from,
      to,
      message,
      details: { fileName },
    });
    return json(res, 400, { error: message, importId });
  }

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
    exceptions: result.exceptions,
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
  const importLogs = [
    {
      level: "Info",
      message: `Import started from ${source}: ${rows.length} DTR row(s) received`,
      details: { source },
    },
  ];
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
        const employeeNo = String(
          row.employeeId || row.employeeNo || row.employeeDbId || "",
        ).trim();
        const message = error.message || "Unable to import row";
        errors.push(`Row ${index + 1}: ${message}`);
        importLogs.push({
          level: "Error",
          rowNumber: index + 1,
          employeeNo,
          message,
          details: { workDate: row.workDate || row.date || null },
        });
      }
    }

    const sortedDates = dates.slice().sort();
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
        periodFrom: sortedDates[0] || null,
        periodTo: sortedDates[sortedDates.length - 1] || null,
        notes: errors.length
          ? `${errors.length} row(s) had errors`
          : body.notes
            ? String(body.notes)
            : null,
      },
    );
    importLogs.push({
      level: errors.length ? "Warning" : "Success",
      message: `Imported ${imported} DTR row(s); ${errors.length} row(s) had errors`,
      details: { imported, errors: errors.length },
    });
    await insertAttendanceImportLogs(connection, importId, importLogs);

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
  try {
    validateAttendanceRange(from, to, "Refresh date range");
  } catch (error) {
    return json(res, error.statusCode || 400, { error: error.message });
  }
  const result = await refreshDtrEntries({
    employeeId: employeeId || "",
    from,
    to,
    userId: user.id,
  });
  await logAudit(user.id, "attendance.refresh", { employeeId, from, to, ...result }, req);
  return json(res, 200, result);
}

function scheduleRow(row) {
  return {
    employeeId: String(row.employee_id),
    employeeNo: String(row.employee_no || ""),
    employeeName: formatEmployeeName(row, ""),
    lastname: row.lastname || "",
    firstname: row.firstname || "",
    department: row.department || "",
    position: row.position || "",
    empStatus: row.emp_status || "Active",
    scheduleAmIn: formatTime(row.schedule_am_in) || "08:00",
    scheduleAmOut: formatTime(row.schedule_am_out) || "12:00",
    schedulePmIn: formatTime(row.schedule_pm_in) || "13:00",
    schedulePmOut: formatTime(row.schedule_pm_out) || "17:00",
    overrideCount: Number(row.override_count || 0),
  };
}

function scheduleOverrideRow(row) {
  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    employeeName: formatEmployeeName(row, ""),
    department: row.department || "",
    workDate: normalizeDate(row.work_date),
    amIn: formatTime(row.am_in) || "",
    amOut: formatTime(row.am_out) || "",
    pmIn: formatTime(row.pm_in) || "",
    pmOut: formatTime(row.pm_out) || "",
    shiftTemplateId: row.shift_template_id ? String(row.shift_template_id) : "",
    shiftCode: row.shift_code || "",
    shiftName: row.shift_name || "",
    updatedAt: row.updated_at || "",
  };
}

function shiftTemplateRow(row) {
  return {
    id: String(row.id),
    code: row.code || "",
    name: row.name || "",
    shiftType: row.shift_type || "split",
    startTime: formatTime(row.start_time) || "",
    endTime: formatTime(row.end_time) || "",
    breakStart: formatTime(row.break_start) || "",
    breakEnd: formatTime(row.break_end) || "",
    active: Boolean(row.active),
  };
}

async function handleListEmployeeSchedules(req, res, url) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return;
  if (!(await hasPermission(user, "employees.read"))) {
    json(res, 403, { error: "HR schedule access required" });
    return;
  }

  const q = String(url.searchParams.get("q") || "").trim();
  const department = String(url.searchParams.get("department") || "all").trim();
  const from = normalizeDate(url.searchParams.get("from"));
  const to = normalizeDate(url.searchParams.get("to"));
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(10, Number(url.searchParams.get("pageSize") || 50)));
  const offset = (page - 1) * pageSize;
  if ((from && !to) || (!from && to)) {
    return json(res, 400, { error: "Start and end dates are required" });
  }
  if (from && to && from > to) {
    return json(res, 400, { error: "Start date cannot be after end date" });
  }

  const where = ["1 = 1"];
  const params = {};
  if (q) {
    where.push(`(
      e.employee_no LIKE :search OR e.lastname LIKE :search OR e.firstname LIKE :search
      OR e.middlename LIKE :search OR e.department LIKE :search OR e.position LIKE :search
    )`);
    params.search = `%${q}%`;
  }
  if (department && department !== "all") {
    where.push("e.department = :department");
    params.department = department;
  }

  const overrideCountWhere = from && to ? "WHERE work_date BETWEEN :fromDate AND :toDate" : "";
  if (from && to) {
    params.fromDate = from;
    params.toDate = to;
  }

  const whereSql = where.join(" AND ");
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM employees e WHERE ${whereSql}`,
    params,
  );
  const [employees] = await pool.execute(
    `SELECT e.id AS employee_id, e.employee_no, e.lastname, e.firstname,
            e.middlename, e.name_ext, e.department, e.position, e.emp_status,
            e.schedule_am_in, e.schedule_am_out, e.schedule_pm_in, e.schedule_pm_out,
            COALESCE(override_counts.override_count, 0) AS override_count
     FROM employees e
     LEFT JOIN (
       SELECT employee_id, COUNT(*) AS override_count
       FROM employee_schedule_overrides
       ${overrideCountWhere}
       GROUP BY employee_id
     ) override_counts ON override_counts.employee_id = e.id
     WHERE ${whereSql}
     ORDER BY e.lastname, e.firstname
     LIMIT ${pageSize} OFFSET ${offset}`,
    params,
  );

  const employeeIds = employees.map((employee) => String(employee.employee_id));
  let overrides = [];
  if (employeeIds.length && from && to) {
    const [rows] = await pool.execute(
      `SELECT eso.id, eso.employee_id, e.lastname, e.firstname, e.middlename, e.name_ext, e.department,
              DATE_FORMAT(eso.work_date, '%Y-%m-%d') AS work_date,
              eso.am_in, eso.am_out, eso.pm_in, eso.pm_out, eso.updated_at,
              st.id AS shift_template_id, st.code AS shift_code, st.name AS shift_name
       FROM employee_schedule_overrides eso
       INNER JOIN employees e ON e.id = eso.employee_id
       LEFT JOIN employee_shift_assignments esa
         ON esa.employee_id = eso.employee_id AND esa.duty_date = eso.work_date
       LEFT JOIN shift_templates st ON st.id = esa.shift_template_id
       WHERE eso.employee_id IN (${employeeIds.map(() => "?").join(",")})
         AND eso.work_date BETWEEN ? AND ?
       ORDER BY eso.work_date DESC, e.lastname, e.firstname`,
      [...employeeIds, from, to],
    );
    overrides = rows.map(scheduleOverrideRow);
  }

  const [departmentRows] = await pool.execute(
    `SELECT DISTINCT department FROM employees
     WHERE department IS NOT NULL AND department <> ''
     ORDER BY department`,
  );
  const [templateRows] = await pool.execute(
    `SELECT id, code, name, shift_type, start_time, end_time, break_start, break_end, active
     FROM shift_templates
     WHERE active = 1
     ORDER BY start_time, name`,
  );

  return json(res, 200, {
    employees: employees.map(scheduleRow),
    overrides,
    departments: departmentRows.map((row) => row.department),
    shiftTemplates: templateRows.map(shiftTemplateRow),
    pagination: {
      total: Number(countRows[0]?.total || 0),
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(Number(countRows[0]?.total || 0) / pageSize)),
    },
  });
}

async function handleDeleteEmployeeScheduleOverride(req, res, employeeId, workDate) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const normalizedDate = normalizeDate(workDate);
  if (!employeeId || !normalizedDate) return json(res, 400, { error: "Invalid schedule override" });
  const [[employee]] = await pool.execute(`SELECT id FROM employees WHERE id = :employeeId LIMIT 1`, {
    employeeId,
  });
  if (!employee) return json(res, 404, { error: "Employee not found" });

  const connection = await pool.getConnection();
  let committed = false;
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `DELETE FROM employee_schedule_overrides
       WHERE employee_id = :employeeId AND work_date = :workDate`,
      { employeeId, workDate: normalizedDate },
    );
    await connection.execute(
      `DELETE FROM employee_shift_assignments
       WHERE employee_id = :employeeId AND duty_date = :workDate`,
      { employeeId, workDate: normalizedDate },
    );
    await connection.commit();
    committed = true;
    await logAudit(
      user.id,
      "attendance.schedule_override_delete",
      { employeeId, workDate: normalizedDate },
      req,
    );
    const refreshed = await refreshDtrEntries({
      employeeId,
      from: normalizedDate,
      to: normalizedDate,
      userId: user.id,
    });
    await logAudit(
      user.id,
      "attendance.schedule_override_refresh",
      { employeeId, workDate: normalizedDate, refreshed },
      req,
    );
    return json(res, 200, {
      ok: true,
      deleted: result.affectedRows || 0,
      refreshed,
      warnings: refreshed.warnings || [],
    });
  } catch (error) {
    if (!committed) await connection.rollback();
    return json(res, 400, { error: error.message });
  } finally {
    connection.release();
  }
}

async function handleBulkEmployeeSchedule(req, res, overrides = false) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const employeeIds = Array.isArray(body.employeeIds)
    ? Array.from(new Set(body.employeeIds.map(String).filter(Boolean)))
    : [];
  const schedule = body.schedule || {};
  if (!employeeIds.length) return json(res, 400, { error: "Select at least one employee" });
  const [existingEmployees] = await pool.query(
    `SELECT id FROM employees WHERE id IN (${employeeIds.map(() => "?").join(",")})`,
    employeeIds,
  );
  const existingEmployeeIds = new Set(existingEmployees.map((employee) => String(employee.id)));
  const invalidEmployeeIds = employeeIds.filter((id) => !existingEmployeeIds.has(id));
  if (invalidEmployeeIds.length) {
    return json(res, 400, { error: "One or more selected employees no longer exist" });
  }
  const values = {
    amIn: normalizeTimeInput(schedule.amIn || schedule.am_in || "08:00"),
    amOut: normalizeTimeInput(schedule.amOut || schedule.am_out || "12:00"),
    pmIn: normalizeTimeInput(schedule.pmIn || schedule.pm_in || "13:00"),
    pmOut: normalizeTimeInput(schedule.pmOut || schedule.pm_out || "17:00"),
  };
  const shiftTemplateCode = String(body.shiftTemplateCode || body.shift_template_code || "").trim();
  let shiftTemplateId = null;
  if (shiftTemplateCode) {
    const [templateRows] = await pool.execute(
      `SELECT id FROM shift_templates WHERE code = :shiftTemplateCode AND active = 1 LIMIT 1`,
      { shiftTemplateCode },
    );
    if (!templateRows[0]) return json(res, 400, { error: "Selected shift template is invalid" });
    shiftTemplateId = templateRows[0].id;
  }

  const connection = await pool.getConnection();
  let refreshFrom = normalizeDate(body.from || body.startDate);
  let refreshTo = normalizeDate(body.to || body.endDate);
  let touchedDates = [];
  try {
    await connection.beginTransaction();
    if (!overrides) {
      if (!refreshFrom || !refreshTo) throw new Error("Schedule refresh date range is required");
      validateAttendanceRange(refreshFrom, refreshTo, "Schedule refresh range");
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
      validateAttendanceRange(startDate, endDate, "Schedule override range");
      refreshFrom = startDate;
      refreshTo = endDate;
      const skipWeekends = body.skipWeekends !== false;
      const cursor = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);
      for (; cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        const day = cursor.getDay();
        if (skipWeekends && (day === 0 || day === 6)) continue;
        const workDate = formatLocalDate(cursor);
        touchedDates.push(workDate);
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
          if (shiftTemplateId) {
            await connection.execute(
              `INSERT INTO employee_shift_assignments
                 (employee_id, duty_date, shift_template_id, created_by)
               VALUES (:employeeId, :workDate, :shiftTemplateId, :createdBy)
               ON DUPLICATE KEY UPDATE
                 shift_template_id = VALUES(shift_template_id),
                 created_by = VALUES(created_by)`,
              { employeeId, workDate, shiftTemplateId, createdBy: user.id },
            );
          } else {
            await connection.execute(
              `DELETE FROM employee_shift_assignments
               WHERE employee_id = :employeeId AND duty_date = :workDate`,
              { employeeId, workDate },
            );
          }
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
    { employeeIds: employeeIds.length, shiftTemplateCode: shiftTemplateCode || null, from: refreshFrom, to: refreshTo },
    req,
  );
  const refreshed = { recordsProcessed: 0, punchesProcessed: 0, warnings: [] };
  if (refreshFrom && refreshTo && (!overrides || touchedDates.length)) {
    for (const employeeId of employeeIds) {
      const result = await refreshDtrEntries({
        employeeId,
        from: refreshFrom,
        to: refreshTo,
        userId: user.id,
      });
      refreshed.recordsProcessed += result.recordsProcessed;
      refreshed.punchesProcessed += result.punchesProcessed;
      refreshed.warnings.push(...(result.warnings || []));
    }
  }
  refreshed.warnings = Array.from(new Set(refreshed.warnings));
  await logAudit(
    user.id,
    overrides ? "attendance.schedule_override_refresh" : "attendance.schedule_refresh",
    { employeeIds: employeeIds.length, from: refreshFrom, to: refreshTo, refreshed },
    req,
  );
  return json(res, 200, {
    ok: true,
    updated: overrides ? employeeIds.length * touchedDates.length : employeeIds.length,
    refreshed,
    warnings: refreshed.warnings,
  });
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
  if (cut === "first")
    return {
      from: `${year}-${String(month).padStart(2, "0")}-01`,
      to: `${year}-${String(month).padStart(2, "0")}-15`,
    };
  if (cut === "last")
    return {
      from: `${year}-${String(month).padStart(2, "0")}-16`,
      to: `${year}-${String(month).padStart(2, "0")}-${last}`,
    };
  return {
    from: `${year}-${String(month).padStart(2, "0")}-01`,
    to: `${year}-${String(month).padStart(2, "0")}-${last}`,
  };
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
  if (Array.isArray(body.periods) && body.periods.length)
    return normalizeDtrExportPeriods(body.periods);

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

function addBiometricSyncLog(level, message) {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
  };
  biometricSyncLogs.push(entry);
  if (biometricSyncLogs.length > BIOMETRIC_SYNC_LOG_LIMIT) biometricSyncLogs.shift();
  console.log(`[BIOMETRIC ${level.toUpperCase()}] ${message}`);
}

function setBiometricSyncStatus(patch) {
  biometricSyncStatus = {
    ...biometricSyncStatus,
    ...patch,
    admsPort: ADMS_PORT,
  };
}

function enqueueBiometricDtrRefresh(employeeId, workDate) {
  if (!employeeId || !workDate) return;
  const existing = biometricRefreshQueue.get(employeeId);
  biometricRefreshQueue.set(employeeId, {
    from: existing?.from && existing.from < workDate ? existing.from : workDate,
    to: existing?.to && existing.to > workDate ? existing.to : workDate,
  });
  processBiometricDtrQueue().catch((error) => {
    addBiometricSyncLog("error", `DTR refresh queue failed: ${error.message}`);
  });
}

async function processBiometricDtrQueue() {
  if (biometricQueueRunning || biometricRefreshQueue.size === 0) return;
  biometricQueueRunning = true;
  try {
    while (biometricRefreshQueue.size > 0) {
      const [employeeId, range] = biometricRefreshQueue.entries().next().value;
      biometricRefreshQueue.delete(employeeId);
      try {
        const refreshed = await refreshDtrEntries({
          employeeId,
          from: range.from,
          to: range.to,
          userId: null,
        });
        addBiometricSyncLog(
          "success",
          `DTR refreshed for employee ${employeeId}: ${refreshed.recordsProcessed} day(s), ${refreshed.punchesProcessed} punch(es)`,
        );
      } catch (error) {
        addBiometricSyncLog(
          "error",
          `DTR refresh failed for employee ${employeeId}: ${error.message}`,
        );
      }
    }
  } finally {
    biometricQueueRunning = false;
  }
}

function parseAdmsAttlog(rawData) {
  return String(rawData || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t");
      const employeeNo = String(parts[0] || "").trim();
      const punchAt = truncateTimestampToMinute(parts[1] || "");
      return {
        employeeNo,
        punchAt,
        workDate: punchAt.slice(0, 10),
        raw: line,
      };
    })
    .filter((row) => row.employeeNo && row.punchAt);
}

async function insertBiometricPunches({
  punches,
  sourceDevice,
  createdBy = null,
  importId = null,
}) {
  let inserted = 0;
  let skipped = 0;
  let exceptions = 0;
  const affectedEmployees = new Map();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const punch of punches) {
      const [[employee]] = await connection.execute(
        `SELECT id FROM employees WHERE employee_no = :employeeNo OR biometric_id = :employeeNo LIMIT 1`,
        { employeeNo: punch.employeeNo },
      );
      if (!employee) {
        exceptions++;
        if (importId) {
          await insertAttendanceImportException(connection, {
            importId,
            employeeNo: punch.employeeNo,
            punchAt: punch.punchAt,
            source: "Biometric",
            sourceDevice,
            raw: punch.raw,
          });
        }
        continue;
      }
      const [result] = await connection.execute(
        `INSERT IGNORE INTO attendance_logs
           (id, employee_id, punch_at, source, source_device, import_id, raw_payload, created_by)
         VALUES
           (:id, :employeeId, :punchAt, 'Biometric', :sourceDevice, :importId, :rawPayload, :createdBy)`,
        {
          id: crypto.randomUUID(),
          employeeId: employee.id,
          punchAt: punch.punchAt,
          sourceDevice: sourceDevice.slice(0, 120),
          importId,
          rawPayload: JSON.stringify({ raw: punch.raw, employeeNo: punch.employeeNo }),
          createdBy,
        },
      );
      if (result.affectedRows > 0) {
        inserted++;
        const existing = affectedEmployees.get(employee.id);
        affectedEmployees.set(employee.id, {
          from: existing?.from && existing.from < punch.workDate ? existing.from : punch.workDate,
          to: existing?.to && existing.to > punch.workDate ? existing.to : punch.workDate,
        });
      } else {
        skipped++;
      }
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return { inserted, skipped, exceptions, affectedEmployees };
}

async function handleAdmsIclock(req, res, url) {
  if (req.method === "GET") return text(res, 200, "OK");
  if (req.method !== "POST") return text(res, 405, "OK");

  const table = String(url.searchParams.get("table") || "").toUpperCase();
  const serial = String(url.searchParams.get("SN") || url.searchParams.get("sn") || "").trim();
  const remote = req.socket?.remoteAddress || "";
  const sourceDevice = serial ? `ADMS ${serial}` : `ADMS ${remote || "device"}`;
  const rawData = await readRawBody(req);
  text(res, 200, "OK");

  if (table !== "ATTLOG") return;
  const punches = parseAdmsAttlog(rawData);
  if (!punches.length) return;

  biometricSyncStartedAt = Date.now();
  setBiometricSyncStatus({
    status: "syncing",
    mode: "ADMS",
    syncStartTime: new Date().toISOString(),
    error: null,
  });
  addBiometricSyncLog("info", `ADMS received ${punches.length} ATTLOG row(s) from ${sourceDevice}`);
  const importId = crypto.randomUUID();
  const punchDates = punches
    .map((punch) => punch.workDate)
    .filter(Boolean)
    .sort();
  await pool.execute(
    `INSERT INTO attendance_imports
       (id, source, file_name, row_count, status, period_from, period_to, notes, imported_by)
     VALUES
       (:id, 'Biometric', :fileName, 0, 'Processing', :periodFrom, :periodTo, :notes, NULL)`,
    {
      id: importId,
      fileName: sourceDevice.slice(0, 255),
      periodFrom: punchDates[0] || null,
      periodTo: punchDates[punchDates.length - 1] || null,
      notes: "ADMS live biometric import",
    },
  );
  await insertAttendanceImportLogs(pool, importId, [
    {
      level: "Info",
      message: `ADMS received ${punches.length} punch row(s) from ${sourceDevice}`,
      details: { sourceDevice },
    },
  ]);
  try {
    const result = await insertBiometricPunches({ punches, sourceDevice, importId });
    for (const [employeeId, range] of result.affectedEmployees.entries()) {
      enqueueBiometricDtrRefresh(employeeId, range.from);
      if (range.to !== range.from) enqueueBiometricDtrRefresh(employeeId, range.to);
    }
    await pool.execute(
      `UPDATE attendance_imports
       SET row_count = :rowCount, status = 'Completed', notes = :notes
       WHERE id = :id`,
      {
        id: importId,
        rowCount: result.inserted,
        notes: `Stored ${result.inserted} new punch(es); skipped ${result.skipped}; quarantined ${result.exceptions}`,
      },
    );
    await insertAttendanceImportLogs(pool, importId, [
      {
        level: result.skipped || result.exceptions ? "Warning" : "Success",
        message: `Stored ${result.inserted} new punch(es); skipped ${result.skipped}; quarantined ${result.exceptions}`,
        details: { inserted: result.inserted, skipped: result.skipped, exceptions: result.exceptions },
      },
    ]);
    const now = new Date().toISOString();
    setBiometricSyncStatus({
      status: "success",
      lastSyncTime: now,
      durationMs: null,
      recordsFetched: punches.length,
      recordsInserted: result.inserted,
      devicesProcessed: 1,
      error: null,
    });
    biometricSyncStartedAt = null;
    addBiometricSyncLog(
      "success",
      `ADMS stored ${result.inserted} new punch(es), skipped ${result.skipped}, quarantined ${result.exceptions}`,
    );
  } catch (error) {
    await pool.execute(
      `UPDATE attendance_imports
       SET status = 'Failed', notes = :notes
       WHERE id = :id`,
      {
        id: importId,
        notes: `ADMS import failed: ${error.message}`,
      },
    );
    await insertAttendanceImportLogs(pool, importId, [
      {
        level: "Error",
        message: `ADMS import failed: ${error.message}`,
      },
    ]);
    setBiometricSyncStatus({
      status: "failed",
      lastSyncTime: new Date().toISOString(),
      recordsFetched: punches.length,
      recordsInserted: 0,
      devicesProcessed: 1,
      error: error.message,
    });
    biometricSyncStartedAt = null;
    addBiometricSyncLog("error", `ADMS import failed: ${error.message}`);
  }
}

async function handleBiometricRealtimeStatus(req, res) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return;
  const elapsedMs =
    biometricSyncStatus.status === "syncing" && biometricSyncStartedAt
      ? Date.now() - biometricSyncStartedAt
      : biometricSyncStatus.durationMs;
  const [devices] = await pool.query(
    `SELECT id, name, ip_address, port, is_active FROM biometric_devices ORDER BY name ASC`,
  );
  return json(res, 200, {
    status: { ...biometricSyncStatus, elapsedMs },
    queue: {
      pendingEmployees: biometricRefreshQueue.size,
      running: biometricQueueRunning,
    },
    devices: devices.map(biometricDeviceRow),
  });
}

async function handleBiometricRealtimeLogs(req, res, url) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return;
  const since = Math.max(0, Number(url.searchParams.get("since") || 0));
  return json(res, 200, {
    logs: biometricSyncLogs.slice(since),
    total: biometricSyncLogs.length,
  });
}

async function handleBiometricSyncNow(req, res) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  if (biometricSyncStatus.status === "syncing") {
    return json(res, 409, {
      error: "Biometric sync already in progress",
      status: biometricSyncStatus,
    });
  }

  const body = await readBody(req);
  const today = new Date();
  const fallbackTo = formatLocalDate(today);
  const fallbackFromDate = new Date(today);
  fallbackFromDate.setDate(today.getDate() - Number(body.daysBack || 7));
  const from = normalizeDate(body.from || body.startDate) || formatLocalDate(fallbackFromDate);
  const to = normalizeDate(body.to || body.endDate) || fallbackTo;
  const deviceId = String(body.deviceId || body.biometricId || "").trim();
  try {
    validateAttendanceRange(from, to, "Biometric sync range");
  } catch (error) {
    return json(res, error.statusCode || 400, { error: error.message });
  }

  const deviceWhere = deviceId ? "WHERE id = :deviceId" : "WHERE is_active = 1";
  const [devices] = await pool.execute(
    `SELECT * FROM biometric_devices ${deviceWhere} ORDER BY name ASC`,
    { deviceId },
  );
  const activeDevices = devices.filter((device) => device.is_active);
  if (!activeDevices.length) {
    return json(res, 400, { error: "No active biometric devices configured" });
  }

  biometricSyncStartedAt = Date.now();
  setBiometricSyncStatus({
    status: "syncing",
    mode: "manual",
    syncStartTime: new Date().toISOString(),
    durationMs: null,
    recordsFetched: 0,
    recordsInserted: 0,
    devicesProcessed: 0,
    error: null,
  });
  addBiometricSyncLog(
    "info",
    `Manual sync started for ${activeDevices.length} device(s), ${from} to ${to}`,
  );

  let recordsFetched = 0;
  let recordsInserted = 0;
  let devicesProcessed = 0;
  const errors = [];

  for (const device of activeDevices) {
    try {
      addBiometricSyncLog("info", `Fetching ${device.name} (${device.ip_address}:${device.port})`);
      const parsed = await fetchBiometricPunches(device, from, to);
      recordsFetched += parsed.length;
      const result = await importParsedPunches({
        user,
        req,
        body,
        fileName: `Biometric ${device.name || device.ip_address}`,
        parsed,
        employeeId: "",
        from,
        to,
        source: "Biometric",
        sourceDevice: String(device.name || device.ip_address || "Biometric").slice(0, 120),
      });
      recordsInserted += result.imported;
      devicesProcessed++;
      addBiometricSyncLog(
        "success",
        `${device.name} imported ${result.imported} punch(es); refreshed ${result.refreshed.recordsProcessed} day(s)`,
      );
    } catch (error) {
      errors.push(`${device.name || device.ip_address}: ${error.message}`);
      await recordFailedAttendanceImport({
        user,
        source: "Biometric",
        fileName: `Biometric ${device.name || device.ip_address}`,
        from,
        to,
        message: `Biometric sync skipped device: ${error.message}`,
        details: { deviceId: device.id, ipAddress: device.ip_address },
      });
      addBiometricSyncLog("warn", `${device.name || device.ip_address} skipped: ${error.message}`);
    }
  }

  const durationMs = Date.now() - biometricSyncStartedAt;
  const status = errors.length && !recordsInserted ? "failed" : "success";
  setBiometricSyncStatus({
    status,
    lastSyncTime: new Date().toISOString(),
    durationMs,
    recordsFetched,
    recordsInserted,
    devicesProcessed,
    error: errors.length ? errors.join("\n") : null,
  });
  biometricSyncStartedAt = null;
  addBiometricSyncLog(
    status === "success" ? "success" : "error",
    `Manual sync finished: ${recordsFetched} fetched, ${recordsInserted} imported`,
  );

  return json(res, status === "success" ? 200 : 500, {
    status: biometricSyncStatus,
    recordsFetched,
    recordsInserted,
    devicesProcessed,
    errors,
  });
}

async function prepareDtrExport(req, res) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return null;
  const body = await readBody(req);
  let employeeId = String(body.employeeId || "").trim();
  if ((await hasPermission(user, "self_service.access")) && !(await canReadAllAttendance(user))) {
    employeeId = user.employeeId || "";
  }
  if (!employeeId) {
    json(res, 400, { error: "Employee is required" });
    return null;
  }
  if (!(await canReadEmployeeAttendance(user, employeeId))) {
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
      to: ranges
        .map((range) => range.to)
        .sort()
        .at(-1),
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
  const rows = await readAttendanceRows({
    employeeId,
    from: bounds.from,
    to: bounds.to,
    limit: 1000,
  });
  const employeeName = formatEmployeeName(employee);
  const defaultDtrSignatory = formatDtrSignatoryName(employee, employeeName.toUpperCase());
  const noter = {
    signatory: String(
      body.noterSignatory ||
        body.noter_signatory ||
        employee.dtrSignatory ||
        defaultDtrSignatory ||
        "",
    )
      .trim()
      .toUpperCase(),
    position: String(body.noterPosition || body.noter_position || "Immediate Supervisor").trim(),
  };
  const payload = {
    employee: {
      id: employee.id,
      name: employeeName,
      position: employee.position,
      department: employee.department,
      signatory: String(employee.dtrSignatory || defaultDtrSignatory).toUpperCase(),
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

async function authorizeDtrExportJob(user, fileName, expectedScope) {
  const [[job]] = await pool.execute(
    `SELECT id, scope, employee_id, file_name, created_by, created_at
     FROM dtr_export_jobs
     WHERE BINARY file_name = BINARY :fileName
       AND created_at >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
     ORDER BY created_at DESC
     LIMIT 1`,
    { fileName },
  );
  if (!job || job.scope !== expectedScope) return false;
  if (job.scope === "Mass") return hasPermission(user, "attendance.write");
  if (Number(job.created_by || 0) === Number(user.id || 0)) return true;
  return canReadEmployeeAttendance(user, job.employee_id || "");
}

async function handleGenerateDtrExcel(req, res) {
  const exportData = await prepareDtrExport(req, res);
  if (!exportData) return;
  const { user, employeeId, rows, bounds, payload } = exportData;

  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const fileName = `dtr-${crypto.randomUUID()}.xlsx`;
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
  if (!/^dtr-[0-9a-f-]{36}\.xlsx$/i.test(decoded)) {
    return json(res, 400, { error: "Invalid DTR Excel file name" });
  }
  if (!(await authorizeDtrExportJob(user, decoded, "Single"))) {
    return json(res, 403, { error: "DTR Excel link is not available to this user" });
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
  return sendFile(res, resolved, decoded, { deleteAfterSend: true });
}

async function handleGenerateDtrPdf(req, res) {
  const exportData = await prepareDtrExport(req, res);
  if (!exportData) return;
  const { user, employeeId, rows, bounds, payload } = exportData;

  await cleanupPreviewFiles().catch(() => {});
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const fileName = `dtr-${crypto.randomUUID()}.pdf`;
  const inputPath = path.join(PREVIEW_DIR, `${fileName}.json`);
  const outputPath = path.join(PREVIEW_DIR, fileName);
  const workbookPath = outputPath.replace(/\.pdf$/i, ".xlsx");

  await fs.writeFile(inputPath, JSON.stringify(payload), "utf8");
  try {
    await runPython([DTR_EXCEL_SCRIPT, inputPath, workbookPath, DTR_TEMPLATE_XLSX]);
    const convertedPath = await convertSpreadsheetToPdf(workbookPath);
    if (path.resolve(convertedPath) !== path.resolve(outputPath)) {
      await fs.rename(convertedPath, outputPath);
    }
  } catch (error) {
    return json(res, 500, { error: error.message });
  } finally {
    await fs.rm(inputPath, { force: true }).catch(() => {});
    await fs.rm(workbookPath, { force: true }).catch(() => {});
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

async function handleGenerateMassDtrPdf(req, res) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;

  const body = await readBody(req);
  const office = String(body.office || body.department || "").trim();
  const employeeType = String(body.employeeType || "all");
  if (!office) return json(res, 400, { error: "Office is required" });

  const periods = dtrExportPeriodsFromBody(body);
  let ranges;
  let bounds;
  try {
    ranges = periods.map(monthPeriodBounds);
    bounds = {
      from: ranges.map((range) => range.from).sort()[0],
      to: ranges
        .map((range) => range.to)
        .sort()
        .at(-1),
    };
  } catch (error) {
    return json(res, 400, { error: error.message });
  }

  const where = ["department = :office", "emp_status = 'Active'"];
  const params = { office };
  if (employeeType === "regular") where.push("regular = 1");
  if (employeeType === "jobOrder") where.push("regular = 0");

  const [employeeRows] = await pool.execute(
    `SELECT * FROM employees
     WHERE ${where.join(" AND ")}
     ORDER BY lastname ASC, firstname ASC, employee_no ASC`,
    params,
  );
  if (!employeeRows.length) {
    return json(res, 404, { error: "No employees found for the selected criteria" });
  }

  await cleanupPreviewFiles().catch(() => {});
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const fileName = `mass-dtr-${crypto.randomUUID()}.pdf`;
  const outputPath = path.join(PREVIEW_DIR, fileName);
  const individualPaths = [];
  let rowCount = 0;

  try {
    for (const employeeRowData of employeeRows) {
      const employee = employeeRow(employeeRowData);
      const rows = await readAttendanceRows({
        employeeId: employee.id,
        from: bounds.from,
        to: bounds.to,
        limit: 1000,
      });
      rowCount += rows.length;
      const employeeName = formatEmployeeName(employee);
      const defaultDtrSignatory = formatDtrSignatoryName(employee, employeeName.toUpperCase());
      const payload = {
        employee: {
          id: employee.id,
          name: employeeName,
          position: employee.position,
          department: employee.department,
          signatory: String(employee.dtrSignatory || defaultDtrSignatory).toUpperCase(),
          scheduleAmIn: employee.scheduleAmIn,
          scheduleAmOut: employee.scheduleAmOut,
          schedulePmIn: employee.schedulePmIn,
          schedulePmOut: employee.schedulePmOut,
        },
        noter: {
          signatory: String(
            body.noterSignatory ||
              body.noter_signatory ||
              employee.dtrSignatory ||
              defaultDtrSignatory ||
              "",
          )
            .trim()
            .toUpperCase(),
          position: String(
            body.noterPosition || body.noter_position || "Immediate Supervisor",
          ).trim(),
        },
        periods: periods.map((period, index) => ({
          ...ranges[index],
          month: period.month ? Number(period.month) : undefined,
          year: period.year ? Number(period.year) : undefined,
          cut: period.cut ? String(period.cut) : undefined,
        })),
        entries: rows,
      };

      const employeeSafeName =
        `${employee.lastname || "employee"}-${employee.firstname || employee.id}`
          .replace(/[^A-Za-z0-9_-]+/g, "-")
          .slice(0, 80);
      const individualPdfPath = path.join(
        PREVIEW_DIR,
        `mass-dtr-part-${employeeSafeName}-${crypto.randomUUID()}.pdf`,
      );
      const individualJsonPath = `${individualPdfPath}.json`;
      const individualWorkbookPath = individualPdfPath.replace(/\.pdf$/i, ".xlsx");
      await fs.writeFile(individualJsonPath, JSON.stringify(payload), "utf8");
      try {
        await runPython([
          DTR_EXCEL_SCRIPT,
          individualJsonPath,
          individualWorkbookPath,
          DTR_TEMPLATE_XLSX,
        ]);
        const convertedPath = await convertSpreadsheetToPdf(individualWorkbookPath);
        if (path.resolve(convertedPath) !== path.resolve(individualPdfPath)) {
          await fs.rename(convertedPath, individualPdfPath);
        }
      } finally {
        await fs.rm(individualJsonPath, { force: true }).catch(() => {});
        await fs.rm(individualWorkbookPath, { force: true }).catch(() => {});
      }
      individualPaths.push(individualPdfPath);
    }

    await runPython([PDF_MERGE_SCRIPT, outputPath, ...individualPaths]);
  } catch (error) {
    await fs.rm(outputPath, { force: true }).catch(() => {});
    return json(res, 500, { error: error.message });
  } finally {
    await Promise.all(
      individualPaths.map((filePath) => fs.rm(filePath, { force: true }).catch(() => {})),
    );
  }

  await pool.execute(
    `INSERT INTO dtr_export_jobs (id, scope, employee_id, period_from, period_to, file_name, row_count, created_by)
     VALUES (:id, 'Mass', NULL, :from, :to, :fileName, :rowCount, :createdBy)`,
    {
      id: crypto.randomUUID(),
      from: bounds.from,
      to: bounds.to,
      fileName,
      rowCount,
      createdBy: user.id,
    },
  );

  return json(res, 200, {
    fileName,
    previewUrl: `/api/attendance/dtr/mass/pdf/${encodeURIComponent(fileName)}`,
    employeeCount: employeeRows.length,
    rowCount,
  });
}

async function handlePreviewMassDtrPdf(req, res, fileName) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return;
  const decoded = decodeURIComponent(fileName);
  if (!/^mass-dtr-[0-9a-f-]{36}\.pdf$/i.test(decoded)) {
    return json(res, 400, { error: "Invalid mass DTR PDF file name" });
  }
  if (!(await authorizeDtrExportJob(user, decoded, "Mass"))) {
    return json(res, 403, { error: "Mass DTR PDF link is not available to this user" });
  }
  const resolved = path.resolve(PREVIEW_DIR, decoded);
  if (!resolved.startsWith(path.resolve(PREVIEW_DIR))) {
    return json(res, 400, { error: "Invalid mass DTR PDF path" });
  }
  try {
    await fs.access(resolved);
  } catch {
    return json(res, 404, { error: "Mass DTR PDF file not found" });
  }
  return sendInlinePdfAndDelete(res, resolved, decoded);
}
async function handlePreviewDtrPdf(req, res, fileName) {
  const user = await requireAttendanceRead(req, res);
  if (!user) return;
  const decoded = decodeURIComponent(fileName);
  if (!/^dtr-[0-9a-f-]{36}\.pdf$/i.test(decoded)) {
    return json(res, 400, { error: "Invalid DTR PDF file name" });
  }
  if (!(await authorizeDtrExportJob(user, decoded, "Single"))) {
    return json(res, 403, { error: "DTR PDF link is not available to this user" });
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

async function readDtrCorrectionRequests({
  employeeId = "",
  status = "",
  requestType = "",
  reviewerId = "",
  q = "",
  from = "",
  to = "",
}) {
  const where = [];
  const params = {};
  if (employeeId) {
    where.push("r.employee_id = :employeeId");
    params.employeeId = employeeId;
  }
  if (status) {
    where.push("r.status = :status");
    params.status = status;
  }
  if (requestType) {
    where.push("r.request_type = :requestType");
    params.requestType = requestType;
  }
  if (reviewerId) {
    where.push("r.reviewed_by = :reviewerId");
    params.reviewerId = reviewerId;
  }
  if (q) {
    where.push(`(
      e.employee_no LIKE :query OR e.firstname LIKE :query OR e.lastname LIKE :query OR
      r.reason LIKE :query OR r.review_remarks LIKE :query OR r.requested_label LIKE :query
    )`);
    params.query = `%${q}%`;
  }
  if (from) {
    where.push("r.work_date >= :from");
    params.from = from;
  }
  if (to) {
    where.push("r.work_date <= :to");
    params.to = to;
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [rows] = await pool.execute(
    `SELECT r.*, e.employee_no, e.department,
            ${EMPLOYEE_DISPLAY_NAME_SQL} AS employee_name,
            creator.name AS created_by_name,
            reviewer.name AS reviewed_by_name,
            reverser.name AS reversed_by_name
     FROM dtr_correction_requests r
     INNER JOIN employees e ON e.id = r.employee_id
     LEFT JOIN users creator ON creator.id = r.created_by
     LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
     LEFT JOIN users reverser ON reverser.id = r.reversed_by
     ${whereSql}
     ORDER BY CASE r.status WHEN 'Pending' THEN 0 ELSE 1 END, r.created_at DESC
     LIMIT 500`,
    params,
  );
  const requests = rows.map(dtrCorrectionRequestRow);
  if (!requests.length) return requests;
  const placeholders = requests.map(() => "?").join(", ");
  const [eventRows] = await pool.query(
    `SELECT ev.*, actor.name AS actor_name
     FROM dtr_correction_events ev
     LEFT JOIN users actor ON actor.id = ev.actor_id
     WHERE ev.request_id IN (${placeholders})
     ORDER BY ev.created_at ASC`,
    requests.map((item) => item.id),
  );
  const eventsByRequest = new Map();
  for (const row of eventRows) {
    const event = {
      id: row.id,
      eventType: row.event_type,
      fromStatus: row.from_status || "",
      toStatus: row.to_status,
      actorName: row.actor_name || "System",
      remarks: row.remarks || "",
      ipAddress: row.ip_address || "",
      original: parseJson(row.original_json, null),
      requested: parseJson(row.requested_json, null),
      applied: parseJson(row.applied_json, null),
      createdAt: row.created_at,
    };
    const events = eventsByRequest.get(row.request_id) || [];
    events.push(event);
    eventsByRequest.set(row.request_id, events);
  }
  return requests.map((request) => ({
    ...request,
    events: eventsByRequest.get(request.id) || [],
  }));
}

async function handleListDtrCorrectionRequests(req, res, url) {
  const user = await requireUser(req, res);
  if (!user) return;
  const canApproveCorrections = await hasPermission(user, "attendance.corrections.approve");
  const canSelfServiceAttendance = await hasPermission(user, "self_service.access");
  if (!canApproveCorrections && !canSelfServiceAttendance) {
    return json(res, 403, { error: "DTR correction request access required" });
  }
  const requestedEmployeeId = String(url.searchParams.get("employeeId") || "").trim();
  const employeeId = canApproveCorrections ? requestedEmployeeId : user.employeeId || "";
  if (!canApproveCorrections && !employeeId) {
    return json(res, 400, { error: "No employee record linked to this account" });
  }
  const status = String(url.searchParams.get("status") || "").trim();
  if (status && !["Pending", "Approved", "Disapproved", "Cancelled", "Reversed"].includes(status)) {
    return json(res, 400, { error: "Invalid request status" });
  }
  const requestType = String(url.searchParams.get("requestType") || "").trim();
  if (requestType && !["Times", "Label"].includes(requestType)) {
    return json(res, 400, { error: "Invalid request type" });
  }
  const requests = await readDtrCorrectionRequests({
    employeeId,
    status,
    requestType,
    reviewerId: String(url.searchParams.get("reviewerId") || "").trim(),
    q: String(url.searchParams.get("q") || "")
      .trim()
      .slice(0, 100),
    from: normalizeDate(url.searchParams.get("from")),
    to: normalizeDate(url.searchParams.get("to")),
  });
  return json(res, 200, { requests });
}

async function handleCreateDtrCorrectionRequest(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!(await hasPermission(user, "self_service.access"))) {
    return json(res, 403, { error: "DTR correction request access required" });
  }
  const body = await readBody(req);
  const employeeId = user.employeeId || "";
  if (!employeeId) return json(res, 400, { error: "Employee is required" });
  const workDate = normalizeDate(body.workDate || body.date);
  if (!workDate) return json(res, 400, { error: "DTR date is required" });
  if (workDate > formatLocalDate(new Date())) {
    return json(res, 400, { error: "Future DTR dates cannot be corrected" });
  }
  const requestType = body.requestType === "Label" ? "Label" : "Times";
  const reason = String(body.reason || "").trim();
  if (reason.length < 5) return json(res, 400, { error: "Provide a clear reason for the request" });
  if (reason.length > 1000) return json(res, 400, { error: "Reason is too long" });

  const [[employee]] = await pool.execute(
    `SELECT id FROM employees WHERE id = :employeeId LIMIT 1`,
    {
      employeeId,
    },
  );
  if (!employee) return json(res, 404, { error: "Employee not found" });
  const [[existing]] = await pool.execute(
    `SELECT * FROM dtr_entries WHERE employee_id = :employeeId AND work_date = :workDate LIMIT 1`,
    { employeeId, workDate },
  );
  const [[pending]] = await pool.execute(
    `SELECT id FROM dtr_correction_requests
     WHERE employee_id = :employeeId AND work_date = :workDate AND status = 'Pending' LIMIT 1`,
    { employeeId, workDate },
  );
  if (pending)
    return json(res, 409, { error: "A pending DTR request already exists for this date" });

  let requested = { amIn: null, amOut: null, pmIn: null, pmOut: null };
  let requestedLabel = null;
  if (requestType === "Times") {
    try {
      requested = {
        amIn: normalizeTimeInput(body.amIn),
        amOut: normalizeTimeInput(body.amOut),
        pmIn: normalizeTimeInput(body.pmIn),
        pmOut: normalizeTimeInput(body.pmOut),
      };
    } catch (error) {
      return json(res, 400, { error: error.message });
    }
    const originalTimes = [
      existing?.am_in,
      existing?.am_out,
      existing?.pm_in,
      existing?.pm_out,
    ].map((value) => formatTime(value));
    const requestedTimes = [requested.amIn, requested.amOut, requested.pmIn, requested.pmOut].map(
      (value) => formatTime(value),
    );
    if (originalTimes.every((value, index) => value === requestedTimes[index])) {
      return json(res, 400, { error: "Requested times are unchanged" });
    }
  } else {
    requestedLabel = String(body.label || body.requestedLabel || "")
      .trim()
      .replace(/\s+/g, " ");
    if (requestedLabel.length < 3) return json(res, 400, { error: "Enter the DTR activity label" });
    if (requestedLabel.length > 180) return json(res, 400, { error: "DTR label is too long" });
    if (requestedLabel === String(existing?.display_label || "").trim()) {
      return json(res, 400, { error: "Requested label is unchanged" });
    }
  }

  const id = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO dtr_correction_requests (
       id, employee_id, dtr_entry_id, work_date, request_type,
       original_am_in, original_am_out, original_pm_in, original_pm_out, original_label,
       requested_am_in, requested_am_out, requested_pm_in, requested_pm_out, requested_label,
       reason, created_by, request_ip
     ) VALUES (
       :id, :employeeId, :dtrEntryId, :workDate, :requestType,
       :originalAmIn, :originalAmOut, :originalPmIn, :originalPmOut, :originalLabel,
       :requestedAmIn, :requestedAmOut, :requestedPmIn, :requestedPmOut, :requestedLabel,
       :reason, :createdBy, :requestIp
     )`,
    {
      id,
      employeeId,
      dtrEntryId: existing?.id || null,
      workDate,
      requestType,
      originalAmIn: existing?.am_in || null,
      originalAmOut: existing?.am_out || null,
      originalPmIn: existing?.pm_in || null,
      originalPmOut: existing?.pm_out || null,
      originalLabel: existing?.display_label || null,
      requestedAmIn: requested.amIn,
      requestedAmOut: requested.amOut,
      requestedPmIn: requested.pmIn,
      requestedPmOut: requested.pmOut,
      requestedLabel,
      reason,
      createdBy: user.id,
      requestIp: getIp(req),
    },
  );
  await insertDtrCorrectionEvent(pool, {
    requestId: id,
    eventType: "Filed",
    toStatus: "Pending",
    actorId: user.id,
    remarks: reason,
    ipAddress: getIp(req),
    original: dtrAuditSnapshot(existing),
    requested:
      requestType === "Times"
        ? {
            amIn: formatTime(requested.amIn),
            amOut: formatTime(requested.amOut),
            pmIn: formatTime(requested.pmIn),
            pmOut: formatTime(requested.pmOut),
            displayLabel: "",
          }
        : { displayLabel: requestedLabel },
  });
  await logAudit(
    user.id,
    "attendance.correction_request.create",
    { id, employeeId, workDate, requestType },
    req,
  );
  const requests = await readDtrCorrectionRequests({ employeeId, from: workDate, to: workDate });
  const createdRequest = requests.find((item) => item.id === id);
  await notifyRoles({
    topic: "attendance",
    title: "New DTR correction request",
    message: `${createdRequest?.employeeName || "An employee"} filed a ${requestType === "Label" ? "DTR label" : "time correction"} request for ${workDate}.`,
    path: `/attendance#dtr-request-${id}`,
    sourceType: "dtr_correction_request",
    sourceId: id,
    roles: APPROVAL_ROLES,
    excludeUserId: user.id,
  });
  return json(res, 201, { request: createdRequest });
}

async function handleDecideDtrCorrectionRequest(req, res, id) {
  const user = await requirePermission(
    req,
    res,
    "attendance.corrections.approve",
    "DTR correction approval access required",
  );
  if (!user) return;
  const body = await readBody(req);
  const status = String(body.status || "");
  if (!["Approved", "Disapproved"].includes(status)) {
    return json(res, 400, { error: "Decision must be Approved or Disapproved" });
  }
  const reviewRemarks = String(body.reviewRemarks || body.remarks || "").trim();
  if (status === "Disapproved" && reviewRemarks.length < 3) {
    return json(res, 400, { error: "Disapproval reason is required" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[request]] = await connection.execute(
      `SELECT * FROM dtr_correction_requests WHERE id = :id FOR UPDATE`,
      { id },
    );
    if (!request) {
      await connection.rollback();
      return json(res, 404, { error: "DTR request not found" });
    }
    if (request.status !== "Pending") {
      await connection.rollback();
      return json(res, 409, { error: "This DTR request has already been decided" });
    }

    let beforeSnapshot = null;
    let appliedSnapshot = null;
    if (status === "Approved") {
      const [[existing]] = await connection.execute(
        `SELECT * FROM dtr_entries
         WHERE employee_id = :employeeId AND work_date = :workDate
         LIMIT 1 FOR UPDATE`,
        { employeeId: request.employee_id, workDate: request.work_date },
      );
      if (!correctionOriginalStillMatches(request, existing)) {
        await connection.rollback();
        return json(res, 409, {
          error:
            "The DTR changed after this request was filed. Review the current record and ask the employee to file a new request.",
        });
      }

      beforeSnapshot = dtrAuditSnapshot(existing);
      if (request.request_type === "Times") {
        const existingLocks = dtrLockFields(existing);
        const requestedLocks = {
          amIn: formatTime(request.original_am_in) !== formatTime(request.requested_am_in)
            ? true
            : existingLocks.amIn,
          amOut: formatTime(request.original_am_out) !== formatTime(request.requested_am_out)
            ? true
            : existingLocks.amOut,
          pmIn: formatTime(request.original_pm_in) !== formatTime(request.requested_pm_in)
            ? true
            : existingLocks.pmIn,
          pmOut: formatTime(request.original_pm_out) !== formatTime(request.requested_pm_out)
            ? true
            : existingLocks.pmOut,
        };
        await upsertDtrEntry(
          connection,
          {
            id: existing?.id || crypto.randomUUID(),
            employeeId: request.employee_id,
            workDate: normalizeDate(request.work_date),
            amIn: request.requested_am_in,
            amOut: request.requested_am_out,
            pmIn: request.requested_pm_in,
            pmOut: request.requested_pm_out,
            source: "Adjusted",
            remarks: reviewRemarks || request.reason,
            lockFields: requestedLocks,
          },
          user.id,
          false,
        );
      } else if (existing) {
        await connection.execute(
          `UPDATE dtr_entries
           SET display_label = :label, display_label_request_id = :requestId,
               status = 'Official Business', late_minutes = 0, undertime_minutes = 0,
               source = 'Adjusted', remarks = :remarks, edited_by = :editedBy, edited_at = NOW()
           WHERE id = :id`,
          {
            id: existing.id,
            label: request.requested_label,
            requestId: request.id,
            remarks: reviewRemarks || request.reason,
            editedBy: user.id,
          },
        );
      } else {
        await connection.execute(
          `INSERT INTO dtr_entries (
             id, employee_id, work_date, status, source, remarks,
             display_label, display_label_request_id, edited_by, edited_at
           ) VALUES (
             :id, :employeeId, :workDate, 'Official Business', 'Adjusted', :remarks,
             :label, :requestId, :editedBy, NOW()
           )`,
          {
            id: crypto.randomUUID(),
            employeeId: request.employee_id,
            workDate: request.work_date,
            remarks: reviewRemarks || request.reason,
            label: request.requested_label,
            requestId: request.id,
            editedBy: user.id,
          },
        );
      }
      const [[applied]] = await connection.execute(
        `SELECT * FROM dtr_entries
         WHERE employee_id = :employeeId AND work_date = :workDate LIMIT 1`,
        { employeeId: request.employee_id, workDate: request.work_date },
      );
      appliedSnapshot = dtrAuditSnapshot(applied);
    }

    await connection.execute(
      `UPDATE dtr_correction_requests
       SET status = :status, reviewed_by = :reviewedBy, review_remarks = :reviewRemarks,
           reviewed_at = NOW(), review_ip = :reviewIp,
           pre_approval_snapshot = :beforeSnapshot, applied_snapshot = :appliedSnapshot
       WHERE id = :id`,
      {
        id,
        status,
        reviewedBy: user.id,
        reviewRemarks: reviewRemarks || null,
        reviewIp: getIp(req),
        beforeSnapshot: beforeSnapshot ? JSON.stringify(beforeSnapshot) : null,
        appliedSnapshot: appliedSnapshot ? JSON.stringify(appliedSnapshot) : null,
      },
    );
    await insertDtrCorrectionEvent(connection, {
      requestId: id,
      eventType: status,
      fromStatus: "Pending",
      toStatus: status,
      actorId: user.id,
      remarks: reviewRemarks,
      ipAddress: getIp(req),
      original: beforeSnapshot,
      requested:
        request.request_type === "Times"
          ? {
              amIn: formatTime(request.requested_am_in),
              amOut: formatTime(request.requested_am_out),
              pmIn: formatTime(request.requested_pm_in),
              pmOut: formatTime(request.requested_pm_out),
            }
          : { displayLabel: request.requested_label || "" },
      applied: appliedSnapshot,
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  await logAudit(user.id, "attendance.correction_request.decision", { id, status }, req);
  const requests = await readDtrCorrectionRequests({});
  const decidedRequest = requests.find((item) => item.id === id);
  if (decidedRequest) {
    await notifyEmployees({
      topic: "attendance",
      title: `DTR request ${status.toLowerCase()}`,
      message: `Your ${decidedRequest.requestType === "Label" ? "DTR label" : "time correction"} request for ${decidedRequest.workDate} was ${status.toLowerCase()}.`,
      path: `/requests#request-${id}`,
      sourceType: "dtr_correction_request",
      sourceId: id,
      employeeIds: [decidedRequest.employeeId],
      excludeUserId: user.id,
    });
  }
  return json(res, 200, { request: decidedRequest });
}

async function handleCancelDtrCorrectionRequest(req, res, id) {
  const user = await requireUser(req, res);
  if (!user) return;
  const [[request]] = await pool.execute(
    `SELECT * FROM dtr_correction_requests WHERE id = :id LIMIT 1`,
    { id },
  );
  if (!request) return json(res, 404, { error: "DTR request not found" });
  if (request.status !== "Pending")
    return json(res, 409, { error: "Only pending requests can be cancelled" });
  const canCancelAny = await hasPermission(user, "attendance.write");
  const canCancelOwn =
    (await hasPermission(user, "self_service.access")) && user.employeeId === request.employee_id;
  if (!canCancelAny && !canCancelOwn) {
    return json(res, 403, { error: "You can only cancel your own request" });
  }
  await pool.execute(`UPDATE dtr_correction_requests SET status = 'Cancelled' WHERE id = :id`, {
    id,
  });
  await insertDtrCorrectionEvent(pool, {
    requestId: id,
    eventType: "Cancelled",
    fromStatus: "Pending",
    toStatus: "Cancelled",
    actorId: user.id,
    remarks: "Request cancelled",
    ipAddress: getIp(req),
  });
  await logAudit(user.id, "attendance.correction_request.cancel", { id }, req);
  return json(res, 200, { ok: true });
}

async function handleReverseDtrCorrectionRequest(req, res, id) {
  const user = await requirePermission(
    req,
    res,
    "attendance.corrections.approve",
    "DTR correction approval access required",
  );
  if (!user) return;
  const body = await readBody(req);
  const reason = String(body.reason || body.reverseReason || "").trim();
  if (reason.length < 5) {
    return json(res, 400, { error: "A clear reversal reason is required" });
  }

  let employeeId = "";
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[request]] = await connection.execute(
      `SELECT * FROM dtr_correction_requests WHERE id = :id FOR UPDATE`,
      { id },
    );
    if (!request) {
      await connection.rollback();
      return json(res, 404, { error: "DTR request not found" });
    }
    if (request.status !== "Approved") {
      await connection.rollback();
      return json(res, 409, { error: "Only an approved request can be reversed" });
    }
    employeeId = request.employee_id;
    const beforeSnapshot = parseJson(request.pre_approval_snapshot, null);
    const appliedSnapshot = parseJson(request.applied_snapshot, null);
    if (!beforeSnapshot || !appliedSnapshot) {
      await connection.rollback();
      return json(res, 409, { error: "This approval has no safe reversal snapshot" });
    }
    const [[current]] = await connection.execute(
      `SELECT * FROM dtr_entries
       WHERE employee_id = :employeeId AND work_date = :workDate
       LIMIT 1 FOR UPDATE`,
      { employeeId: request.employee_id, workDate: request.work_date },
    );
    if (!dtrSnapshotsMatch(dtrAuditSnapshot(current), appliedSnapshot)) {
      await connection.rollback();
      return json(res, 409, {
        error:
          "The DTR changed after approval. Reversal was blocked to avoid overwriting newer data.",
      });
    }

    if (!beforeSnapshot.exists) {
      await connection.execute(`DELETE FROM dtr_entries WHERE id = :id`, { id: current.id });
    } else {
      const restoredLockFields = {
        amIn: false,
        amOut: false,
        pmIn: false,
        pmOut: false,
        ...(beforeSnapshot.lockFields || {}),
      };
      await connection.execute(
        `UPDATE dtr_entries
         SET am_in = :amIn, am_out = :amOut, pm_in = :pmIn, pm_out = :pmOut,
             status = :status, late_minutes = :lateMinutes,
             undertime_minutes = :undertimeMinutes, source = :source, remarks = :remarks,
             display_label = :displayLabel,
             display_label_request_id = :displayLabelRequestId,
             locked = :locked, am_in_locked = :amInLocked, am_out_locked = :amOutLocked,
             pm_in_locked = :pmInLocked, pm_out_locked = :pmOutLocked,
             edited_by = :editedBy, edited_at = NOW()
         WHERE id = :id`,
        {
          id: current.id,
          amIn: beforeSnapshot.amIn || null,
          amOut: beforeSnapshot.amOut || null,
          pmIn: beforeSnapshot.pmIn || null,
          pmOut: beforeSnapshot.pmOut || null,
          status: beforeSnapshot.status || "Incomplete",
          lateMinutes: Number(beforeSnapshot.lateMinutes || 0),
          undertimeMinutes: Number(beforeSnapshot.undertimeMinutes || 0),
          source: beforeSnapshot.source || "Imported",
          remarks: beforeSnapshot.remarks || null,
          displayLabel: beforeSnapshot.displayLabel || null,
          displayLabelRequestId: beforeSnapshot.displayLabelRequestId || null,
          locked: Object.values(restoredLockFields).every(Boolean) ? 1 : 0,
          amInLocked: restoredLockFields.amIn ? 1 : 0,
          amOutLocked: restoredLockFields.amOut ? 1 : 0,
          pmInLocked: restoredLockFields.pmIn ? 1 : 0,
          pmOutLocked: restoredLockFields.pmOut ? 1 : 0,
          editedBy: user.id,
        },
      );
    }
    const restoredSnapshot = beforeSnapshot.exists
      ? dtrAuditSnapshot({
          ...beforeSnapshot,
          am_in: beforeSnapshot.amIn,
          am_out: beforeSnapshot.amOut,
          pm_in: beforeSnapshot.pmIn,
          pm_out: beforeSnapshot.pmOut,
          late_minutes: beforeSnapshot.lateMinutes,
          undertime_minutes: beforeSnapshot.undertimeMinutes,
          display_label: beforeSnapshot.displayLabel,
          display_label_request_id: beforeSnapshot.displayLabelRequestId,
          am_in_locked: restoredLockFields.amIn ? 1 : 0,
          am_out_locked: restoredLockFields.amOut ? 1 : 0,
          pm_in_locked: restoredLockFields.pmIn ? 1 : 0,
          pm_out_locked: restoredLockFields.pmOut ? 1 : 0,
        })
      : { exists: false };
    await connection.execute(
      `UPDATE dtr_correction_requests
       SET status = 'Reversed', reversed_by = :reversedBy, reverse_reason = :reason,
           reversal_ip = :reversalIp, reversed_at = NOW()
       WHERE id = :id`,
      { id, reversedBy: user.id, reason, reversalIp: getIp(req) },
    );
    await insertDtrCorrectionEvent(connection, {
      requestId: id,
      eventType: "Reversed",
      fromStatus: "Approved",
      toStatus: "Reversed",
      actorId: user.id,
      remarks: reason,
      ipAddress: getIp(req),
      original: appliedSnapshot,
      applied: restoredSnapshot,
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  await logAudit(user.id, "attendance.correction_request.reverse", { id, reason }, req);
  const requests = await readDtrCorrectionRequests({ employeeId });
  const reversedRequest = requests.find((item) => item.id === id);
  if (reversedRequest) {
    await notifyEmployees({
      topic: "attendance",
      title: "DTR approval reversed",
      message: `The approved DTR request for ${reversedRequest.workDate} was reversed.`,
      path: `/requests#request-${id}`,
      sourceType: "dtr_correction_request",
      sourceId: id,
      employeeIds: [employeeId],
      excludeUserId: user.id,
    });
  }
  return json(res, 200, { request: reversedRequest });
}

async function handleCreateDtrEntry(req, res) {
  const user = await requireAttendanceWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const employee = await resolveAttendanceEmployee(body);
  const workDate = normalizeDate(body.workDate || body.date);
  if (!workDate) return json(res, 400, { error: "Date is required" });
  let shiftTemplateId = null;
  try {
    shiftTemplateId = await resolveShiftTemplateIdByCode(body.shiftTemplateCode);
  } catch (error) {
    return json(res, error.statusCode || 400, { error: error.message });
  }

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
    shiftTemplateId,
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
  const connection = await pool.getConnection();
  let employeeId = "";
  let workDate = "";
  try {
    await connection.beginTransaction();
    const [[existing]] = await connection.execute(
      `SELECT * FROM dtr_entries WHERE id = :id LIMIT 1 FOR UPDATE`,
      { id },
    );
    if (!existing) {
      await connection.rollback();
      return json(res, 404, { error: "DTR entry not found" });
    }

    let shiftTemplateId = existing.shift_template_id || null;
    if (Object.prototype.hasOwnProperty.call(body, "shiftTemplateCode")) {
      try {
        shiftTemplateId = await resolveShiftTemplateIdByCode(body.shiftTemplateCode);
      } catch (error) {
        await connection.rollback();
        return json(res, error.statusCode || 400, { error: error.message });
      }
    }
    const entry = {
      employeeId: existing.employee_id,
      workDate: normalizeDate(body.workDate || body.date || existing.work_date),
      amIn: normalizeTimeInput(body.amIn ?? body.am_in ?? existing.am_in),
      amOut: normalizeTimeInput(body.amOut ?? body.am_out ?? existing.am_out),
      pmIn: normalizeTimeInput(body.pmIn ?? body.pm_in ?? existing.pm_in),
      pmOut: normalizeTimeInput(body.pmOut ?? body.pm_out ?? existing.pm_out),
      shiftTemplateId,
    };
    const beforeSnapshot = dtrAuditSnapshot(existing);
    const existingLocks = dtrLockFields(existing);
    const changedSlots = {
      amIn: formatTime(existing.am_in) !== formatTime(entry.amIn),
      amOut: formatTime(existing.am_out) !== formatTime(entry.amOut),
      pmIn: formatTime(existing.pm_in) !== formatTime(entry.pmIn),
      pmOut: formatTime(existing.pm_out) !== formatTime(entry.pmOut),
    };
    const shouldLockEditedSlots = Boolean(body.lockDtr);
    const nextLocks = {
      amIn: changedSlots.amIn ? shouldLockEditedSlots : existingLocks.amIn,
      amOut: changedSlots.amOut ? shouldLockEditedSlots : existingLocks.amOut,
      pmIn: changedSlots.pmIn ? shouldLockEditedSlots : existingLocks.pmIn,
      pmOut: changedSlots.pmOut ? shouldLockEditedSlots : existingLocks.pmOut,
    };
    const stats = calculateAttendanceStats(entry);
    const allSlotsLocked = Object.values(nextLocks).every(Boolean);
    await connection.execute(
      `UPDATE dtr_entries
       SET work_date = :workDate, am_in = :amIn, am_out = :amOut, pm_in = :pmIn, pm_out = :pmOut,
           status = :status, late_minutes = :lateMinutes, undertime_minutes = :undertimeMinutes,
           source = 'Adjusted', remarks = :remarks, shift_template_id = :shiftTemplateId,
           locked = :locked, am_in_locked = :amInLocked, am_out_locked = :amOutLocked,
           pm_in_locked = :pmInLocked, pm_out_locked = :pmOutLocked,
           edited_by = :editedBy, edited_at = NOW()
       WHERE id = :id`,
      {
        id,
        ...entry,
        status: body.status || stats.status,
        lateMinutes: stats.lateMinutes,
        undertimeMinutes: stats.undertimeMinutes,
        remarks: body.remarks || "",
        locked: allSlotsLocked ? 1 : 0,
        amInLocked: nextLocks.amIn ? 1 : 0,
        amOutLocked: nextLocks.amOut ? 1 : 0,
        pmInLocked: nextLocks.pmIn ? 1 : 0,
        pmOutLocked: nextLocks.pmOut ? 1 : 0,
        editedBy: user.id,
      },
    );
    const [[applied]] = await connection.execute(`SELECT * FROM dtr_entries WHERE id = :id`, {
      id,
    });
    const appliedSnapshot = dtrAuditSnapshot(applied);
    const requestId = crypto.randomUUID();
    await connection.execute(
      `INSERT INTO dtr_correction_requests (
         id, employee_id, dtr_entry_id, work_date, request_type,
         original_am_in, original_am_out, original_pm_in, original_pm_out,
         requested_am_in, requested_am_out, requested_pm_in, requested_pm_out,
         reason, status, reviewed_by, review_remarks, reviewed_at, created_by,
         pre_approval_snapshot, applied_snapshot, request_ip, review_ip
       ) VALUES (
         :requestId, :employeeId, :dtrEntryId, :workDate, 'Times',
         :originalAmIn, :originalAmOut, :originalPmIn, :originalPmOut,
         :requestedAmIn, :requestedAmOut, :requestedPmIn, :requestedPmOut,
         :reason, 'Approved', :reviewedBy, :reviewRemarks, NOW(), :createdBy,
         :beforeSnapshot, :appliedSnapshot, :requestIp, :reviewIp
       )`,
      {
        requestId,
        employeeId: existing.employee_id,
        dtrEntryId: id,
        workDate: entry.workDate,
        originalAmIn: existing.am_in || null,
        originalAmOut: existing.am_out || null,
        originalPmIn: existing.pm_in || null,
        originalPmOut: existing.pm_out || null,
        requestedAmIn: entry.amIn || null,
        requestedAmOut: entry.amOut || null,
        requestedPmIn: entry.pmIn || null,
        requestedPmOut: entry.pmOut || null,
        reason: body.remarks || "Direct admin DTR edit",
        reviewedBy: user.id,
        reviewRemarks: body.remarks || "Direct admin DTR edit",
        createdBy: user.id,
        beforeSnapshot: JSON.stringify(beforeSnapshot),
        appliedSnapshot: JSON.stringify(appliedSnapshot),
        requestIp: getIp(req),
        reviewIp: getIp(req),
      },
    );
    await insertDtrCorrectionEvent(connection, {
      requestId,
      eventType: "Approved",
      fromStatus: "Pending",
      toStatus: "Approved",
      actorId: user.id,
      remarks: body.remarks || "Direct admin DTR edit",
      ipAddress: getIp(req),
      original: beforeSnapshot,
      requested: {
        amIn: formatTime(entry.amIn),
        amOut: formatTime(entry.amOut),
        pmIn: formatTime(entry.pmIn),
        pmOut: formatTime(entry.pmOut),
        lockFields: nextLocks,
      },
      applied: appliedSnapshot,
    });
    await connection.commit();
    employeeId = existing.employee_id;
    workDate = entry.workDate;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  await logAudit(user.id, "attendance.dtr.update", { id }, req);
  const [rows] = await readAttendanceRows({
    employeeId,
    from: workDate,
    to: workDate,
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
  if (mass && !(await hasPermission(user, "attendance.write")))
    return json(res, 403, { error: "Mass export requires HR access" });
  if (employeeId && !(await canReadEmployeeAttendance(user, employeeId))) {
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
     WHERE u.id IS NULL AND e.is_hidden = 0
     ORDER BY e.lastname ASC, e.firstname ASC, e.employee_no ASC
     LIMIT 500`,
  );

  return json(res, 200, { employees: rows.map(employeeRow) });
}

async function handleBulkCreateEmployeeAccounts(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const accounts = [];
  const skipped = [];
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();
    const [employees] = await connection.query(
      `SELECT e.*
       FROM employees e
       WHERE e.is_hidden = 0
         AND NOT EXISTS (
           SELECT 1 FROM users u WHERE u.employee_id = e.id
         )
       ORDER BY e.lastname ASC, e.firstname ASC, e.employee_no ASC
       LIMIT 500
       FOR UPDATE`,
    );

    for (const employee of employees) {
      try {
        const username = await generateEmployeeUsername(connection, employee);
        const temporaryPassword = generateTemporaryPassword();
        const passwordHash = hashPassword(temporaryPassword);
        const accountName = formatEmployeeName(employee);
        const [accountResult] = await connection.execute(
          `INSERT INTO users (username, password_hash, name, role, employee_id, must_change_password)
           VALUES (:username, :passwordHash, :name, 'Employee', :employeeId, 1)`,
          { username, passwordHash, name: accountName, employeeId: employee.id },
        );
        await recordPasswordHistory(accountResult.insertId, passwordHash, connection);
        accounts.push({
          userId: accountResult.insertId,
          employeeId: employee.id,
          employeeNo: employee.employee_no,
          employeeName: formatEmployeeName(employee),
          username,
          temporaryPassword,
        });
      } catch (error) {
        if (error?.statusCode || error?.code === "ER_DUP_ENTRY") {
          skipped.push({
            employeeId: employee.id,
            employeeNo: employee.employee_no,
            employeeName: formatEmployeeName(employee),
            reason:
              error?.code === "ER_DUP_ENTRY"
                ? "Account already exists"
                : error.message || "Unable to create account",
          });
          continue;
        }
        throw error;
      }
    }

    await connection.commit();
    committed = true;
    await logAudit(
      user.id,
      "users.bulk_create_employee_accounts",
      { created: accounts.length, skipped: skipped.length },
      req,
    );
    return json(res, 201, { accounts, skipped });
  } catch (error) {
    if (!committed) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function handleBulkResetEmployeePasswords(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const accounts = [];
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();
    const [users] = await connection.query(
      `SELECT u.id user_id,
              u.username,
              u.password_hash,
              u.role,
              u.employee_id,
              e.employee_no,
              e.lastname,
              e.firstname
         FROM users u
         INNER JOIN employees e ON e.id = u.employee_id
        WHERE u.role = 'Employee'
          AND u.is_active = 1
          AND e.is_hidden = 0
        ORDER BY e.lastname ASC, e.firstname ASC, e.employee_no ASC
        FOR UPDATE`,
    );

    for (const account of users) {
      const temporaryPassword = generateTemporaryPassword();
      const passwordHash = hashPassword(temporaryPassword);
      await recordPasswordHistory(account.user_id, account.password_hash, connection);
      await connection.execute(
        `UPDATE users
            SET password_hash = :passwordHash,
                must_change_password = 1,
                failed_login_attempts = 0,
                locked_at = NULL
          WHERE id = :id`,
        { id: account.user_id, passwordHash },
      );
      await recordPasswordHistory(account.user_id, passwordHash, connection);
      accounts.push({
        userId: account.user_id,
        employeeId: account.employee_id,
        employeeNo: account.employee_no,
        employeeName: formatEmployeeName(account),
        username: account.username,
        temporaryPassword,
      });
    }

    if (users.length) {
      await connection.query(
        `DELETE s
           FROM sessions s
           INNER JOIN users u ON u.id = s.user_id
           INNER JOIN employees e ON e.id = u.employee_id
          WHERE u.role = 'Employee'
            AND u.is_active = 1
            AND e.is_hidden = 0`,
      );
    }

    await connection.commit();
    committed = true;
    await logAudit(user.id, "users.bulk_reset_employee_passwords", { reset: accounts.length }, req);
    return json(res, 200, { accounts });
  } catch (error) {
    if (!committed) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function handleCreateEmployee(req, res) {
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;

  const body = await readBody(req);
  if (body.appointment && !(await hasPermission(user, "movements.write"))) {
    return json(res, 403, { error: "Employee movement management access required" });
  }
  if (body.engagement && !(await hasPermission(user, "engagements.manage"))) {
    return json(res, 403, { error: "Non-Plantilla engagement access required" });
  }
  let data;
  try {
    data = employeeDbPayload(body);
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
  const id = crypto.randomUUID();
  const employeeNo = data.employeeNo || `EMP-${Date.now()}`;
  const createAccount = body.createAccount !== false;
  let accountActive = !body.appointment && !body.engagement ? body.accountActive !== false : false;

  let connection;
  let committed = false;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `INSERT INTO employees (
        id, employee_no, biometric_id, firstname, middlename, lastname, name_ext, department, position, status, level,
        status_class, date_hired, date_employed, item_no, emp_status, lifecycle_state, current_org_unit_ref_id,
        birthday, gender, civil_status,
        email, cellphone_no, photo_url, schedule_am_in, schedule_am_out, schedule_pm_in, schedule_pm_out,
        dtr_signatory, dtr_noter_id, is_dtr_noter, regular, profile_json
      ) VALUES (
        :id, :employeeNo, :biometricId, :firstname, :middlename, :lastname, :nameExt, :department, :position, :status, :level,
        :statusClass, :dateHired, :dateEmployed, :itemNo, :empStatus, :lifecycleState, :currentOrganizationId,
        :birthday, :gender, :civilStatus,
        :email, :cellphoneNo, :photoUrl, :scheduleAmIn, :scheduleAmOut, :schedulePmIn, :schedulePmOut,
        :dtrSignatory, :dtrNoterId, :isDtrNoter, :regular, :profileJson
      )`,
      { id, ...data, employeeNo },
    );

    let account = null;
    let accountResult = null;
    let appointmentMovementId = null;
    let appointmentPostResult = null;
    let engagementId = null;
    if (body.appointment && body.engagement)
      throw httpError(400, "Choose either a Plantilla appointment or a non-Plantilla engagement");
    if (body.appointment) {
      const appointment = body.appointment;
      const targetPlantillaItemId = String(appointment.targetPlantillaItemId || "").trim();
      const requestedSalaryGradeId = Number(
        appointment.targetSalaryGradeId || appointment.salaryGradeId || 0,
      );
      const effectiveDate = String(appointment.effectiveDate || "").trim();
      if (!targetPlantillaItemId) throw httpError(400, "Target Plantilla item is required");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate))
        throw httpError(400, "Appointment effective date is required");
      const [[target]] = await connection.execute(
        `SELECT pi.*,p.title position_title,
                item_sg.ordinance item_salary_ordinance,item_sg.grade item_salary_grade,
                COALESCE(sec.name,divi.name,off.name,s.name) organization_name,
                pt.name plantilla_type_name
           FROM plantilla_items pi JOIN positions p ON p.id=pi.position_id
           LEFT JOIN salary_grades item_sg ON item_sg.id=pi.salary_grade_id
           LEFT JOIN hr_reference_values sec ON sec.id=pi.section_ref_id
           LEFT JOIN hr_reference_values divi ON divi.id=pi.division_ref_id
           LEFT JOIN hr_reference_values off ON off.id=pi.office_ref_id
           LEFT JOIN hr_reference_values s ON s.id=pi.sector_ref_id
           LEFT JOIN hr_reference_values pt ON pt.id=pi.plantilla_type_ref_id
          WHERE pi.id=:id FOR UPDATE`,
        { id: targetPlantillaItemId },
      );
      if (!target || target.item_status !== "Active")
        throw httpError(409, "Target Plantilla item is not active");
      const plantillaEmploymentStatus =
        String(target.plantilla_type_name || "").trim() || "Permanent";
      await connection.execute("UPDATE employees SET status=:status WHERE id=:id", {
        id,
        status:
          plantillaEmploymentStatus.toLowerCase() === "plantilla"
            ? "Permanent"
            : plantillaEmploymentStatus,
      });
      const targetSalaryGradeId = requestedSalaryGradeId || Number(target.salary_grade_id || 0);
      const [[appointmentSalary]] = await connection.execute(
        `SELECT selected.id
           FROM salary_grades selected
          WHERE selected.id=:salaryGradeId
            AND selected.is_active=1
            AND selected.ordinance=:ordinance
            AND selected.grade=:grade`,
        {
          salaryGradeId: targetSalaryGradeId,
          ordinance: target.item_salary_ordinance,
          grade: target.item_salary_grade,
        },
      );
      if (!appointmentSalary)
        throw httpError(
          409,
          "Select an active employee salary step for the Plantilla item's salary grade",
        );
      const itemEffectiveFrom = normalizeDate(target.effective_from);
      const itemEffectiveTo = normalizeDate(target.effective_to);
      if (itemEffectiveFrom && effectiveDate < itemEffectiveFrom) {
        throw httpError(
          409,
          `Appointment date cannot be before the Plantilla item effectivity (${itemEffectiveFrom})`,
        );
      }
      if (itemEffectiveTo && effectiveDate > itemEffectiveTo) {
        throw httpError(
          409,
          `Appointment date cannot be after the Plantilla item effectivity (${itemEffectiveTo})`,
        );
      }
      const [[occupied]] = await connection.execute(
        "SELECT id FROM plantilla_occupancies WHERE plantilla_item_id=:id AND status='Active' FOR UPDATE",
        { id: targetPlantillaItemId },
      );
      if (occupied) throw httpError(409, "Target Plantilla item is already occupied");
      const [[pendingMovement]] = await connection.execute(
        `SELECT id,control_number,status FROM personnel_movements
          WHERE target_plantilla_item_id=:id
            AND status IN ('Draft','Submitted','Reviewed','Approved','Scheduled')
          LIMIT 1`,
        { id: targetPlantillaItemId },
      );
      if (pendingMovement)
        throw httpError(
          409,
          `Target Plantilla item already has pending movement ${pendingMovement.control_number} (${pendingMovement.status})`,
        );
      appointmentMovementId = crypto.randomUUID();
      const controlNumber =
        String(appointment.controlNumber || "")
          .trim()
          .toUpperCase()
          .slice(0, 80) ||
        `PA-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const sourceSnapshot = {
        employee: {
          id,
          employeeNo,
          department: "",
          position: "",
          itemNo: "",
          empStatus: data.empStatus,
          lifecycleState: data.lifecycleState,
          currentOrganizationId: null,
        },
        occupancy: null,
      };
      const supportingDocuments = Array.isArray(appointment.supportingDocuments)
        ? appointment.supportingDocuments.slice(0, 20)
        : [];
      await connection.execute(
        `INSERT INTO personnel_movements
          (id,control_number,employee_id,action_type,status,effective_date,authority_number,authority_date,
           target_plantilla_item_id,target_position_id,target_salary_grade_id,target_department,remarks,
           supporting_documents,source_snapshot_json,prepared_by,submitted_by,reviewed_by,approved_by,
           submitted_at,reviewed_at,approved_at,decision_remarks)
         VALUES (:id,:controlNumber,:employeeId,'Original Appointment','Approved',:effectiveDate,:authorityNumber,
          :authorityDate,:targetPlantillaItemId,:targetPositionId,:targetSalaryGradeId,:targetDepartment,
          :remarks,:supportingDocuments,:sourceSnapshot,:userId,:userId,:userId,:userId,
          NOW(),NOW(),NOW(),:decisionRemarks)`,
        {
          id: appointmentMovementId,
          controlNumber,
          employeeId: id,
          effectiveDate,
          authorityNumber: String(appointment.authorityNumber || "").trim() || null,
          authorityDate: appointment.authorityDate || null,
          targetPlantillaItemId,
          targetPositionId: target.position_id,
          targetSalaryGradeId,
          targetDepartment: target.organization_name || null,
          remarks: String(appointment.remarks || "").trim() || null,
          supportingDocuments: JSON.stringify(supportingDocuments),
          sourceSnapshot: JSON.stringify(sourceSnapshot),
          userId: user.id,
          decisionRemarks: "Created from Plantilla add employee; approval not required",
        },
      );
      await connection.execute(
        `INSERT INTO personnel_movement_events
          (id,movement_id,event_type,from_status,to_status,actor_id,remarks,snapshot_json)
         VALUES (:id,:movementId,'Created from vacancy',NULL,'Approved',:userId,:remarks,:snapshot)`,
        {
          id: crypto.randomUUID(),
          movementId: appointmentMovementId,
          userId: user.id,
          remarks:
            String(appointment.remarks || "").trim() ||
            "Created from Plantilla add employee; approval not required",
          snapshot: JSON.stringify({ source: sourceSnapshot, targetItemId: targetPlantillaItemId }),
        },
      );
      appointmentPostResult = await movementHandlers.post(
        req,
        null,
        appointmentMovementId,
        user,
        "Created from Plantilla add employee; approval not required",
        { connection },
      );
    }
    if (body.engagement) {
      const engagement = body.engagement;
      const allowedTypes = new Set(["JO", "COS", "Casual", "Contractual", "Other"]);
      const engagementType = String(engagement.engagementType || "").trim();
      if (!allowedTypes.has(engagementType)) throw httpError(400, "Select a valid engagement type");
      const organizationId = Number(engagement.organizationId);
      if (!Number.isInteger(organizationId) || organizationId < 1) {
        throw httpError(400, "Organizational unit is required");
      }
      const organization = await readAssignableOrganization(organizationId, connection);
      const designation = String(engagement.designation || "").trim();
      const dateFrom = String(engagement.dateFrom || "").trim();
      const dateTo = String(engagement.dateTo || "").trim();
      if (!designation) throw httpError(400, "Designation is required");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo))
        throw httpError(400, "Engagement start and end dates are required");
      if (dateTo < dateFrom)
        throw httpError(400, "Engagement end date cannot be before its start date");
      const currentDate = formatLocalDate(new Date());
      const engagementStatus =
        dateFrom > currentDate ? "Scheduled" : dateTo < currentDate ? "Expired" : "Active";
      accountActive = engagementStatus === "Active";
      const rate =
        engagement.rate === "" || engagement.rate == null ? null : Number(engagement.rate);
      if (rate !== null && (!Number.isFinite(rate) || rate < 0))
        throw httpError(400, "Engagement rate must be non-negative");
      engagementId = crypto.randomUUID();
      await connection.execute(
        `INSERT INTO non_plantilla_engagements
          (id,employee_id,engagement_type,org_unit_ref_id,designation,contract_number,date_from,date_to,
           rate,funding_source,supervisor,remarks,status,created_by)
         VALUES (:id,:employeeId,:engagementType,:organizationId,:designation,:contractNumber,:dateFrom,
          :dateTo,:rate,:fundingSource,:supervisor,:remarks,:status,:userId)`,
        {
          id: engagementId,
          employeeId: id,
          engagementType,
          organizationId,
          designation,
          contractNumber: String(engagement.contractNumber || "").trim() || null,
          dateFrom,
          dateTo,
          rate,
          fundingSource: String(engagement.fundingSource || "").trim() || null,
          supervisor: String(engagement.supervisor || "").trim() || null,
          remarks: String(engagement.remarks || "").trim() || null,
          status: engagementStatus,
          userId: user.id,
        },
      );
      if (engagementStatus === "Active") {
        await connection.execute(
          `UPDATE employees SET department=:department,position=:position,status=:employmentType,
            emp_status='Active',lifecycle_state='Active',current_org_unit_ref_id=:organizationId WHERE id=:employeeId`,
          {
            employeeId: id,
            department: organization.name,
            position: designation,
            employmentType: engagementType,
            organizationId,
          },
        );
      }
    }

    if (createAccount) {
      const username = await generateEmployeeUsername(connection, data);
      const temporaryPassword = generateTemporaryPassword();
      const passwordHash = hashPassword(temporaryPassword);
      const accountName = formatEmployeeName(data);
      [accountResult] = await connection.execute(
        `INSERT INTO users (username, password_hash, name, role, employee_id, must_change_password, is_active)
         VALUES (:username, :passwordHash, :name, 'Employee', :employeeId, 1, :isActive)`,
        {
          username,
          passwordHash,
          name: accountName,
          employeeId: id,
          isActive: accountActive ? 1 : 0,
        },
      );
      await recordPasswordHistory(accountResult.insertId, passwordHash, connection);
      account = { username, temporaryPassword, active: accountActive };
    }

    await connection.commit();
    committed = true;
    await logAudit(user.id, "employees.create", { employeeId: id, employeeNo }, req);
    if (accountResult && account) {
      await logAudit(
        user.id,
        "users.create_employee_account",
        {
          userId: accountResult.insertId,
          username: account.username,
          employeeId: id,
          active: accountActive,
        },
        req,
      );
    }
    if (appointmentMovementId) {
      await logAudit(
        user.id,
        "movement.create_from_vacancy",
        { id: appointmentMovementId, employeeId: id },
        req,
      );
      if (appointmentPostResult) {
        await logAudit(
          user.id,
          appointmentPostResult.status === "Scheduled" ? "movement.schedule" : "movement.post",
          {
            id: appointmentMovementId,
            employeeId: id,
            actionType: "Original Appointment",
            ...(appointmentPostResult.effectiveDate
              ? { effectiveDate: appointmentPostResult.effectiveDate }
              : {}),
          },
          req,
        );
      }
    }
    if (engagementId) {
      await logAudit(
        user.id,
        "engagement.create_with_person",
        { id: engagementId, employeeId: id },
        req,
      );
    }
    const employee = await readEmployeeById(id);
    await notifyPermission({
      permission: "employees.read",
      excludeUserId: user.id,
      topic: "employees",
      title: "Employee added",
      message: `${formatEmployeeName(data)} (${employeeNo}) was added${appointmentMovementId ? " with a Plantilla appointment" : engagementId ? " with a non-Plantilla engagement" : ""}.`,
      path: "/employees",
      sourceType: "employee",
      sourceId: id,
    });
    return json(res, 201, {
      employee,
      ...(account ? { account } : {}),
      ...(appointmentMovementId
        ? {
            appointmentMovementId,
            appointmentStatus: appointmentPostResult?.status || "Approved",
          }
        : {}),
      ...(engagementId ? { engagementId } : {}),
    });
  } catch (error) {
    if (connection && !committed) await connection.rollback();
    if (error?.statusCode) return json(res, error.statusCode, { error: error.message });
    if (error?.code === "ER_DUP_ENTRY") {
      if (String(error.message || "").includes("uniq_personnel_movement_control")) {
        return json(res, 409, { error: "Movement control number already exists" });
      }
      if (String(error.message || "").includes("users")) {
        return json(res, 409, { error: "Generated employee account already exists" });
      }
      return json(res, 409, { error: "Employee ID already exists" });
    }
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function handleGetEmployee(req, res, id) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!(await hasPermission(user, "employees.read")) && user.employeeId !== id) {
    return json(res, 403, { error: "You can only view your own employee record" });
  }

  const employee = await readEmployeeById(id);
  if (!employee) return json(res, 404, { error: "Employee not found" });
  if (employee.isHidden && !(await hasPermission(user, "employees.read"))) {
    return json(res, 404, { error: "Employee not found" });
  }

  const sections = {};
  for (const [key, config] of Object.entries(EMPLOYEE_SECTION_TABLES)) {
    const [rows] = await pool.execute(
      `SELECT id, payload, created_at, updated_at FROM \`${config.table}\` WHERE employee_id = :id ORDER BY created_at ASC, id ASC`,
      { id },
    );
    sections[key] = rows.map(sectionRow);
  }

  const currentAssignment = assignmentHandlers
    ? await assignmentHandlers.currentAssignment(id)
    : { substantive: null, temporary: null };
  return json(res, 200, { employee, sections, currentAssignment });
}

async function buildEmployeePdsPayload(id, user) {
  if (!(await hasPermission(user, "employees.read")) && user.employeeId !== id) {
    throw httpError(403, "You can only export your own Personal Data Sheet");
  }
  try {
    await fs.access(PDS_TEMPLATE_XLSX);
  } catch {
    throw httpError(500, "Personal Data Sheet Excel template was not found");
  }

  const employee = await readEmployeeById(id);
  if (!employee) throw httpError(404, "Employee not found");

  const sections = {};
  for (const [key, config] of Object.entries(EMPLOYEE_SECTION_TABLES)) {
    const [rows] = await pool.execute(
      `SELECT id, payload, created_at, updated_at FROM \`${config.table}\` WHERE employee_id = :id ORDER BY created_at ASC, id ASC`,
      { id },
    );
    sections[key] = rows.map(sectionRow);
  }

  const [[agency]] = await pool.query(
    `SELECT name, tagline FROM agency_settings WHERE id = 1 LIMIT 1`,
  );

  return {
    agency: agency || {},
    employee,
    sections,
    generatedAt: new Date().toISOString(),
  };
}

function pdsFileName(employee) {
  const cleanPart = (value) =>
    String(value || "")
      .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const lastName = cleanPart(employee.lastname);
  const firstName = cleanPart(employee.firstname);
  const middleName = cleanPart(employee.middlename);
  const middleInitial = middleName ? `${middleName.charAt(0).toUpperCase()}.` : "";
  const name = [lastName, [firstName, middleInitial].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return `${name || "Personal Data Sheet"} - Personal Data Sheet.xlsx`;
}

async function generateEmployeePdsExcelFile(id, user, req) {
  const payload = await buildEmployeePdsPayload(id, user);
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const fileName = `pds-${crypto.randomUUID()}.xlsx`;
  const inputPath = path.join(PREVIEW_DIR, `${fileName}.json`);
  const outputPath = path.join(PREVIEW_DIR, fileName);

  await fs.writeFile(inputPath, JSON.stringify(payload), "utf8");
  let scriptOutput = "";
  try {
    scriptOutput = await runPython([PDS_EXCEL_SCRIPT, inputPath, outputPath, PDS_TEMPLATE_XLSX]);
  } finally {
    await fs.rm(inputPath, { force: true }).catch(() => {});
  }

  const result = parseJson(scriptOutput, {});
  const warnings = Array.isArray(result.warnings) ? result.warnings : [];
  await registerDocumentExport(fileName, id, user.id, "pds_excel");
  await logAudit(
    user.id,
    "employees.pds_excel_generate",
    { employeeId: id, fileName, warnings },
    req,
  );
  return { fileName, outputPath, payload, warnings };
}

async function handleGenerateEmployeePdsExcel(req, res, id) {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const { fileName, warnings } = await generateEmployeePdsExcelFile(id, user, req);
    return json(res, 200, {
      fileName,
      warnings,
      downloadUrl: `/api/employees/pds/excel/${encodeURIComponent(fileName)}`,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return json(res, status, { error: error.message });
  }
}

async function handleDownloadEmployeePdsExcel(req, res, fileName) {
  const user = await requireUser(req, res);
  if (!user) return;
  const decoded = decodeURIComponent(fileName);
  if (!/^pds-[0-9a-f-]{36}\.xlsx$/i.test(decoded)) {
    return json(res, 400, { error: "Invalid Personal Data Sheet file name" });
  }
  const resolved = path.resolve(PREVIEW_DIR, decoded);
  if (!resolved.startsWith(path.resolve(PREVIEW_DIR))) {
    return json(res, 400, { error: "Invalid Personal Data Sheet path" });
  }
  try {
    await fs.access(resolved);
  } catch {
    return json(res, 404, { error: "Personal Data Sheet file not found" });
  }
  const exportRecord = await authorizeDocumentExport(user, decoded);
  if (!exportRecord) {
    return json(res, 403, { error: "This export is not available to your account or has expired" });
  }
  const employee = await readEmployeeById(exportRecord.employee_id);
  const downloadFileName = pdsFileName(employee || {});
  await logAudit(user.id, "employees.pds_excel_download", { fileName: decoded }, req);
  return sendFile(res, resolved, downloadFileName, { deleteAfterSend: true });
}

function wesFileName(employee) {
  const cleanPart = (value) =>
    String(value || "")
      .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const lastName = cleanPart(employee.lastname);
  const firstName = cleanPart(employee.firstname);
  const middleName = cleanPart(employee.middlename);
  const middleInitial = middleName ? `${middleName.charAt(0).toUpperCase()}.` : "";
  const name = [lastName, [firstName, middleInitial].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return `${name || "Work Experience Sheet"} - Work Experience Sheet.docx`;
}

async function generateEmployeeWesDocxFile(id, user, req) {
  try {
    await fs.access(WES_TEMPLATE_DOCX);
  } catch {
    throw httpError(500, "Work Experience Sheet template was not found");
  }

  const payload = await buildEmployeePdsPayload(id, user);
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const fileName = `wes-${crypto.randomUUID()}.docx`;
  const inputPath = path.join(PREVIEW_DIR, `${fileName}.json`);
  const outputPath = path.join(PREVIEW_DIR, fileName);

  await fs.writeFile(inputPath, JSON.stringify(payload), "utf8");
  let scriptOutput = "";
  try {
    scriptOutput = await runPython([WES_DOCX_SCRIPT, inputPath, outputPath, WES_TEMPLATE_DOCX]);
  } finally {
    await fs.rm(inputPath, { force: true }).catch(() => {});
  }

  const result = parseJson(scriptOutput, {});
  const rowCount = Number(result.rowCount || 0);
  await registerDocumentExport(fileName, id, user.id, "wes_docx");
  await logAudit(
    user.id,
    "employees.wes_docx_generate",
    { employeeId: id, fileName, rowCount },
    req,
  );
  return { fileName, outputPath, rowCount };
}

async function handleGenerateEmployeeWesDocx(req, res, id) {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const { fileName, rowCount } = await generateEmployeeWesDocxFile(id, user, req);
    return json(res, 200, {
      fileName,
      rowCount,
      downloadUrl: `/api/employees/wes/docx/${encodeURIComponent(fileName)}`,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return json(res, status, { error: error.message });
  }
}

async function handleDownloadEmployeeWesDocx(req, res, fileName) {
  const user = await requireUser(req, res);
  if (!user) return;
  const decoded = decodeURIComponent(fileName);
  if (!/^wes-[0-9a-f-]{36}\.docx$/i.test(decoded)) {
    return json(res, 400, { error: "Invalid Work Experience Sheet file name" });
  }
  const resolved = path.resolve(PREVIEW_DIR, decoded);
  if (!resolved.startsWith(path.resolve(PREVIEW_DIR))) {
    return json(res, 400, { error: "Invalid Work Experience Sheet path" });
  }
  try {
    await fs.access(resolved);
  } catch {
    return json(res, 404, { error: "Work Experience Sheet file not found" });
  }
  const exportRecord = await authorizeDocumentExport(user, decoded);
  if (!exportRecord) {
    return json(res, 403, { error: "This export is not available to your account or has expired" });
  }
  const employee = await readEmployeeById(exportRecord.employee_id);
  const downloadFileName = wesFileName(employee || {});
  await logAudit(user.id, "employees.wes_docx_download", { fileName: decoded }, req);
  return sendFile(res, resolved, downloadFileName, { deleteAfterSend: true });
}

async function handleUpdateEmployee(req, res, id) {
  const user = await requireUser(req, res);
  if (!user) return;
  const canManage = await canManageEmployeeRecord(user);
  const isSelfService =
    !canManage && user.employeeId === id && (await hasPermission(user, "self_service.access"));
  if (!canManage && !isSelfService) {
    return json(res, 403, { error: "You can only update your own employee record" });
  }

  const existing = await readEmployeeById(id);
  if (!existing) return json(res, 404, { error: "Employee not found" });
  const body = await readBody(req);
  let data;
  try {
    data = employeeDbPayload(body, existing);
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
  if (isSelfService) {
    const existingData = employeeDbPayload(existing, existing);
    data = selfServiceEmployeePayload(body, existing, data, existingData);
  }
  if (
    canManage &&
    body.currentOrganizationId !== undefined &&
    data.currentOrganizationId &&
    Number(data.currentOrganizationId) !== Number(existing.currentOrganizationId || 0)
  ) {
    try {
      const organization = await readAssignableOrganization(Number(data.currentOrganizationId));
      data.department = organization.name;
    } catch (error) {
      return json(res, 400, { error: error.message });
    }
  }
  const assignmentOwner = await activeAssignmentOwnership(id);
  if (assignmentOwner) {
    const changed = assignmentOwnedFieldChanges(existing, data);
    if (changed.length) {
      return json(res, 409, {
        error: `This employee has an active ${assignmentOwner.kind}. Change ${changed.join(
          ", ",
        )} through assignment or movement workflows instead.`,
      });
    }
  }
  const employeeNo = data.employeeNo || existing.employeeId || `EMP-${Date.now()}`;

  let connection;
  let committed = false;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [[currentEmployeeState]] = await connection.execute(
      `SELECT emp_status FROM employees WHERE id = :id FOR UPDATE`,
      { id },
    );
    const lifecycleTransition = canManage
      ? employeeLifecycleTransition(currentEmployeeState.emp_status, data.empStatus)
      : null;
    if (lifecycleTransition) {
      data.lifecycleState = lifecycleTransition.lifecycleState;
    }
    await connection.execute(
      `UPDATE employees SET
        employee_no = :employeeNo,
        biometric_id = :biometricId,
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
        lifecycle_state = :lifecycleState,
        current_org_unit_ref_id = :currentOrganizationId,
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
    if (lifecycleTransition) {
      await connection.execute(
        `UPDATE users
            SET is_active = :accountActive
          WHERE employee_id = :employeeId`,
        {
          employeeId: id,
          accountActive: lifecycleTransition.accountActive,
        },
      );
    }
    const [updatedRows] = await connection.execute(
      `SELECT * FROM employees WHERE id = :id LIMIT 1`,
      { id },
    );
    const updated = employeeRow(updatedRows[0]);
    await connection.commit();
    committed = true;
    const changes = auditDiff(existing, updated);
    await logAudit(
      user.id,
      "employees.update",
      {
        actorRole: user.role,
        employeeId: id,
        changedFields: auditChangedFields(changes),
        changes,
      },
      req,
    );
    return json(res, 200, { employee: updated });
  } catch (error) {
    if (connection && !committed) await connection.rollback().catch(() => {});
    if (error?.code === "ER_DUP_ENTRY")
      return json(res, 409, { error: "Employee ID already exists" });
    throw error;
  } finally {
    connection?.release();
  }
}

async function handleDeleteEmployee(req, res, id) {
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;

  const [[employee]] = await pool.execute(
    `SELECT id, is_hidden FROM employees WHERE id = :id LIMIT 1`,
    {
      id,
    },
  );
  if (!employee) return json(res, 404, { error: "Employee not found" });
  if (employee.is_hidden) return json(res, 200, { ok: true });

  await pool.execute(`UPDATE employees SET is_hidden = 1 WHERE id = :id`, { id });
  await logAudit(user.id, "employees.archive", { employeeId: id }, req);
  return json(res, 200, { ok: true });
}

async function handleRestoreEmployee(req, res, id) {
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;

  const [[employee]] = await pool.execute(
    `SELECT id, is_hidden FROM employees WHERE id = :id LIMIT 1`,
    {
      id,
    },
  );
  if (!employee) return json(res, 404, { error: "Employee not found" });
  if (!employee.is_hidden) return json(res, 200, { ok: true });

  await pool.execute(`UPDATE employees SET is_hidden = 0 WHERE id = :id`, { id });
  await logAudit(user.id, "employees.restore", { employeeId: id }, req);
  return json(res, 200, { ok: true });
}

async function handleCreateSectionRow(req, res, employeeId, section) {
  const user = await requireUser(req, res);
  if (!user) return;
  const canManage = await canManageEmployeeRecord(user);
  const isSelfService =
    !canManage &&
    user.employeeId === employeeId &&
    (await hasPermission(user, "self_service.access"));
  if (!canManage && !isSelfService) {
    return json(res, 403, { error: "You can only update your own 201 records" });
  }
  const config = validateSection(section);
  if (!config) return json(res, 404, { error: "Section not found" });
  if (isSelfService && !EMPLOYEE_SELF_SERVICE_SECTIONS.has(section)) {
    return json(res, 403, { error: selfServiceSectionAccessError(section) });
  }
  const employee = await readEmployeeById(employeeId);
  if (!employee) return json(res, 404, { error: "Employee not found" });

  const body = await readBody(req);
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
  let safePayload;
  try {
    safePayload = validateSectionPayload(
      section,
      isSelfService ? selfServiceSectionPayload(section, payload) : payload,
    );
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
  const id = crypto.randomUUID();

  if (config.single) {
    const [[existing]] = await pool.execute(
      `SELECT id FROM \`${config.table}\` WHERE employee_id = :employeeId LIMIT 1`,
      { employeeId },
    );
    if (existing)
      return handleUpdateSectionRow(req, res, employeeId, section, existing.id, safePayload);
  }

  await pool.execute(
    `INSERT INTO \`${config.table}\` (id, employee_id, payload) VALUES (:id, :employeeId, :payload)`,
    { id, employeeId, payload: JSON.stringify(safePayload) },
  );
  const sanitizedPayload = Object.fromEntries(
    Object.entries(safePayload).map(([key, value]) => [key, sanitizeAuditValue(key, value)]),
  );
  await logAudit(
    user.id,
    "employees.section_create",
    {
      actorRole: user.role,
      employeeId,
      section,
      rowId: id,
      changedFields: Object.keys(sanitizedPayload),
      after: sanitizedPayload,
    },
    req,
  );
  const [[row]] = await pool.execute(
    `SELECT id, payload, created_at, updated_at FROM \`${config.table}\` WHERE id = :id`,
    { id },
  );
  return json(res, 201, { row: sectionRow(row) });
}

async function handleUpdateSectionRow(req, res, employeeId, section, rowId, suppliedPayload) {
  const user = await requireUser(req, res);
  if (!user) return;
  const canManage = await canManageEmployeeRecord(user);
  const isSelfService =
    !canManage &&
    user.employeeId === employeeId &&
    (await hasPermission(user, "self_service.access"));
  if (!canManage && !isSelfService) {
    return json(res, 403, { error: "You can only update your own 201 records" });
  }
  const config = validateSection(section);
  if (!config) return json(res, 404, { error: "Section not found" });
  if (isSelfService && !EMPLOYEE_SELF_SERVICE_SECTIONS.has(section)) {
    return json(res, 403, { error: selfServiceSectionAccessError(section) });
  }
  const body = suppliedPayload ? { payload: suppliedPayload } : await readBody(req);
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
  const [[existing]] = await pool.execute(
    `SELECT id, payload FROM \`${config.table}\` WHERE id = :rowId AND employee_id = :employeeId LIMIT 1`,
    { rowId, employeeId },
  );
  if (!existing) return json(res, 404, { error: "Record not found" });
  const beforePayload = parseJson(existing.payload, {});
  let safePayload = payload;
  try {
    safePayload = validateSectionPayload(
      section,
      isSelfService ? selfServiceSectionPayload(section, payload, beforePayload) : payload,
      beforePayload,
    );
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
  const changes = auditDiff(beforePayload, safePayload);

  const [result] = await pool.execute(
    `UPDATE \`${config.table}\` SET payload = :payload WHERE id = :rowId AND employee_id = :employeeId`,
    { rowId, employeeId, payload: JSON.stringify(safePayload) },
  );
  if (result.affectedRows === 0) return json(res, 404, { error: "Record not found" });
  await logAudit(
    user.id,
    "employees.section_update",
    {
      actorRole: user.role,
      employeeId,
      section,
      rowId,
      changedFields: auditChangedFields(changes),
      changes,
    },
    req,
  );
  const [[row]] = await pool.execute(
    `SELECT id, payload, created_at, updated_at FROM \`${config.table}\` WHERE id = :rowId`,
    { rowId },
  );
  return json(res, 200, { row: sectionRow(row) });
}

async function handleDeleteSectionRow(req, res, employeeId, section, rowId) {
  const user = await requireUser(req, res);
  if (!user) return;
  const canManage = await canManageEmployeeRecord(user);
  const isSelfService =
    !canManage &&
    user.employeeId === employeeId &&
    (await hasPermission(user, "self_service.access"));
  if (!canManage && !isSelfService) {
    return json(res, 403, { error: "You can only update your own 201 records" });
  }
  const config = validateSection(section);
  if (!config) return json(res, 404, { error: "Section not found" });
  if (isSelfService && !EMPLOYEE_SELF_SERVICE_SECTIONS.has(section)) {
    return json(res, 403, { error: selfServiceSectionAccessError(section) });
  }
  const [[existing]] = await pool.execute(
    `SELECT id, payload FROM \`${config.table}\` WHERE id = :rowId AND employee_id = :employeeId LIMIT 1`,
    { rowId, employeeId },
  );
  if (!existing) return json(res, 404, { error: "Record not found" });
  const beforePayload = parseJson(existing.payload, {});
  const sanitizedPayload = Object.fromEntries(
    Object.entries(beforePayload).map(([key, value]) => [key, sanitizeAuditValue(key, value)]),
  );

  const [result] = await pool.execute(
    `DELETE FROM \`${config.table}\` WHERE id = :rowId AND employee_id = :employeeId`,
    { rowId, employeeId },
  );
  if (result.affectedRows === 0) return json(res, 404, { error: "Record not found" });
  await logAudit(
    user.id,
    "employees.section_delete",
    {
      actorRole: user.role,
      employeeId,
      section,
      rowId,
      changedFields: Object.keys(sanitizedPayload),
      before: sanitizedPayload,
    },
    req,
  );
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
  if (!(await hasPermission(user, "leave.read")) && user.employeeId !== employeeId) {
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
            e.employee_no, e.firstname, e.middlename, e.lastname, e.name_ext, e.department, e.position,
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
  const [ledgerRows] = await pool.execute(
    `SELECT l.*, lt.code, lt.name, u.name AS created_by_name
     FROM leave_credit_ledger l
     INNER JOIN leave_types lt ON lt.id = l.leave_type_id
     LEFT JOIN users u ON u.id = l.created_by
     WHERE l.employee_id = :employeeId
     ORDER BY l.created_at DESC
     LIMIT 200`,
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
    ledger: ledgerRows.map(leaveCreditLedgerRow),
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
  await changeLeaveBalance(employeeId, leaveTypeId, amount, "adjusted", amount, {
    entryType: "ManualAdjustment",
    sourceType: "leave_adjustment",
    sourceId: id,
    description: reason || "Manual leave credit adjustment",
    createdBy: user.id,
  });
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
            e.employee_no, e.firstname, e.middlename, e.lastname, e.name_ext, e.department, e.position,
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

function countWeekdaysInclusive(dateFrom, dateTo) {
  const start = new Date(`${dateFrom}T00:00:00Z`);
  const end = new Date(`${dateTo}T00:00:00Z`);
  let count = 0;
  for (const day = new Date(start); day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
    const weekday = day.getUTCDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
  }
  return count;
}

function addUtcDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

async function resolveChargedLeaveType(leaveType) {
  if (!Number(leaveType.is_credit_based || 0)) return null;
  const creditGroup = String(leaveType.credit_group || leaveType.code || "").trim();
  if (creditGroup === "VL" || creditGroup === "SL") {
    const [[groupType]] = await pool.execute(
      `SELECT id FROM leave_types WHERE code = :code AND is_active = 1 LIMIT 1`,
      { code: creditGroup },
    );
    return Number(groupType?.id || leaveType.id);
  }
  return Number(leaveType.id);
}

function approvedLeaveCreditChargeDays(application, leaveType, approvedDaysWithPay) {
  if (!Number(leaveType.is_credit_based || 0)) return 0;
  if (approvedDaysWithPay !== null && approvedDaysWithPay !== undefined) {
    return Number(approvedDaysWithPay || 0);
  }
  return Number(application.days_requested || 0);
}

async function handleCreateLeaveApplication(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const body = await readBody(req);
  const employeeId = String(body.employeeId || "").trim();
  const leaveTypeId = Number(body.leaveTypeId);
  const dateFrom = String(body.dateFrom || "").trim();
  const dateTo = String(body.dateTo || "").trim();
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
  const formPayload =
    body.formPayload && typeof body.formPayload === "object" ? body.formPayload : {};
  if (!employeeId || !Number.isInteger(leaveTypeId) || !dateFrom || !dateTo) {
    return json(res, 400, {
      error: "Employee, leave type, and leave dates are required",
    });
  }
  if (!(await hasPermission(user, "leave.write")) && user.employeeId !== employeeId) {
    return json(res, 403, { error: "You can only file leave for your own employee record" });
  }
  const employee = await readEmployeeById(employeeId);
  if (!employee) return json(res, 404, { error: "Employee not found" });
  const parsedFrom = new Date(`${dateFrom}T00:00:00Z`);
  const parsedTo = new Date(`${dateTo}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateTo) ||
    Number.isNaN(parsedFrom.getTime()) ||
    Number.isNaN(parsedTo.getTime()) ||
    dateTo < dateFrom
  ) {
    return json(res, 400, {
      error: "Leave dates must be valid and the end date cannot precede the start date",
    });
  }
  const daysRequested = countWeekdaysInclusive(dateFrom, dateTo);
  if (daysRequested <= 0)
    return json(res, 400, { error: "Leave dates must include at least one working day" });
  const [[leaveType]] = await pool.execute(`SELECT * FROM leave_types WHERE id = :leaveTypeId`, {
    leaveTypeId,
  });
  if (!leaveType) return json(res, 404, { error: "Leave type not found" });

  const leaveCode = String(leaveType.code || "");
  const advanceNoticeDays = Number(leaveType.advance_notice_days || 0);
  if (advanceNoticeDays > 0 && dateFrom < addUtcDays(todayDateString(), advanceNoticeDays)) {
    return json(res, 400, {
      error: `${leaveType.name} must be filed at least ${advanceNoticeDays} day(s) before the start date`,
    });
  }
  const requiresLocation = ["VL", "SPL"].includes(leaveCode);
  if (requiresLocation && !["Philippines", "Abroad"].includes(detailLocationType)) {
    return json(res, 400, { error: "Please indicate whether the leave is local or abroad" });
  }
  if (detailLocationType === "Abroad" && !detailLocationText) {
    return json(res, 400, { error: "Please specify the abroad location" });
  }
  if (leaveCode === "SL" && !["Hospital", "OutPatient"].includes(detailSickType)) {
    return json(res, 400, {
      error: "Please indicate whether sick leave is in hospital or outpatient",
    });
  }
  if ((leaveCode === "SL" || leaveCode === "SLBW") && !detailIllness) {
    return json(res, 400, { error: "Please specify the illness or medical detail" });
  }
  if (leaveCode === "STUDY" && !["MastersDegree", "BarBoardReview"].includes(detailStudyPurpose)) {
    return json(res, 400, { error: "Please select the study leave purpose" });
  }
  if (["MONETIZATION", "TERMINAL", "OTHERS"].includes(leaveCode)) {
    const validOtherPurpose = ["Monetization", "TerminalLeave", "Other"].includes(
      detailOtherPurpose,
    );
    if (!validOtherPurpose || (detailOtherPurpose === "Other" && !detailOtherText)) {
      return json(res, 400, { error: "Please specify the other leave purpose" });
    }
  }
  if (
    leaveType.max_days !== null &&
    Number(leaveType.max_days) > 0 &&
    daysRequested > Number(leaveType.max_days)
  ) {
    return json(res, 400, {
      error: `${leaveType.name} can be filed for up to ${Number(leaveType.max_days)} days`,
    });
  }
  const [[overlap]] = await pool.execute(
    `SELECT id FROM leave_applications
      WHERE employee_id=:employeeId AND status IN ('Pending','Approved')
        AND date_from <= :dateTo AND date_to >= :dateFrom
      LIMIT 1`,
    { employeeId, dateFrom, dateTo },
  );
  if (overlap)
    return json(res, 409, { error: "The employee already has an overlapping leave application" });

  const chargedLeaveTypeId = await resolveChargedLeaveType(leaveType);
  if (chargedLeaveTypeId && daysRequested > 0) {
    await ensureLeaveBalance(employeeId, chargedLeaveTypeId);
    const [[balance]] = await pool.execute(
      `SELECT balance FROM leave_balances
       WHERE employee_id = :employeeId AND leave_type_id = :leaveTypeId
       LIMIT 1`,
      { employeeId, leaveTypeId: chargedLeaveTypeId },
    );
    if (Number(balance?.balance || 0) < daysRequested) {
      return json(res, 409, { error: "Insufficient leave balance for this request" });
    }
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
  if (chargedLeaveTypeId && chargedLeaveTypeId !== leaveTypeId) {
    await ensureLeaveBalance(employeeId, chargedLeaveTypeId);
  }
  await logAudit(user.id, "leave.application_create", { id, employeeId, leaveTypeId }, req);
  const application = await readLeaveApplication(id);
  await notifyRoles({
    topic: "leave",
    title: "New leave request",
    message: `${application?.employeeName || "An employee"} filed a leave request.`,
    path: `/leave#leave-request-${id}`,
    sourceType: "leave_application",
    sourceId: id,
    roles: APPROVAL_ROLES,
    excludeUserId: user.id,
  });
  return json(res, 201, { application });
}

async function handleDecideLeaveApplication(req, res, id) {
  const user = await requireApproval(req, res);
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
  const approvedTotal = [approvedDaysWithPay, approvedDaysWithoutPay, approvedDaysOther]
    .filter((value) => value !== null)
    .reduce((total, value) => total + Number(value || 0), 0);
  if (
    [approvedDaysWithPay, approvedDaysWithoutPay, approvedDaysOther].some(
      (value) => value !== null && value < 0,
    )
  ) {
    return json(res, 400, { error: "Approved leave days cannot be negative" });
  }

  const connection = await pool.getConnection();
  let existing;
  try {
    await connection.beginTransaction();
    const [[row]] = await connection.execute(
      `SELECT la.*, lt.is_credit_based, lt.credit_group, lt.code AS leave_code
       FROM leave_applications la
       INNER JOIN leave_types lt ON lt.id = la.leave_type_id
       WHERE la.id = :id
       FOR UPDATE`,
      { id },
    );
    existing = row;
    if (!existing) {
      await connection.rollback();
      return json(res, 404, { error: "Leave application not found" });
    }
    if (status === "Approved" && approvedTotal > Number(existing.days_requested)) {
      await connection.rollback();
      return json(res, 400, { error: "Approved leave days cannot exceed the requested days" });
    }

    const chargedLeaveTypeId = await resolveChargedLeaveType({
      id: existing.leave_type_id,
      code: existing.leave_code,
      is_credit_based: existing.is_credit_based,
      credit_group: existing.credit_group,
    });
    const nextChargeDays =
      status === "Approved"
        ? approvedLeaveCreditChargeDays(existing, existing, approvedDaysWithPay)
        : 0;
    const previousChargeDays = Number(
      existing.approved_credit_charge_days ?? existing.days_requested ?? 0,
    );
    const previousChargedTypeId = Number(existing.charged_leave_type_id || existing.leave_type_id);

    if (status === "Approved" && chargedLeaveTypeId && nextChargeDays > 0) {
      const [[balance]] = await connection.execute(
        `SELECT lb.balance FROM leave_balances lb
          WHERE lb.employee_id=:employeeId AND lb.leave_type_id=:leaveTypeId
          FOR UPDATE`,
        { employeeId: existing.employee_id, leaveTypeId: chargedLeaveTypeId },
      );
      const availableBalance =
        Number(balance?.balance || 0) +
        (existing.status === "Approved" && previousChargedTypeId === chargedLeaveTypeId
          ? previousChargeDays
          : 0);
      if (availableBalance < nextChargeDays) {
        await connection.rollback();
        return json(res, 409, { error: "Insufficient leave balance for this approval" });
      }
      const [[overlap]] = await connection.execute(
        `SELECT id FROM leave_applications
          WHERE employee_id=:employeeId AND id<>:id AND status='Approved'
            AND date_from <= :dateTo AND date_to >= :dateFrom LIMIT 1`,
        {
          employeeId: existing.employee_id,
          id,
          dateFrom: existing.date_from,
          dateTo: existing.date_to,
        },
      );
      if (overlap) {
        await connection.rollback();
        return json(res, 409, { error: "Another approved leave overlaps this application" });
      }
    }

    if (existing.status === "Approved" && previousChargeDays > 0) {
      await changeLeaveBalance(
        existing.employee_id,
        previousChargedTypeId,
        -previousChargeDays,
        "used",
        previousChargeDays,
        {
          entryType: "ApprovalReversal",
          sourceType: "leave_application",
          sourceId: id,
          description: `Reversed approved leave before status changed to ${status}`,
          createdBy: user.id,
        },
        connection,
      );
    }
    if (status === "Approved" && chargedLeaveTypeId && nextChargeDays > 0) {
      await changeLeaveBalance(
        existing.employee_id,
        chargedLeaveTypeId,
        nextChargeDays,
        "used",
        -nextChargeDays,
        {
          entryType: "LeaveApproval",
          sourceType: "leave_application",
          sourceId: id,
          description: "Approved leave application",
          createdBy: user.id,
        },
        connection,
      );
    }
    await connection.execute(
      `UPDATE leave_applications
       SET status = :status,
           approver_id = :approverId,
           decision_remarks = :remarks,
           approved_days_with_pay = :approvedDaysWithPay,
           approved_days_without_pay = :approvedDaysWithoutPay,
           approved_days_other = :approvedDaysOther,
           approved_days_other_text = :approvedDaysOtherText,
           final_disapproval_reason = :finalDisapprovalReason,
           approved_credit_charge_days = :approvedCreditChargeDays,
           charged_leave_type_id = :chargedLeaveTypeId,
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
        approvedCreditChargeDays: status === "Approved" ? nextChargeDays : null,
        chargedLeaveTypeId: status === "Approved" ? chargedLeaveTypeId : null,
      },
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await logAudit(user.id, "leave.application_decide", { id, status }, req);
  const application = await readLeaveApplication(id);
  if (application) {
    await notifyEmployees({
      topic: "leave",
      title: `Leave request ${status.toLowerCase()}`,
      message: `Your leave request was ${status.toLowerCase()}.`,
      path: `/requests#request-${id}`,
      sourceType: "leave_application",
      sourceId: id,
      employeeIds: [application.employeeId],
      excludeUserId: user.id,
    });
  }
  return json(res, 200, { application });
}

async function handleDeleteLeaveApplication(req, res, id) {
  const user = await requireLeaveWrite(req, res);
  if (!user) return;
  const [[existing]] = await pool.execute(`SELECT * FROM leave_applications WHERE id = :id`, {
    id,
  });
  if (!existing) return json(res, 404, { error: "Leave application not found" });
  if (existing.status === "Approved") {
    const chargeDays =
      existing.approved_credit_charge_days === null ||
      existing.approved_credit_charge_days === undefined
        ? Number(existing.days_requested || 0)
        : Number(existing.approved_credit_charge_days || 0);
    const chargedLeaveTypeId = Number(existing.charged_leave_type_id || existing.leave_type_id);
    if (chargeDays > 0) {
      await changeLeaveBalance(
        existing.employee_id,
        chargedLeaveTypeId,
        -chargeDays,
        "used",
        chargeDays,
        {
          entryType: "DeleteReversal",
          sourceType: "leave_application",
          sourceId: id,
          description: "Reversed approved leave because application was deleted",
          createdBy: user.id,
        },
      );
    }
  }
  await pool.execute(`DELETE FROM leave_applications WHERE id = :id`, { id });
  await logAudit(user.id, "leave.application_delete", { id }, req);
  return json(res, 200, { ok: true });
}

async function handleCancelLeaveApplication(req, res, id) {
  const user = await requireUser(req, res);
  if (!user) return;
  const [[existing]] = await pool.execute(
    `SELECT id, employee_id, status FROM leave_applications WHERE id = :id LIMIT 1`,
    { id },
  );
  if (!existing) return json(res, 404, { error: "Leave application not found" });
  if (existing.status !== "Pending") {
    return json(res, 409, { error: "Only pending leave applications can be withdrawn" });
  }
  const canCancelAny = await hasPermission(user, "leave.write");
  const canCancelOwn =
    (await hasPermission(user, "self_service.access")) && user.employeeId === existing.employee_id;
  if (!canCancelAny && !canCancelOwn) {
    return json(res, 403, { error: "You can only withdraw your own pending leave request" });
  }
  await pool.execute(
    `UPDATE leave_applications
     SET status = 'Cancelled',
         decision_remarks = :remarks,
         decided_at = NOW()
     WHERE id = :id AND status = 'Pending'`,
    { id, remarks: "Request withdrawn by employee" },
  );
  await logAudit(
    user.id,
    "leave.application_cancel",
    { id, employeeId: existing.employee_id },
    req,
  );
  const application = await readLeaveApplication(id);
  return json(res, 200, { application });
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
  if (!(await hasPermission(user, "leave.read")) && user.employeeId !== application.employeeId) {
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
  const fileName = `leave-form6-${crypto.randomUUID()}.xlsx`;
  const inputPath = path.join(PREVIEW_DIR, `${fileName}.json`);
  const outputPath = path.join(PREVIEW_DIR, fileName);

  await fs.writeFile(inputPath, JSON.stringify(payload), "utf8");
  try {
    await runPython([LEAVE_FORM6_EXCEL_SCRIPT, inputPath, outputPath, LEAVE_FORM6_TEMPLATE_XLSX]);
  } finally {
    await fs.rm(inputPath, { force: true }).catch(() => {});
  }

  await registerDocumentExport(
    fileName,
    payload.application.employeeId,
    user.id,
    "leave_form6_excel",
  );
  await logAudit(user.id, "leave.form6_excel_generate", { id, fileName }, req);
  return { fileName, outputPath, payload };
}

async function convertSpreadsheetToPdf(inputPath) {
  const libreOfficeExe = await resolveLibreOfficeExe();
  if (!libreOfficeExe) {
    throw new Error(
      "LibreOffice was not found. Install LibreOffice or set HRIS_LIBREOFFICE_EXE in server/.env.local to enable PDF exports.",
    );
  }
  await fs.mkdir(LIBREOFFICE_PROFILE_DIR, { recursive: true });
  const profileUri = `file:///${LIBREOFFICE_PROFILE_DIR.replace(/\\/g, "/")}`;
  await runProcess(libreOfficeExe, [
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

async function resolveLibreOfficeExe() {
  for (const candidate of LIBREOFFICE_CANDIDATES) {
    if (!candidate) continue;
    if (candidate.includes("\\") || candidate.includes("/")) {
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }
    try {
      await runProcess(candidate, ["--version"], 5000);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

async function exportDependencyStatus() {
  const checks = await Promise.all([
    fs.access(PDS_TEMPLATE_XLSX).then(
      () => ({ ok: true }),
      (error) => ({ ok: false, error: error.message }),
    ),
    fs.access(WES_TEMPLATE_DOCX).then(
      () => ({ ok: true }),
      (error) => ({ ok: false, error: error.message }),
    ),
    fs.access(DTR_TEMPLATE_XLSX).then(
      () => ({ ok: true }),
      (error) => ({ ok: false, error: error.message }),
    ),
    fs.access(LEAVE_FORM6_TEMPLATE_XLSX).then(
      () => ({ ok: true }),
      (error) => ({ ok: false, error: error.message }),
    ),
  ]);
  const libreOfficeExe = await resolveLibreOfficeExe();
  return {
    libreOffice: {
      ok: Boolean(libreOfficeExe),
      executable: libreOfficeExe || "",
      configured: process.env.HRIS_LIBREOFFICE_EXE || "",
    },
    templates: {
      pds: checks[0],
      wes: checks[1],
      dtr: checks[2],
      leaveForm6: checks[3],
    },
  };
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
    await runPython([PDF_WATERMARK_SCRIPT, pdfPath, "PREVIEW"]);
    await fs.rm(outputPath, { force: true }).catch(() => {});
    const pdfFileName = fileName.replace(/\.xlsx$/i, ".pdf");
    await registerDocumentExport(
      pdfFileName,
      (await readLeaveApplication(id))?.employeeId,
      user.id,
      "leave_form6_pdf",
    );
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
  if (!/^leave-form6-[0-9a-f-]{36}\.xlsx$/.test(decoded)) {
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
  if (!(await authorizeDocumentExport(user, decoded))) {
    return json(res, 403, {
      error: "This leave export is not available to your account or has expired",
    });
  }
  await logAudit(user.id, "leave.form6_excel_download", { fileName: decoded }, req);
  return sendFile(res, resolved, decoded, { deleteAfterSend: true });
}

async function handlePreviewLeaveForm6Pdf(req, res, fileName) {
  const user = await requireUser(req, res);
  if (!user) return;
  const decoded = decodeURIComponent(fileName);
  if (!/^leave-form6-[0-9a-f-]{36}\.pdf$/.test(decoded)) {
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
  if (!(await authorizeDocumentExport(user, decoded, { singleUse: false }))) {
    return json(res, 403, {
      error: "This leave export is not available to your account or has expired",
    });
  }
  await logAudit(user.id, "leave.form6_pdf_preview", { fileName: decoded }, req);
  return sendInlinePdf(res, resolved, decoded);
}

async function handleGetConfig(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  const [[agency]] = await pool.query(
    `SELECT name, tagline, logo_url, icon_url, banner_url, organization_hierarchy_json
     FROM agency_settings WHERE id = 1`,
  );
  const [departments] = await pool.query(
    `SELECT id, name
     FROM hr_reference_values
     WHERE category = 'offices' AND is_active = 1
     ORDER BY sort_order ASC, name ASC`,
  );
  const [positions] = await pool.query(
    `SELECT id, title FROM positions ORDER BY sort_order ASC, title ASC`,
  );
  const [salaryGrades] = await pool.query(
    `SELECT id, ordinance, grade, step, amount, is_active
     FROM salary_grades
     ORDER BY ordinance ASC, grade ASC, step ASC`,
  );
  const [salaryGradeTables] = await pool.query(
    `SELECT ordinance,
            COUNT(*) row_count,
            MIN(grade) min_grade,
            MAX(grade) max_grade,
            MAX(is_active) is_active
       FROM salary_grades
      GROUP BY ordinance
      ORDER BY is_active DESC, ordinance ASC`,
  );

  return json(res, 200, {
    agency: {
      name: agency.name,
      tagline: agency.tagline,
      logoUrl: agency.logo_url || "",
      iconUrl: agency.icon_url || "",
      bannerUrl: agency.banner_url || "",
      hierarchy: organizationHierarchyMetadata(
        parseOrganizationHierarchyValue(agency.organization_hierarchy_json),
      ),
    },
    departments,
    positions,
    salaryGrades: salaryGrades.map((row) => ({
      id: row.id,
      ordinance: row.ordinance,
      grade: Number(row.grade),
      step: Number(row.step),
      amount: Number(row.amount),
      isActive: Boolean(row.is_active),
    })),
    salaryGradeTables: salaryGradeTables.map((row) => ({
      ordinance: row.ordinance,
      rowCount: Number(row.row_count || 0),
      minGrade: row.min_grade == null ? null : Number(row.min_grade),
      maxGrade: row.max_grade == null ? null : Number(row.max_grade),
      isActive: Boolean(row.is_active),
    })),
  });
}

async function handlePublicAgencySettings(req, res) {
  const [[agency]] = await pool.query(
    `SELECT name, tagline, logo_url, icon_url, banner_url, organization_hierarchy_json
     FROM agency_settings WHERE id = 1`,
  );

  return json(res, 200, {
    agency: {
      name: agency?.name || DEFAULT_AGENCY.name,
      tagline: agency?.tagline || DEFAULT_AGENCY.tagline,
      logoUrl: agency?.logo_url || "",
      iconUrl: agency?.icon_url || "",
      bannerUrl: agency?.banner_url || "",
      hierarchy: organizationHierarchyMetadata(
        parseOrganizationHierarchyValue(agency?.organization_hierarchy_json),
      ),
    },
  });
}

async function handleUpdateAgency(req, res) {
  const admin = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!admin) return;

  const body = await readBody(req, Infinity);
  let agency;
  try {
    agency = {
      name: String(body.name || "").trim(),
      tagline: String(body.tagline || "").trim(),
      logoUrl:
        body.logoUrl !== undefined
          ? validateImageDataUrl(
              body.logoUrl,
              "Agency logo",
              MAX_BRANDING_IMAGE_BYTES,
              MAX_LOGO_IMAGE_DIMENSIONS,
            )
          : "",
      iconUrl:
        body.iconUrl !== undefined
          ? validateImageDataUrl(
              body.iconUrl,
              "System icon",
              MAX_PROFILE_IMAGE_BYTES,
              MAX_ICON_IMAGE_DIMENSIONS,
            )
          : "",
      bannerUrl:
        body.bannerUrl !== undefined
          ? validateImageDataUrl(body.bannerUrl, "Cover photo", null, null)
          : "",
    };
  } catch (error) {
    return json(res, 400, { error: error.message });
  }

  if (!agency.name) return json(res, 400, { error: "Agency name is required" });
  await pool.execute(
    `UPDATE agency_settings SET name = :name, tagline = :tagline, logo_url = :logoUrl, icon_url = :iconUrl, banner_url = :bannerUrl WHERE id = 1`,
    agency,
  );
  await logAudit(admin.id, "config.agency_update", null, req);
  return json(res, 200, {
    agency: {
      ...agency,
      hierarchy: organizationHierarchyMetadata(await readOrganizationHierarchy()),
    },
  });
}

async function handleGetDatabaseConfig(req, res) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;
  const env = await readServerEnvLocal();
  return json(res, 200, {
    database: publicDatabaseConfig(currentDatabaseConfig(), env.values),
  });
}

async function handleTestDatabaseConfig(req, res) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;

  const env = await readServerEnvLocal();
  let config;
  try {
    config = normalizeDatabaseConfig(
      await readBody(req),
      env.values.HRIS_DB_PASSWORD ?? DB_PASSWORD,
    );
  } catch (error) {
    return json(res, 400, { error: error.message });
  }

  try {
    const result = await testDatabaseConfig(config);
    if (!result.ok) return json(res, 422, result);
    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 422, {
      ok: false,
      error: error?.message || "Unable to connect to the database",
      code: error?.code || "",
    });
  }
}

async function handleUpdateDatabaseConfig(req, res) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;

  const env = await readServerEnvLocal();
  let config;
  try {
    config = normalizeDatabaseConfig(
      await readBody(req),
      env.values.HRIS_DB_PASSWORD ?? DB_PASSWORD,
    );
  } catch (error) {
    return json(res, 400, { error: error.message });
  }

  try {
    const result = await testDatabaseConfig(config, { createDatabase: true });
    if (!result.ok) return json(res, 422, result);
  } catch (error) {
    return json(res, 422, {
      ok: false,
      error: error?.message || "Unable to connect to the database",
      code: error?.code || "",
    });
  }

  await writeDatabaseConfig(config);
  await logAudit(
    user.id,
    "config.database_update",
    {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database,
      passwordChanged: config.password !== (env.values.HRIS_DB_PASSWORD ?? DB_PASSWORD),
    },
    req,
  );
  return json(res, 200, {
    database: {
      ...publicDatabaseConfig(config, { HRIS_DB_HOST: config.host }),
      restartRequired: true,
    },
  });
}

async function handleCreateDepartment(req, res) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;
  return json(res, 409, {
    error: "Departments are managed through the configured organizational reference level",
  });
}

async function handleUpdateDepartment(req, res, id) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;
  return json(res, 409, {
    error: "Departments are read-only here; edit the configured organizational reference level",
  });
}

async function handleDeleteDepartment(req, res, id) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;
  return json(res, 409, {
    error: "Departments are read-only here; deactivate the configured organizational reference",
  });
}

async function handleCreatePosition(req, res) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;
  const body = await readBody(req);
  const title = String(body.title || "").trim();
  if (!title) return json(res, 400, { error: "Position title is required" });
  try {
    const [result] = await pool.execute(`INSERT INTO positions (title) VALUES (:title)`, { title });
    await logAudit(user.id, "config.position_create", { title }, req);
    return json(res, 201, { position: { id: result.insertId, title } });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") return json(res, 409, { error: "Position already exists" });
    throw error;
  }
}

async function handleUpdatePosition(req, res, id) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;
  const body = await readBody(req);
  const title = String(body.title || "").trim();
  if (!title) return json(res, 400, { error: "Position title is required" });
  try {
    const [result] = await pool.execute(`UPDATE positions SET title = :title WHERE id = :id`, {
      id,
      title,
    });
    if (!result.affectedRows) return json(res, 404, { error: "Position not found" });
    await logAudit(user.id, "config.position_update", { id, title }, req);
    return json(res, 200, { position: { id: Number(id), title } });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") return json(res, 409, { error: "Position already exists" });
    throw error;
  }
}

async function handleDeletePosition(req, res, id) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;
  await pool.execute(`DELETE FROM positions WHERE id = :id`, { id });
  await logAudit(user.id, "config.position_delete", { id }, req);
  return json(res, 200, { ok: true });
}

async function handleCreateSalaryGrade(req, res) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;
  let payload;
  try {
    payload = readSalaryGradePayload(await readBody(req));
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
  try {
    const [result] = await pool.execute(
      `INSERT INTO salary_grades (ordinance, grade, step, amount)
       VALUES (:ordinance, :grade, :step, :amount)`,
      payload,
    );
    await logAudit(
      user.id,
      "config.salary_grade_create",
      { ordinance: payload.ordinance, grade: payload.grade, step: payload.step },
      req,
    );
    return json(res, 201, { salaryGrade: { id: result.insertId, ...payload } });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY")
      return json(res, 409, { error: "Salary grade already exists" });
    throw error;
  }
}

const STANDARD_SALARY_GRADE_MAX = 33;
const STANDARD_SALARY_STEP_MAX = 8;

function readSalaryGradePayload(body) {
  const ordinance = String(body.ordinance || "").trim();
  const grade = Number(body.grade);
  const step = Number(body.step);
  const amount = Number(body.amount);
  if (
    !ordinance ||
    !Number.isInteger(grade) ||
    grade < 1 ||
    grade > STANDARD_SALARY_GRADE_MAX ||
    !Number.isInteger(step) ||
    step < 1 ||
    step > STANDARD_SALARY_STEP_MAX ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error("Enter an ordinance, SG 1-33, Step 1-8, and an amount greater than zero");
  }
  return { ordinance, grade, step, amount };
}

async function salaryGradeUsage(id) {
  const [[usage]] = await pool.execute(
    `SELECT
       (SELECT COUNT(*) FROM plantilla_items WHERE salary_grade_id = :id) plantilla_count,
       (SELECT COUNT(*) FROM plantilla_occupancies WHERE current_salary_grade_id = :id) occupancy_count,
       (SELECT COUNT(*) FROM personnel_movements WHERE target_salary_grade_id = :id) movement_count`,
    { id },
  );
  return {
    plantillaCount: Number(usage.plantilla_count || 0),
    occupancyCount: Number(usage.occupancy_count || 0),
    movementCount: Number(usage.movement_count || 0),
  };
}

async function handleUpdateSalaryGrade(req, res, id) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;

  const [[salaryGrade]] = await pool.execute(
    `SELECT id, ordinance, grade, step, amount, is_active FROM salary_grades WHERE id = :id LIMIT 1`,
    { id },
  );
  if (!salaryGrade) return json(res, 404, { error: "Salary grade not found" });

  let payload;
  try {
    payload = readSalaryGradePayload(await readBody(req));
  } catch (error) {
    return json(res, 400, { error: error.message });
  }

  const usage = await salaryGradeUsage(id);
  const isUsed = usage.plantillaCount > 0 || usage.occupancyCount > 0 || usage.movementCount > 0;
  if (Number(salaryGrade.is_active) === 1 || isUsed) {
    return json(res, 409, {
      error:
        "This salary grade row is active or already used. Create a corrected salary table and activate it instead.",
    });
  }

  try {
    await pool.execute(
      `UPDATE salary_grades
          SET ordinance = :ordinance,
              grade = :grade,
              step = :step,
              amount = :amount
        WHERE id = :id`,
      { id, ...payload },
    );
    await logAudit(
      user.id,
      "config.salary_grade_update",
      {
        id,
        before: {
          ordinance: salaryGrade.ordinance,
          grade: Number(salaryGrade.grade),
          step: Number(salaryGrade.step),
          amount: Number(salaryGrade.amount),
        },
        after: payload,
      },
      req,
    );
    return json(res, 200, { salaryGrade: { id: Number(id), ...payload, isActive: false } });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY")
      return json(res, 409, { error: "Salary grade already exists in this table" });
    throw error;
  }
}

async function handleRenameSalaryGradeTable(req, res) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;

  const body = await readBody(req);
  const oldOrdinance = String(body.oldOrdinance || "").trim();
  const newOrdinance = String(body.newOrdinance || "").trim();
  if (!oldOrdinance || !newOrdinance) {
    return json(res, 400, { error: "Current and new ordinance names are required" });
  }
  if (oldOrdinance === newOrdinance) {
    return json(res, 400, { error: "New ordinance name must be different" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[source]] = await connection.execute(
      `SELECT COUNT(*) count, MAX(is_active) is_active
         FROM salary_grades
        WHERE ordinance = :oldOrdinance`,
      { oldOrdinance },
    );
    if (Number(source.count || 0) === 0) {
      await connection.rollback();
      return json(res, 404, { error: "Salary grade table not found" });
    }

    const [[target]] = await connection.execute(
      `SELECT COUNT(*) count FROM salary_grades WHERE ordinance = :newOrdinance`,
      { newOrdinance },
    );
    if (Number(target.count || 0) > 0) {
      await connection.rollback();
      return json(res, 409, { error: "A salary grade table with that ordinance already exists" });
    }

    await connection.execute(
      `UPDATE salary_grades SET ordinance = :newOrdinance WHERE ordinance = :oldOrdinance`,
      { oldOrdinance, newOrdinance },
    );
    await connection.execute(
      `UPDATE employee_salary_records
          SET payload = JSON_SET(payload, '$.ordinance', :newOrdinance)
        WHERE JSON_UNQUOTE(JSON_EXTRACT(payload, '$.ordinance')) = :oldOrdinance`,
      { oldOrdinance, newOrdinance },
    );
    await connection.execute(
      `UPDATE employee_salary_records
          SET payload = JSON_SET(payload, '$.previousOrdinance', :newOrdinance)
        WHERE JSON_UNQUOTE(JSON_EXTRACT(payload, '$.previousOrdinance')) = :oldOrdinance`,
      { oldOrdinance, newOrdinance },
    );

    await connection.commit();
    await logAudit(
      user.id,
      "config.salary_grade_table_rename",
      { oldOrdinance, newOrdinance, rowCount: Number(source.count || 0) },
      req,
    );
    return json(res, 200, {
      table: {
        ordinance: newOrdinance,
        rowCount: Number(source.count || 0),
        isActive: Boolean(source.is_active),
      },
    });
  } catch (error) {
    await connection.rollback();
    if (error?.code === "ER_DUP_ENTRY")
      return json(res, 409, { error: "A salary grade table with that ordinance already exists" });
    throw error;
  } finally {
    connection.release();
  }
}

async function handleDeleteSalaryGradeTable(req, res, url) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;

  const body = await readBody(req);
  const ordinance = String(body.ordinance || url.searchParams.get("ordinance") || "").trim();
  if (!ordinance) return json(res, 400, { error: "Select a salary grade table to delete" });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [tableRows] = await connection.execute(
      `SELECT id, is_active
         FROM salary_grades
        WHERE ordinance = :ordinance
        FOR UPDATE`,
      { ordinance },
    );
    const rowCount = tableRows.length;
    if (rowCount === 0) {
      await connection.rollback();
      return json(res, 404, { error: "Salary grade table not found" });
    }
    if (tableRows.some((row) => Number(row.is_active) === 1)) {
      await connection.rollback();
      return json(res, 409, { error: "Cannot delete the active salary grade table" });
    }

    const [[usage]] = await connection.execute(
      `SELECT
         (SELECT COUNT(*)
            FROM plantilla_items pi
            JOIN salary_grades sg ON sg.id = pi.salary_grade_id
           WHERE sg.ordinance = :ordinance) plantilla_count,
         (SELECT COUNT(*)
            FROM plantilla_occupancies po
            JOIN salary_grades sg ON sg.id=po.current_salary_grade_id
           WHERE sg.ordinance=:ordinance) occupancy_count,
         (SELECT COUNT(*)
            FROM personnel_movements pm
            JOIN salary_grades sg ON sg.id = pm.target_salary_grade_id
           WHERE sg.ordinance = :ordinance) movement_count,
         (SELECT COUNT(*)
            FROM employee_salary_records
           WHERE JSON_UNQUOTE(JSON_EXTRACT(payload, '$.ordinance')) = :ordinance
              OR JSON_UNQUOTE(JSON_EXTRACT(payload, '$.previousOrdinance')) = :ordinance) salary_record_count`,
      { ordinance },
    );
    const plantillaCount = Number(usage.plantilla_count || 0);
    const occupancyCount = Number(usage.occupancy_count || 0);
    const movementCount = Number(usage.movement_count || 0);
    const salaryRecordCount = Number(usage.salary_record_count || 0);
    if (plantillaCount || occupancyCount || movementCount || salaryRecordCount) {
      await connection.rollback();
      return json(res, 409, {
        error:
          "Cannot delete this salary table because it is already referenced by plantilla, movements, or 201 salary records.",
        usage: { plantillaCount, occupancyCount, movementCount, salaryRecordCount },
      });
    }

    await connection.execute(`DELETE FROM salary_grades WHERE ordinance = :ordinance`, {
      ordinance,
    });
    await connection.commit();
    await logAudit(user.id, "config.salary_grade_table_delete", { ordinance, rowCount }, req);
    return json(res, 200, { ok: true, ordinance, rowCount });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function readSalaryEffectivityDate(value) {
  const date = value ? String(value).trim() : formatLocalDate(new Date());
  const parsed = new Date(`${date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new Error("Effectivity date must be a valid YYYY-MM-DD date");
  }
  return date;
}

async function handleActivateSalaryGradeTable(req, res) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;

  const body = await readBody(req);
  const ordinance = String(body.ordinance || "").trim();
  const remarks = String(body.remarks || "").trim();
  let effectivityDate = "";
  try {
    effectivityDate = readSalaryEffectivityDate(body.effectivityDate);
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
  if (!ordinance) return json(res, 400, { error: "Select a salary grade table to activate" });

  const connection = await pool.getConnection();
  const results = [];
  let itemsUpdated = 0;
  let employeeSalaryRecordsCreated = 0;
  let movementsSynchronized = 0;
  try {
    await connection.beginTransaction();

    const [targetTableRows] = await connection.execute(
      `SELECT id, is_active
         FROM salary_grades
        WHERE ordinance = :ordinance
        FOR UPDATE`,
      { ordinance },
    );
    if (!targetTableRows.length) {
      await connection.rollback();
      return json(res, 404, { error: "Salary grade table not found" });
    }
    if (targetTableRows.some((row) => Number(row.is_active) === 1)) {
      await connection.rollback();
      return json(res, 409, { error: "This salary grade table is already active" });
    }

    const [items] = await connection.execute(
      `SELECT pi.id plantilla_item_id,
              pi.item_number,
              pi.salary_grade_id old_salary_grade_id,
              pi.authorized_salary old_authorized_salary,
              old_sg.ordinance old_ordinance,
              old_sg.grade old_grade,
              old_sg.step old_step,
              old_sg.amount old_monthly_amount,
              new_sg.id new_salary_grade_id,
              new_sg.amount new_monthly_amount,
              po.id occupancy_id,
              COALESCE(po.current_salary_grade_id,pi.salary_grade_id) employee_salary_grade_id,
              employee_sg.ordinance employee_old_ordinance,
              employee_sg.grade employee_grade,
              employee_sg.step employee_step,
              employee_sg.amount employee_old_monthly_amount,
              new_employee_sg.id new_employee_salary_grade_id,
              new_employee_sg.amount employee_new_monthly_amount,
              e.id employee_id,
              e.employee_no,
              e.firstname,
              e.middlename,
              e.lastname,
              e.name_ext
         FROM plantilla_items pi
    LEFT JOIN salary_grades old_sg ON old_sg.id = pi.salary_grade_id
    LEFT JOIN salary_grades new_sg
           ON new_sg.ordinance = :ordinance
          AND new_sg.grade = old_sg.grade
          AND new_sg.step = old_sg.step
    LEFT JOIN plantilla_occupancies po
           ON po.plantilla_item_id = pi.id
          AND po.status = 'Active'
    LEFT JOIN salary_grades employee_sg
           ON employee_sg.id=COALESCE(po.current_salary_grade_id,pi.salary_grade_id)
    LEFT JOIN salary_grades new_employee_sg
           ON new_employee_sg.ordinance=:ordinance
          AND new_employee_sg.grade=employee_sg.grade
          AND new_employee_sg.step=employee_sg.step
    LEFT JOIN employees e ON e.id = po.employee_id
        WHERE pi.item_status = 'Active'
        ORDER BY pi.item_number ASC
        FOR UPDATE`,
      { ordinance },
    );

    const missingRequiredRows = items
      .filter(
        (item) =>
          !item.old_salary_grade_id ||
          item.old_grade == null ||
          item.old_step == null ||
          !item.new_salary_grade_id ||
          (item.employee_id && !item.new_employee_salary_grade_id),
      )
      .map((item) => ({
        plantillaItemId: item.plantilla_item_id,
        itemNumber: item.item_number,
        grade: item.old_grade == null ? null : Number(item.old_grade),
        step: item.old_step == null ? null : Number(item.old_step),
        status: "blocked",
        reason: !item.old_salary_grade_id
          ? "Plantilla item has no current salary grade"
          : item.employee_id && !item.new_employee_salary_grade_id
            ? `No employee SG-${item.employee_grade} Step ${item.employee_step} row in ${ordinance}`
            : `No SG-${item.old_grade} Step ${item.old_step} row in ${ordinance}`,
      }));
    if (missingRequiredRows.length) {
      await connection.rollback();
      return json(res, 409, {
        error: `Activation blocked: ${missingRequiredRows.length} active Plantilla item(s) cannot be mapped to ${ordinance}. Add the missing salary grade/step rows before activating this table.`,
        results: missingRequiredRows,
      });
    }

    await connection.execute(`UPDATE salary_grades SET is_active = 0`);
    await connection.execute(
      `UPDATE salary_grades SET is_active = 1 WHERE ordinance = :ordinance`,
      {
        ordinance,
      },
    );

    for (const item of items) {
      const employeeName = item.employee_id ? formatEmployeeName(item) : "";
      const oldMonthlyAmount = Number(item.old_monthly_amount || 0);
      const newMonthlyAmount = Number(item.new_monthly_amount || 0);
      const oldAnnualAmount =
        item.old_authorized_salary == null
          ? oldMonthlyAmount * 12
          : Number(item.old_authorized_salary);
      const newAnnualAmount = newMonthlyAmount * 12;
      const employeeOldMonthlyAmount = Number(item.employee_old_monthly_amount || 0);
      const employeeNewMonthlyAmount = Number(item.employee_new_monthly_amount || 0);
      const baseResult = {
        plantillaItemId: item.plantilla_item_id,
        itemNumber: item.item_number,
        employeeId: item.employee_id || null,
        employeeNo: item.employee_no || "",
        employeeName,
        grade: Number(item.old_grade),
        step: Number(item.old_step),
        oldSalaryGradeId: Number(item.old_salary_grade_id),
        newSalaryGradeId: Number(item.new_salary_grade_id),
        oldMonthlyAmount,
        newMonthlyAmount,
        oldAnnualAmount,
        newAnnualAmount,
      };

      await connection.execute(
        `UPDATE plantilla_items
            SET salary_grade_id = :salaryGradeId,
                authorized_salary = :annualAmount,
                updated_by = :userId
          WHERE id = :plantillaItemId`,
        {
          salaryGradeId: item.new_salary_grade_id,
          annualAmount: newAnnualAmount,
          userId: user.id,
          plantillaItemId: item.plantilla_item_id,
        },
      );

      await connection.execute(
        `INSERT INTO plantilla_item_history (plantilla_item_id, action, snapshot_json, changed_by)
         VALUES (:plantillaItemId, 'Salary Grade Table Activation', :snapshot, :userId)`,
        {
          plantillaItemId: item.plantilla_item_id,
          userId: user.id,
          snapshot: JSON.stringify({
            ordinance,
            effectivityDate,
            previousOrdinance: item.old_ordinance || "",
            oldSalaryGradeId: item.old_salary_grade_id,
            newSalaryGradeId: item.new_salary_grade_id,
            oldMonthlyAmount,
            newMonthlyAmount,
            oldAnnualAmount,
            newAnnualAmount,
            employeeId: item.employee_id || null,
            remarks,
          }),
        },
      );

      let salaryRecordCreated = false;
      if (item.employee_id) {
        await connection.execute(
          `UPDATE plantilla_occupancies
              SET current_salary_grade_id=:salaryGradeId
            WHERE id=:occupancyId`,
          {
            salaryGradeId: item.new_employee_salary_grade_id,
            occupancyId: item.occupancy_id,
          },
        );
        const [duplicates] = await connection.execute(
          `SELECT id
             FROM employee_salary_records
            WHERE employee_id = :employeeId
              AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.type')) = 'Salary Grade Table Activation'
              AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.ordinance')) = :ordinance
              AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.date')) = :effectivityDate
            LIMIT 1`,
          { employeeId: item.employee_id, ordinance, effectivityDate },
        );
        if (!duplicates.length) {
          await connection.execute(
            `INSERT INTO employee_salary_records (id, employee_id, payload)
             VALUES (:id, :employeeId, :payload)`,
            {
              id: crypto.randomUUID(),
              employeeId: item.employee_id,
              payload: JSON.stringify({
                date: effectivityDate,
                description: "Salary grade table activation",
                ordinance,
                previousOrdinance: item.employee_old_ordinance || item.old_ordinance || "",
                grade: Number(item.employee_grade),
                step: Number(item.employee_step),
                previousAmount: employeeOldMonthlyAmount,
                amount: employeeNewMonthlyAmount,
                gross: employeeNewMonthlyAmount,
                type: "Salary Grade Table Activation",
                remarks,
              }),
            },
          );
          salaryRecordCreated = true;
          employeeSalaryRecordsCreated += 1;
        }
      }

      const [pendingMovements] = await connection.execute(
        `SELECT m.id,m.control_number,m.status,m.target_salary_grade_id,
                new_target.id new_target_salary_grade_id
           FROM personnel_movements m
           LEFT JOIN salary_grades old_target ON old_target.id=m.target_salary_grade_id
           LEFT JOIN salary_grades new_target
             ON new_target.ordinance=:ordinance
            AND new_target.grade=old_target.grade
            AND new_target.step=old_target.step
          WHERE m.target_plantilla_item_id = :plantillaItemId
            AND m.status IN ('Draft','Submitted','Reviewed','Approved','Scheduled')
          FOR UPDATE`,
        { plantillaItemId: item.plantilla_item_id, ordinance },
      );
      for (const movement of pendingMovements) {
        const synchronizedSalaryGradeId =
          movement.new_target_salary_grade_id || item.new_salary_grade_id;
        await connection.execute(
          `UPDATE personnel_movements
              SET target_salary_grade_id = :salaryGradeId,
                  version = version + 1
            WHERE id = :movementId`,
          { movementId: movement.id, salaryGradeId: synchronizedSalaryGradeId },
        );
        await connection.execute(
          `INSERT INTO personnel_movement_events
             (id, movement_id, event_type, from_status, to_status, actor_id, remarks, snapshot_json)
           VALUES
             (:id, :movementId, 'Salary Table Synced', :status, :status, :actorId, :remarks, :snapshot)`,
          {
            id: crypto.randomUUID(),
            movementId: movement.id,
            status: movement.status,
            actorId: user.id,
            remarks: remarks || null,
            snapshot: JSON.stringify({
              ordinance,
              effectivityDate,
              controlNumber: movement.control_number,
              oldSalaryGradeId: movement.target_salary_grade_id,
              newSalaryGradeId: synchronizedSalaryGradeId,
              oldMonthlyAmount,
              newMonthlyAmount,
              oldAnnualAmount,
              newAnnualAmount,
            }),
          },
        );
        movementsSynchronized += 1;
      }

      itemsUpdated += 1;
      results.push({
        ...baseResult,
        status: "updated",
        salaryRecordCreated,
        movementsSynchronized: pendingMovements.length,
      });
    }

    await connection.commit();
    await logAudit(
      user.id,
      "config.salary_grade_table_activate",
      {
        ordinance,
        effectivityDate,
        itemsChecked: items.length,
        itemsUpdated,
        employeeSalaryRecordsCreated,
        movementsSynchronized,
        skipped: items.length - itemsUpdated,
      },
      req,
    );
    return json(res, 200, {
      activeOrdinance: ordinance,
      effectivityDate,
      summary: {
        checked: items.length,
        updated: itemsUpdated,
        skipped: items.length - itemsUpdated,
        itemsChecked: items.length,
        itemsUpdated,
        employeeSalaryRecordsCreated,
        movementsSynchronized,
      },
      results,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function handleDeleteSalaryGrade(req, res, id) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;
  const [[salaryGrade]] = await pool.execute(
    `SELECT id, is_active FROM salary_grades WHERE id = :id LIMIT 1`,
    { id },
  );
  if (!salaryGrade) return json(res, 404, { error: "Salary grade not found" });
  if (Number(salaryGrade.is_active) === 1) {
    return json(res, 409, { error: "Cannot delete a row from the active salary grade table" });
  }
  const usage = await salaryGradeUsage(id);
  if (usage.plantillaCount > 0 || usage.occupancyCount > 0 || usage.movementCount > 0) {
    return json(res, 409, {
      error: "Cannot delete a salary grade row already used by plantilla or movements",
    });
  }
  await pool.execute(`DELETE FROM salary_grades WHERE id = :id`, { id });
  await logAudit(user.id, "config.salary_grade_delete", { id }, req);
  return json(res, 200, { ok: true });
}

function getReferenceLibraryType(category) {
  return REFERENCE_LIBRARY_TYPES[category] || null;
}

function cloneDefaultOrganizationHierarchy() {
  return JSON.parse(JSON.stringify(DEFAULT_ORGANIZATION_HIERARCHY));
}

function parseOrganizationHierarchyValue(value) {
  if (!value) return cloneDefaultOrganizationHierarchy();
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return normalizeOrganizationHierarchy(parsed);
  } catch {
    return cloneDefaultOrganizationHierarchy();
  }
}

function normalizeOrganizationHierarchy(value) {
  const incoming = Array.isArray(value?.levels) ? value.levels : [];
  if (incoming.length !== ORGANIZATION_REFERENCE_CATEGORIES.length) {
    throw new Error("Organizational structure must include all four reusable levels");
  }

  const seen = new Set();
  const levels = incoming.map((level) => {
    const category = String(level?.category || "");
    if (!ORGANIZATION_REFERENCE_CATEGORIES.includes(category) || seen.has(category)) {
      throw new Error("Organizational levels must be unique Sector, Office, Division, and Section");
    }
    seen.add(category);
    const label = String(level?.label || "").trim();
    const pluralLabel = String(level?.pluralLabel || "").trim();
    if (!label || !pluralLabel) throw new Error("Every organizational level needs labels");
    if (label.length > 80 || pluralLabel.length > 100) {
      throw new Error("Organizational level labels are too long");
    }
    const enabled = Boolean(level?.enabled);
    const assignable = enabled && Boolean(level?.assignable);
    return { category, label, pluralLabel, enabled, assignable };
  });

  const enabled = levels.filter((level) => level.enabled);
  if (!enabled.length) throw new Error("Enable at least one organizational level");
  if (!enabled.some((level) => level.assignable)) {
    throw new Error("At least one enabled organizational level must accept assignments");
  }

  return {
    version: Math.max(1, Number(value?.version || 1)),
    levels,
  };
}

async function readOrganizationHierarchy(connection = pool) {
  const [[agency]] = await connection.query(
    `SELECT organization_hierarchy_json FROM agency_settings WHERE id = 1 LIMIT 1`,
  );
  return parseOrganizationHierarchyValue(agency?.organization_hierarchy_json);
}

function organizationHierarchyMetadata(hierarchy) {
  const enabledLevels = hierarchy.levels.filter((level) => level.enabled);
  let previousCategory = null;
  return {
    version: hierarchy.version,
    levels: hierarchy.levels.map((level) => {
      const parentCategory = level.enabled ? previousCategory : null;
      if (level.enabled) previousCategory = level.category;
      return { ...level, parentCategory };
    }),
    enabledCategories: enabledLevels.map((level) => level.category),
    assignableCategories: enabledLevels
      .filter((level) => level.assignable)
      .map((level) => level.category),
  };
}

function hierarchyLevel(hierarchy, category) {
  return hierarchy.levels.find((level) => level.category === category) || null;
}

function configuredParentCategory(hierarchy, category) {
  const enabled = hierarchy.levels.filter((level) => level.enabled);
  const index = enabled.findIndex((level) => level.category === category);
  return index > 0 ? enabled[index - 1].category : null;
}

async function readAssignableOrganization(id, connection = pool) {
  const hierarchy = await readOrganizationHierarchy(connection);
  const metadata = organizationHierarchyMetadata(hierarchy);
  const [[organization]] = await connection.execute(
    `SELECT id, name, category, parent_id, is_active
     FROM hr_reference_values
     WHERE id = :id
     LIMIT 1`,
    { id },
  );
  if (
    !organization ||
    !organization.is_active ||
    !metadata.assignableCategories.includes(organization.category)
  ) {
    const labels = hierarchy.levels
      .filter((level) => level.enabled && level.assignable)
      .map((level) => level.label);
    throw new Error(`Select an active ${labels.join(" or ") || "organizational unit"}`);
  }
  const selectedLevelIndex = metadata.enabledCategories.indexOf(organization.category);
  if (selectedLevelIndex > 0) {
    const [organizationRows] = await connection.query(
      `SELECT id, category, parent_id, is_active
       FROM hr_reference_values
       WHERE category IN ('sectors','offices','divisions','sections')`,
    );
    const rowsById = new Map(
      organizationRows.map((row) => [
        Number(row.id),
        {
          ...row,
          id: Number(row.id),
          parent_id: row.parent_id == null ? null : Number(row.parent_id),
        },
      ]),
    );
    for (const requiredCategory of metadata.enabledCategories.slice(0, selectedLevelIndex)) {
      const ancestor = referenceAncestor(rowsById, organization, requiredCategory);
      if (!ancestor || !ancestor.is_active) {
        const requiredLevel = hierarchyLevel(hierarchy, requiredCategory);
        throw new Error(
          `${requiredLevel?.label || "Organizational"} ancestry is missing or inactive`,
        );
      }
    }
  }
  return organization;
}

function referenceAncestor(rowsById, row, category) {
  const visited = new Set([Number(row.id)]);
  let parentId = row.parent_id == null ? null : Number(row.parent_id);
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = rowsById.get(parentId);
    if (!parent) return null;
    if (parent.category === category) return parent;
    parentId = parent.parent_id == null ? null : Number(parent.parent_id);
  }
  return null;
}

async function organizationHierarchyPreview(hierarchy, connection = pool) {
  const metadata = organizationHierarchyMetadata(hierarchy);
  const currentHierarchy = await readOrganizationHierarchy(connection);
  const currentMetadata = organizationHierarchyMetadata(currentHierarchy);
  const [referenceRows] = await connection.query(
    `SELECT id, category, name, parent_id, is_active
     FROM hr_reference_values
     WHERE category IN ('sectors','offices','divisions','sections')`,
  );
  const rowsById = new Map(referenceRows.map((row) => [Number(row.id), row]));
  const [legacyDepartments] = await connection.query(
    `SELECT id, name FROM departments ORDER BY sort_order, name`,
  );
  const normalizeOrganizationName = (value) =>
    String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const officesByName = new Map(
    referenceRows
      .filter((row) => row.category === "offices")
      .map((row) => [normalizeOrganizationName(row.name), row]),
  );
  const departmentConsolidation = {
    matched: [],
    unresolved: [],
  };
  for (const department of legacyDepartments) {
    const office = officesByName.get(normalizeOrganizationName(department.name));
    const target = office ? departmentConsolidation.matched : departmentConsolidation.unresolved;
    target.push({
      departmentId: Number(department.id),
      departmentName: department.name,
      officeId: office ? Number(office.id) : null,
      officeName: office?.name || "",
    });
  }
  const parentIssues = [];

  for (const row of referenceRows) {
    if (!row.is_active || !metadata.enabledCategories.includes(row.category)) continue;
    const expectedParentCategory = configuredParentCategory(hierarchy, row.category);
    if (!expectedParentCategory) continue;
    const ancestor = referenceAncestor(rowsById, row, expectedParentCategory);
    if (!ancestor) {
      parentIssues.push({
        referenceId: Number(row.id),
        category: row.category,
        name: row.name,
        requiredParentCategory: expectedParentCategory,
      });
    }
  }

  const assignable = metadata.assignableCategories;
  const [employeeRows] = await connection.query(
    `SELECT current_org_unit_ref_id reference_id, COUNT(*) count
     FROM employees
     WHERE current_org_unit_ref_id IS NOT NULL AND lifecycle_state = 'Active'
     GROUP BY current_org_unit_ref_id`,
  );
  const [engagementRows] = await connection.query(
    `SELECT org_unit_ref_id reference_id, COUNT(*) count
     FROM non_plantilla_engagements
     WHERE status IN ('Active','Scheduled')
     GROUP BY org_unit_ref_id`,
  );
  const [temporaryRows] = await connection.query(
    `SELECT org_unit_ref_id reference_id, COUNT(*) count
     FROM temporary_assignments
     WHERE org_unit_ref_id IS NOT NULL AND status IN ('Active','Scheduled')
     GROUP BY org_unit_ref_id`,
  );
  const [movementRows] = await connection.query(
    `SELECT target_org_unit_ref_id reference_id, COUNT(*) count
     FROM personnel_movements
     WHERE target_org_unit_ref_id IS NOT NULL
       AND status IN ('Draft','Submitted','Reviewed','Approved','Scheduled')
     GROUP BY target_org_unit_ref_id`,
  );
  const referenceColumn = {
    sectors: "sector_ref_id",
    offices: "office_ref_id",
    divisions: "division_ref_id",
    sections: "section_ref_id",
  };
  const effectivePlantillaColumns = [...currentMetadata.enabledCategories]
    .reverse()
    .map((category) => `pi.${referenceColumn[category]}`);
  const effectivePlantillaReference =
    effectivePlantillaColumns.length === 1
      ? effectivePlantillaColumns[0]
      : `COALESCE(${effectivePlantillaColumns.join(",")})`;
  const [plantillaRows] = effectivePlantillaColumns.length
    ? await connection.query(
        `SELECT ${effectivePlantillaReference} reference_id, COUNT(*) count
         FROM plantilla_items pi
         WHERE pi.item_status = 'Active'
           AND ${effectivePlantillaReference} IS NOT NULL
         GROUP BY ${effectivePlantillaReference}`,
      )
    : [[]];
  const operationalUsage = new Map();
  for (const [kind, rows] of [
    ["employees", employeeRows],
    ["engagements", engagementRows],
    ["temporaryAssignments", temporaryRows],
    ["movements", movementRows],
    ["plantillaItems", plantillaRows],
  ]) {
    for (const row of rows) {
      const id = Number(row.reference_id);
      const current = operationalUsage.get(id) || {
        referenceId: id,
        employees: 0,
        engagements: 0,
        temporaryAssignments: 0,
        movements: 0,
        plantillaItems: 0,
      };
      current[kind] += Number(row.count || 0);
      operationalUsage.set(id, current);
    }
  }
  const assignmentIssues = [];
  for (const usage of operationalUsage.values()) {
    const reference = rowsById.get(usage.referenceId);
    if (!reference || !assignable.includes(reference.category)) {
      assignmentIssues.push({
        ...usage,
        category: reference?.category || "",
        name: reference?.name || `Reference #${usage.referenceId}`,
      });
    }
  }

  return {
    hierarchy: metadata,
    compatible: parentIssues.length === 0 && assignmentIssues.length === 0,
    parentIssues,
    assignmentIssues,
    departmentConsolidation,
    summary: {
      activeReferences: referenceRows.filter((row) => row.is_active).length,
      parentMappingsRequired: parentIssues.length,
      assignmentMappingsRequired: assignmentIssues.length,
      unresolvedLegacyDepartments: departmentConsolidation.unresolved.length,
    },
  };
}

function referenceValueResponse(row) {
  return {
    id: row.id,
    category: row.category,
    code: row.code,
    name: row.name,
    description: row.description || "",
    parentId: row.parent_id || null,
    parentName: row.parent_name || "",
    isActive: Boolean(row.is_active),
    effectiveFrom: normalizeDate(row.effective_from),
    effectiveTo: normalizeDate(row.effective_to),
    sortOrder: Number(row.sort_order || 0),
  };
}

async function readReferenceValue(id, category = "") {
  const params = { id };
  const categorySql = category ? "AND r.category = :category" : "";
  if (category) params.category = category;
  const [rows] = await pool.execute(
    `SELECT r.*, p.name AS parent_name
     FROM hr_reference_values r
     LEFT JOIN hr_reference_values p ON p.id = r.parent_id
     WHERE r.id = :id ${categorySql}
     LIMIT 1`,
    params,
  );
  return rows[0] ? referenceValueResponse(rows[0]) : null;
}

async function handleListReferenceValues(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!(await hasPermission(user, "employees.read"))) {
    return json(res, 403, { error: "Employee reference access required" });
  }
  const [rows] = await pool.query(
    `SELECT r.*, p.name AS parent_name
     FROM hr_reference_values r
     LEFT JOIN hr_reference_values p ON p.id = r.parent_id
     ORDER BY r.category ASC, r.sort_order ASC, r.name ASC`,
  );
  const libraries = Object.fromEntries(
    Object.keys(REFERENCE_LIBRARY_TYPES).map((category) => [category, []]),
  );
  for (const row of rows) {
    if (libraries[row.category]) libraries[row.category].push(referenceValueResponse(row));
  }
  const hierarchy = await readOrganizationHierarchy();
  return json(res, 200, {
    libraries,
    hierarchy: organizationHierarchyMetadata(hierarchy),
  });
}

async function handlePreviewOrganizationHierarchy(req, res) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;
  try {
    const body = await readBody(req);
    const hierarchy = normalizeOrganizationHierarchy(body?.hierarchy || body);
    return json(res, 200, await organizationHierarchyPreview(hierarchy));
  } catch (error) {
    return json(res, 400, { error: error instanceof Error ? error.message : "Invalid hierarchy" });
  }
}

async function handleActivateOrganizationHierarchy(req, res) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;
  const connection = await pool.getConnection();
  try {
    const body = await readBody(req);
    const requested = normalizeOrganizationHierarchy(body?.hierarchy || body);
    await connection.beginTransaction();
    const current = await readOrganizationHierarchy(connection);
    const hierarchy = { ...requested, version: Number(current.version || 1) + 1 };
    const currentMetadata = organizationHierarchyMetadata(current);
    const nextMetadata = organizationHierarchyMetadata(hierarchy);
    const referenceColumn = {
      sectors: "sector_ref_id",
      offices: "office_ref_id",
      divisions: "division_ref_id",
      sections: "section_ref_id",
    };
    const currentPlantillaColumns = [...currentMetadata.enabledCategories]
      .reverse()
      .map((category) => referenceColumn[category]);
    const currentPlantillaReference = currentPlantillaColumns.length
      ? `COALESCE(${currentPlantillaColumns.join(",")})`
      : "NULL";
    const preview = await organizationHierarchyPreview(hierarchy, connection);
    const parentMappings = new Map(
      (Array.isArray(body?.parentMappings) ? body.parentMappings : []).map((mapping) => [
        Number(mapping.referenceId),
        mapping.parentId == null || mapping.parentId === "" ? null : Number(mapping.parentId),
      ]),
    );
    const assignmentMappings = new Map(
      (Array.isArray(body?.assignmentMappings) ? body.assignmentMappings : []).map((mapping) => [
        Number(mapping.referenceId),
        Number(mapping.replacementId),
      ]),
    );

    for (const issue of preview.parentIssues) {
      if (!parentMappings.has(issue.referenceId)) {
        throw new Error(`Choose a ${issue.requiredParentCategory} parent for ${issue.name}`);
      }
      const parentId = parentMappings.get(issue.referenceId);
      if (!parentId) throw new Error(`${issue.name} requires an active parent`);
      const [[parent]] = await connection.execute(
        `SELECT id, category, is_active FROM hr_reference_values WHERE id = :id LIMIT 1`,
        { id: parentId },
      );
      if (!parent || !parent.is_active || parent.category !== issue.requiredParentCategory) {
        throw new Error(`Select a valid active parent for ${issue.name}`);
      }
      await connection.execute(
        `UPDATE hr_reference_values SET parent_id = :parentId WHERE id = :id`,
        { id: issue.referenceId, parentId },
      );
    }

    const assignableCategories = nextMetadata.assignableCategories;
    for (const issue of preview.assignmentIssues) {
      const replacementId = assignmentMappings.get(issue.referenceId);
      if (!replacementId) {
        throw new Error(`Choose an assignable replacement for ${issue.name}`);
      }
      const [[replacement]] = await connection.execute(
        `SELECT id, category, name, is_active
         FROM hr_reference_values WHERE id = :id LIMIT 1`,
        { id: replacementId },
      );
      if (
        !replacement ||
        !replacement.is_active ||
        !assignableCategories.includes(replacement.category)
      ) {
        throw new Error(`Select a valid active assignable replacement for ${issue.name}`);
      }
      await connection.execute(
        `UPDATE employees
         SET current_org_unit_ref_id = :replacementId, department = :replacementName
         WHERE current_org_unit_ref_id = :sourceId AND lifecycle_state = 'Active'`,
        {
          sourceId: issue.referenceId,
          replacementId,
          replacementName: replacement.name,
        },
      );
      await connection.execute(
        `UPDATE non_plantilla_engagements
         SET org_unit_ref_id = :replacementId
         WHERE org_unit_ref_id = :sourceId AND status IN ('Active','Scheduled')`,
        { sourceId: issue.referenceId, replacementId },
      );
      await connection.execute(
        `UPDATE temporary_assignments
         SET org_unit_ref_id = :replacementId
         WHERE org_unit_ref_id = :sourceId AND status IN ('Active','Scheduled')`,
        { sourceId: issue.referenceId, replacementId },
      );
      await connection.execute(
        `UPDATE personnel_movements
         SET target_org_unit_ref_id = :replacementId,
             target_department = :replacementName
         WHERE target_org_unit_ref_id = :sourceId
           AND status IN ('Draft','Submitted','Reviewed','Approved','Scheduled')`,
        {
          sourceId: issue.referenceId,
          replacementId,
          replacementName: replacement.name,
        },
      );
      const replacementIndex = nextMetadata.enabledCategories.indexOf(replacement.category);
      const plantillaAssignments = [
        `${referenceColumn[replacement.category]} = :replacementId`,
        ...nextMetadata.enabledCategories
          .slice(replacementIndex + 1)
          .map((category) => `${referenceColumn[category]} = NULL`),
      ];
      if (currentPlantillaColumns.length) {
        await connection.execute(
          `UPDATE plantilla_items
           SET ${plantillaAssignments.join(", ")}
           WHERE item_status = 'Active'
             AND ${currentPlantillaReference} = :sourceId`,
          { sourceId: issue.referenceId, replacementId },
        );
      }
    }

    await connection.execute(
      `UPDATE agency_settings
       SET organization_hierarchy_json = :hierarchy
       WHERE id = 1`,
      { hierarchy: JSON.stringify(hierarchy) },
    );
    const afterPreview = await organizationHierarchyPreview(hierarchy, connection);
    if (!afterPreview.compatible) {
      throw new Error("Organizational structure still has unresolved mappings");
    }
    await connection.commit();
    await logAudit(
      user.id,
      "config.organization_hierarchy_activate",
      {
        previous: current,
        next: hierarchy,
        parentMappings: [...parentMappings.entries()],
        assignmentMappings: [...assignmentMappings.entries()],
      },
      req,
    );
    return json(res, 200, await organizationHierarchyPreview(hierarchy));
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    return json(res, 400, {
      error: error instanceof Error ? error.message : "Unable to activate hierarchy",
    });
  } finally {
    connection.release();
  }
}

async function validateReferenceParent(
  category,
  parentId,
  { existingParentId = null, childIsActive = true } = {},
) {
  const config = getReferenceLibraryType(category);
  if (ORGANIZATION_REFERENCE_CATEGORIES.includes(category)) {
    const hierarchy = await readOrganizationHierarchy();
    const level = hierarchyLevel(hierarchy, category);
    const parentCategory = level?.enabled
      ? configuredParentCategory(hierarchy, category)
      : config?.parentCategory || null;
    const label = level?.label || config?.label || "Organizational unit";
    const parentLevel = parentCategory ? hierarchyLevel(hierarchy, parentCategory) : null;
    const parentLabel =
      parentLevel?.label || REFERENCE_LIBRARY_TYPES[parentCategory]?.label || "Parent";
    const unchangedParent = Number(existingParentId || 0) === Number(parentId || 0);

    if (!parentCategory) {
      if (parentId && !unchangedParent) throw new Error(`${label} cannot have a parent`);
      return parentId ? Number(parentId) : null;
    }
    if (!parentId) throw new Error(`${parentLabel} is required`);
    const [rows] = await pool.execute(
      `SELECT id, category, parent_id, is_active
       FROM hr_reference_values
       WHERE id = :parentId
       LIMIT 1`,
      { parentId },
    );
    const parent = rows[0];
    if (!parent) throw new Error(`Select a valid ${parentLabel}`);
    if (!parent.is_active && (childIsActive || !unchangedParent)) {
      throw new Error(`Select an active ${parentLabel}`);
    }
    if (parent.category === parentCategory) return Number(parentId);

    if (unchangedParent) {
      const [organizationRows] = await pool.query(
        `SELECT id, category, parent_id
         FROM hr_reference_values
         WHERE category IN ('sectors','offices','divisions','sections')`,
      );
      const rowsById = new Map(organizationRows.map((row) => [Number(row.id), row]));
      if (referenceAncestor(rowsById, { id: 0, parent_id: parentId }, parentCategory)) {
        return Number(parentId);
      }
    }
    throw new Error(`Select a ${parentLabel} as the direct parent`);
  }
  if (!config?.parentCategory) {
    if (parentId) throw new Error(`${config?.label || "This reference"} cannot have a parent`);
    return null;
  }
  const parentLabel = REFERENCE_LIBRARY_TYPES[config.parentCategory].label;
  if (!parentId) throw new Error(`${parentLabel} is required`);
  const [rows] = await pool.execute(
    `SELECT id, is_active FROM hr_reference_values
     WHERE id = :parentId AND category = :parentCategory
     LIMIT 1`,
    { parentId, parentCategory: config.parentCategory },
  );
  if (!rows[0]) throw new Error(`Select a valid ${parentLabel}`);
  if (!rows[0].is_active && (childIsActive || Number(existingParentId) !== Number(parentId))) {
    throw new Error(`Select an active ${parentLabel}`);
  }
  return Number(parentId);
}

function parseReferenceDate(value, label) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const date = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`${label} must use YYYY-MM-DD format`);
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error(`${label} must be a valid date`);
  }
  return date;
}

function referencePayload(body) {
  const code = String(body.code || "")
    .trim()
    .toUpperCase();
  const name = String(body.name || "").trim();
  if (code.length > 80) throw new Error("Code cannot exceed 80 characters");
  if (name.length > 200) throw new Error("Name cannot exceed 200 characters");

  const effectiveFrom = parseReferenceDate(body.effectiveFrom, "Effective-from date");
  const effectiveTo = parseReferenceDate(body.effectiveTo, "Effective-to date");
  if (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom) {
    throw new Error("Effective-to date cannot be earlier than effective-from date");
  }

  const sortOrder = Number(body.sortOrder || 0);
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 4294967295) {
    throw new Error("Sort order must be a non-negative whole number");
  }

  const hasParentId =
    body.parentId !== null && body.parentId !== undefined && String(body.parentId).trim() !== "";
  const parentId = hasParentId ? Number(body.parentId) : null;
  if (hasParentId && (!Number.isInteger(parentId) || parentId <= 0)) {
    throw new Error("Parent ID must be a positive whole number");
  }

  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    throw new Error("Active status must be true or false");
  }

  return {
    code,
    name,
    description: String(body.description || "").trim() || null,
    parentId,
    isActive: body.isActive === undefined || body.isActive ? 1 : 0,
    effectiveFrom,
    effectiveTo,
    sortOrder,
  };
}

function referenceMutationError(res, error, label) {
  if (error?.code === "ER_DUP_ENTRY") {
    return json(res, 409, { error: `${label} code or name already exists` });
  }
  if (error?.code === "ER_ROW_IS_REFERENCED_2") {
    return json(res, 409, {
      error: `${label} is in use and cannot be deleted; deactivate it instead`,
    });
  }
  if (error instanceof Error && !error.code) return json(res, 400, { error: error.message });
  throw error;
}

async function referenceValueUsage(id, category, connection = pool) {
  const plantillaColumn = {
    sectors: "sector_ref_id",
    offices: "office_ref_id",
    divisions: "division_ref_id",
    sections: "section_ref_id",
  }[category];
  const [[children]] = await connection.execute(
    `SELECT
       SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) active_count,
       COUNT(*) total_count
     FROM hr_reference_values
     WHERE parent_id = :id`,
    { id },
  );
  const [[employees]] = await connection.execute(
    `SELECT
       SUM(CASE WHEN lifecycle_state = 'Active' THEN 1 ELSE 0 END) active_count,
       COUNT(*) total_count
     FROM employees
     WHERE current_org_unit_ref_id = :id`,
    { id },
  );
  const [[engagements]] = await connection.execute(
    `SELECT
       SUM(CASE WHEN status IN ('Active','Scheduled') THEN 1 ELSE 0 END) active_count,
       COUNT(*) total_count
     FROM non_plantilla_engagements
     WHERE org_unit_ref_id = :id`,
    { id },
  );
  const [[temporaryAssignments]] = await connection.execute(
    `SELECT
       SUM(CASE WHEN status IN ('Active','Scheduled') THEN 1 ELSE 0 END) active_count,
       COUNT(*) total_count
     FROM temporary_assignments
     WHERE org_unit_ref_id = :id`,
    { id },
  );
  const [[movements]] = await connection.execute(
    `SELECT
       SUM(CASE WHEN status IN ('Draft','Submitted','Reviewed','Approved','Scheduled') THEN 1 ELSE 0 END) active_count,
       COUNT(*) total_count
     FROM personnel_movements
     WHERE target_org_unit_ref_id = :id`,
    { id },
  );
  let plantillaItems = { active_count: 0, total_count: 0 };
  if (plantillaColumn) {
    [[plantillaItems]] = await connection.execute(
      `SELECT
         SUM(CASE WHEN item_status = 'Active' THEN 1 ELSE 0 END) active_count,
         COUNT(*) total_count
       FROM plantilla_items
       WHERE ${plantillaColumn} = :id`,
      { id },
    );
  }
  const count = (row, key) => Number(row?.[key] || 0);
  const usage = {
    activeChildren: count(children, "active_count"),
    totalChildren: count(children, "total_count"),
    currentEmployees: count(employees, "active_count"),
    employeeReferences: count(employees, "total_count"),
    activeEngagements: count(engagements, "active_count"),
    engagementReferences: count(engagements, "total_count"),
    activeTemporaryAssignments: count(temporaryAssignments, "active_count"),
    temporaryAssignmentReferences: count(temporaryAssignments, "total_count"),
    pendingMovements: count(movements, "active_count"),
    movementReferences: count(movements, "total_count"),
    activePlantillaItems: count(plantillaItems, "active_count"),
    plantillaReferences: count(plantillaItems, "total_count"),
  };
  usage.activeDependencies =
    usage.activeChildren +
    usage.currentEmployees +
    usage.activeEngagements +
    usage.activeTemporaryAssignments +
    usage.pendingMovements +
    usage.activePlantillaItems;
  usage.totalDependencies =
    usage.totalChildren +
    usage.employeeReferences +
    usage.engagementReferences +
    usage.temporaryAssignmentReferences +
    usage.movementReferences +
    usage.plantillaReferences;
  return usage;
}

async function handleGetReferenceValueUsage(req, res, category, id) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!(await hasPermission(user, "employees.read"))) {
    return json(res, 403, { error: "Employee reference access required" });
  }
  const config = getReferenceLibraryType(category);
  if (!config) return json(res, 404, { error: "Reference library not found" });
  const value = await readReferenceValue(id, category);
  if (!value) return json(res, 404, { error: `${config.label} not found` });
  const [activeChildren] = await pool.execute(
    `SELECT id, category, name
     FROM hr_reference_values
     WHERE parent_id = :id AND is_active = 1
     ORDER BY name`,
    { id: Number(id) },
  );
  return json(res, 200, {
    value,
    usage: await referenceValueUsage(Number(id), category),
    activeChildren: activeChildren.map((child) => ({
      id: Number(child.id),
      category: child.category,
      name: child.name,
    })),
  });
}

async function handleRetireReferenceValue(req, res, category, id) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;
  const config = getReferenceLibraryType(category);
  if (!config) return json(res, 404, { error: "Reference library not found" });
  const sourceId = Number(id);
  const connection = await pool.getConnection();
  try {
    const body = await readBody(req);
    const replacementId =
      body?.replacementId == null || body.replacementId === "" ? null : Number(body.replacementId);
    const requestedChildMappings = new Map(
      (Array.isArray(body?.childMappings) ? body.childMappings : []).map((mapping) => [
        Number(mapping.childId),
        mapping.parentId == null || mapping.parentId === "" ? null : Number(mapping.parentId),
      ]),
    );
    await connection.beginTransaction();
    const [[source]] = await connection.execute(
      `SELECT id, category, code, name, is_active
       FROM hr_reference_values
       WHERE id = :id AND category = :category
       FOR UPDATE`,
      { id: sourceId, category },
    );
    if (!source) throw new Error(`${config.label} not found`);
    if (!source.is_active) throw new Error(`${config.label} is already inactive`);
    const usage = await referenceValueUsage(sourceId, category, connection);
    let replacement = null;
    if (replacementId) {
      [[replacement]] = await connection.execute(
        `SELECT id, category, name, is_active
         FROM hr_reference_values
         WHERE id = :id
         FOR UPDATE`,
        { id: replacementId },
      );
      if (
        !replacement ||
        !replacement.is_active ||
        replacement.category !== category ||
        Number(replacement.id) === sourceId
      ) {
        throw new Error(`Select another active ${config.label} as the replacement`);
      }
    }
    const currentUsage =
      usage.currentEmployees +
      usage.activeEngagements +
      usage.activeTemporaryAssignments +
      usage.pendingMovements +
      usage.activePlantillaItems;
    if (currentUsage > 0 && !replacement) {
      throw new Error(`${config.label} has current operational usage; choose a replacement`);
    }

    const hierarchy = await readOrganizationHierarchy(connection);
    const [children] = await connection.execute(
      `SELECT id, category, name
       FROM hr_reference_values
       WHERE parent_id = :id AND is_active = 1
       FOR UPDATE`,
      { id: sourceId },
    );
    for (const child of children) {
      const mappedParent = requestedChildMappings.has(Number(child.id))
        ? requestedChildMappings.get(Number(child.id))
        : replacementId;
      const expectedParent = hierarchyLevel(hierarchy, child.category)?.enabled
        ? configuredParentCategory(hierarchy, child.category)
        : getReferenceLibraryType(child.category)?.parentCategory || null;
      if (mappedParent == null) {
        if (expectedParent) {
          throw new Error(`Choose a parent for ${child.name}`);
        }
      } else {
        const [[parent]] = await connection.execute(
          `SELECT id, category, is_active
           FROM hr_reference_values
           WHERE id = :id
           LIMIT 1`,
          { id: mappedParent },
        );
        if (!parent || !parent.is_active || parent.category !== expectedParent) {
          throw new Error(`Select a valid active parent for ${child.name}`);
        }
      }
      await connection.execute(
        `UPDATE hr_reference_values SET parent_id = :parentId WHERE id = :childId`,
        { childId: child.id, parentId: mappedParent },
      );
    }

    if (replacement) {
      await connection.execute(
        `UPDATE employees
         SET current_org_unit_ref_id = :replacementId, department = :replacementName
         WHERE current_org_unit_ref_id = :sourceId AND lifecycle_state = 'Active'`,
        {
          sourceId,
          replacementId,
          replacementName: replacement.name,
        },
      );
      await connection.execute(
        `UPDATE non_plantilla_engagements
         SET org_unit_ref_id = :replacementId
         WHERE org_unit_ref_id = :sourceId AND status IN ('Active','Scheduled')`,
        { sourceId, replacementId },
      );
      await connection.execute(
        `UPDATE temporary_assignments
         SET org_unit_ref_id = :replacementId
         WHERE org_unit_ref_id = :sourceId AND status IN ('Active','Scheduled')`,
        { sourceId, replacementId },
      );
      await connection.execute(
        `UPDATE personnel_movements
         SET target_org_unit_ref_id = :replacementId,
             target_department = :replacementName
         WHERE target_org_unit_ref_id = :sourceId
           AND status IN ('Draft','Submitted','Reviewed','Approved','Scheduled')`,
        {
          sourceId,
          replacementId,
          replacementName: replacement.name,
        },
      );
      const plantillaColumn = {
        sectors: "sector_ref_id",
        offices: "office_ref_id",
        divisions: "division_ref_id",
        sections: "section_ref_id",
      }[category];
      if (plantillaColumn) {
        await connection.execute(
          `UPDATE plantilla_items
           SET ${plantillaColumn} = :replacementId
           WHERE ${plantillaColumn} = :sourceId AND item_status = 'Active'`,
          { sourceId, replacementId },
        );
      }
    }
    await connection.execute(
      `UPDATE hr_reference_values SET is_active = 0 WHERE id = :id AND category = :category`,
      { id: sourceId, category },
    );
    await connection.commit();
    await logAudit(
      user.id,
      "config.reference_retire",
      {
        category,
        id: sourceId,
        replacementId,
        childMappings: [...requestedChildMappings.entries()],
        usage,
      },
      req,
    );
    return json(res, 200, {
      value: await readReferenceValue(sourceId, category),
      usage,
    });
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    return referenceMutationError(res, error, config.label);
  } finally {
    connection.release();
  }
}

async function handleCreateReferenceValue(req, res, category) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;
  const config = getReferenceLibraryType(category);
  if (!config) return json(res, 404, { error: "Reference library not found" });
  try {
    if (ORGANIZATION_REFERENCE_CATEGORIES.includes(category)) {
      const hierarchy = await readOrganizationHierarchy();
      const level = hierarchyLevel(hierarchy, category);
      if (!level?.enabled) {
        return json(res, 409, {
          error: `${level?.label || config.label} is preserved but disabled in the active structure`,
        });
      }
    }
    const payload = referencePayload(await readBody(req));
    if (!payload.code || !payload.name) {
      return json(res, 400, { error: `${config.label} code and name are required` });
    }
    payload.parentId = await validateReferenceParent(category, payload.parentId, {
      childIsActive: Boolean(payload.isActive),
    });
    const [result] = await pool.execute(
      `INSERT INTO hr_reference_values (
         category, code, name, description, parent_id, is_active,
         effective_from, effective_to, sort_order
       ) VALUES (
         :category, :code, :name, :description, :parentId, :isActive,
         :effectiveFrom, :effectiveTo, :sortOrder
       )`,
      { category, ...payload },
    );
    const value = await readReferenceValue(result.insertId, category);
    await logAudit(
      user.id,
      "config.reference_create",
      { category, id: result.insertId, code: payload.code },
      req,
    );
    return json(res, 201, { value });
  } catch (error) {
    return referenceMutationError(res, error, config.label);
  }
}

async function handleUpdateReferenceValue(req, res, category, id) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;
  const config = getReferenceLibraryType(category);
  if (!config) return json(res, 404, { error: "Reference library not found" });
  const existing = await readReferenceValue(id, category);
  if (!existing) return json(res, 404, { error: `${config.label} not found` });
  try {
    const payload = referencePayload(await readBody(req));
    if (!payload.code || !payload.name) {
      return json(res, 400, { error: `${config.label} code and name are required` });
    }
    payload.parentId = await validateReferenceParent(category, payload.parentId, {
      existingParentId: existing.parentId,
      childIsActive: Boolean(payload.isActive),
    });
    if (existing.isActive && !payload.isActive) {
      const usage = await referenceValueUsage(Number(id), category);
      if (usage.activeDependencies > 0) {
        return json(res, 409, {
          error: `${config.label} has ${usage.activeDependencies} active dependent record(s); use Deactivate and Reassign`,
          usage,
        });
      }
    }
    await pool.execute(
      `UPDATE hr_reference_values
       SET code = :code, name = :name, description = :description,
           parent_id = :parentId, is_active = :isActive,
           effective_from = :effectiveFrom, effective_to = :effectiveTo,
           sort_order = :sortOrder
       WHERE id = :id AND category = :category`,
      { id, category, ...payload },
    );
    const value = await readReferenceValue(id, category);
    await logAudit(user.id, "config.reference_update", { category, id, code: payload.code }, req);
    return json(res, 200, { value });
  } catch (error) {
    return referenceMutationError(res, error, config.label);
  }
}

async function handleDeleteReferenceValue(req, res, category, id) {
  const user = await requirePermission(req, res, "settings.manage", "Settings access required");
  if (!user) return;
  const config = getReferenceLibraryType(category);
  if (!config) return json(res, 404, { error: "Reference library not found" });
  const existing = await readReferenceValue(id, category);
  if (!existing) return json(res, 404, { error: `${config.label} not found` });
  try {
    const usage = await referenceValueUsage(Number(id), category);
    if (usage.totalDependencies > 0) {
      return json(res, 409, {
        error: `${config.label} is in use and cannot be deleted; deactivate it instead`,
        usage,
      });
    }
    await pool.execute(`DELETE FROM hr_reference_values WHERE id = :id AND category = :category`, {
      id,
      category,
    });
    await logAudit(user.id, "config.reference_delete", { category, id, code: existing.code }, req);
    return json(res, 200, { ok: true });
  } catch (error) {
    return referenceMutationError(res, error, config.label);
  }
}

async function handleListAuditLogs(req, res) {
  const admin = await requirePermission(req, res, "admin.audit", "Audit log access required");
  if (!admin) return;
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(200, Math.max(10, Number(url.searchParams.get("pageSize")) || 50));
  const offset = (page - 1) * pageSize;
  const q = String(url.searchParams.get("q") || "")
    .trim()
    .slice(0, 100);
  const action = String(url.searchParams.get("action") || "")
    .trim()
    .slice(0, 100);
  const from = normalizeDate(url.searchParams.get("from"));
  const to = normalizeDate(url.searchParams.get("to"));
  const where = [];
  const params = { limit: pageSize, offset };
  if (q) {
    where.push(`(al.action LIKE :q OR u.username LIKE :q OR u.name LIKE :q)`);
    params.q = `%${q}%`;
  }
  if (action) {
    where.push(`al.action LIKE :action`);
    params.action = `%${action}%`;
  }
  if (from) {
    where.push(`al.created_at >= :from`);
    params.from = `${from} 00:00:00`;
  }
  if (to) {
    where.push(`al.created_at <= :to`);
    params.to = `${to} 23:59:59`;
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [[countRow]] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ${whereSql}`,
    params,
  );
  const [rows] = await pool.execute(
    `SELECT al.id, al.action, al.details, al.ip_address, al.created_at,
            u.username, u.name, u.role
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ${whereSql}
     ORDER BY al.created_at DESC, al.id DESC
     LIMIT :limit OFFSET :offset`,
    params,
  );

  const logs = rows.map((row) => ({
    id: row.id,
    action: row.action,
    details: typeof row.details === "string" ? JSON.parse(row.details || "null") : row.details,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
    user: row.username ? { username: row.username, name: row.name, role: row.role } : null,
  }));

  return json(res, 200, {
    logs,
    pagination: {
      total: Number(countRow.total || 0),
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(Number(countRow.total || 0) / pageSize)),
    },
  });
}

async function handleListErrorLogs(req, res) {
  const admin = await requirePermission(req, res, "admin.errors", "Error log access required");
  if (!admin) return;
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(200, Math.max(10, Number(url.searchParams.get("pageSize")) || 50));
  const offset = (page - 1) * pageSize;
  const importPage = Math.max(1, Number(url.searchParams.get("importPage")) || 1);
  const importPageSize = Math.min(
    200,
    Math.max(10, Number(url.searchParams.get("importPageSize")) || pageSize),
  );
  const importOffset = (importPage - 1) * importPageSize;
  const q = String(url.searchParams.get("q") || "")
    .trim()
    .slice(0, 100);
  const from = normalizeDate(url.searchParams.get("from"));
  const to = normalizeDate(url.searchParams.get("to"));
  const importLevel = String(url.searchParams.get("importLevel") || "").trim();
  const errorWhere = [];
  const errorParams = { limit: pageSize, offset };
  if (q) {
    errorWhere.push(
      `(el.path LIKE :q OR el.message LIKE :q OR u.username LIKE :q OR u.name LIKE :q)`,
    );
    errorParams.q = `%${q}%`;
  }
  if (from) {
    errorWhere.push(`el.created_at >= :from`);
    errorParams.from = `${from} 00:00:00`;
  }
  if (to) {
    errorWhere.push(`el.created_at <= :to`);
    errorParams.to = `${to} 23:59:59`;
  }
  const errorWhereSql = errorWhere.length ? `WHERE ${errorWhere.join(" AND ")}` : "";

  const [[errorCountRow]] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM error_logs el
     LEFT JOIN users u ON u.id = el.user_id
     ${errorWhereSql}`,
    errorParams,
  );
  const [rows] = await pool.execute(
    `SELECT el.id, el.method, el.path, el.message, el.stack, el.ip_address, el.user_agent,
            el.created_at, u.username, u.name, u.role
     FROM error_logs el
     LEFT JOIN users u ON u.id = el.user_id
     ${errorWhereSql}
     ORDER BY el.created_at DESC, el.id DESC
     LIMIT :limit OFFSET :offset`,
    errorParams,
  );
  const importWhere = [];
  const importParams = { limit: importPageSize, offset: importOffset };
  if (q) {
    importWhere.push(
      `(ail.message LIKE :q OR ail.employee_no LIKE :q OR ai.file_name LIKE :q OR u.username LIKE :q OR u.name LIKE :q)`,
    );
    importParams.q = `%${q}%`;
  }
  if (from) {
    importWhere.push(`ail.created_at >= :from`);
    importParams.from = `${from} 00:00:00`;
  }
  if (to) {
    importWhere.push(`ail.created_at <= :to`);
    importParams.to = `${to} 23:59:59`;
  }
  if (["Info", "Success", "Warning", "Error"].includes(importLevel)) {
    importWhere.push(`ail.level = :importLevel`);
    importParams.importLevel = importLevel;
  }
  const importWhereSql = importWhere.length ? `WHERE ${importWhere.join(" AND ")}` : "";
  const [[importCountRow]] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM attendance_import_logs ail
     LEFT JOIN attendance_imports ai ON BINARY ai.id = BINARY ail.import_id
     LEFT JOIN users u ON u.id = ai.imported_by
     ${importWhereSql}`,
    importParams,
  );
  const [importLogRows] = await pool.execute(
    `SELECT ail.id, ail.import_id, ail.level, ail.source_row_number, ail.employee_no,
            ail.message, ail.details, ail.created_at,
            ai.source, ai.file_name, ai.period_from, ai.period_to, ai.row_count,
            ai.status, ai.imported_at, u.username, u.name, u.role
     FROM attendance_import_logs ail
     LEFT JOIN attendance_imports ai ON BINARY ai.id = BINARY ail.import_id
     LEFT JOIN users u ON u.id = ai.imported_by
     ${importWhereSql}
     ORDER BY ail.created_at DESC, ail.id DESC
     LIMIT :limit OFFSET :offset`,
    importParams,
  );

  return json(res, 200, {
    pagination: {
      total: Number(errorCountRow.total || 0),
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(Number(errorCountRow.total || 0) / pageSize)),
    },
    logs: rows.map((row) => ({
      id: row.id,
      method: row.method || "",
      path: row.path || "",
      message: row.message || "",
      stack: row.stack || "",
      ipAddress: row.ip_address || "",
      userAgent: row.user_agent || "",
      createdAt: row.created_at,
      user: row.username ? { username: row.username, name: row.name, role: row.role } : null,
    })),
    importPagination: {
      total: Number(importCountRow.total || 0),
      page: importPage,
      pageSize: importPageSize,
      totalPages: Math.max(1, Math.ceil(Number(importCountRow.total || 0) / importPageSize)),
    },
    importLogs: importLogRows.map((row) => ({
      id: String(row.id),
      importId: row.import_id || "",
      level: row.level || "Info",
      rowNumber:
        row.source_row_number === null || row.source_row_number === undefined
          ? null
          : Number(row.source_row_number),
      employeeNo: row.employee_no || "",
      message: row.message || "",
      details: typeof row.details === "string" ? JSON.parse(row.details || "null") : row.details,
      source: row.source || "",
      fileName: row.file_name || "",
      periodFrom: normalizeDate(row.period_from),
      periodTo: normalizeDate(row.period_to),
      rowCount: Number(row.row_count || 0),
      status: row.status || "",
      importedAt: row.imported_at,
      createdAt: row.created_at,
      user: row.username ? { username: row.username, name: row.name, role: row.role } : null,
    })),
  });
}

async function logServerError(req, error) {
  try {
    const user = await getSessionUser(req).catch(() => null);
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const [result] = await pool.execute(
      `INSERT INTO error_logs (
         user_id, method, path, message, stack, ip_address, user_agent
       )
       VALUES (
         :userId, :method, :path, :message, :stack, :ipAddress, :userAgent
       )`,
      {
        userId: user?.id || null,
        method: String(req.method || "").slice(0, 12),
        path: url.pathname.slice(0, 500),
        message: String(error?.message || error || "Unknown error"),
        stack: String(error?.stack || ""),
        ipAddress: getIp(req),
        userAgent: String(req.headers["user-agent"] || "").slice(0, 500),
      },
    );
    return result.insertId;
  } catch (logError) {
    console.error("Failed to record error log", logError);
    return null;
  }
}

let movementHandlers;
let plantillaHandlers;
let serviceRecordHandlers;
let reportHandlers;
let assignmentHandlers;

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    url.pathname !== "/iclock/cdata" &&
    url.pathname !== "/iclock/getrequest" &&
    !validateMutationOrigin(req, res)
  ) {
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/realtime/events")
    return handleRealtimeEvents(req, res);
  const userMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)$/);
  const resetPasswordMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/reset-password$/);
  const resetTemporaryPasswordMatch = url.pathname.match(
    /^\/api\/admin\/users\/(\d+)\/reset-temporary-password$/,
  );
  const unlockUserMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/unlock$/);
  const employeeRestoreMatch = url.pathname.match(/^\/api\/employees\/([A-Za-z0-9-]+)\/restore$/);
  const employeeMatch = url.pathname.match(/^\/api\/employees\/([A-Za-z0-9-]+)$/);
  const employeePdsExcelGenerateMatch = url.pathname.match(
    /^\/api\/employees\/([A-Za-z0-9-]+)\/pds\/excel$/,
  );
  const employeePdsExcelDownloadMatch = url.pathname.match(
    /^\/api\/employees\/pds\/excel\/([^/]+)$/,
  );
  const employeeWesDocxGenerateMatch = url.pathname.match(
    /^\/api\/employees\/([A-Za-z0-9-]+)\/wes\/docx$/,
  );
  const employeeWesDocxDownloadMatch = url.pathname.match(/^\/api\/employees\/wes\/docx\/([^/]+)$/);
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
  const leaveCancelMatch = url.pathname.match(
    /^\/api\/leave\/applications\/([A-Za-z0-9-]+)\/cancel$/,
  );
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
  const dtrCorrectionDecisionMatch = url.pathname.match(
    /^\/api\/attendance\/correction-requests\/([A-Za-z0-9-]+)\/decision$/,
  );
  const dtrCorrectionCancelMatch = url.pathname.match(
    /^\/api\/attendance\/correction-requests\/([A-Za-z0-9-]+)\/cancel$/,
  );
  const dtrCorrectionReverseMatch = url.pathname.match(
    /^\/api\/attendance\/correction-requests\/([A-Za-z0-9-]+)\/reverse$/,
  );
  const attendanceImportLogMatch = url.pathname.match(
    /^\/api\/attendance\/imports\/([A-Za-z0-9-]+)\/logs$/,
  );
  const attendanceImportExceptionMatch = url.pathname.match(
    /^\/api\/attendance\/import-exceptions\/([A-Za-z0-9-]+)$/,
  );
  const scheduleOverrideMatch = url.pathname.match(
    /^\/api\/attendance\/schedule\/overrides\/([A-Za-z0-9-]+)\/(\d{4}-\d{2}-\d{2})$/,
  );
  const dtrExcelMatch = url.pathname.match(/^\/api\/attendance\/dtr\/excel\/([^/]+)$/);
  const dtrPdfMatch = url.pathname.match(/^\/api\/attendance\/dtr\/pdf\/([^/]+)$/);
  const dtrMassPdfMatch = url.pathname.match(/^\/api\/attendance\/dtr\/mass\/pdf\/([^/]+)$/);
  const dtrNoterMatch = url.pathname.match(/^\/api\/attendance\/noters\/(\d+)$/);
  const biometricDeviceMatch = url.pathname.match(/^\/api\/attendance\/biometrics\/(\d+)$/);
  const isAdmsIclock = url.pathname === "/iclock/cdata" || url.pathname === "/iclock/getrequest";
  const unimportedDtrMatch = url.pathname.match(
    /^\/api\/attendance\/check-unimported-dtrs\/([A-Za-z0-9-]+)$/,
  );
  const departmentMatch = url.pathname.match(/^\/api\/settings\/departments\/(\d+)$/);
  const positionMatch = url.pathname.match(/^\/api\/settings\/positions\/(\d+)$/);
  const salaryGradeMatch = url.pathname.match(/^\/api\/settings\/salary-grades\/(\d+)$/);
  const referenceValueMatch = url.pathname.match(/^\/api\/settings\/references\/([a-z-]+)\/(\d+)$/);
  const referenceUsageMatch = url.pathname.match(
    /^\/api\/settings\/references\/([a-z-]+)\/(\d+)\/usage$/,
  );
  const referenceRetireMatch = url.pathname.match(
    /^\/api\/settings\/references\/([a-z-]+)\/(\d+)\/retire$/,
  );
  const referenceCollectionMatch = url.pathname.match(/^\/api\/settings\/references\/([a-z-]+)$/);
  const notificationReadMatch = url.pathname.match(/^\/api\/notifications\/([A-Za-z0-9-]+)\/read$/);
  const serviceRecordEmployeeMatch = url.pathname.match(
    /^\/api\/service-records\/([A-Za-z0-9-]+)$/,
  );
  const serviceRecordEntryMatch = url.pathname.match(
    /^\/api\/service-records\/entries\/([A-Za-z0-9-]+)$/,
  );
  const serviceRecordExportMatch = url.pathname.match(
    /^\/api\/service-records\/([A-Za-z0-9-]+)\/export\/(xlsx|pdf)$/,
  );
  const serviceRecordFileMatch = url.pathname.match(/^\/api\/service-records\/files\/([^/]+)$/);
  const reportExportMatch = url.pathname.match(
    /^\/api\/reports\/personnel-plantilla\/export\/(xlsx|pdf)$/,
  );
  const reportFileMatch = url.pathname.match(/^\/api\/reports\/files\/([^/]+)$/);
  const movementMatch = url.pathname.match(/^\/api\/movements\/([A-Za-z0-9-]+)$/);
  const movementEventsMatch = url.pathname.match(/^\/api\/movements\/([A-Za-z0-9-]+)\/events$/);
  const movementActionMatch = url.pathname.match(
    /^\/api\/movements\/([A-Za-z0-9-]+)\/(submit|unsubmit|review|approve|reject|return|post|reverse)$/,
  );
  const plantillaItemMatch = url.pathname.match(/^\/api\/plantilla\/([A-Za-z0-9-]+)$/);
  const plantillaDisconnectMatch = url.pathname.match(
    /^\/api\/plantilla\/([A-Za-z0-9-]+)\/disconnect$/,
  );
  const plantillaHistoryMatch = url.pathname.match(/^\/api\/plantilla\/([A-Za-z0-9-]+)\/history$/);
  const engagementMatch = url.pathname.match(/^\/api\/engagements\/([A-Za-z0-9-]+)$/);
  const engagementActionMatch = url.pathname.match(
    /^\/api\/engagements\/([A-Za-z0-9-]+)\/(renew|terminate)$/,
  );

  if (isAdmsIclock) return handleAdmsIclock(req, res, url);

  if (req.method === "GET" && url.pathname === "/api/health") {
    return json(res, 200, {
      ok: true,
      database: DB_NAME,
      exports: await exportDependencyStatus(),
    });
  }
  if (req.method === "GET" && url.pathname === "/api/dashboard") return handleDashboard(req, res);
  if (req.method === "GET" && url.pathname === "/api/reports/personnel-plantilla")
    return reportHandlers.personnelPlantilla(req, res);
  if (req.method === "POST" && reportExportMatch)
    return reportHandlers.exportPersonnelPlantilla(req, res, reportExportMatch[1]);
  if (req.method === "GET" && reportFileMatch)
    return reportHandlers.file(req, res, reportFileMatch[1]);

  if (req.method === "POST" && url.pathname === "/api/auth/login") return handleLogin(req, res);
  if (req.method === "GET" && url.pathname === "/api/auth/bootstrap-status")
    return handleBootstrapStatus(req, res);
  if (req.method === "POST" && url.pathname === "/api/auth/bootstrap-super-admin")
    return handleBootstrapSuperAdmin(req, res);
  if (req.method === "GET" && url.pathname === "/api/public/agency")
    return handlePublicAgencySettings(req, res);
  if (req.method === "POST" && url.pathname === "/api/auth/logout") return handleLogout(req, res);
  if (req.method === "POST" && url.pathname === "/api/auth/change-password")
    return handleChangePassword(req, res);

  if (req.method === "GET" && url.pathname === "/api/auth/me") {
    const user = await getSessionUser(req);
    return json(res, 200, { user });
  }

  if (req.method === "GET" && url.pathname === "/api/notifications")
    return handleListNotifications(req, res, url);
  if (req.method === "PATCH" && notificationReadMatch)
    return handleReadNotification(req, res, notificationReadMatch[1]);
  if (req.method === "POST" && url.pathname === "/api/notifications/read-all")
    return handleReadAllNotifications(req, res);

  if (req.method === "PATCH" && url.pathname === "/api/users/me")
    return handleProfileUpdate(req, res);
  if (req.method === "GET" && url.pathname === "/api/admin/users") return handleListUsers(req, res);
  if (req.method === "POST" && url.pathname === "/api/admin/users")
    return handleCreateUser(req, res);
  if (req.method === "PATCH" && userMatch) return handleUpdateUser(req, res, userMatch[1]);
  if (req.method === "DELETE" && userMatch) return handleDeleteUser(req, res, userMatch[1]);
  if (req.method === "POST" && resetPasswordMatch)
    return handleResetUserPassword(req, res, resetPasswordMatch[1]);
  if (req.method === "POST" && resetTemporaryPasswordMatch)
    return handleResetUserTemporaryPassword(req, res, resetTemporaryPasswordMatch[1]);
  if (req.method === "POST" && unlockUserMatch)
    return handleUnlockUser(req, res, unlockUserMatch[1]);
  if (req.method === "GET" && url.pathname === "/api/admin/role-permissions")
    return handleListRolePermissions(req, res);
  if (req.method === "PATCH" && url.pathname === "/api/admin/role-permissions")
    return handleUpdateRolePermissions(req, res);
  if (req.method === "GET" && url.pathname === "/api/admin/audit-logs")
    return handleListAuditLogs(req, res);
  if (req.method === "GET" && url.pathname === "/api/admin/error-logs")
    return handleListErrorLogs(req, res);

  if (req.method === "GET" && url.pathname === "/api/admin/employee-account-candidates")
    return handleListEmployeeAccountCandidates(req, res);
  if (req.method === "POST" && url.pathname === "/api/admin/employee-accounts/bulk")
    return handleBulkCreateEmployeeAccounts(req, res);
  if (req.method === "POST" && url.pathname === "/api/admin/employee-accounts/reset-passwords")
    return handleBulkResetEmployeePasswords(req, res);
  if (req.method === "GET" && url.pathname === "/api/employees")
    return handleListEmployees(req, res, url);
  if (req.method === "POST" && url.pathname === "/api/employees")
    return handleCreateEmployee(req, res);
  if (req.method === "POST" && employeePdsExcelGenerateMatch)
    return handleGenerateEmployeePdsExcel(req, res, employeePdsExcelGenerateMatch[1]);
  if (req.method === "GET" && employeePdsExcelDownloadMatch)
    return handleDownloadEmployeePdsExcel(req, res, employeePdsExcelDownloadMatch[1]);
  if (req.method === "POST" && employeeWesDocxGenerateMatch)
    return handleGenerateEmployeeWesDocx(req, res, employeeWesDocxGenerateMatch[1]);
  if (req.method === "GET" && employeeWesDocxDownloadMatch)
    return handleDownloadEmployeeWesDocx(req, res, employeeWesDocxDownloadMatch[1]);
  if (req.method === "GET" && employeeMatch) return handleGetEmployee(req, res, employeeMatch[1]);
  if (req.method === "PATCH" && employeeMatch)
    return handleUpdateEmployee(req, res, employeeMatch[1]);
  if (req.method === "DELETE" && employeeMatch)
    return handleDeleteEmployee(req, res, employeeMatch[1]);
  if (req.method === "POST" && employeeRestoreMatch)
    return handleRestoreEmployee(req, res, employeeRestoreMatch[1]);
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
  if (req.method === "POST" && leaveCancelMatch)
    return handleCancelLeaveApplication(req, res, leaveCancelMatch[1]);
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
  if (req.method === "GET" && attendanceImportLogMatch)
    return handleListAttendanceImportLogs(req, res, attendanceImportLogMatch[1]);
  if (req.method === "GET" && url.pathname === "/api/attendance/import-exceptions")
    return handleListAttendanceImportExceptions(req, res, url);
  if (req.method === "POST" && url.pathname === "/api/attendance/import-exceptions/reprocess")
    return handleReprocessAttendanceImportExceptions(req, res);
  if (req.method === "POST" && attendanceImportExceptionMatch)
    return handleMapAttendanceImportException(req, res, attendanceImportExceptionMatch[1]);
  if (req.method === "GET" && url.pathname === "/api/attendance/correction-requests")
    return handleListDtrCorrectionRequests(req, res, url);
  if (req.method === "POST" && url.pathname === "/api/attendance/correction-requests")
    return handleCreateDtrCorrectionRequest(req, res);
  if (req.method === "POST" && dtrCorrectionDecisionMatch)
    return handleDecideDtrCorrectionRequest(req, res, dtrCorrectionDecisionMatch[1]);
  if (req.method === "POST" && dtrCorrectionCancelMatch)
    return handleCancelDtrCorrectionRequest(req, res, dtrCorrectionCancelMatch[1]);
  if (req.method === "POST" && dtrCorrectionReverseMatch)
    return handleReverseDtrCorrectionRequest(req, res, dtrCorrectionReverseMatch[1]);
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
  if (req.method === "POST" && url.pathname === "/api/attendance/import-all")
    return handleImportAllDtr(req, res);
  if (req.method === "POST" && url.pathname === "/api/attendance/import-all-dtr")
    return handleImportAllDtr(req, res);
  if (req.method === "GET" && unimportedDtrMatch)
    return handleCheckUnimportedDtrs(req, res, unimportedDtrMatch[1]);
  if (req.method === "POST" && url.pathname === "/api/attendance/refresh")
    return handleRefreshDtr(req, res);
  if (req.method === "GET" && url.pathname === "/api/attendance/schedules")
    return handleListEmployeeSchedules(req, res, url);
  if (req.method === "POST" && url.pathname === "/api/attendance/schedule/bulk")
    return handleBulkEmployeeSchedule(req, res, false);
  if (req.method === "POST" && url.pathname === "/api/attendance/schedule/overrides")
    return handleBulkEmployeeSchedule(req, res, true);
  if (req.method === "DELETE" && scheduleOverrideMatch)
    return handleDeleteEmployeeScheduleOverride(
      req,
      res,
      scheduleOverrideMatch[1],
      scheduleOverrideMatch[2],
    );
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
  if (req.method === "GET" && url.pathname === "/api/attendance/biometrics/realtime/status")
    return handleBiometricRealtimeStatus(req, res);
  if (req.method === "GET" && url.pathname === "/api/attendance/biometrics/realtime/logs")
    return handleBiometricRealtimeLogs(req, res, url);
  if (req.method === "POST" && url.pathname === "/api/attendance/biometrics/realtime/sync-now")
    return handleBiometricSyncNow(req, res);
  if (req.method === "POST" && url.pathname === "/api/attendance/dtr/excel")
    return handleGenerateDtrExcel(req, res);
  if (req.method === "GET" && dtrExcelMatch)
    return handleDownloadDtrExcel(req, res, dtrExcelMatch[1]);
  if (req.method === "POST" && url.pathname === "/api/attendance/dtr/pdf")
    return handleGenerateDtrPdf(req, res);
  if (req.method === "POST" && url.pathname === "/api/attendance/dtr/mass/pdf")
    return handleGenerateMassDtrPdf(req, res);
  if (req.method === "GET" && dtrMassPdfMatch)
    return handlePreviewMassDtrPdf(req, res, dtrMassPdfMatch[1]);
  if (req.method === "GET" && dtrPdfMatch) return handlePreviewDtrPdf(req, res, dtrPdfMatch[1]);
  if (req.method === "GET" && url.pathname === "/api/attendance/export")
    return handleExportDtr(req, res, url, false);
  if (req.method === "GET" && url.pathname === "/api/attendance/export/mass")
    return handleExportDtr(req, res, url, true);

  if (req.method === "GET" && serviceRecordFileMatch)
    return serviceRecordHandlers.file(req, res, serviceRecordFileMatch[1]);
  if (req.method === "GET" && serviceRecordEmployeeMatch)
    return serviceRecordHandlers.list(req, res, serviceRecordEmployeeMatch[1]);
  if (req.method === "POST" && serviceRecordEmployeeMatch)
    return serviceRecordHandlers.create(req, res, serviceRecordEmployeeMatch[1]);
  if (req.method === "PATCH" && serviceRecordEntryMatch)
    return serviceRecordHandlers.update(req, res, serviceRecordEntryMatch[1]);
  if (req.method === "DELETE" && serviceRecordEntryMatch)
    return serviceRecordHandlers.remove(req, res, serviceRecordEntryMatch[1]);
  if (req.method === "POST" && serviceRecordExportMatch)
    return serviceRecordHandlers.export(
      req,
      res,
      serviceRecordExportMatch[1],
      serviceRecordExportMatch[2],
    );

  if (req.method === "GET" && url.pathname === "/api/movements")
    return movementHandlers.list(req, res, url);
  if (req.method === "POST" && url.pathname === "/api/movements")
    return movementHandlers.create(req, res);
  if (req.method === "PATCH" && movementMatch)
    return movementHandlers.update(req, res, movementMatch[1]);
  if (req.method === "GET" && movementEventsMatch)
    return movementHandlers.events(req, res, movementEventsMatch[1]);
  if (req.method === "POST" && movementActionMatch)
    return movementHandlers.transition(req, res, movementActionMatch[1], movementActionMatch[2]);

  if (req.method === "GET" && url.pathname === "/api/plantilla")
    return plantillaHandlers.list(req, res, url);
  if (req.method === "POST" && url.pathname === "/api/plantilla")
    return plantillaHandlers.create(req, res);
  if (req.method === "PATCH" && plantillaItemMatch)
    return plantillaHandlers.update(req, res, plantillaItemMatch[1]);
  if (req.method === "POST" && plantillaDisconnectMatch)
    return plantillaHandlers.vacate(req, res, plantillaDisconnectMatch[1]);
  if (req.method === "DELETE" && plantillaItemMatch)
    return plantillaHandlers.remove(req, res, plantillaItemMatch[1]);
  if (req.method === "GET" && plantillaHistoryMatch)
    return plantillaHandlers.history(req, res, plantillaHistoryMatch[1]);
  if (req.method === "GET" && url.pathname === "/api/engagements")
    return assignmentHandlers.listEngagements(req, res, url);
  if (req.method === "POST" && url.pathname === "/api/engagements")
    return assignmentHandlers.createEngagement(req, res);
  if (req.method === "PATCH" && engagementMatch)
    return assignmentHandlers.updateEngagement(req, res, engagementMatch[1]);
  if (req.method === "POST" && engagementActionMatch && engagementActionMatch[2] === "renew")
    return assignmentHandlers.renewEngagement(req, res, engagementActionMatch[1]);
  if (req.method === "POST" && engagementActionMatch && engagementActionMatch[2] === "terminate")
    return assignmentHandlers.terminateEngagement(req, res, engagementActionMatch[1]);

  if (req.method === "GET" && url.pathname === "/api/settings/references")
    return handleListReferenceValues(req, res);
  if (req.method === "POST" && url.pathname === "/api/settings/organization-hierarchy/preview")
    return handlePreviewOrganizationHierarchy(req, res);
  if (req.method === "PUT" && url.pathname === "/api/settings/organization-hierarchy")
    return handleActivateOrganizationHierarchy(req, res);
  if (req.method === "GET" && referenceUsageMatch)
    return handleGetReferenceValueUsage(req, res, referenceUsageMatch[1], referenceUsageMatch[2]);
  if (req.method === "POST" && referenceRetireMatch)
    return handleRetireReferenceValue(req, res, referenceRetireMatch[1], referenceRetireMatch[2]);
  if (req.method === "POST" && referenceCollectionMatch)
    return handleCreateReferenceValue(req, res, referenceCollectionMatch[1]);
  if ((req.method === "PUT" || req.method === "PATCH") && referenceValueMatch)
    return handleUpdateReferenceValue(req, res, referenceValueMatch[1], referenceValueMatch[2]);
  if (req.method === "DELETE" && referenceValueMatch)
    return handleDeleteReferenceValue(req, res, referenceValueMatch[1], referenceValueMatch[2]);
  if (req.method === "GET" && url.pathname === "/api/settings") return handleGetConfig(req, res);
  if (req.method === "PUT" && url.pathname === "/api/settings/agency")
    return handleUpdateAgency(req, res);
  if (req.method === "GET" && url.pathname === "/api/settings/database")
    return handleGetDatabaseConfig(req, res);
  if (req.method === "POST" && url.pathname === "/api/settings/database/test")
    return handleTestDatabaseConfig(req, res);
  if (req.method === "PUT" && url.pathname === "/api/settings/database")
    return handleUpdateDatabaseConfig(req, res);
  if (req.method === "POST" && url.pathname === "/api/settings/departments")
    return handleCreateDepartment(req, res);
  if ((req.method === "PUT" || req.method === "PATCH") && departmentMatch)
    return handleUpdateDepartment(req, res, departmentMatch[1]);
  if (req.method === "DELETE" && departmentMatch)
    return handleDeleteDepartment(req, res, departmentMatch[1]);
  if (req.method === "POST" && url.pathname === "/api/settings/positions")
    return handleCreatePosition(req, res);
  if ((req.method === "PUT" || req.method === "PATCH") && positionMatch)
    return handleUpdatePosition(req, res, positionMatch[1]);
  if (req.method === "DELETE" && positionMatch)
    return handleDeletePosition(req, res, positionMatch[1]);
  if (req.method === "POST" && url.pathname === "/api/settings/salary-grades")
    return handleCreateSalaryGrade(req, res);
  if (req.method === "POST" && url.pathname === "/api/settings/salary-grades/rename-table")
    return handleRenameSalaryGradeTable(req, res);
  if (req.method === "DELETE" && url.pathname === "/api/settings/salary-grades/table")
    return handleDeleteSalaryGradeTable(req, res, url);
  if (req.method === "POST" && url.pathname === "/api/settings/salary-grades/activate")
    return handleActivateSalaryGradeTable(req, res);
  if ((req.method === "PUT" || req.method === "PATCH") && salaryGradeMatch)
    return handleUpdateSalaryGrade(req, res, salaryGradeMatch[1]);
  if (req.method === "DELETE" && salaryGradeMatch)
    return handleDeleteSalaryGrade(req, res, salaryGradeMatch[1]);

  return json(res, 404, { error: "Not found" });
}

await initializeDatabase();
await applyVersionedMigrations();
serviceRecordHandlers = createServiceRecordHandlers({
  pool,
  requireUser,
  hasPermission,
  requireEmployeeWrite: requireServiceRecordWrite,
  readBody,
  json,
  logAudit,
  runPython,
  previewDir: PREVIEW_DIR,
  exportScript: SERVICE_RECORD_EXPORT_SCRIPT,
  sendFile,
});
reportHandlers = createReportHandlers({
  pool,
  requireEmployeeRead: requireReportView,
  json,
  logAudit,
  runPython,
  previewDir: PREVIEW_DIR,
  exportScript: PERSONNEL_PLANTILLA_REPORT_SCRIPT,
  sendFile,
});
movementHandlers = createMovementHandlers({
  pool,
  readAssignableOrganization,
  requireEmployeeRead: requireMovementRead,
  requireEmployeeWrite: requireMovementWrite,
  requireApproval,
  readBody,
  json,
  logAudit,
  notifyUsers,
  notifyEmployees,
  notifyPermission,
  notifyRoles,
  publishRealtime,
});
plantillaHandlers = createPlantillaHandlers({
  pool,
  getOrganizationHierarchy: async (connection = pool) =>
    organizationHierarchyMetadata(await readOrganizationHierarchy(connection)),
  requireEmployeeRead: requirePlantillaRead,
  requireEmployeeWrite: requirePlantillaWrite,
  readBody,
  json,
  logAudit,
  notifyPermission,
});
assignmentHandlers = createAssignmentHandlers({
  pool,
  readAssignableOrganization,
  requireRead: requireAssignmentRead,
  requireEngagement: requireEngagementWrite,
  readBody,
  json,
  logAudit,
  notifyEmployees,
  notifyPermission,
  publishRealtime,
});
await cleanupPreviewFiles().catch(() => {});
await cleanupDocumentExportJobs().catch(() => {});
await cleanupNotifications().catch(() => {});
setInterval(() => cleanupPreviewFiles().catch(() => {}), 5 * 60 * 1000).unref();
setInterval(() => cleanupDocumentExportJobs().catch(() => {}), 60 * 60 * 1000).unref();
setInterval(() => cleanupNotifications().catch(() => {}), 24 * 60 * 60 * 1000).unref();
assignmentHandlers
  .processDue()
  .catch((error) => console.error("Assignment processor failed", error));
movementHandlers.processDue().catch((error) => console.error("Movement processor failed", error));
setInterval(
  () => {
    assignmentHandlers
      .processDue()
      .catch((error) => console.error("Assignment processor failed", error));
    movementHandlers
      .processDue()
      .catch((error) => console.error("Movement processor failed", error));
  },
  5 * 60 * 1000,
).unref();

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method || "");
  const shouldPublishMutation =
    isMutation &&
    !requestUrl.pathname.startsWith("/api/auth/") &&
    !requestUrl.pathname.startsWith("/api/notifications") &&
    !requestUrl.pathname.includes("/excel") &&
    !requestUrl.pathname.includes("/pdf") &&
    !requestUrl.pathname.includes("/export") &&
    !requestUrl.pathname.endsWith("/check-status");
  if (shouldPublishMutation) {
    res.once("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        publishRealtime({
          kind: "refresh",
          topic: realtimeTopic(requestUrl.pathname),
          path: requestUrl.pathname,
        });
      }
    });
  }
  try {
    await route(req, res);
  } catch (error) {
    console.error(error);
    const errorId = await logServerError(req, error);
    json(res, 500, {
      error: errorId ? `Internal server error. Reference #${errorId}` : "Internal server error",
    });
  }
});

server.listen(PORT, () => {
  console.log(`HRIS API listening on http://localhost:${PORT}`);
  console.log(`Using MySQL schema ${DB_NAME} at ${DB_HOST}`);
});

if (ADMS_PORT && ADMS_PORT !== PORT) {
  const admsServer = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || `localhost:${ADMS_PORT}`}`);
      if (url.pathname === "/iclock/cdata" || url.pathname === "/iclock/getrequest") {
        return handleAdmsIclock(req, res, url);
      }
      return text(res, 404, "Not found");
    } catch (error) {
      console.error(error);
      if (!res.headersSent) text(res, 200, "OK");
    }
  });

  admsServer.on("error", (error) => {
    addBiometricSyncLog(
      "error",
      `ADMS listener could not start on port ${ADMS_PORT}: ${error.message}`,
    );
  });

  admsServer.listen(ADMS_PORT, "0.0.0.0", () => {
    addBiometricSyncLog("info", `ADMS live receiver listening on port ${ADMS_PORT}`);
  });
}
