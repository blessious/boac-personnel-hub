// Mock data layer for DOH-STRH HRIS
// All data lives in-memory. Static/mock only — no backend.
import strhLogo from "../STRH-logo.png";

// ─── Backward-compat exports used by employees.$id.tsx ───
export const DEPARTMENTS = [
  "Nursing", "Medical", "Finance", "IT", "Administrative",
  "Pharmacy", "Laboratory", "Radiology", "Surgery", "OPD",
];
export const POSITIONS = [
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
  "Warehouseman II"
];
export const SALARY_GRADES = Array.from({ length: 33 }, (_, i) => i + 1);
export const SALARY_STEPS = Array.from({ length: 8 }, (_, i) => i + 1);
export const SALARY_TABLE: Record<number, number[]> = {};
for (const g of SALARY_GRADES) {
  const base = 13000 + g * 1850;
  SALARY_TABLE[g] = Array.from({ length: 8 }, (_, s) => Math.round(base * (1 + s * 0.018)));
}
export interface FamilyRecord {
  spouse: { lastname: string; firstname: string; middlename: string; occupation: string; employer: string; businessTel: string; businessAddress: string };
  father: { lastname: string; firstname: string; middlename: string };
  mother: { lastname: string; firstname: string; middlename: string };
}
export interface ChildRecord { id: string; lastname: string; firstname: string; middlename: string; gender: "Male" | "Female"; birthday: string }
export interface EducationRecord { id: string; level: string; school: string; degree: string; yearFrom: string; yearTo: string; yearGraduated: string; scholarship: string }
export interface CivilServiceRecord { id: string; type: string; place: string; date: string; rating: string; license: string; dateRelease: string; licenseValidity: string }
export interface WorkRecord { id: string; position: string; company: string; status: string; dateFrom: string; dateTo: string; salary: string; govEmp: "YES" | "NO" }
export interface OrgRecord { id: string; name: string; position: string; address: string; yearFrom: string; yearTo: string; hours: string }
export interface TrainingRecord2 { id: string; name: string; conductedBy: string; yearFrom: string; yearTo: string; hours: string; file?: string }
export interface SalaryRecord { id: string; date: string; description: string; ordinance: string; grade: number; step: number; tax: string; amount: number; gross: number; type: "Step Increment" | "Not Step Increment"; pera: number; rata: number; cata: number }
export interface ServiceRecord { id: string; from: string; to: string; status: string; salary: string; designation: string; department: string; assignment: string; branch: string; leave: string; sepDate: string; sepCause: string }
export interface LeaveRecord { id: string; type: string; period: string; particulars: string; vlEarned: number; vlAbsWP: number; vlBalance: number; vlAbsWOP: number; slEarned: number; slAbsWP: number; slBalance: number; slAbsWOP: number; dateAction: string; employeeId: string }
export interface IPCRRecord { id: string; month: string; from: string; to: string; remarks: string; grades: string; file?: string }
interface CompatStore {
  family: Record<string, FamilyRecord>;
  children: Record<string, ChildRecord[]>;
  education: Record<string, EducationRecord[]>;
  civilService: Record<string, CivilServiceRecord[]>;
  work: Record<string, WorkRecord[]>;
  org: Record<string, OrgRecord[]>;
  training: Record<string, TrainingRecord2[]>;
  salary: Record<string, SalaryRecord[]>;
  service: Record<string, ServiceRecord[]>;
  leave: Record<string, LeaveRecord[]>;
  ipcr: Record<string, IPCRRecord[]>;
}
export const STORE: CompatStore = {
  family: {}, children: {}, education: {}, civilService: {},
  work: {}, org: {}, training: {}, salary: {}, service: {}, leave: {}, ipcr: {},
};


export type EmploymentStatus = "Regular" | "Job Order" | "Casual" | "Contractual" | "Permanent";
export type Department = "Nursing" | "Medical" | "Finance" | "IT" | "Administrative" | "Pharmacy" | "Laboratory" | "Radiology" | "Surgery" | "OPD";

export interface Employee {
  id: string;
  employeeId: string;
  lastname: string;
  firstname: string;
  middlename: string;
  nameExt?: string;
  department: Department;
  position: string;
  itemNumber?: string;
  salaryGrade: number;
  salaryStep: number;
  officeDiv: string;
  status: EmploymentStatus;
  dateHired: string;
  dateAssumption: string;
  birthday: string;
  gender: "Male" | "Female";
  civilStatus: "Single" | "Married" | "Widowed" | "Separated";
  address: string;
  contact: string;
  email: string;
  tin?: string;
  gsis?: string;
  philhealth?: string;
  pagibig?: string;
  sss?: string;
  photoUrl?: string;
  empStatus: "Active" | "Inactive";
}

export const STRH_DEPARTMENTS: Department[] = [
  "Nursing", "Medical", "Finance", "IT", "Administrative",
  "Pharmacy", "Laboratory", "Radiology", "Surgery", "OPD"
];

export const STRH_POSITIONS: Record<Department, string[]> = {
  Nursing: ["Chief Nurse", "Nurse IV", "Nurse III", "Nurse II", "Nurse I", "Nursing Attendant"],
  Medical: ["Medical Specialist IV", "Medical Specialist III", "Medical Officer IV", "Medical Officer III", "Resident Physician"],
  Finance: ["Finance Officer", "Budget Officer IV", "Accountant III", "Accountant I", "Accounting Clerk"],
  IT: ["IT Officer", "Computer Programmer II", "Computer Programmer I", "Systems Analyst"],
  Administrative: ["Admin Officer V", "Admin Officer III", "Admin Aide VI", "Admin Aide IV", "Records Officer"],
  Pharmacy: ["Pharmacist IV", "Pharmacist III", "Pharmacist II", "Pharmacy Aide"],
  Laboratory: ["Medical Technologist IV", "Medical Technologist II", "Laboratory Aide"],
  Radiology: ["Radiologist", "Radiologic Technologist II", "Radiologic Technologist I"],
  Surgery: ["Operating Room Nurse", "Anesthesiologist", "Surgical Technician"],
  OPD: ["OPD Nurse", "Clerk II", "Triage Officer"],
};

export const EMPLOYEES: Employee[] = [
  {
    id: "e001", employeeId: "STRH-2015-001",
    lastname: "dela Cruz", firstname: "Juan", middlename: "Santos",
    department: "Administrative", position: "Admin Officer V",
    itemNumber: "STRH-A-001", salaryGrade: 18, salaryStep: 4,
    officeDiv: "Human Resource Management Office",
    status: "Permanent", dateHired: "2015-03-01", dateAssumption: "2015-03-01",
    birthday: "1980-07-14", gender: "Male", civilStatus: "Married",
    address: "Blk 5 Lot 3, Maaraw St., Sto. Tomas, Batangas",
    contact: "09171234567", email: "juan.delacruz@strh.doh.gov.ph",
    tin: "123-456-789", gsis: "1234567890", philhealth: "12-345678901-2",
    pagibig: "1234-5678-9012", empStatus: "Active",
  },
  {
    id: "e002", employeeId: "STRH-2018-002",
    lastname: "Reyes", firstname: "Rosa", middlename: "Mendoza",
    department: "Nursing", position: "Nurse IV",
    itemNumber: "STRH-N-012", salaryGrade: 15, salaryStep: 3,
    officeDiv: "Ward A — Medical/Surgical",
    status: "Permanent", dateHired: "2018-06-15", dateAssumption: "2018-06-15",
    birthday: "1989-02-20", gender: "Female", civilStatus: "Single",
    address: "45 Rizal Ave., Lipa City, Batangas",
    contact: "09181234567", email: "rosa.reyes@strh.doh.gov.ph",
    tin: "234-567-890", gsis: "2345678901", philhealth: "23-456789012-3",
    pagibig: "2345-6789-0123", empStatus: "Active",
  },
  {
    id: "e003", employeeId: "STRH-2020-003",
    lastname: "Santos", firstname: "Jose", middlename: "Lim",
    department: "IT", position: "Computer Programmer II",
    itemNumber: "STRH-IT-003", salaryGrade: 16, salaryStep: 2,
    officeDiv: "Information Technology Unit",
    status: "Permanent", dateHired: "2020-01-06", dateAssumption: "2020-01-06",
    birthday: "1992-11-05", gender: "Male", civilStatus: "Single",
    address: "23 Mabini St., Bauan, Batangas",
    contact: "09191234567", email: "jose.santos@strh.doh.gov.ph",
    tin: "345-678-901", gsis: "3456789012", philhealth: "34-567890123-4",
    pagibig: "3456-7890-1234", empStatus: "Active",
  },
  {
    id: "e004", employeeId: "STRH-2016-004",
    lastname: "Lim", firstname: "Ana", middlename: "Co",
    department: "Finance", position: "Accountant III",
    itemNumber: "STRH-F-004", salaryGrade: 19, salaryStep: 5,
    officeDiv: "Finance and Budget Division",
    status: "Permanent", dateHired: "2016-08-22", dateAssumption: "2016-08-22",
    birthday: "1985-04-18", gender: "Female", civilStatus: "Married",
    address: "78 Bonifacio St., Batangas City",
    contact: "09201234567", email: "ana.lim@strh.doh.gov.ph",
    tin: "456-789-012", gsis: "4567890123", philhealth: "45-678901234-5",
    pagibig: "4567-8901-2345", empStatus: "Active",
  },
  {
    id: "e005", employeeId: "STRH-2019-005",
    lastname: "Garcia", firstname: "Pedro", middlename: "Tan",
    department: "Medical", position: "Medical Officer III",
    itemNumber: "STRH-M-005", salaryGrade: 24, salaryStep: 2,
    officeDiv: "Department of Medicine",
    status: "Permanent", dateHired: "2019-03-11", dateAssumption: "2019-03-11",
    birthday: "1978-09-30", gender: "Male", civilStatus: "Married",
    address: "12 Perez St., San Jose, Batangas",
    contact: "09211234567", email: "pedro.garcia@strh.doh.gov.ph",
    tin: "567-890-123", gsis: "5678901234", philhealth: "56-789012345-6",
    pagibig: "5678-9012-3456", empStatus: "Active",
  },
  {
    id: "e006", employeeId: "STRH-2021-006",
    lastname: "Villanueva", firstname: "Maria", middlename: "Uy",
    department: "Pharmacy", position: "Pharmacist II",
    itemNumber: undefined, salaryGrade: 14, salaryStep: 1,
    officeDiv: "Pharmacy Unit",
    status: "Job Order", dateHired: "2021-07-01", dateAssumption: "2021-07-01",
    birthday: "1995-12-03", gender: "Female", civilStatus: "Single",
    address: "56 Luna St., Rosario, Batangas",
    contact: "09221234567", email: "maria.villanueva@strh.doh.gov.ph",
    philhealth: "67-890123456-7", pagibig: "6789-0123-4567", empStatus: "Active",
  },
  {
    id: "e007", employeeId: "STRH-2017-007",
    lastname: "Aquino", firstname: "Grace", middlename: "Chan",
    department: "Laboratory", position: "Medical Technologist IV",
    itemNumber: "STRH-L-007", salaryGrade: 17, salaryStep: 6,
    officeDiv: "Clinical Laboratory",
    status: "Permanent", dateHired: "2017-04-05", dateAssumption: "2017-04-05",
    birthday: "1982-06-25", gender: "Female", civilStatus: "Married",
    address: "34 Mabini Ave., Tanauan, Batangas",
    contact: "09231234567", email: "grace.aquino@strh.doh.gov.ph",
    tin: "678-901-234", gsis: "6789012345", philhealth: "78-901234567-8",
    pagibig: "7890-1234-5678", empStatus: "Active",
  },
  {
    id: "e008", employeeId: "STRH-2022-008",
    lastname: "Mendoza", firstname: "Ramon", middlename: "Sy",
    department: "Nursing", position: "Nurse I",
    itemNumber: undefined, salaryGrade: 11, salaryStep: 1,
    officeDiv: "Ward B — Pediatrics",
    status: "Casual", dateHired: "2022-01-10", dateAssumption: "2022-01-10",
    birthday: "1998-03-17", gender: "Male", civilStatus: "Single",
    address: "90 Zamora St., Balayan, Batangas",
    contact: "09241234567", email: "ramon.mendoza@strh.doh.gov.ph",
    philhealth: "89-012345678-9", pagibig: "8901-2345-6789", empStatus: "Active",
  },
  {
    id: "e009", employeeId: "STRH-2014-009",
    lastname: "Rivera", firstname: "Cristina", middlename: "Ang",
    department: "Radiology", position: "Radiologic Technologist II",
    itemNumber: "STRH-R-009", salaryGrade: 15, salaryStep: 7,
    officeDiv: "Radiology Unit",
    status: "Permanent", dateHired: "2014-11-20", dateAssumption: "2014-11-20",
    birthday: "1979-08-12", gender: "Female", civilStatus: "Married",
    address: "67 Quezon St., Taysan, Batangas",
    contact: "09251234567", email: "cristina.rivera@strh.doh.gov.ph",
    tin: "789-012-345", gsis: "7890123456", philhealth: "90-123456789-0",
    pagibig: "9012-3456-7890", empStatus: "Active",
  },
  {
    id: "e010", employeeId: "STRH-2023-010",
    lastname: "Castillo", firstname: "Eduardo", middlename: "Lee",
    department: "OPD", position: "OPD Nurse",
    itemNumber: undefined, salaryGrade: 11, salaryStep: 1,
    officeDiv: "Out-Patient Department",
    status: "Job Order", dateHired: "2023-02-14", dateAssumption: "2023-02-14",
    birthday: "2000-01-22", gender: "Male", civilStatus: "Single",
    address: "11 Evangelista St., Lemery, Batangas",
    contact: "09261234567", email: "eduardo.castillo@strh.doh.gov.ph",
    philhealth: "01-234567890-1", pagibig: "0123-4567-8901", empStatus: "Active",
  },
  {
    id: "e011", employeeId: "STRH-2013-011",
    lastname: "Bautista", firstname: "Teresa", middlename: "Ong",
    department: "Nursing", position: "Chief Nurse",
    itemNumber: "STRH-N-001", salaryGrade: 24, salaryStep: 8,
    officeDiv: "Nursing Service",
    status: "Permanent", dateHired: "2013-05-06", dateAssumption: "2013-05-06",
    birthday: "1970-10-01", gender: "Female", civilStatus: "Married",
    address: "3 Del Pilar St., Batangas City",
    contact: "09271234567", email: "teresa.bautista@strh.doh.gov.ph",
    tin: "890-123-456", gsis: "8901234567", philhealth: "12-345678902-3",
    pagibig: "1234-5678-9013", empStatus: "Active",
  },
  {
    id: "e012", employeeId: "STRH-2020-012",
    lastname: "Pangilinan", firstname: "Roberto", middlename: "Yap",
    department: "Surgery", position: "Operating Room Nurse",
    itemNumber: "STRH-S-012", salaryGrade: 15, salaryStep: 2,
    officeDiv: "Surgical Department",
    status: "Permanent", dateHired: "2020-09-01", dateAssumption: "2020-09-01",
    birthday: "1991-05-28", gender: "Male", civilStatus: "Single",
    address: "55 Aguinaldo St., San Pascual, Batangas",
    contact: "09281234567", email: "roberto.pangilinan@strh.doh.gov.ph",
    tin: "901-234-567", gsis: "9012345678", philhealth: "23-456789013-4",
    pagibig: "2345-6789-0124", empStatus: "Active",
  },
];

// --- Work History per employee ---
export interface WorkHistory {
  id: string;
  date: string;
  natureOfAppointment: string;
  position: string;
  department: string;
  salaryGrade: number;
  step: number;
  remarks: string;
}

export const WORK_HISTORY: Record<string, WorkHistory[]> = {
  "e001": [
    { id: "wh1", date: "2015-03-01", natureOfAppointment: "Original Appointment", position: "Admin Aide VI", department: "Administrative", salaryGrade: 6, step: 1, remarks: "Initial appointment" },
    { id: "wh2", date: "2018-07-01", natureOfAppointment: "Promotion", position: "Admin Officer III", department: "Administrative", salaryGrade: 14, step: 1, remarks: "Passed CSE Professional" },
    { id: "wh3", date: "2022-01-01", natureOfAppointment: "Promotion", position: "Admin Officer V", department: "Administrative", salaryGrade: 18, step: 1, remarks: "Performance-based" },
  ],
  "e002": [
    { id: "wh4", date: "2018-06-15", natureOfAppointment: "Original Appointment", position: "Nurse I", department: "Nursing", salaryGrade: 11, step: 1, remarks: "PRC Licensed" },
    { id: "wh5", date: "2021-01-01", natureOfAppointment: "Promotion", position: "Nurse II", department: "Nursing", salaryGrade: 13, step: 1, remarks: "Merit Promotion" },
    { id: "wh6", date: "2023-07-01", natureOfAppointment: "Promotion", position: "Nurse IV", department: "Nursing", salaryGrade: 15, step: 1, remarks: "Step Increment" },
  ],
};

// --- Trainings per employee ---
export interface TrainingRecord {
  id: string;
  title: string;
  conductedBy: string;
  venue: string;
  dateFrom: string;
  dateTo: string;
  hours: number;
  type: "Local" | "Foreign";
}

export const TRAININGS: Record<string, TrainingRecord[]> = {
  "e001": [
    { id: "t1", title: "Basic HR Management Course", conductedBy: "CSC Regional Office IV-B", venue: "MIMAROPA", dateFrom: "2016-03-07", dateTo: "2016-03-11", hours: 40, type: "Local" },
    { id: "t2", title: "Records Management Seminar", conductedBy: "HRMO", venue: "Batangas City", dateFrom: "2019-11-20", dateTo: "2019-11-22", hours: 24, type: "Local" },
  ],
  "e002": [
    { id: "t3", title: "Basic Life Support Training", conductedBy: "Philippine Heart Center", venue: "Manila", dateFrom: "2020-02-10", dateTo: "2020-02-12", hours: 16, type: "Local" },
    { id: "t4", title: "Wound Care Management", conductedBy: "DOH Training Center", venue: "San Lazaro Hospital, Manila", dateFrom: "2022-08-01", dateTo: "2022-08-05", hours: 40, type: "Local" },
  ],
};

// --- Leave Credits ---
export interface LeaveCredit {
  employeeId: string;
  vlEarned: number;
  vlUsed: number;
  vlBalance: number;
  slEarned: number;
  slUsed: number;
  slBalance: number;
  forcedLeave: number;
  specialPrivilege: number;
  maternityLeave: number;
  soloParent: number;
}

export const LEAVE_CREDITS: LeaveCredit[] = EMPLOYEES.map((e, i) => ({
  employeeId: e.id,
  vlEarned: 15 + i % 5,
  vlUsed: i % 4,
  vlBalance: 15 + i % 5 - (i % 4),
  slEarned: 15 + i % 3,
  slUsed: i % 3,
  slBalance: 15 + i % 3 - (i % 3),
  forcedLeave: 5,
  specialPrivilege: 3,
  maternityLeave: e.gender === "Female" ? 105 : 0,
  soloParent: 0,
}));

// --- Pending Leave Requests ---
export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  leaveType: string;
  dateFrom: string;
  dateTo: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Disapproved";
  filedDate: string;
}

export const LEAVE_REQUESTS: LeaveRequest[] = [
  { id: "lr001", employeeId: "e008", employeeName: "Ramon Mendoza", department: "Nursing", leaveType: "Vacation Leave", dateFrom: "2026-06-10", dateTo: "2026-06-12", days: 3, reason: "Family vacation", status: "Pending", filedDate: "2026-06-05" },
  { id: "lr002", employeeId: "e010", employeeName: "Eduardo Castillo", department: "OPD", leaveType: "Sick Leave", dateFrom: "2026-06-08", dateTo: "2026-06-09", days: 2, reason: "Medical consultation", status: "Pending", filedDate: "2026-06-07" },
  { id: "lr003", employeeId: "e006", employeeName: "Maria Villanueva", department: "Pharmacy", leaveType: "Special Leave Benefit", dateFrom: "2026-06-15", dateTo: "2026-06-19", days: 5, reason: "Medical procedure", status: "Pending", filedDate: "2026-06-04" },
  { id: "lr004", employeeId: "e003", employeeName: "Jose Santos", department: "IT", leaveType: "Vacation Leave", dateFrom: "2026-06-20", dateTo: "2026-06-20", days: 1, reason: "Personal errand", status: "Pending", filedDate: "2026-06-06" },
  { id: "lr005", employeeId: "e012", employeeName: "Roberto Pangilinan", department: "Surgery", leaveType: "Compensatory Time-Off", dateFrom: "2026-06-17", dateTo: "2026-06-17", days: 1, reason: "Overtime compensation", status: "Approved", filedDate: "2026-06-03" },
  { id: "lr006", employeeId: "e009", employeeName: "Cristina Rivera", department: "Radiology", leaveType: "Sick Leave", dateFrom: "2026-06-05", dateTo: "2026-06-06", days: 2, reason: "Flu", status: "Approved", filedDate: "2026-06-04" },
  { id: "lr007", employeeId: "e007", employeeName: "Grace Aquino", department: "Laboratory", leaveType: "Vacation Leave", dateFrom: "2026-06-01", dateTo: "2026-06-02", days: 2, reason: "Rest day", status: "Disapproved", filedDate: "2026-05-28" },
];

// --- Attendance data (today) ---
export interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  department: Department;
  timeIn: string;
  timeOut: string;
  totalHours: number;
  status: "Present" | "Late" | "Absent" | "Half-Day";
}

export const ATTENDANCE_TODAY: AttendanceRecord[] = [
  { employeeId: "e001", employeeName: "Juan dela Cruz", department: "Administrative", timeIn: "07:58", timeOut: "17:02", totalHours: 9.07, status: "Present" },
  { employeeId: "e002", employeeName: "Rosa Reyes", department: "Nursing", timeIn: "08:15", timeOut: "17:00", totalHours: 8.75, status: "Late" },
  { employeeId: "e003", employeeName: "Jose Santos", department: "IT", timeIn: "07:55", timeOut: "17:05", totalHours: 9.17, status: "Present" },
  { employeeId: "e004", employeeName: "Ana Lim", department: "Finance", timeIn: "08:01", timeOut: "17:00", totalHours: 8.98, status: "Present" },
  { employeeId: "e005", employeeName: "Pedro Garcia", department: "Medical", timeIn: "", timeOut: "", totalHours: 0, status: "Absent" },
  { employeeId: "e006", employeeName: "Maria Villanueva", department: "Pharmacy", timeIn: "07:52", timeOut: "12:10", totalHours: 4.3, status: "Half-Day" },
  { employeeId: "e007", employeeName: "Grace Aquino", department: "Laboratory", timeIn: "07:48", timeOut: "17:08", totalHours: 9.33, status: "Present" },
  { employeeId: "e008", employeeName: "Ramon Mendoza", department: "Nursing", timeIn: "08:22", timeOut: "17:00", totalHours: 8.63, status: "Late" },
  { employeeId: "e009", employeeName: "Cristina Rivera", department: "Radiology", timeIn: "07:59", timeOut: "17:01", totalHours: 9.03, status: "Present" },
  { employeeId: "e010", employeeName: "Eduardo Castillo", department: "OPD", timeIn: "07:55", timeOut: "17:00", totalHours: 9.08, status: "Present" },
];

// --- Weekly attendance chart data ---
export const WEEKLY_ATTENDANCE = [
  { day: "Mon", present: 198, absent: 14 },
  { day: "Tue", present: 205, absent: 7 },
  { day: "Wed", present: 201, absent: 11 },
  { day: "Thu", present: 196, absent: 16 },
  { day: "Fri", present: 188, absent: 24 },
];

// --- Activity Feed ---
export const ACTIVITY_FEED = [
  { id: "a1", text: "Juan dela Cruz filed a Vacation Leave", time: "2 hrs ago", icon: "leave" },
  { id: "a2", text: "Rosa Reyes approved OB Pass for Dept. of Medicine", time: "3 hrs ago", icon: "pass" },
  { id: "a3", text: "Step Increment issued to 5 employees", time: "Yesterday", icon: "increment" },
  { id: "a4", text: "DTR corrected for Jose Santos", time: "Yesterday", icon: "dtr" },
  { id: "a5", text: "New employee onboarded: Ana Lim", time: "2 days ago", icon: "onboard" },
];

// --- Self Service Requests (for logged-in user: Maria Santos) ---
export interface SelfServiceRequest {
  id: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  status: "Pending" | "Approved" | "Disapproved";
  filedDate: string;
}

export const MY_REQUESTS: SelfServiceRequest[] = [
  { id: "sr1", type: "Vacation Leave", dateFrom: "2026-05-20", dateTo: "2026-05-22", status: "Approved", filedDate: "2026-05-15" },
  { id: "sr2", type: "OB Pass", dateFrom: "2026-06-03", dateTo: "2026-06-03", status: "Approved", filedDate: "2026-06-02" },
  { id: "sr3", type: "Sick Leave", dateFrom: "2026-06-08", dateTo: "2026-06-09", status: "Pending", filedDate: "2026-06-07" },
];

export const MY_NOTIFICATIONS = [
  { id: "n1", text: "Your Vacation Leave (May 20-22) has been approved.", time: "2 days ago", type: "success" },
  { id: "n2", text: "Reminder: Submit your June DTR by June 30.", time: "1 day ago", type: "info" },
  { id: "n3", text: "Step Increment has been processed for your record.", time: "3 hrs ago", type: "success" },
  { id: "n4", text: "Your Sick Leave request is pending approval.", time: "1 hr ago", type: "warning" },
];

// Settings & system
export const SETTINGS = {
  users: [
    { id: "u1", username: "admin", role: "Admin", name: "System Administrator" },
    { id: "u2", username: "hrmo", role: "HR Officer", name: "Maria Santos" },
    { id: "u3", username: "viewer", role: "Viewer", name: "Pedro Cruz" },
  ],
  agency: {
    name: "STRH — HRIS",
    tagline: "DOH Southern Tagalog",
    shortName: "STRH",
    logoUrl: strhLogo,
    iconUrl: strhLogo,
    bannerUrl: "",
  },
};

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}
