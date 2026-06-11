import { api } from "@/lib/api";

export const EMPLOYMENT_STATUSES = [
  "Permanent",
  "Regular",
  "Job Order",
  "Casual",
  "Contractual",
] as const;
export const EMPLOYEE_LEVELS = ["First Level", "Second Level", "Third Level", "Executive"] as const;
export const GENDERS = ["Male", "Female"] as const;
export const CIVIL_STATUSES = ["Single", "Married", "Widowed", "Separated"] as const;

export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];
export type EmployeeLevel = (typeof EMPLOYEE_LEVELS)[number];
export type Gender = (typeof GENDERS)[number];
export type CivilStatus = (typeof CIVIL_STATUSES)[number];

export type EmployeeRecord = {
  id: string;
  employeeId: string;
  lastname: string;
  firstname: string;
  middlename: string;
  nameExt: string;
  department: string;
  position: string;
  status: EmploymentStatus;
  level: EmployeeLevel | "";
  statusClass: string;
  dateHired: string;
  dateEmployed: string;
  itemNo: string;
  empStatus: "Active" | "Inactive";
  birthday: string;
  gender: Gender | "";
  civilStatus: CivilStatus | "";
  citizenship: string;
  placeOfBirth: string;
  height: string;
  heightUnit: string;
  weight: string;
  weightUnit: string;
  bloodType: string;
  sss: string;
  gsis: string;
  pagibig: string;
  tin: string;
  philhealth: string;
  ctcNo: string;
  ctcPlaceIssued: string;
  ctcDateIssued: string;
  cellphoneNo: string;
  email: string;
  scheduleAmIn: string;
  scheduleAmOut: string;
  schedulePmIn: string;
  schedulePmOut: string;
  dtrSignatory: string;
  dtrNoterId: string;
  isDtrNoter: boolean;
  regular: boolean;
  residentialAddress: string;
  residentialZipcode: string;
  residentialTelNo: string;
  permanentAddress: string;
  permanentZipcode: string;
  permanentTelNo: string;
  agency: string;
  dateSeparated: string;
  veteransCode: string;
  bankAccountId: string;
  cardSerialNo: string;
  photoUrl: string;
};

export type EmployeeListResponse = {
  employees: EmployeeRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type EmployeeDetailResponse = {
  employee: EmployeeRecord;
  sections: Record<string, SectionRow[]>;
};

export type SectionRow = {
  id: string;
  payload: Record<string, string | number | boolean | null>;
  createdAt?: string;
  updatedAt?: string;
};

export type DashboardResponse = {
  totalEmployees: number;
  regularEmployees: number;
  jobOrderEmployees: number;
  byDivision: Array<{ department: string; filled: number; unfilled: number; total: number }>;
  bySexLevel: Array<{
    department: string;
    firstLevel: number;
    secondLevel: number;
    thirdLevel: number;
    male: number;
    female: number;
    total: number;
  }>;
  byPosition: Array<{
    department: string;
    position: string;
    filled: number;
    unfilled: number;
    total: number;
  }>;
  byCadre: Array<{
    department: string;
    cadre: string;
    filled: number;
    unfilled: number;
    total: number;
  }>;
  byEmploymentStatus: Array<{ status: string; active: number; inactive: number; total: number }>;
  byAgeGroup: Array<{ ageGroup: string; total: number }>;
  hiringTrend: Array<{ year: string; hired: number }>;
  generatedAt: string;
};

export type SettingsOptions = {
  departments: Array<{ id: number; name: string }>;
  positions: Array<{ id: number; title: string }>;
  salaryGrades: Array<{
    id: number;
    ordinance: string;
    grade: number;
    step: number;
    amount: number;
  }>;
};

export function listEmployees(params: {
  q?: string;
  department?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.department && params.department !== "all") query.set("department", params.department);
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  return api<EmployeeListResponse>(`/api/employees?${query.toString()}`);
}

export function getEmployee(id: string) {
  return api<EmployeeDetailResponse>(`/api/employees/${id}`);
}

export function createEmployee(employee: Partial<EmployeeRecord>) {
  return api<{ employee: EmployeeRecord }>("/api/employees", {
    method: "POST",
    body: JSON.stringify(employee),
  });
}

export function updateEmployee(id: string, employee: Partial<EmployeeRecord>) {
  return api<{ employee: EmployeeRecord }>(`/api/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(employee),
  });
}

export function deleteEmployee(id: string) {
  return api<{ ok: boolean }>(`/api/employees/${id}`, { method: "DELETE" });
}

export function createSectionRow(
  employeeId: string,
  section: string,
  payload: Record<string, unknown>,
) {
  return api<{ row: SectionRow }>(`/api/employees/${employeeId}/sections/${section}`, {
    method: "POST",
    body: JSON.stringify({ payload }),
  });
}

export function updateSectionRow(
  employeeId: string,
  section: string,
  rowId: string,
  payload: Record<string, unknown>,
) {
  return api<{ row: SectionRow }>(`/api/employees/${employeeId}/sections/${section}/${rowId}`, {
    method: "PATCH",
    body: JSON.stringify({ payload }),
  });
}

export function deleteSectionRow(employeeId: string, section: string, rowId: string) {
  return api<{ ok: boolean }>(`/api/employees/${employeeId}/sections/${section}/${rowId}`, {
    method: "DELETE",
  });
}

export function getDashboard() {
  return api<DashboardResponse>("/api/dashboard");
}

export function getSettingsOptions() {
  return api<SettingsOptions>("/api/settings");
}
