import {
  createLeaveApplication,
  type CreateLeaveApplicationPayload,
  type LeaveApplication,
  type LeaveStatus,
} from "@/lib/leave-api";
import type { DtrCorrectionRequest } from "@/lib/attendance-api";

export type RequestKind = "Leave" | "DTR Correction" | "DTR Label";

export type RequestStatus = LeaveStatus | "Reversed";

export type RequestRecord = {
  id: string;
  kind: RequestKind;
  title: string;
  status: RequestStatus;
  submittedAt: string;
  dateFrom: string;
  dateTo: string;
  details: string;
  remarks: string;
  metricLabel: string;
  metricValue: string;
  source: LeaveApplication | DtrCorrectionRequest;
};

export function requestFromLeave(application: LeaveApplication): RequestRecord {
  return {
    id: application.id,
    kind: "Leave",
    title: application.leaveName,
    status: application.status,
    submittedAt: application.createdAt,
    dateFrom: application.dateFrom,
    dateTo: application.dateTo,
    details: application.reason,
    remarks: application.decisionRemarks,
    metricLabel: "Days",
    metricValue: formatNumber(application.daysRequested),
    source: application,
  };
}

export function requestFromDtrCorrection(request: DtrCorrectionRequest): RequestRecord {
  const isLabel = request.requestType === "Label";
  return {
    id: request.id,
    kind: isLabel ? "DTR Label" : "DTR Correction",
    title: isLabel ? request.requested.label : "Time correction",
    status: request.status,
    submittedAt: request.createdAt,
    dateFrom: request.workDate,
    dateTo: request.workDate,
    details: request.reason,
    remarks: request.reviewRemarks,
    metricLabel: "Type",
    metricValue: isLabel ? "Label" : "Times",
    source: request,
  };
}

export function requestsFromDtrCorrections(requests: DtrCorrectionRequest[]) {
  return requests.map(requestFromDtrCorrection);
}

export function requestsFromLeave(applications: LeaveApplication[]) {
  return applications.map(requestFromLeave);
}

export function submitLeaveRequest(payload: CreateLeaveApplicationPayload) {
  return createLeaveApplication(payload);
}

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}
