import { api } from "@/lib/api";
export const MOVEMENT_TYPES = [
  "Original Appointment",
  "Promotion",
  "Transfer",
  "Renewal",
  "Reassignment",
  "Detail",
  "Designation",
  "Job Rotation",
  "Reclassification",
  "Step Increment",
  "Resignation",
  "Retirement",
  "Termination",
  "Death",
  "Other",
] as const;
export type MovementStatus =
  | "Draft"
  | "Submitted"
  | "Reviewed"
  | "Approved"
  | "Posted"
  | "Rejected"
  | "Reversed";
export type Movement = {
  id: string;
  controlNumber: string;
  employeeId: string;
  employeeNo: string;
  employeeName: string;
  actionType: string;
  status: MovementStatus;
  effectiveDate: string;
  endDate: string | null;
  authorityNumber: string;
  authorityDate: string | null;
  targetPlantillaItemId: string | null;
  targetItemNumber: string;
  targetPositionId: number | null;
  targetPositionTitle: string;
  targetSalaryGradeId: number | null;
  targetSalaryGrade: null | { grade: number; step: number; amount: number };
  targetDepartment: string;
  remarks: string;
  supportingDocuments: Array<{ name: string; reference: string }>;
  preparedBy: string;
  reviewedBy: string;
  approvedBy: string;
  postedBy: string;
  decisionRemarks: string;
  reversalReason: string;
  createdAt: string;
  updatedAt: string;
};
export type MovementForm = {
  controlNumber: string;
  employeeId: string;
  actionType: string;
  effectiveDate: string;
  endDate: string;
  authorityNumber: string;
  authorityDate: string;
  targetPlantillaItemId: string;
  targetPositionId: string;
  targetSalaryGradeId: string;
  targetDepartment: string;
  remarks: string;
  documentsText: string;
};
export const emptyMovement: MovementForm = {
  controlNumber: "",
  employeeId: "",
  actionType: "Original Appointment",
  effectiveDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  authorityNumber: "",
  authorityDate: "",
  targetPlantillaItemId: "",
  targetPositionId: "",
  targetSalaryGradeId: "",
  targetDepartment: "",
  remarks: "",
  documentsText: "",
};
const payload = (f: MovementForm) => ({
  ...f,
  supportingDocuments: f.documentsText
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => {
      const [name, ...rest] = x.split("|");
      return { name: name.trim(), reference: rest.join("|").trim() };
    }),
});
export const listMovements = (q = "", status = "all", actionType = "all") =>
  api<{ movements: Movement[]; summary: Record<string, number>; actionTypes: string[] }>(
    `/api/movements?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&actionType=${encodeURIComponent(actionType)}`,
  );
export const saveMovement = (form: MovementForm, id?: string) =>
  api<{ movement: Movement }>(id ? `/api/movements/${id}` : "/api/movements", {
    method: id ? "PATCH" : "POST",
    body: JSON.stringify(payload(form)),
  });
export const transitionMovement = (id: string, action: string, remarks = "") =>
  api<{ movement: Movement }>(`/api/movements/${id}/${action}`, {
    method: "POST",
    body: JSON.stringify({ remarks }),
  });
