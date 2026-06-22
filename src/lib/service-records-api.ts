import { api } from "@/lib/api";
export type ServiceRecord = {
  id: string;
  employeeId: string;
  serviceFrom: string;
  serviceTo: string | null;
  positionTitle: string;
  department: string;
  agency: string;
  appointmentStatus: string;
  annualSalary: number | null;
  salaryGrade: number | null;
  salaryStep: number | null;
  itemNumber: string;
  branch: string;
  leaveWithoutPay: string;
  separationDate: string | null;
  separationCause: string;
  remarks: string;
  source: "Automatic" | "Manual" | "Legacy";
  movementId: string | null;
};
export type ServiceRecordForm = {
  serviceFrom: string;
  serviceTo: string;
  positionTitle: string;
  department: string;
  agency: string;
  appointmentStatus: string;
  annualSalary: string;
  salaryGrade: string;
  salaryStep: string;
  itemNumber: string;
  branch: string;
  leaveWithoutPay: string;
  separationDate: string;
  separationCause: string;
  remarks: string;
};
export const emptyServiceRecord: ServiceRecordForm = {
  serviceFrom: "",
  serviceTo: "",
  positionTitle: "",
  department: "",
  agency: "",
  appointmentStatus: "",
  annualSalary: "",
  salaryGrade: "",
  salaryStep: "",
  itemNumber: "",
  branch: "",
  leaveWithoutPay: "",
  separationDate: "",
  separationCause: "",
  remarks: "",
};
export const getServiceRecord = (employeeId: string) =>
  api<{ employee: Record<string, unknown>; records: ServiceRecord[]; warnings: string[] }>(
    `/api/service-records/${employeeId}`,
  );
export const saveServiceRecord = (employeeId: string, form: ServiceRecordForm, id?: string) =>
  api<{ entry: ServiceRecord }>(
    id ? `/api/service-records/entries/${id}` : `/api/service-records/${employeeId}`,
    { method: id ? "PATCH" : "POST", body: JSON.stringify(form) },
  );
export const deleteServiceRecord = (id: string) =>
  api<{ ok: boolean }>(`/api/service-records/entries/${id}`, { method: "DELETE" });
export const exportServiceRecord = (employeeId: string, format: "xlsx" | "pdf") =>
  api<{ fileName: string; downloadUrl: string }>(
    `/api/service-records/${employeeId}/export/${format}`,
    { method: "POST", body: "{}" },
  );
