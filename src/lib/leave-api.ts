import { api } from "@/lib/api";
import type { EmployeeRecord } from "@/lib/employees-api";

export type LeaveStatus = "Pending" | "Approved" | "Disapproved" | "Cancelled";

export type LeaveType = {
  id: number;
  code: string;
  name: string;
  isPaid: boolean;
  isCreditBased: boolean;
  creditGroup: string;
  maxDays: number | null;
  advanceNoticeDays: number | null;
  legalBasis: string;
  filingRule: string;
  requirements: string[];
  detailSchema: string[];
  isActive: boolean;
  sortOrder: number;
};

export type LeaveBalance = {
  id: number;
  employeeId: string;
  leaveTypeId: number;
  code: string;
  name: string;
  balance: number;
  earned: number;
  used: number;
  adjusted: number;
  updatedAt: string;
};

export type LeaveApplication = {
  id: string;
  employeeId: string;
  employeeNo: string;
  employeeName: string;
  department: string;
  position: string;
  leaveTypeId: number;
  leaveCode: string;
  leaveName: string;
  dateFrom: string;
  dateTo: string;
  daysRequested: number;
  reason: string;
  salarySnapshot: number | null;
  detailLocationType: string;
  detailLocationText: string;
  detailSickType: string;
  detailIllness: string;
  detailStudyPurpose: string;
  detailOtherPurpose: string;
  detailOtherText: string;
  commutationRequested: boolean;
  requirementsPayload: Record<string, unknown>;
  formPayload: Record<string, unknown>;
  recommendationStatus: string;
  recommendationReason: string;
  recommendedByName: string;
  recommendedAt: string | null;
  approvedDaysWithPay: number | null;
  approvedDaysWithoutPay: number | null;
  approvedDaysOther: number | null;
  approvedDaysOtherText: string;
  finalDisapprovalReason: string;
  status: LeaveStatus;
  approverName: string;
  decisionRemarks: string;
  decidedAt: string | null;
  createdAt: string;
};

export type LeaveAdjustment = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  code: string;
  name: string;
  createdByName: string;
};

export type EmployeeLeaveResponse = {
  employee: EmployeeRecord;
  balances: LeaveBalance[];
  applications: LeaveApplication[];
  adjustments: LeaveAdjustment[];
};

export type CreateLeaveApplicationPayload = {
  employeeId: string;
  leaveTypeId: number;
  dateFrom: string;
  dateTo: string;
  daysRequested: number;
  reason: string;
  salarySnapshot?: number | null;
  detailLocationType?: string;
  detailLocationText?: string;
  detailSickType?: string;
  detailIllness?: string;
  detailStudyPurpose?: string;
  detailOtherPurpose?: string;
  detailOtherText?: string;
  commutationRequested?: boolean;
  requirementsPayload?: Record<string, unknown>;
  formPayload?: Record<string, unknown>;
};

export function listLeaveTypes() {
  return api<{ leaveTypes: LeaveType[] }>("/api/leave/types");
}

export function createLeaveType(payload: { code: string; name: string; isPaid: boolean }) {
  return api<{ leaveType: LeaveType }>("/api/leave/types", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listLeaveApplications(params: { status?: string; q?: string } = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  return api<{
    applications: LeaveApplication[];
    summary: {
      total: number;
      pending: number;
      approved: number;
      disapproved: number;
      cancelled: number;
    };
  }>(`/api/leave/applications?${query.toString()}`);
}

export function createLeaveApplication(payload: CreateLeaveApplicationPayload) {
  return api<{ application: LeaveApplication }>("/api/leave/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function decideLeaveApplication(
  id: string,
  payload: {
    status: Exclude<LeaveStatus, "Pending">;
    remarks: string;
    approvedDaysWithPay?: number | null;
    approvedDaysWithoutPay?: number | null;
    approvedDaysOther?: number | null;
    approvedDaysOtherText?: string;
    finalDisapprovalReason?: string;
  },
) {
  return api<{ application: LeaveApplication }>(`/api/leave/applications/${id}/decision`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteLeaveApplication(id: string) {
  return api<{ ok: boolean }>(`/api/leave/applications/${id}`, { method: "DELETE" });
}

export function generateLeaveForm6Excel(id: string) {
  return api<{ fileName: string; downloadUrl: string }>(
    `/api/leave/applications/${id}/form6/excel`,
    { method: "POST" },
  );
}

export function generateLeaveForm6Pdf(id: string) {
  return api<{ fileName: string; previewUrl: string }>(
    `/api/leave/applications/${id}/form6/pdf`,
    { method: "POST" },
  );
}

export function getEmployeeLeave(employeeId: string) {
  return api<EmployeeLeaveResponse>(`/api/employees/${employeeId}/leave`);
}

export function createLeaveAdjustment(
  employeeId: string,
  payload: { leaveTypeId: number; amount: number; reason: string },
) {
  return api<EmployeeLeaveResponse>(`/api/employees/${employeeId}/leave/adjustments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
