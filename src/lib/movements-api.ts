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
] as const;
export type MovementStatus =
  | "Draft"
  | "Submitted"
  | "Reviewed"
  | "Approved"
  | "Scheduled"
  | "Posted"
  | "Rejected"
  | "Reversed";
export type MovementSnapshot = {
  employee?: {
    position?: string;
    department?: string;
    itemNo?: string;
    empStatus?: string;
  };
  occupancy?: {
    itemNumber?: string;
    salaryGradeId?: number | null;
  } | null;
} | null;
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
  targetOrganizationId: number | null;
  remarks: string;
  supportingDocuments: Array<{ name: string; reference: string }>;
  sourceSnapshot: MovementSnapshot;
  beforeSnapshot: MovementSnapshot;
  afterSnapshot: MovementSnapshot;
  preparedById: number | null;
  preparedBy: string;
  reviewedBy: string;
  approvedBy: string;
  postedBy: string;
  decisionRemarks: string;
  reversalReason: string;
  scheduledAt?: string | null;
  activationError?: string;
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
  targetOrganizationId: string;
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
  targetOrganizationId: "",
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
export const listMovements = (
  q = "",
  status = "all",
  actionType = "all",
  options: RequestInit = {},
  pagination: { page?: number; pageSize?: number } = {},
) =>
  api<{
    movements: Movement[];
    summary: Record<string, number>;
    actionTypes: string[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }>(
    `/api/movements?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&actionType=${encodeURIComponent(actionType)}&page=${encodeURIComponent(String(pagination.page || 1))}&pageSize=${encodeURIComponent(String(pagination.pageSize || 10))}`,
    options,
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
