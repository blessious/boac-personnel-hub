// Mock data layer for PMIS - Municipality of Boac, Marinduque
// All data lives in-memory. Replace with Axios calls to Hono backend later.

export type EmploymentStatus =
  | "PERMANENT"
  | "CASUAL"
  | "CONTRACTUAL"
  | "COTERMINOUS"
  | "ELECTED";

export type StatusClass = "Technical" | "Administrative" | "Legislative";
export type Level = "First Level" | "Second Level" | "Executive";

export interface Employee {
  id: string;
  refId: string;
  lastname: string;
  firstname: string;
  middlename: string;
  nameExt?: string;
  department: string;
  position: string;
  status: EmploymentStatus;
  level: Level;
  statusClass: StatusClass;
  dateEmployed: string;
  empStatus: "Employed" | "Not Employed";
  itemNo?: string;
  veteransCode?: string;
  bankAccountId?: string;
  cardSerialNo?: string;
  placeOfBirth?: string;
  birthday: string;
  gender: "Male" | "Female";
  civilStatus: "Single" | "Married" | "Widowed" | "Separated";
  citizenship: "Filipino" | "Foreigner";
  height?: string;
  heightUnit?: "M" | "FT";
  weight?: string;
  weightUnit?: "KL" | "LB";
  bloodType?: string;
  sss?: string;
  gsis?: string;
  pagibig?: string;
  tin?: string;
  philhealth?: string;
  ctcNo?: string;
  ctcPlaceIssued?: string;
  ctcDateIssued?: string;
  cellphoneNo?: string;
  email?: string;
  residentialAddress?: string;
  residentialZipcode?: string;
  residentialTelNo?: string;
  permanentAddress?: string;
  permanentZipcode?: string;
  permanentTelNo?: string;
  agency?: string;
  dateSeparated?: string;
  photoUrl?: string;
}

export const DEPARTMENTS = [
  "Office of the Mayor",
  "Office of the Vice Mayor",
  "Sangguniang Bayan",
  "Human Resource Mgmt. Office",
  "Municipal Treasurer's Office",
  "Municipal Assessor's Office",
  "Municipal Accountant's Office",
  "Municipal Budget Office",
  "Municipal Planning & Dev't Office",
  "Municipal Civil Registrar",
  "Municipal Engineering Office",
  "Municipal Health Office",
  "Municipal Social Welfare & Dev't",
  "Municipal Agriculture Office",
  "MDRRMO",
  "BPLO",
  "GSO",
];

export const POSITIONS = [
  "Municipal Mayor",
  "Vice Mayor",
  "Sangguniang Bayan Member",
  "Department Head",
  "Administrative Officer V",
  "Administrative Officer III",
  "Administrative Aide VI",
  "Administrative Aide IV",
  "Administrative Aide I",
  "Engineer III",
  "Engineer II",
  "Nurse II",
  "Midwife I",
  "Agricultural Technologist",
  "Social Welfare Officer II",
  "Revenue Collection Clerk II",
  "Accountant I",
  "Local Treasury Operations Officer",
  "Driver I",
  "Utility Worker I",
];

export const SALARY_GRADES = Array.from({ length: 33 }, (_, i) => i + 1);
export const SALARY_STEPS = Array.from({ length: 8 }, (_, i) => i + 1);

// Approximate SSL salary base (₱) per grade step 1
export const SALARY_TABLE: Record<number, number[]> = {};
for (const g of SALARY_GRADES) {
  const base = 13000 + g * 1850;
  SALARY_TABLE[g] = Array.from({ length: 8 }, (_, s) => Math.round(base * (1 + s * 0.018)));
}

const FIRST = ["Juan", "Maria", "Jose", "Ana", "Pedro", "Liza", "Mark", "Grace", "Ramon", "Cristina", "Antonio", "Rosa", "Eduardo", "Luz", "Manuel", "Teresa", "Roberto", "Imelda", "Carlos", "Divina"];
const LAST = ["Reyes", "Santos", "Cruz", "Garcia", "Mercado", "Bautista", "Villanueva", "Aquino", "Mendoza", "Dela Cruz", "Rivera", "Castillo", "Pangilinan", "Salazar", "Lopez", "Domingo", "Tolentino", "Marasigan", "Nieto", "Solis"];
const MIDDLE = ["Lim", "Tan", "Co", "Ong", "Sy", "Yap", "Uy", "Chan", "Lee", "Ang"];

const seed = (n: number) => {
  let x = n + 1;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
};

export function generateEmployees(count = 47): Employee[] {
  const rnd = seed(7);
  const list: Employee[] = [];
  for (let i = 0; i < count; i++) {
    const ln = LAST[Math.floor(rnd() * LAST.length)];
    const fn = FIRST[Math.floor(rnd() * FIRST.length)];
    const mn = MIDDLE[Math.floor(rnd() * MIDDLE.length)];
    const dept = DEPARTMENTS[Math.floor(rnd() * DEPARTMENTS.length)];
    const pos = POSITIONS[Math.floor(rnd() * POSITIONS.length)];
    const statusPool: EmploymentStatus[] = ["PERMANENT", "PERMANENT", "PERMANENT", "CASUAL", "CONTRACTUAL", "COTERMINOUS", "ELECTED"];
    const status = statusPool[Math.floor(rnd() * statusPool.length)];
    const year = 2005 + Math.floor(rnd() * 20);
    const month = 1 + Math.floor(rnd() * 12);
    const day = 1 + Math.floor(rnd() * 27);
    const id = `${1000 + i}`;
    list.push({
      id,
      refId: `EMP-${id}`,
      lastname: ln,
      firstname: fn,
      middlename: mn,
      department: dept,
      position: pos,
      status,
      level: rnd() > 0.6 ? "Second Level" : "First Level",
      statusClass: rnd() > 0.5 ? "Administrative" : rnd() > 0.5 ? "Technical" : "Legislative",
      dateEmployed: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      empStatus: "Employed",
      itemNo: `OSEC-DBM-A-${10 + i}`,
      birthday: `${1965 + Math.floor(rnd() * 35)}-${String(1 + Math.floor(rnd() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rnd() * 27)).padStart(2, "0")}`,
      gender: rnd() > 0.5 ? "Male" : "Female",
      civilStatus: rnd() > 0.5 ? "Married" : "Single",
      citizenship: "Filipino",
      bloodType: ["A+", "B+", "O+", "AB+", "O-"][Math.floor(rnd() * 5)],
      cellphoneNo: `0917${Math.floor(1000000 + rnd() * 8999999)}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase().replace(/\s/g, "")}@agency.gov.ph`,
      residentialAddress: `Brgy. ${["Poblacion", "Mercado", "Caganhao", "Tanza", "Boi", "Murallon"][Math.floor(rnd() * 6)]}, Boac, Marinduque`,
      residentialZipcode: "4900",
      permanentAddress: `Brgy. Poblacion, Boac, Marinduque`,
      permanentZipcode: "4900",
    });
  }
  return list;
}

export const EMPLOYEES = generateEmployees();

// --- Sub-record stores keyed by employee id ---
export interface FamilyRecord {
  spouse: { lastname: string; firstname: string; middlename: string; occupation: string; employer: string; businessTel: string; businessAddress: string };
  father: { lastname: string; firstname: string; middlename: string };
  mother: { lastname: string; firstname: string; middlename: string };
}
export interface ChildRecord { id: string; lastname: string; firstname: string; middlename: string; gender: "Male" | "Female"; birthday: string }
export interface EducationRecord { id: string; level: string; school: string; degree: string; yearFrom: string; yearTo: string; yearGraduated: string; scholarship: string }
export interface CivilServiceRecord { id: string; type: string; place: string; date: string; rating: string; license: string; dateRelease: string }
export interface WorkRecord { id: string; position: string; company: string; status: string; dateFrom: string; dateTo: string; salary: string; govEmp: "YES" | "NO" }
export interface OrgRecord { id: string; name: string; position: string; address: string; yearFrom: string; yearTo: string; hours: string }
export interface TrainingRecord { id: string; name: string; conductedBy: string; yearFrom: string; yearTo: string; hours: string; file?: string }
export interface SalaryRecord { id: string; date: string; description: string; ordinance: string; grade: number; step: number; tax: string; amount: number; gross: number; type: "Step Increment" | "Not Step Increment"; pera: number; rata: number; cata: number }
export interface ServiceRecord { id: string; from: string; to: string; status: string; salary: string; designation: string; department: string; assignment: string; branch: string; leave: string; sepDate: string; sepCause: string }
export interface LeaveRecord { id: string; type: string; period: string; particulars: string; vlEarned: number; vlAbsWP: number; vlBalance: number; vlAbsWOP: number; slEarned: number; slAbsWP: number; slBalance: number; slAbsWOP: number; dateAction: string; employeeId: string }
export interface IPCRRecord { id: string; month: string; from: string; to: string; remarks: string; grades: string; file?: string }

interface Store {
  family: Record<string, FamilyRecord>;
  children: Record<string, ChildRecord[]>;
  education: Record<string, EducationRecord[]>;
  civilService: Record<string, CivilServiceRecord[]>;
  work: Record<string, WorkRecord[]>;
  org: Record<string, OrgRecord[]>;
  training: Record<string, TrainingRecord[]>;
  salary: Record<string, SalaryRecord[]>;
  service: Record<string, ServiceRecord[]>;
  leave: Record<string, LeaveRecord[]>;
  ipcr: Record<string, IPCRRecord[]>;
}

const empty = (): Store => ({
  family: {}, children: {}, education: {}, civilService: {},
  work: {}, org: {}, training: {}, salary: {}, service: {}, leave: {}, ipcr: {},
});

export const STORE: Store = empty();

// Seed some leave records
EMPLOYEES.slice(0, 12).forEach((e, idx) => {
  STORE.leave[e.id] = [{
    id: `L${idx}`,
    employeeId: e.id,
    type: idx % 2 ? "Sick Leave" : "Vacation Leave",
    period: "2025-01-01 to 2025-12-31",
    particulars: "Annual entitlement",
    vlEarned: 15, vlAbsWP: 3, vlBalance: 12, vlAbsWOP: 0,
    slEarned: 15, slAbsWP: 2, slBalance: 13, slAbsWOP: 0,
    dateAction: "2025-01-15",
  }];
});

// Departments / Positions / Salary table mutable for Settings
export const SETTINGS = {
  departments: [...DEPARTMENTS],
  positions: [...POSITIONS],
  salaryGrades: SALARY_GRADES.flatMap((g) =>
    SALARY_STEPS.map((s) => ({ ordinance: "Annex 1", grade: g, step: s, amount: SALARY_TABLE[g][s - 1] }))
  ),
  users: [
    { id: "u1", username: "admin", role: "Admin", name: "Brooklyn Simmons" },
    { id: "u2", username: "hr", role: "HR Officer", name: "Maria Santos" },
    { id: "u3", username: "viewer", role: "Viewer", name: "Pedro Cruz" },
  ],
  agency: {
    name: "Agency Name",
    tagline: "Organization Subtitle",
    logoUrl: "",
    iconUrl: "",
    bannerUrl: "",
  },
};

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}
