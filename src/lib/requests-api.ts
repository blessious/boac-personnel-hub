import {
  createLeaveApplication,
  type CreateLeaveApplicationPayload,
  type LeaveApplication,
  type LeaveStatus,
} from "@/lib/leave-api";

export type RequestKind = "Leave";

export type RequestStatus = LeaveStatus;

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
  source: LeaveApplication;
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
    source: application,
  };
}

export function requestsFromLeave(applications: LeaveApplication[]) {
  return applications.map(requestFromLeave);
}

export function submitLeaveRequest(payload: CreateLeaveApplicationPayload) {
  return createLeaveApplication(payload);
}
