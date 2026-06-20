import { api } from "@/lib/api";

export type DtrEntry = {
  id: string;
  employeeId: string;
  employeeNo: string;
  biometricId: string;
  employeeName: string;
  department: string;
  position: string;
  workDate: string;
  amIn: string;
  amOut: string;
  pmIn: string;
  pmOut: string;
  status: string;
  lateMinutes: number;
  undertimeMinutes: number;
  source: "Imported" | "Manual" | "Adjusted";
  remarks: string;
  displayLabel: string;
  displayLabelRequestId: string;
  locked: boolean;
  importId: string;
  editedByName: string;
  editedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type DtrCorrectionStatus = "Pending" | "Approved" | "Disapproved" | "Cancelled" | "Reversed";

export type DtrCorrectionEvent = {
  id: string;
  eventType: "Filed" | "Approved" | "Disapproved" | "Cancelled" | "Reversed";
  fromStatus: string;
  toStatus: string;
  actorName: string;
  remarks: string;
  ipAddress: string;
  original: Record<string, unknown> | null;
  requested: Record<string, unknown> | null;
  applied: Record<string, unknown> | null;
  createdAt: string;
};

export type DtrCorrectionRequest = {
  id: string;
  employeeId: string;
  employeeNo: string;
  employeeName: string;
  department: string;
  dtrEntryId: string;
  workDate: string;
  requestType: "Times" | "Label";
  original: { amIn: string; amOut: string; pmIn: string; pmOut: string; label: string };
  requested: { amIn: string; amOut: string; pmIn: string; pmOut: string; label: string };
  applied: {
    amIn: string;
    amOut: string;
    pmIn: string;
    pmOut: string;
    label: string;
    status: string;
    remarks: string;
  };
  reason: string;
  status: DtrCorrectionStatus;
  createdByName: string;
  requestIp: string;
  reviewRemarks: string;
  reviewedByName: string;
  reviewIp: string;
  reviewedAt: string;
  reverseReason: string;
  reversedByName: string;
  reversalIp: string;
  reversedAt: string;
  events: DtrCorrectionEvent[];
  createdAt: string;
  updatedAt: string;
};

export type DtrCorrectionPayload = {
  employeeId?: string;
  workDate: string;
  requestType: "Times" | "Label";
  amIn?: string;
  amOut?: string;
  pmIn?: string;
  pmOut?: string;
  label?: string;
  reason: string;
};

export type AttendanceImport = {
  id: string;
  source: string;
  fileName: string;
  periodFrom: string;
  periodTo: string;
  rowCount: number;
  status: string;
  notes: string;
  importedByName: string;
  importedAt: string;
};

export type DtrListResponse = {
  entries: DtrEntry[];
  imports: AttendanceImport[];
  summary: {
    total: number;
    present: number;
    incomplete: number;
    lateMinutes: number;
  };
};

export type DtrPayload = {
  id?: string;
  employeeDbId?: string;
  employeeId?: string;
  employeeNo?: string;
  workDate: string;
  amIn?: string;
  amOut?: string;
  pmIn?: string;
  pmOut?: string;
  status?: string;
  remarks?: string;
};

export type DtrNoter = {
  id: string;
  name: string;
  position: string;
  office: string;
  signatory: string;
  isActive: boolean;
};

export type BiometricDevice = {
  id: string;
  biometric_id: number;
  name: string;
  ip_address: string;
  port: number;
  active: boolean;
};

export type BiometricRealtimeLog = {
  time: string;
  level: "info" | "success" | "warn" | "error" | string;
  message: string;
};

export type BiometricRealtimeStatus = {
  status: {
    status: "idle" | "syncing" | "success" | "failed" | string;
    mode: string;
    admsPort: number;
    lastSyncTime: string | null;
    syncStartTime: string | null;
    durationMs: number | null;
    elapsedMs: number | null;
    recordsFetched: number;
    recordsInserted: number;
    devicesProcessed: number;
    error: string | null;
  };
  queue: {
    pendingEmployees: number;
    running: boolean;
  };
  devices: BiometricDevice[];
};

export function listDtr(params: { employeeId?: string; from?: string; to?: string; q?: string }) {
  const query = new URLSearchParams();
  if (params.employeeId) query.set("employeeId", params.employeeId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.q) query.set("q", params.q);
  return api<DtrListResponse>(`/api/attendance/dtr?${query.toString()}`);
}

export function createDtr(payload: DtrPayload) {
  return api<{ entry: DtrEntry }>("/api/attendance/dtr", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDtr(id: string, payload: DtrPayload) {
  return api<{ entry: DtrEntry }>(`/api/attendance/dtr/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteDtr(id: string) {
  return api<{ ok: boolean }>(`/api/attendance/dtr/${id}`, { method: "DELETE" });
}

export function listDtrCorrectionRequests(
  params: {
    employeeId?: string;
    status?: DtrCorrectionStatus;
    requestType?: "Times" | "Label";
    reviewerId?: string;
    q?: string;
    from?: string;
    to?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.employeeId) query.set("employeeId", params.employeeId);
  if (params.status) query.set("status", params.status);
  if (params.requestType) query.set("requestType", params.requestType);
  if (params.reviewerId) query.set("reviewerId", params.reviewerId);
  if (params.q) query.set("q", params.q);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  return api<{ requests: DtrCorrectionRequest[] }>(
    `/api/attendance/correction-requests?${query.toString()}`,
  );
}

export function createDtrCorrectionRequest(payload: DtrCorrectionPayload) {
  return api<{ request: DtrCorrectionRequest }>("/api/attendance/correction-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function decideDtrCorrectionRequest(
  id: string,
  payload: { status: "Approved" | "Disapproved"; reviewRemarks?: string },
) {
  return api<{ request: DtrCorrectionRequest }>(
    `/api/attendance/correction-requests/${id}/decision`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function cancelDtrCorrectionRequest(id: string) {
  return api<{ ok: boolean }>(`/api/attendance/correction-requests/${id}/cancel`, {
    method: "POST",
  });
}

export function reverseDtrCorrectionRequest(id: string, reason: string) {
  return api<{ request: DtrCorrectionRequest }>(
    `/api/attendance/correction-requests/${id}/reverse`,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
}

export function importDtrRows(payload: {
  fileName: string;
  source?: "CSV" | "Legacy";
  rows: DtrPayload[];
  notes?: string;
}) {
  return api<{ importId: string; imported: number; errors: string[] }>("/api/attendance/import", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function importDtrFile(payload: {
  fileName: string;
  fileBase64: string;
  employeeId?: string;
  from?: string;
  to?: string;
  origin?: string;
  notes?: string;
}) {
  return api<{
    importId: string;
    imported: number;
    errors: string[];
    refreshed: { recordsProcessed: number; punchesProcessed: number };
  }>("/api/attendance/import-file", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function importAllDtr(payload: {
  source: "file" | "biometric";
  biometricId?: string;
  fileName?: string;
  fileBase64?: string;
  startDate: string;
  endDate: string;
}) {
  return api<{
    message: string;
    importId: string;
    records_imported: number;
    imported: number;
    errors: string[];
    refreshed: { recordsProcessed: number; punchesProcessed: number };
  }>("/api/attendance/import-all", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function importSingleDtr(payload: {
  source: "file" | "biometric";
  employeeId: string;
  biometricId?: string;
  fileName?: string;
  fileBase64?: string;
  startDate: string;
  endDate: string;
}) {
  return api<{
    message: string;
    importId: string;
    records_imported: number;
    imported: number;
    errors: string[];
    refreshed: { recordsProcessed: number; punchesProcessed: number };
  }>("/api/attendance/import-single-dtr", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function refreshDtr(params: { employeeId?: string; from?: string; to?: string }) {
  return api<{ recordsProcessed: number; punchesProcessed: number }>("/api/attendance/refresh", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function listDtrNoters() {
  return api<{ noters: DtrNoter[] }>("/api/attendance/noters");
}

export function createDtrNoter(payload: {
  name: string;
  position: string;
  office?: string;
  signatory: string;
}) {
  return api<{ noter: DtrNoter }>("/api/attendance/noters", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listBiometricDevices() {
  return api<{ devices: BiometricDevice[] }>("/api/attendance/biometrics");
}

export function createBiometricDevice(payload: {
  name: string;
  ip_address: string;
  port: number;
  active: boolean;
}) {
  return api<{ device: BiometricDevice }>("/api/attendance/biometrics", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBiometricDevice(
  id: string,
  payload: { name: string; ip_address: string; port: number; active: boolean },
) {
  return api<{ device: BiometricDevice }>(`/api/attendance/biometrics/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteBiometricDevice(id: string) {
  return api<{ ok: boolean }>(`/api/attendance/biometrics/${id}`, { method: "DELETE" });
}

export function checkBiometricStatus(payload: { ip_address: string; port: number }) {
  return api<{ online: boolean; status: "online" | "offline" }>(
    "/api/attendance/biometrics/check-status",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function getBiometricRealtimeStatus() {
  return api<BiometricRealtimeStatus>("/api/attendance/biometrics/realtime/status");
}

export function getBiometricRealtimeLogs(since = 0) {
  return api<{ logs: BiometricRealtimeLog[]; total: number }>(
    `/api/attendance/biometrics/realtime/logs?since=${since}`,
  );
}

export function syncBiometricNow(payload: { deviceId?: string; from?: string; to?: string }) {
  return api<{
    status: BiometricRealtimeStatus["status"];
    recordsFetched: number;
    recordsInserted: number;
    devicesProcessed: number;
    errors: string[];
  }>("/api/attendance/biometrics/realtime/sync-now", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function checkUnimportedDtrs(employeeId: string) {
  return api<{ count: number }>(`/api/attendance/check-unimported-dtrs/${employeeId}`);
}

export function bulkUpdateSchedule(payload: {
  employeeIds: string[];
  schedule: { amIn: string; amOut: string; pmIn: string; pmOut: string };
}) {
  return api<{ ok: boolean; updated: number }>("/api/attendance/schedule/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function bulkUpdateScheduleOverrides(payload: {
  employeeIds: string[];
  startDate: string;
  endDate: string;
  skipWeekends: boolean;
  schedule: { amIn: string; amOut: string; pmIn: string; pmOut: string };
}) {
  return api<{ ok: boolean; updated: number }>("/api/attendance/schedule/overrides", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateDtrExcel(payload: {
  employeeId: string;
  noterSignatory: string;
  noterPosition: string;
  periods: Array<{ from: string; to: string }>;
  firstStartDate?: string;
  firstEndDate?: string;
  secondStartDate?: string;
  secondEndDate?: string;
}) {
  return api<{ fileName: string; downloadUrl: string; rowCount: number }>(
    "/api/attendance/dtr/excel",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function generateDtrPdf(payload: {
  employeeId: string;
  noterSignatory: string;
  noterPosition: string;
  periods: Array<{ from: string; to: string }>;
  firstStartDate?: string;
  firstEndDate?: string;
  secondStartDate?: string;
  secondEndDate?: string;
}) {
  return api<{ fileName: string; previewUrl: string; rowCount: number }>(
    "/api/attendance/dtr/pdf",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function openGeneratedFile(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function downloadGeneratedFile(downloadUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.click();
}

export async function downloadDtrCsv(params: {
  employeeId?: string;
  from?: string;
  to?: string;
  mass?: boolean;
}) {
  const query = new URLSearchParams();
  if (params.employeeId) query.set("employeeId", params.employeeId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  const path = params.mass ? "/api/attendance/export/mass" : "/api/attendance/export";
  const response = await fetch(`${path}?${query.toString()}`, { credentials: "include" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Unable to export DTR");
  }
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const fileName = disposition.match(/filename="([^"]+)"/)?.[1] || "dtr-export.csv";
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
