import { api } from "@/lib/api";

export type ReconciliationRecord = {
  employeeId: string;
  employeeNo: string;
  employeeName: string;
  employmentType: string;
  employeeStatus: string;
  legacyItemNumber: string;
  legacyPosition: string;
  legacyOrganization: string;
  classification: string;
  matchedItemId: string | null;
  matchedItemNumber: string;
  matchedPosition: string;
  matchedOrganization: string;
};

export type AssignmentSummary = {
  awaitingAssignment: number;
  scheduledMovements: number;
  expiringEngagements: number;
  unmappedOrganizations: number;
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

export const getAssignmentSummary = () => api<AssignmentSummary>("/api/assignments/summary");

export const listReconciliation = (q = "", classification = "all") =>
  api<{ records: ReconciliationRecord[]; summary: Record<string, number> }>(
    `/api/plantilla/reconciliation?q=${encodeURIComponent(q)}&classification=${encodeURIComponent(classification)}`,
  );

export const confirmReconciliation = (payload: {
  employeeId: string;
  plantillaItemId: string;
  effectiveFrom: string;
  remarks: string;
}) =>
  api<{ result: Record<string, string> }>("/api/plantilla/reconciliation", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const confirmReconciliationBulk = (payload: {
  effectiveFrom: string;
  remarks: string;
  matches: Array<{ employeeId: string; plantillaItemId: string }>;
}) =>
  api<{ results: Array<{ ok: boolean; employeeId: string; error?: string }> }>(
    "/api/plantilla/reconciliation/bulk",
    { method: "POST", body: JSON.stringify(payload) },
  );

export const listEngagements = (employeeId = "", status = "all") =>
  api<{ engagements: NonPlantillaEngagement[] }>(
    `/api/engagements?employeeId=${encodeURIComponent(employeeId)}&status=${encodeURIComponent(status)}`,
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
