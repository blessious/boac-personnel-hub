import { api } from "@/lib/api";

export type ScheduleEmployee = {
  employeeId: string;
  employeeNo: string;
  employeeName: string;
  lastname: string;
  firstname: string;
  department: string;
  organizationUnitId: number | null;
  organizationUnitName: string;
  organizationPath: string[];
  position: string;
  empStatus: string;
  scheduleAmIn: string;
  scheduleAmOut: string;
  schedulePmIn: string;
  schedulePmOut: string;
  overrideCount: number;
};

export type ScheduleOverride = {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  workDate: string;
  amIn: string;
  amOut: string;
  pmIn: string;
  pmOut: string;
  shiftTemplateId: string;
  shiftCode: string;
  shiftName: string;
  updatedAt: string;
};

export type ShiftTemplate = {
  id: string;
  code: string;
  name: string;
  shiftType: "split" | "straight" | "night";
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  active: boolean;
};

export type ScheduleListResponse = {
  employees: ScheduleEmployee[];
  overrides: ScheduleOverride[];
  departments: string[];
  shiftTemplates: ShiftTemplate[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type ScheduleOverrideListResponse = {
  overrides: ScheduleOverride[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type ScheduleMutationResponse = {
  ok: boolean;
  updated: number;
  refreshed: { recordsProcessed: number; punchesProcessed: number; warnings?: string[] };
  warnings: string[];
};

export type ScheduleFilterSelection = {
  allFiltered: true;
  filters: {
    q?: string;
    department?: string;
    orgUnitId?: string;
    empStatus?: string;
  };
};

export function listSchedules(params: {
  q?: string;
  department?: string;
  orgUnitId?: string;
  empStatus?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.department && params.department !== "all") query.set("department", params.department);
  if (params.orgUnitId && params.orgUnitId !== "all") query.set("orgUnitId", params.orgUnitId);
  if (params.empStatus && params.empStatus !== "all") query.set("empStatus", params.empStatus);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  return api<ScheduleListResponse>(`/api/attendance/schedules?${query.toString()}`);
}

export function updateDefaultSchedules(payload: {
  employeeIds?: string[];
  selection?: ScheduleFilterSelection;
  shiftTemplateCode?: string;
  from: string;
  to: string;
  schedule: { amIn: string; amOut: string; pmIn: string; pmOut: string };
}) {
  return api<ScheduleMutationResponse>("/api/attendance/schedule/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateScheduleOverrides(payload: {
  employeeIds?: string[];
  selection?: ScheduleFilterSelection;
  startDate: string;
  endDate: string;
  skipWeekends: boolean;
  shiftTemplateCode?: string;
  schedule: { amIn: string; amOut: string; pmIn: string; pmOut: string };
}) {
  return api<ScheduleMutationResponse>("/api/attendance/schedule/overrides", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listScheduleOverrides(params: {
  q?: string;
  department?: string;
  orgUnitId?: string;
  empStatus?: string;
  from: string;
  to: string;
  page?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.department && params.department !== "all") query.set("department", params.department);
  if (params.orgUnitId && params.orgUnitId !== "all") query.set("orgUnitId", params.orgUnitId);
  if (params.empStatus && params.empStatus !== "all") query.set("empStatus", params.empStatus);
  query.set("from", params.from);
  query.set("to", params.to);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  return api<ScheduleOverrideListResponse>(
    `/api/attendance/schedule/overrides?${query.toString()}`,
  );
}

export function deleteScheduleOverride(employeeId: string, workDate: string) {
  return api<ScheduleMutationResponse & { deleted: number }>(
    `/api/attendance/schedule/overrides/${employeeId}/${workDate}`,
    { method: "DELETE" },
  );
}
