import { api } from "@/lib/api";

export type AssignmentSummary = {
  awaitingAssignment: number;
  scheduledMovements: number;
  expiringEngagements: number;
};

export type NonPlantillaEngagement = {
  id: string;
  employeeId: string;
  employeeNo: string;
  employeeName: string;
  engagementType: "JO" | "COS" | "Casual" | "Contractual" | "Other";
  organizationId: number;
  organization: string;
  designation: string;
  contractNumber: string;
  dateFrom: string;
  dateTo: string;
  rate: number | null;
  fundingSource: string;
  supervisor: string;
  remarks: string;
  status: "Scheduled" | "Active" | "Expired" | "Terminated" | "Renewed";
  previousEngagementId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EngagementPayload = {
  employeeId: string;
  engagementType: NonPlantillaEngagement["engagementType"];
  organizationId: string;
  designation: string;
  contractNumber: string;
  dateFrom: string;
  dateTo: string;
  rate: string;
  fundingSource: string;
  supervisor: string;
  remarks: string;
};

export const getAssignmentSummary = (options: RequestInit = {}) =>
  api<AssignmentSummary>("/api/assignments/summary", options);

export const listEngagements = (employeeId = "", status = "all", options: RequestInit = {}) =>
  api<{ engagements: NonPlantillaEngagement[] }>(
    `/api/engagements?employeeId=${encodeURIComponent(employeeId)}&status=${encodeURIComponent(status)}`,
    options,
  );

export const createEngagement = (payload: EngagementPayload) =>
  api<{ engagement: NonPlantillaEngagement }>("/api/engagements", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateEngagement = (id: string, payload: EngagementPayload) =>
  api<{ engagement: NonPlantillaEngagement }>(`/api/engagements/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const renewEngagement = (id: string, payload: Partial<EngagementPayload>) =>
  api<{ engagement: NonPlantillaEngagement }>(`/api/engagements/${id}/renew`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const terminateEngagement = (id: string, dateTo: string, remarks: string) =>
  api<{ engagement: NonPlantillaEngagement }>(`/api/engagements/${id}/terminate`, {
    method: "POST",
    body: JSON.stringify({ dateTo, remarks }),
  });
