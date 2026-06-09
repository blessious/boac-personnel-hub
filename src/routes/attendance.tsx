import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Download,
  FileDown,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createDtr,
  deleteDtr,
  downloadDtrCsv,
  importDtrRows,
  listDtr,
  refreshDtr,
  updateDtr,
  type DtrEntry,
  type DtrPayload,
} from "@/lib/attendance-api";
import { useAuth } from "@/lib/auth";
import { listEmployees, type EmployeeRecord } from "@/lib/employees-api";

export const Route = createFileRoute("/attendance")({
  component: AttendancePage,
});

const today = new Date();
const DEFAULT_FROM = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
const DEFAULT_TO = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  .toISOString()
  .slice(0, 10);

const EMPTY_DTR_FORM: DtrPayload = {
  employeeDbId: "",
  workDate: new Date().toISOString().slice(0, 10),
  amIn: "",
  amOut: "",
  pmIn: "",
  pmOut: "",
  remarks: "",
};

const STATUS_CLASS: Record<string, string> = {
  Present: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Late: "border-amber-200 bg-amber-50 text-amber-700",
  Incomplete: "border-orange-200 bg-orange-50 text-orange-700",
  Absent: "border-rose-200 bg-rose-50 text-rose-700",
};

function AttendancePage() {
  const { user } = useAuth();
  const canManage = user?.role === "Admin" || user?.role === "HR";
  const isEmployee = user?.role === "Employee";
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
  const [q, setQ] = useState("");
  const [employeeId, setEmployeeId] = useState("all");
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [entries, setEntries] = useState<DtrEntry[]>([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, incomplete: 0, lateMinutes: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showDtrDialog, setShowDtrDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editing, setEditing] = useState<DtrEntry | null>(null);
  const [form, setForm] = useState<DtrPayload>(EMPTY_DTR_FORM);
  const [importFileName, setImportFileName] = useState("");
  const [importText, setImportText] = useState("");

  const selectedEmployeeId = isEmployee
    ? user?.employeeId || ""
    : employeeId === "all"
      ? ""
      : employeeId;

  const load = () => {
    setLoading(true);
    listDtr({ employeeId: selectedEmployeeId, from, to, q: isEmployee ? "" : q })
      .then((result) => {
        setEntries(result.entries);
        setSummary(result.summary);
      })
      .catch((err) => toast.error(err.message || "Unable to load DTR"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [selectedEmployeeId, from, to, q, isEmployee]);

  useEffect(() => {
    if (!canManage && user?.role !== "Viewer") return;
    listEmployees({ pageSize: 200 })
      .then((result) => setEmployees(result.employees))
      .catch(() => setEmployees([]));
  }, [canManage, user?.role]);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        id: employee.id,
        label: `${employee.lastname}, ${employee.firstname} (${employee.employeeId})`,
      })),
    [employees],
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_DTR_FORM, employeeDbId: employeeId === "all" ? "" : employeeId });
    setShowDtrDialog(true);
  };

  const openEdit = (entry: DtrEntry) => {
    setEditing(entry);
    setForm({
      employeeDbId: entry.employeeId,
      employeeId: entry.employeeNo,
      workDate: entry.workDate,
      amIn: entry.amIn,
      amOut: entry.amOut,
      pmIn: entry.pmIn,
      pmOut: entry.pmOut,
      remarks: entry.remarks,
    });
    setShowDtrDialog(true);
  };

  const saveDtr = async () => {
    if (!form.employeeDbId && !form.employeeId && !form.employeeNo) {
      toast.error("Select an employee first");
      return;
    }
    if (!form.workDate) {
      toast.error("Select a DTR date");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await updateDtr(editing.id, form);
        toast.success("DTR updated");
      } else {
        await createDtr(form);
        toast.success("DTR added");
      }
      setShowDtrDialog(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save DTR");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (entry: DtrEntry) => {
    if (!window.confirm(`Delete DTR for ${entry.employeeName} on ${entry.workDate}?`)) return;
    try {
      await deleteDtr(entry.id);
      toast.success("DTR deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete DTR");
    }
  };

  const refresh = async () => {
    setBusy(true);
    try {
      const result = await refreshDtr({ employeeId: selectedEmployeeId, from, to });
      toast.success(`DTR refreshed: ${result.recordsProcessed} day record(s) processed`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to refresh DTR");
    } finally {
      setBusy(false);
    }
  };

  const exportRows = async (mass = false) => {
    try {
      await downloadDtrCsv({ employeeId: selectedEmployeeId, from, to, mass });
      toast.success(mass ? "Mass export downloaded" : "DTR export downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to export DTR");
    }
  };

  const importRows = async () => {
    const rows = parseImportRows(importText);
    if (!rows.length) {
      toast.error(
        "No valid rows found. Use CSV columns: employeeNo,date,amIn,amOut,pmIn,pmOut,remarks",
      );
      return;
    }
    setBusy(true);
    try {
      const result = await importDtrRows({
        fileName: importFileName || "Manual CSV import",
        rows,
      });
      toast.success(`${result.imported} DTR row(s) imported`);
      if (result.errors.length) toast.warning(`${result.errors.length} row(s) need checking`);
      setShowImportDialog(false);
      setImportFileName("");
      setImportText("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to import DTR");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      title={isEmployee ? "My Attendance" : "Attendance DTR"}
      subtitle={
        isEmployee
          ? "View your daily time record and download your DTR when needed"
          : "Import, refresh, view, edit, delete, and export daily time records"
      }
    >
      <div className="space-y-4">
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-end">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {!isEmployee && (
                <div className="space-y-1.5">
                  <Label>Employee</Label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All employees</SelectItem>
                      {employeeOptions.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>From</Label>
                <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>To</Label>
                <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
              </div>
              {!isEmployee && (
                <div className="space-y-1.5">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Name, ID, department"
                      value={q}
                      onChange={(event) => setQ(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={load} disabled={loading}>
                <RefreshCw className="mr-1.5 h-4 w-4" /> Reload
              </Button>
              {canManage && (
                <>
                  <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                    <Upload className="mr-1.5 h-4 w-4" /> Import
                  </Button>
                  <Button variant="outline" onClick={refresh} disabled={busy}>
                    <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh DTR
                  </Button>
                  <Button onClick={openAdd} className="bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="mr-1.5 h-4 w-4" /> Add DTR
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => exportRows(false)}>
                <Download className="mr-1.5 h-4 w-4" /> Export
              </Button>
              {!isEmployee && (
                <Button variant="outline" onClick={() => exportRows(true)}>
                  <FileDown className="mr-1.5 h-4 w-4" /> Mass Export
                </Button>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="DTR Rows" value={summary.total} />
          <SummaryCard label="Present/Late" value={summary.present} />
          <SummaryCard label="Incomplete" value={summary.incomplete} />
          <SummaryCard label="Late Minutes" value={summary.lateMinutes} />
        </div>

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-blue-700" />
              <h2 className="text-sm font-semibold text-foreground">Daily Time Records</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : `${entries.length} record(s)`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  {!isEmployee && <th className="px-4 py-3 font-semibold">Employee</th>}
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">AM In</th>
                  <th className="px-4 py-3 font-semibold">AM Out</th>
                  <th className="px-4 py-3 font-semibold">PM In</th>
                  <th className="px-4 py-3 font-semibold">PM Out</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Late</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  {canManage && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-border">
                    {!isEmployee && (
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{entry.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{entry.employeeNo}</p>
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-foreground">{entry.workDate}</td>
                    <td className="px-4 py-3">{entry.amIn || "-"}</td>
                    <td className="px-4 py-3">{entry.amOut || "-"}</td>
                    <td className="px-4 py-3">{entry.pmIn || "-"}</td>
                    <td className="px-4 py-3">{entry.pmOut || "-"}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          STATUS_CLASS[entry.status] || "border-border bg-muted text-foreground"
                        }
                      >
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {entry.lateMinutes ? `${entry.lateMinutes} min` : "-"}
                    </td>
                    <td className="px-4 py-3">{entry.source}</td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(entry)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {!entries.length && !loading && (
                  <tr>
                    <td
                      colSpan={canManage ? 10 : isEmployee ? 8 : 9}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      No DTR records found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Dialog open={showDtrDialog} onOpenChange={setShowDtrDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit DTR" : "Add DTR"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Employee</Label>
              <Select
                value={form.employeeDbId || ""}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, employeeDbId: value }))
                }
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employeeOptions.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field
              label="Date"
              type="date"
              value={form.workDate}
              onChange={(workDate) => setForm({ ...form, workDate })}
            />
            <Field
              label="AM In"
              type="time"
              value={form.amIn || ""}
              onChange={(amIn) => setForm({ ...form, amIn })}
            />
            <Field
              label="AM Out"
              type="time"
              value={form.amOut || ""}
              onChange={(amOut) => setForm({ ...form, amOut })}
            />
            <Field
              label="PM In"
              type="time"
              value={form.pmIn || ""}
              onChange={(pmIn) => setForm({ ...form, pmIn })}
            />
            <Field
              label="PM Out"
              type="time"
              value={form.pmOut || ""}
              onChange={(pmOut) => setForm({ ...form, pmOut })}
            />
            <div className="space-y-1.5 md:col-span-2">
              <Label>Remarks</Label>
              <Input
                value={form.remarks || ""}
                onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                placeholder="Optional note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDtrDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveDtr}
              disabled={busy}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Save DTR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import DTR</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>CSV File</Label>
              <Input
                type="file"
                accept=".csv,.txt"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setImportFileName(file.name);
                  file.text().then(setImportText);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rows</Label>
              <textarea
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                className="min-h-52 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="employeeNo,date,amIn,amOut,pmIn,pmOut,remarks&#10;EMP-001,2026-06-09,08:01,12:00,13:00,17:02,"
              />
              <p className="text-xs text-muted-foreground">
                Accepted columns: employeeNo, date, amIn, amOut, pmIn, pmOut, remarks.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={importRows}
              disabled={busy}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Import DTR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function parseImportRows(text: string): DtrPayload[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const first = splitCsvLine(lines[0]).map((column) => column.trim().toLowerCase());
  const hasHeader = first.some((column) =>
    ["employeeno", "employeeid", "date", "workdate"].includes(column),
  );
  const headers = hasHeader
    ? first
    : ["employeeNo", "date", "amIn", "amOut", "pmIn", "pmOut", "remarks"].map((column) =>
        column.toLowerCase(),
      );
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .map((line) => {
      const values = splitCsvLine(line);
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || "";
      });
      return {
        employeeNo: row.employeeno || row.employeeid || row.employee_no,
        workDate: row.date || row.workdate || row.work_date,
        amIn: row.amin || row.am_in,
        amOut: row.amout || row.am_out,
        pmIn: row.pmin || row.pm_in,
        pmOut: row.pmout || row.pm_out,
        remarks: row.remarks || "",
      };
    })
    .filter((row) => row.employeeNo && row.workDate);
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}
