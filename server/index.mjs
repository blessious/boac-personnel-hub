import http from "node:http";
import crypto from "node:crypto";
import net from "node:net";
import { spawn } from "node:child_process";
import { URL } from "node:url";
import { createReadStream, readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { initializePlantillaSchema, createPlantillaHandlers } from "./plantilla.mjs";
import { initializeMovementSchema, createMovementHandlers } from "./movements.mjs";
import { initializeServiceRecordSchema, createServiceRecordHandlers } from "./service-records.mjs";

function loadServerEnv() {
  const candidates = [".env.local", ".env"];
  for (const fileName of candidates) {
    try {
      const envPath = path.join(process.cwd(), "server", fileName);
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
}

loadServerEnv();

const PORT = Number(process.env.HRIS_API_PORT || 47101);
const DB_HOST = process.env.HRIS_DB_HOST || "localhost";
const DB_USER = process.env.HRIS_DB_USER || "root";
const DB_PASSWORD = process.env.HRIS_DB_PASSWORD || "";
const DB_NAME = process.env.HRIS_DB_NAME || "hris_db";
const SESSION_COOKIE = "hris_session";
const SESSION_HOURS = 8;
const MAX_FAILED_LOGIN_ATTEMPTS = 3;
const PASSWORD_HISTORY_LIMIT = 5;
const BACKUP_DIR = path.join(process.cwd(), "server", "backups");
const EXPORT_DIR = path.join(process.cwd(), "server", "exports");
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
const PDS_TEMPLATE_XLSX = path.join(
  process.cwd(),
  "Personal Data Sheet",
  "Personal Data Sheet.xlsx",
);
const PDS_EXCEL_SCRIPT = path.join(process.cwd(), "server", "pds_excel.py");
const SERVICE_RECORD_EXPORT_SCRIPT = path.join(process.cwd(), "server", "service_record_export.py");
const BIOMETRIC_FETCH_SCRIPT = path.join(process.cwd(), "server", "fetch_biometric.py");
const ADMS_PORT = Number(process.env.HRIS_ADMS_PORT || 6000);
const LIBREOFFICE_EXE =
  process.env.HRIS_LIBREOFFICE_EXE || "C:\\Program Files\\LibreOffice\\program\\soffice.com";
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
const BIOMETRIC_PYTHON_EXE =
  process.env.HRIS_BIOMETRIC_PYTHON_EXE || process.env.PYTHON_EXE || "python";
const BIOMETRIC_SYNC_LOG_LIMIT = 200;

const ROLES = ["Super Admin", "Admin", "HR", "Approver", "Employee", "Viewer"];
const HR_READ_ROLES = ["Super Admin", "HR", "Approver", "Viewer"];
const HR_WRITE_ROLES = ["Super Admin", "HR"];
const APPROVAL_ROLES = ["Super Admin", "Approver"];
const LEAVE_READ_ROLES = ["Super Admin", "HR", "Approver"];
const SYSTEM_ADMIN_ROLES = ["Super Admin", "Admin"];
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

const DEFAULT_REFERENCE_VALUES = [
  {
    category: "sectors",
    code: "EXEC",
    name: "Executive Office",
    description: "Top-level executive and hospital leadership offices.",
    sortOrder: 1,
  },
  {
    category: "sectors",
    code: "MED",
    name: "Medical Services Sector",
    description: "Medical care, clinical departments, and physician services.",
    sortOrder: 2,
  },
  {
    category: "sectors",
    code: "NURS",
    name: "Nursing Services Sector",
    description: "Nursing service, ward operations, and nursing supervision.",
    sortOrder: 3,
  },
  {
    category: "sectors",
    code: "HOPSS",
    name: "Hospital Operations and Patient Support Sector",
    description: "Ancillary, patient support, facility, and hospital operations services.",
    sortOrder: 4,
  },
  {
    category: "sectors",
    code: "ADMIN",
    name: "Finance and Administrative Sector",
    description: "Administrative, finance, HR, records, procurement, and general services.",
    sortOrder: 5,
  },
  {
    category: "offices",
    code: "OMCC",
    name: "Office of the Medical Center Chief",
    description: "Office responsible for overall hospital management and direction.",
    parentCategory: "sectors",
    parentCode: "EXEC",
    sortOrder: 1,
  },
  {
    category: "offices",
    code: "MED-OFF",
    name: "Medical Office",
    description: "Office grouping medical departments and physician services.",
    parentCategory: "sectors",
    parentCode: "MED",
    sortOrder: 2,
  },
  {
    category: "offices",
    code: "NURS-OFF",
    name: "Nursing Office",
    description: "Office grouping nursing divisions, wards, and nursing units.",
    parentCategory: "sectors",
    parentCode: "NURS",
    sortOrder: 3,
  },
  {
    category: "offices",
    code: "HOPSS-OFF",
    name: "Hospital Operations and Patient Support Office",
    description: "Office grouping patient support and operational service units.",
    parentCategory: "sectors",
    parentCode: "HOPSS",
    sortOrder: 4,
  },
  {
    category: "offices",
    code: "ADMIN-OFF",
    name: "Finance and Administrative Office",
    description: "Office grouping finance, HR, supply, records, and administrative units.",
    parentCategory: "sectors",
    parentCode: "ADMIN",
    sortOrder: 5,
  },
  {
    category: "divisions",
    code: "MCC-DIV",
    name: "Executive Management Division",
    parentCategory: "offices",
    parentCode: "OMCC",
    sortOrder: 1,
  },
  {
    category: "divisions",
    code: "MED-DIV",
    name: "Medical Division",
    parentCategory: "offices",
    parentCode: "MED-OFF",
    sortOrder: 2,
  },
  {
    category: "divisions",
    code: "NURS-DIV",
    name: "Nursing Division",
    parentCategory: "offices",
    parentCode: "NURS-OFF",
    sortOrder: 3,
  },
  {
    category: "divisions",
    code: "ANC-DIV",
    name: "Ancillary Services Division",
    parentCategory: "offices",
    parentCode: "HOPSS-OFF",
    sortOrder: 4,
  },
  {
    category: "divisions",
    code: "SUP-DIV",
    name: "Support Services Division",
    parentCategory: "offices",
    parentCode: "HOPSS-OFF",
    sortOrder: 5,
  },
  {
    category: "divisions",
    code: "ADMIN-DIV",
    name: "Administrative Division",
    parentCategory: "offices",
    parentCode: "ADMIN-OFF",
    sortOrder: 6,
  },
  {
    category: "divisions",
    code: "FIN-DIV",
    name: "Finance Division",
    parentCategory: "offices",
    parentCode: "ADMIN-OFF",
    sortOrder: 7,
  },
  {
    category: "sections",
    code: "ER",
    name: "Emergency Room Unit",
    parentCategory: "divisions",
    parentCode: "MED-DIV",
    sortOrder: 1,
  },
  {
    category: "sections",
    code: "OPD",
    name: "Outpatient Department Unit",
    parentCategory: "divisions",
    parentCode: "MED-DIV",
    sortOrder: 2,
  },
  {
    category: "sections",
    code: "WARD",
    name: "Ward Nursing Unit",
    parentCategory: "divisions",
    parentCode: "NURS-DIV",
    sortOrder: 3,
  },
  {
    category: "sections",
    code: "PHARM",
    name: "Pharmacy Section",
    parentCategory: "divisions",
    parentCode: "ANC-DIV",
    sortOrder: 4,
  },
  {
    category: "sections",
    code: "LAB",
    name: "Laboratory Section",
    parentCategory: "divisions",
    parentCode: "ANC-DIV",
    sortOrder: 5,
  },
  {
    category: "sections",
    code: "RAD",
    name: "Radiology Section",
    parentCategory: "divisions",
    parentCode: "ANC-DIV",
    sortOrder: 6,
  },
  {
    category: "sections",
    code: "HR",
    name: "Human Resource Management Section",
    parentCategory: "divisions",
    parentCode: "ADMIN-DIV",
    sortOrder: 7,
  },
  {
    category: "sections",
    code: "RECORDS",
    name: "Records Section",
    parentCategory: "divisions",
    parentCode: "ADMIN-DIV",
    sortOrder: 8,
  },
  {
    category: "sections",
    code: "SUPPLY",
    name: "Supply and Property Section",
    parentCategory: "divisions",
    parentCode: "ADMIN-DIV",
    sortOrder: 9,
  },
  {
    category: "sections",
    code: "BUDGET",
    name: "Budget Section",
    parentCategory: "divisions",
    parentCode: "FIN-DIV",
    sortOrder: 10,
  },
  {
    category: "sections",
    code: "ACCOUNTING",
    name: "Accounting Section",
    parentCategory: "divisions",
    parentCode: "FIN-DIV",
    sortOrder: 11,
  },
  {
    category: "sections",
    code: "CASH",
    name: "Cashier Section",
    parentCategory: "divisions",
    parentCode: "FIN-DIV",
    sortOrder: 12,
  },
  {
    category: "sections",
    code: "GSS",
    name: "General Services Section",
    parentCategory: "divisions",
    parentCode: "SUP-DIV",
    sortOrder: 13,
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
    code: "CASUAL",
    name: "Casual",
    description: "Casual employment status.",
    sortOrder: 4,
  },
  {
    category: "employment-statuses",
    code: "CONTRACT",
    name: "Contractual",
    description: "Contractual employment status.",
    sortOrder: 5,
  },
  {
    category: "employment-statuses",
    code: "JO",
    name: "Job Order",
    description: "Job order engagement.",
    sortOrder: 6,
  },
  {
    category: "employment-statuses",
    code: "COS",
    name: "Contract of Service",
    description: "Contract of service engagement.",
    sortOrder: 7,
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
    name: "Plantilla",
    description: "Regular approved plantilla item.",
    sortOrder: 1,
  },
  {
    category: "plantilla-types",
    code: "NON-PLANTILLA",
    name: "Non-Plantilla",
    description: "Position or engagement not tied to a plantilla item.",
    sortOrder: 2,
  },
  {
    category: "plantilla-types",
    code: "CASUAL",
    name: "Casual",
    description: "Casual item or engagement.",
    sortOrder: 3,
  },
  {
    category: "plantilla-types",
    code: "JO",
    name: "Job Order",
    description: "Job order classification.",
    sortOrder: 4,
  },
  {
    category: "plantilla-types",
    code: "COS",
    name: "Contract of Service",
    description: "Contract of service classification.",
    sortOrder: 5,
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
    code: "INCOME",
    name: "Hospital Income",
    description: "Hospital income or internally generated fund source.",
    sortOrder: 4,
  },
  {
    category: "budget-codes",
    code: "DOH-GAA",
    name: "DOH GAA",
    description: "Department of Health General Appropriations Act source.",
    sortOrder: 5,
  },
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
const biometricSyncLogs = [];
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
  return json(res, 200, { ok: true });
}

async function handleReadAllNotifications(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  const [result] = await pool.execute(
    `UPDATE notifications SET read_at = NOW() WHERE user_id = :userId AND read_at IS NULL`,
    { userId: user.id },
  );
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

async function handleVisitLog(req, res) {
  const body = await readBody(req).catch(() => ({}));
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip =
    String(Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor || "")
      .split(",")[0]
      .trim() ||
    req.socket.remoteAddress ||
    "unknown";
  console.info("[visit]", {
    at: new Date().toISOString(),
    ip,
    path: body.path || "unknown",
    referrer: body.referrer || "direct",
    userAgent: body.userAgent || req.headers["user-agent"] || "unknown",
  });
  return json(res, 200, { ok: true });
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
    regular:
      row.regular === null || row.regular === undefined
        ? row.status !== "Job Order"
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
    birthday: body.birthday || existing.birthday || null,
    gender: String(body.gender ?? existing.gender ?? "").trim(),
    civilStatus: String(body.civilStatus ?? existing.civilStatus ?? "").trim(),
    email: String(body.email ?? existing.email ?? "").trim(),
    cellphoneNo: String(body.cellphoneNo ?? existing.cellphoneNo ?? "").trim(),
    photoUrl: body.photoUrl ? String(body.photoUrl) : existing.photoUrl || "",
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
    dtrSignatory: String(
      body.dtrSignatory ?? body.dtr_signatory ?? existing.dtrSignatory ?? "",
    ).trim(),
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

  const lateMinutes =
    amIn !== null && scheduledAmIn !== null ? Math.max(0, amIn - scheduledAmIn) : 0;
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
    displayLabel: row.display_label || "",
    displayLabelRequestId: row.display_label_request_id || "",
    locked: Boolean(row.locked),
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
  return [
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
    importedByName: row.imported_by_name || "",
    importedAt: row.imported_at,
  };
}

async function requireLeaveRead(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!LEAVE_READ_ROLES.includes(user.role)) {
    json(res, 403, { error: "Leave Management access required" });
    return null;
  }
  return user;
}

async function requireLeaveWrite(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!HR_WRITE_ROLES.includes(user.role)) {
    json(res, 403, { error: "HR access required" });
    return null;
  }
  return user;
}

async function requireApproval(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!APPROVAL_ROLES.includes(user.role)) {
    json(res, 403, { error: "Approval access required" });
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

async function changeLeaveBalance(
  employeeId,
  leaveTypeId,
  amount,
  column,
  balanceDelta = amount,
  ledger = null,
) {
  if (!["earned", "used", "adjusted"].includes(column)) throw new Error("Invalid balance column");
  await ensureLeaveBalance(employeeId, leaveTypeId);
  await pool.execute(
    `UPDATE leave_balances
     SET ${column} = ${column} + :amount,
         balance = balance + :balanceDelta
     WHERE employee_id = :employeeId AND leave_type_id = :leaveTypeId`,
    { employeeId, leaveTypeId, amount, balanceDelta },
  );
  if (ledger) {
    const [[balance]] = await pool.execute(
      `SELECT balance FROM leave_balances
       WHERE employee_id = :employeeId AND leave_type_id = :leaveTypeId
       LIMIT 1`,
      { employeeId, leaveTypeId },
    );
    await pool.execute(
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
  if (!HR_READ_ROLES.includes(user.role)) {
    json(res, 403, { error: "Employee Management access required" });
    return null;
  }
  return user;
}

async function requireEmployeeWrite(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!HR_WRITE_ROLES.includes(user.role)) {
    json(res, 403, { error: "HR access required" });
    return null;
  }
  return user;
}

function canWriteEmployeeRecord(user, employeeId) {
  return HR_WRITE_ROLES.includes(user.role) || user.employeeId === employeeId;
}

async function requireAttendanceRead(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (![...HR_READ_ROLES, "Employee"].includes(user.role)) {
    json(res, 403, { error: "Attendance access required" });
    return null;
  }
  return user;
}

async function requireAttendanceWrite(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!HR_WRITE_ROLES.includes(user.role)) {
    json(res, 403, { error: "HR attendance access required" });
    return null;
  }
  return user;
}

function canReadEmployeeAttendance(user, employeeId) {
  return HR_READ_ROLES.includes(user.role) || user.employeeId === employeeId;
}

async function readEmployeeById(id) {
  const [rows] = await pool.execute(`SELECT * FROM employees WHERE id = :id LIMIT 1`, { id });
  return rows[0] ? employeeRow(rows[0]) : null;
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from({ length: 8 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
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
      display_label VARCHAR(180) NULL,
      display_label_request_id CHAR(36) NULL,
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
  await ensureColumn("dtr_entries", "display_label", "VARCHAR(180) NULL");
  await ensureColumn("dtr_entries", "display_label_request_id", "CHAR(36) NULL");

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

  await seedConfigTables();

  await bootstrapAdministrator();
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

  const username = String(process.env.HRIS_BOOTSTRAP_ADMIN_USERNAME || "")
    .trim()
    .toLowerCase();
  const password = String(process.env.HRIS_BOOTSTRAP_ADMIN_PASSWORD || "");
  const name = String(process.env.HRIS_BOOTSTRAP_ADMIN_NAME || "System Administrator").trim();

  if (!username || !password) {
    throw new Error(
      "No system users exist. Set HRIS_BOOTSTRAP_ADMIN_USERNAME and HRIS_BOOTSTRAP_ADMIN_PASSWORD to create the first administrator.",
    );
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
     VALUES (:username, :passwordHash, :name, 'Admin', 1)`,
    { username, passwordHash, name },
  );
  await recordPasswordHistory(result.insertId, passwordHash);
}

async function recordPasswordHistory(userId, passwordHash) {
  await pool.execute(
    `INSERT INTO password_history (user_id, password_hash) VALUES (:userId, :passwordHash)`,
    { userId, passwordHash },
  );
  await pool.execute(
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

  for (const value of DEFAULT_REFERENCE_VALUES) {
    await pool.execute(
      `INSERT INTO hr_reference_values (
         category, code, name, description, is_active, effective_from, effective_to, sort_order
       )
       VALUES (
         :category, :code, :name, :description, 1, NULL, NULL, :sortOrder
       )
       ON DUPLICATE KEY UPDATE code = code`,
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
         AND child.code = :code
         AND child.parent_id IS NULL`,
      {
        category: value.category,
        code: value.code,
        parentCategory: value.parentCategory,
        parentCode: value.parentCode,
      },
    );
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
  if (!SYSTEM_ADMIN_ROLES.includes(user.role)) {
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
            e.employee_no, CONCAT(e.lastname, ', ', e.firstname) AS employee_name
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

  return json(
    res,
    200,
    { user: publicUser(user) },
    { "Set-Cookie": sessionCookie(token, expiresAt) },
  );
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
  if (!row || !verifyPassword(currentPassword, row.password_hash)) {
    await logAudit(user.id, "auth.password_change_failed", { reason: "incorrect_password" }, req);
    return json(res, 401, { error: "Current password is incorrect" });
  }

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
    `SELECT u.id, u.username, u.name, u.role, u.is_active, u.must_change_password,
            u.failed_login_attempts, u.locked_at, u.employee_id,
            u.created_at, u.updated_at, e.employee_no, CONCAT(e.lastname, ', ', e.firstname) AS employee_name
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

  const [existingRows] = await pool.execute(
    `SELECT role, is_active FROM users WHERE id = :id LIMIT 1`,
    { id },
  );
  const existing = existingRows[0];
  if (!existing) return json(res, 404, { error: "User not found" });
  if (
    admin.role !== "Super Admin" &&
    (existing.role === "Super Admin" || (role === "Super Admin" && (await hasActiveSuperAdmin(id))))
  ) {
    return json(res, 403, { error: "Only a Super Admin can manage Super Admin accounts" });
  }

  await pool.execute(
    `UPDATE users SET name = :name, role = :role, employee_id = :employeeId, is_active = :isActive WHERE id = :id`,
    { id, name, role, employeeId, isActive },
  );
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

  const [[existing]] = await pool.execute(`SELECT role FROM users WHERE id = :id LIMIT 1`, { id });
  if (!existing) return json(res, 404, { error: "User not found" });
  if (existing.role === "Super Admin" && admin.role !== "Super Admin") {
    return json(res, 403, { error: "Only a Super Admin can delete Super Admin accounts" });
  }

  const [result] = await pool.execute(`DELETE FROM users WHERE id = :id`, { id });
  if (result.affectedRows === 0) return json(res, 404, { error: "User not found" });
  await logAudit(admin.id, "users.delete", { userId: id }, req);
  return json(res, 200, { ok: true });
}

async function handleResetUserPassword(req, res, id) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = hashPassword(temporaryPassword);
  const [existingRows] = await pool.execute(
    `SELECT password_hash, role FROM users WHERE id = :id LIMIT 1`,
    { id },
  );
  if (!existingRows[0]) return json(res, 404, { error: "User not found" });
  if (existingRows[0].role === "Super Admin" && admin.role !== "Super Admin") {
    return json(res, 403, { error: "Only a Super Admin can reset Super Admin passwords" });
  }
  await recordPasswordHistory(id, existingRows[0].password_hash);
  const [result] = await pool.execute(
    `UPDATE users
     SET password_hash = :passwordHash, must_change_password = 1,
         failed_login_attempts = 0, locked_at = NULL
     WHERE id = :id`,
    { id, passwordHash },
  );
  await recordPasswordHistory(id, passwordHash);
  await pool.execute(`DELETE FROM sessions WHERE user_id = :id`, { id });
  await logAudit(admin.id, "users.reset_password", { userId: id }, req);
  return json(res, 200, { temporaryPassword });
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

async function handleDashboard(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (![...SYSTEM_ADMIN_ROLES, ...HR_READ_ROLES].includes(user.role)) {
    return json(res, 403, { error: "Dashboard access required" });
  }

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
  const empStatus = String(url.searchParams.get("empStatus") || "").trim();
  const gender = String(url.searchParams.get("gender") || "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 10)));
  const offset = (page - 1) * pageSize;
  const where = [`is_hidden = 0`];
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
  const first = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const last = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
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
        {
          employeeId: group.employeeId,
          workDate: group.workDate,
          ...entry,
          ...group,
          source: "Imported",
        },
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
  await logAudit(
    user.id,
    "attendance.import_file",
    { importId, imported, errors: errors.length },
    req,
  );
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
  if (!parsed.length)
    return json(res, 400, { error: "No valid DTR punches found in the selected range" });

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
      return json(res, 500, { error: `Failed to fetch biometric data: ${error.message}` });
    }
    if (!parsed.length) {
      return json(res, 400, {
        error: "No biometric punches found for the selected employee and date range",
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
  if (!parsed.length)
    return json(res, 400, { error: "No valid DTR punches found in the selected range" });

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
  if (!parsed.length)
    return json(res, 400, { error: "No valid DTR punches found in the selected range" });

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
  const employeeIds = Array.isArray(body.employeeIds)
    ? body.employeeIds.map(String).filter(Boolean)
    : [];
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
        const workDate = formatLocalDate(cursor);
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
        skipped++;
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

  return { inserted, skipped, affectedEmployees };
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
  try {
    const result = await insertBiometricPunches({ punches, sourceDevice });
    for (const [employeeId, range] of result.affectedEmployees.entries()) {
      enqueueBiometricDtrRefresh(employeeId, range.from);
      if (range.to !== range.from) enqueueBiometricDtrRefresh(employeeId, range.to);
    }
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
      `ADMS stored ${result.inserted} new punch(es), skipped ${result.skipped}`,
    );
  } catch (error) {
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
  const noter = {
    signatory: String(
      body.noterSignatory ||
        body.noter_signatory ||
        employee.dtrSignatory ||
        employee.lastname ||
        "",
    ).trim(),
    position: String(body.noterPosition || body.noter_position || "Immediate Supervisor").trim(),
  };
  const payload = {
    employee: {
      id: employee.id,
      name: [employee.firstname, employee.middlename, employee.lastname, employee.nameExt]
        .filter(Boolean)
        .join(" "),
      position: employee.position,
      department: employee.department,
      signatory:
        employee.dtrSignatory ||
        [employee.firstname, employee.middlename, employee.lastname, employee.nameExt]
          .filter(Boolean)
          .join(" "),
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
  const safeName = `${employee.lastname || "employee"}-${employee.firstname || ""}`.replace(
    /[^A-Za-z0-9_-]+/g,
    "-",
  );
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
  const safeName = `${employee.lastname || "employee"}-${employee.firstname || ""}`.replace(
    /[^A-Za-z0-9_-]+/g,
    "-",
  );
  const fileName = `dtr-${safeName}-${stamp}.pdf`;
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
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeOffice = office.replace(/[^A-Za-z0-9_-]+/g, "-");
  const fileName = `mass-dtr-${safeOffice}-${stamp}.pdf`;
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
      const employeeName = [
        employee.firstname,
        employee.middlename,
        employee.lastname,
        employee.nameExt,
      ]
        .filter(Boolean)
        .join(" ");
      const payload = {
        employee: {
          id: employee.id,
          name: employeeName,
          position: employee.position,
          department: employee.department,
          signatory: employee.dtrSignatory || employeeName,
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
              employee.lastname ||
              "",
          ).trim(),
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
  if (!/^mass-dtr-[A-Za-z0-9_.-]+\.pdf$/.test(decoded)) {
    return json(res, 400, { error: "Invalid mass DTR PDF file name" });
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
            CONCAT(e.lastname, ', ', e.firstname) AS employee_name,
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
  if (![...APPROVAL_ROLES, "Employee"].includes(user.role)) {
    return json(res, 403, { error: "DTR correction request access required" });
  }
  const requestedEmployeeId = String(url.searchParams.get("employeeId") || "").trim();
  const employeeId = user.role === "Employee" ? user.employeeId || "" : requestedEmployeeId;
  if (user.role === "Employee" && !employeeId) {
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
  if (user.role !== "Employee") {
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
  const user = await requireApproval(req, res);
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
      if (existing?.locked) {
        await connection.rollback();
        return json(res, 409, { error: "Unlock the DTR entry before approving this request" });
      }
      if (!correctionOriginalStillMatches(request, existing)) {
        await connection.rollback();
        return json(res, 409, {
          error:
            "The DTR changed after this request was filed. Review the current record and ask the employee to file a new request.",
        });
      }

      beforeSnapshot = dtrAuditSnapshot(existing);
      if (request.request_type === "Times") {
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
  if (!HR_WRITE_ROLES.includes(user.role) && user.employeeId !== request.employee_id) {
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
  const user = await requireApproval(req, res);
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
    if (current?.locked) {
      await connection.rollback();
      return json(res, 409, { error: "Unlock the DTR entry before reversing this approval" });
    }
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
      await connection.execute(
        `UPDATE dtr_entries
         SET am_in = :amIn, am_out = :amOut, pm_in = :pmIn, pm_out = :pmOut,
             status = :status, late_minutes = :lateMinutes,
             undertime_minutes = :undertimeMinutes, source = :source, remarks = :remarks,
             display_label = :displayLabel,
             display_label_request_id = :displayLabelRequestId,
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
  if (mass && !HR_WRITE_ROLES.includes(user.role))
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
        id, employee_no, biometric_id, firstname, middlename, lastname, name_ext, department, position, status, level,
        status_class, date_hired, date_employed, item_no, emp_status, birthday, gender, civil_status,
        email, cellphone_no, photo_url, schedule_am_in, schedule_am_out, schedule_pm_in, schedule_pm_out,
        dtr_signatory, dtr_noter_id, is_dtr_noter, regular, profile_json
      ) VALUES (
        :id, :employeeNo, :biometricId, :firstname, :middlename, :lastname, :nameExt, :department, :position, :status, :level,
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
  if (!HR_READ_ROLES.includes(user.role) && user.employeeId !== id) {
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

async function buildEmployeePdsPayload(id, user) {
  if (!HR_READ_ROLES.includes(user.role) && user.employeeId !== id) {
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

async function generateEmployeePdsExcelFile(id, user, req) {
  const payload = await buildEmployeePdsPayload(id, user);
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeName =
    `${payload.employee.lastname || "employee"}-${payload.employee.firstname || ""}`.replace(
      /[^A-Za-z0-9_-]+/g,
      "-",
    ) || "employee";
  const fileName = `pds-${safeName}-${stamp}.xlsx`;
  const inputPath = path.join(PREVIEW_DIR, `${fileName}.json`);
  const outputPath = path.join(PREVIEW_DIR, fileName);

  await fs.writeFile(inputPath, JSON.stringify(payload), "utf8");
  try {
    await runPython([PDS_EXCEL_SCRIPT, inputPath, outputPath, PDS_TEMPLATE_XLSX]);
  } finally {
    await fs.rm(inputPath, { force: true }).catch(() => {});
  }

  await logAudit(user.id, "employees.pds_excel_generate", { employeeId: id, fileName }, req);
  return { fileName, outputPath, payload };
}

async function handleGenerateEmployeePdsExcel(req, res, id) {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const { fileName } = await generateEmployeePdsExcelFile(id, user, req);
    return json(res, 200, {
      fileName,
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
  if (!/^pds-[A-Za-z0-9_.-]+\.xlsx$/.test(decoded)) {
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
  await logAudit(user.id, "employees.pds_excel_download", { fileName: decoded }, req);
  return sendFile(res, resolved, decoded);
}

async function handleUpdateEmployee(req, res, id) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!canWriteEmployeeRecord(user, id)) {
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
  const [[activeOccupancy]] = await pool.execute(
    `SELECT po.id
     FROM plantilla_occupancies po
     WHERE po.employee_id = :id AND po.status = 'Active'
     LIMIT 1`,
    { id },
  );
  if (activeOccupancy) {
    const plantillaOwnedFields = [
      ["department", "department"],
      ["position", "position"],
      ["itemNo", "item number"],
      ["empStatus", "employee active status"],
    ];
    const changed = plantillaOwnedFields
      .filter(([field]) => String(data[field] || "") !== String(existing[field] || ""))
      .map(([, label]) => label);
    if (changed.length) {
      return json(res, 409, {
        error: `This employee has an active Plantilla occupancy. Change ${changed.join(
          ", ",
        )} through Employee Movements instead.`,
      });
    }
  }
  const employeeNo = data.employeeNo || existing.employeeId || `EMP-${Date.now()}`;

  try {
    await pool.execute(
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

  const [[employee]] = await pool.execute(`SELECT id FROM employees WHERE id = :id LIMIT 1`, {
    id,
  });
  if (!employee) return json(res, 404, { error: "Employee not found" });

  await pool.execute(`UPDATE employees SET is_hidden = 1 WHERE id = :id`, { id });
  await logAudit(user.id, "employees.hide", { employeeId: id }, req);
  return json(res, 200, { ok: true });
}

async function handleCreateSectionRow(req, res, employeeId, section) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (!canWriteEmployeeRecord(user, employeeId)) {
    return json(res, 403, { error: "You can only update your own 201 records" });
  }
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
  const user = await requireUser(req, res);
  if (!user) return;
  if (!canWriteEmployeeRecord(user, employeeId)) {
    return json(res, 403, { error: "You can only update your own 201 records" });
  }
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
  const user = await requireUser(req, res);
  if (!user) return;
  if (!canWriteEmployeeRecord(user, employeeId)) {
    return json(res, 403, { error: "You can only update your own 201 records" });
  }
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
  if (!HR_READ_ROLES.includes(user.role) && user.employeeId !== employeeId) {
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
  const formPayload =
    body.formPayload && typeof body.formPayload === "object" ? body.formPayload : {};
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
  if (!HR_WRITE_ROLES.includes(user.role) && user.employeeId !== employeeId) {
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
      {
        entryType: "ApprovalReversal",
        sourceType: "leave_application",
        sourceId: id,
        description: `Reversed approved leave because status changed to ${status}`,
        createdBy: user.id,
      },
    );
  }
  if (existing.status !== "Approved" && status === "Approved") {
    await changeLeaveBalance(
      existing.employee_id,
      existing.leave_type_id,
      Number(existing.days_requested),
      "used",
      -Number(existing.days_requested),
      {
        entryType: "LeaveApproval",
        sourceType: "leave_application",
        sourceId: id,
        description: "Approved leave application",
        createdBy: user.id,
      },
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
    await changeLeaveBalance(
      existing.employee_id,
      existing.leave_type_id,
      -Number(existing.days_requested),
      "used",
      Number(existing.days_requested),
      {
        entryType: "DeleteReversal",
        sourceType: "leave_application",
        sourceId: id,
        description: "Reversed approved leave because application was deleted",
        createdBy: user.id,
      },
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
  if (!LEAVE_READ_ROLES.includes(user.role) && user.employeeId !== application.employeeId) {
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
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;
  const body = await readBody(req);
  const name = String(body.name || "").trim();
  if (!name) return json(res, 400, { error: "Department name is required" });
  try {
    const [result] = await pool.execute(`INSERT INTO departments (name) VALUES (:name)`, { name });
    await logAudit(user.id, "config.department_create", { name }, req);
    return json(res, 201, { department: { id: result.insertId, name } });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY")
      return json(res, 409, { error: "Department already exists" });
    throw error;
  }
}

async function handleDeleteDepartment(req, res, id) {
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;
  await pool.execute(`DELETE FROM departments WHERE id = :id`, { id });
  await logAudit(user.id, "config.department_delete", { id }, req);
  return json(res, 200, { ok: true });
}

async function handleCreatePosition(req, res) {
  const user = await requireEmployeeWrite(req, res);
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

async function handleDeletePosition(req, res, id) {
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;
  await pool.execute(`DELETE FROM positions WHERE id = :id`, { id });
  await logAudit(user.id, "config.position_delete", { id }, req);
  return json(res, 200, { ok: true });
}

async function handleCreateSalaryGrade(req, res) {
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;
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
    await logAudit(user.id, "config.salary_grade_create", { ordinance, grade, step }, req);
    return json(res, 201, { salaryGrade: { id: result.insertId, ordinance, grade, step, amount } });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY")
      return json(res, 409, { error: "Salary grade already exists" });
    throw error;
  }
}

async function handleDeleteSalaryGrade(req, res, id) {
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;
  await pool.execute(`DELETE FROM salary_grades WHERE id = :id`, { id });
  await logAudit(user.id, "config.salary_grade_delete", { id }, req);
  return json(res, 200, { ok: true });
}

function getReferenceLibraryType(category) {
  return REFERENCE_LIBRARY_TYPES[category] || null;
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
  if (!HR_READ_ROLES.includes(user.role)) {
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
  return json(res, 200, { libraries });
}

async function validateReferenceParent(
  category,
  parentId,
  { existingParentId = null, childIsActive = true } = {},
) {
  const config = getReferenceLibraryType(category);
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

async function handleCreateReferenceValue(req, res, category) {
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;
  const config = getReferenceLibraryType(category);
  if (!config) return json(res, 404, { error: "Reference library not found" });
  try {
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
  const user = await requireEmployeeWrite(req, res);
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
      const [[children]] = await pool.execute(
        `SELECT COUNT(*) AS count FROM hr_reference_values
         WHERE parent_id = :id AND is_active = 1`,
        { id },
      );
      if (Number(children.count) > 0) {
        return json(res, 409, {
          error: `${config.label} has ${Number(children.count)} active child record(s); deactivate or reassign them first`,
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
  const user = await requireEmployeeWrite(req, res);
  if (!user) return;
  const config = getReferenceLibraryType(category);
  if (!config) return json(res, 404, { error: "Reference library not found" });
  const existing = await readReferenceValue(id, category);
  if (!existing) return json(res, 404, { error: `${config.label} not found` });
  try {
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

async function handleListErrorLogs(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const [rows] = await pool.query(
    `SELECT el.id, el.method, el.path, el.message, el.stack, el.ip_address, el.user_agent,
            el.created_at, u.username, u.name, u.role
     FROM error_logs el
     LEFT JOIN users u ON u.id = el.user_id
     ORDER BY el.created_at DESC, el.id DESC
     LIMIT 200`,
  );

  return json(res, 200, {
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
  });
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
    "error_logs",
    "agency_settings",
    "departments",
    "positions",
    "salary_grades",
    "hr_reference_values",
    "employees",
    "plantilla_items",
    "plantilla_occupancies",
    "plantilla_item_history",
    "personnel_movements",
    "personnel_movement_events",
    "service_record_entries",
    ...Object.values(EMPLOYEE_SECTION_TABLES).map((config) => config.table),
    "leave_types",
    "leave_balances",
    "leave_applications",
    "leave_adjustments",
    "leave_credit_ledger",
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

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "GET" && url.pathname === "/api/realtime/events")
    return handleRealtimeEvents(req, res);
  const userMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)$/);
  const resetPasswordMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/reset-password$/);
  const unlockUserMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/unlock$/);
  const backupDownloadMatch = url.pathname.match(/^\/api\/admin\/backups\/([^/]+)\/download$/);
  const employeeMatch = url.pathname.match(/^\/api\/employees\/([A-Za-z0-9-]+)$/);
  const employeePdsExcelGenerateMatch = url.pathname.match(
    /^\/api\/employees\/([A-Za-z0-9-]+)\/pds\/excel$/,
  );
  const employeePdsExcelDownloadMatch = url.pathname.match(
    /^\/api\/employees\/pds\/excel\/([^/]+)$/,
  );
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
  const dtrCorrectionDecisionMatch = url.pathname.match(
    /^\/api\/attendance\/correction-requests\/([A-Za-z0-9-]+)\/decision$/,
  );
  const dtrCorrectionCancelMatch = url.pathname.match(
    /^\/api\/attendance\/correction-requests\/([A-Za-z0-9-]+)\/cancel$/,
  );
  const dtrCorrectionReverseMatch = url.pathname.match(
    /^\/api\/attendance\/correction-requests\/([A-Za-z0-9-]+)\/reverse$/,
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
  const movementMatch = url.pathname.match(/^\/api\/movements\/([A-Za-z0-9-]+)$/);
  const movementEventsMatch = url.pathname.match(/^\/api\/movements\/([A-Za-z0-9-]+)\/events$/);
  const movementActionMatch = url.pathname.match(
    /^\/api\/movements\/([A-Za-z0-9-]+)\/(submit|review|approve|reject|return|post|reverse)$/,
  );
  const plantillaItemMatch = url.pathname.match(/^\/api\/plantilla\/([A-Za-z0-9-]+)$/);
  const plantillaHistoryMatch = url.pathname.match(/^\/api\/plantilla\/([A-Za-z0-9-]+)\/history$/);

  if (isAdmsIclock) return handleAdmsIclock(req, res, url);

  if (req.method === "GET" && url.pathname === "/api/health") {
    return json(res, 200, { ok: true, database: DB_NAME });
  }
  if (req.method === "POST" && url.pathname === "/api/visit-log") {
    return handleVisitLog(req, res);
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
  if (req.method === "POST" && unlockUserMatch)
    return handleUnlockUser(req, res, unlockUserMatch[1]);
  if (req.method === "GET" && url.pathname === "/api/admin/audit-logs")
    return handleListAuditLogs(req, res);
  if (req.method === "GET" && url.pathname === "/api/admin/error-logs")
    return handleListErrorLogs(req, res);
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
  if (req.method === "POST" && employeePdsExcelGenerateMatch)
    return handleGenerateEmployeePdsExcel(req, res, employeePdsExcelGenerateMatch[1]);
  if (req.method === "GET" && employeePdsExcelDownloadMatch)
    return handleDownloadEmployeePdsExcel(req, res, employeePdsExcelDownloadMatch[1]);
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
  if (req.method === "DELETE" && plantillaItemMatch)
    return plantillaHandlers.remove(req, res, plantillaItemMatch[1]);
  if (req.method === "GET" && plantillaHistoryMatch)
    return plantillaHandlers.history(req, res, plantillaHistoryMatch[1]);

  if (req.method === "GET" && url.pathname === "/api/settings/references")
    return handleListReferenceValues(req, res);
  if (req.method === "POST" && referenceCollectionMatch)
    return handleCreateReferenceValue(req, res, referenceCollectionMatch[1]);
  if ((req.method === "PUT" || req.method === "PATCH") && referenceValueMatch)
    return handleUpdateReferenceValue(req, res, referenceValueMatch[1], referenceValueMatch[2]);
  if (req.method === "DELETE" && referenceValueMatch)
    return handleDeleteReferenceValue(req, res, referenceValueMatch[1], referenceValueMatch[2]);
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
serviceRecordHandlers = createServiceRecordHandlers({
  pool,
  requireUser,
  requireEmployeeWrite,
  readBody,
  json,
  logAudit,
  runPython,
  previewDir: PREVIEW_DIR,
  exportScript: SERVICE_RECORD_EXPORT_SCRIPT,
  sendFile,
});
movementHandlers = createMovementHandlers({
  pool,
  requireEmployeeRead,
  requireEmployeeWrite,
  requireApproval,
  readBody,
  json,
  logAudit,
});
plantillaHandlers = createPlantillaHandlers({
  pool,
  requireEmployeeRead,
  requireEmployeeWrite,
  readBody,
  json,
  logAudit,
});
await cleanupPreviewFiles().catch(() => {});
await cleanupNotifications().catch(() => {});
setInterval(() => cleanupPreviewFiles().catch(() => {}), 10 * 60 * 1000).unref();
setInterval(() => cleanupNotifications().catch(() => {}), 24 * 60 * 60 * 1000).unref();

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
