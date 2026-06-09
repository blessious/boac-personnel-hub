import { api } from "@/lib/api";

export type DtrEntry = {
  id: string;
  employeeId: string;
  employeeNo: string;
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
  locked: boolean;
  importId: string;
  editedByName: string;
  editedAt: string;
  createdAt: string;
  updatedAt: string;
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

export function refreshDtr(params: { employeeId?: string; from?: string; to?: string }) {
  return api<{ recordsProcessed: number; punchesProcessed: number }>("/api/attendance/refresh", {
    method: "POST",
    body: JSON.stringify(params),
  });
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
