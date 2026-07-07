import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Download,
  FileClock,
  FileSpreadsheet,
  Info,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { canReadHrRecords, canWriteHrRecords, useAuth } from "@/lib/auth";
import { listEmployees, type EmployeeRecord } from "@/lib/employees-api";
import {
  deleteServiceRecord,
  emptyServiceRecord,
  exportServiceRecord,
  getServiceRecord,
  saveServiceRecord,
  type ServiceRecord,
  type ServiceRecordForm,
} from "@/lib/service-records-api";
import { cn, formatDisplayDate, formatEmployeeName } from "@/lib/utils";
export const Route = createFileRoute("/service-records")({ component: ServiceRecordsPage });
function ServiceRecordsPage() {
  const { user } = useAuth(),
    canManage = canWriteHrRecords(user?.role);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]),
    [employeeId, setEmployeeId] = useState(""),
    [records, setRecords] = useState<ServiceRecord[]>([]),
    [warnings, setWarnings] = useState<string[]>([]),
    [query, setQuery] = useState(""),
    [loading, setLoading] = useState(false),
    [loadingEmployees, setLoadingEmployees] = useState(true),
    [edit, setEdit] = useState<ServiceRecord | null | undefined>(undefined),
    [form, setForm] = useState<ServiceRecordForm>(emptyServiceRecord),
    [recordToDelete, setRecordToDelete] = useState<ServiceRecord | null>(null),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setLoadingEmployees(true);
    loadAllEmployees()
      .then((x) => {
        setEmployees(x);
        if (user?.employeeId && !canReadHrRecords(user.role)) setEmployeeId(user.employeeId);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoadingEmployees(false));
  }, [user]);
  const load = useCallback(
    async (id = employeeId) => {
      if (!id) {
        setRecords([]);
        return;
      }
      setLoading(true);
      try {
        const x = await getServiceRecord(id);
        setRecords(x.records);
        setWarnings(x.warnings);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [employeeId],
  );
  useEffect(() => {
    load(employeeId);
  }, [employeeId, load]);
  const filteredEmployees = employees.filter((e) =>
    [formatEmployeeName(e), e.employeeId, e.department, e.position]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const selected = employees.find((e) => e.id === employeeId);
  const summary = useMemo(() => {
    const automatic = records.filter((record) => record.source === "Automatic").length;
    const manual = records.length - automatic;
    return { automatic, manual };
  }, [records]);
  const openForm = (r?: ServiceRecord) => {
    setEdit(r || null);
    setForm(
      r
        ? {
            serviceFrom: r.serviceFrom,
            serviceTo: r.serviceTo || "",
            positionTitle: r.positionTitle,
            department: r.department,
            agency: r.agency,
            appointmentStatus: r.appointmentStatus,
            annualSalary: r.annualSalary == null ? "" : String(r.annualSalary),
            salaryGrade: r.salaryGrade == null ? "" : String(r.salaryGrade),
            salaryStep: r.salaryStep == null ? "" : String(r.salaryStep),
            itemNumber: r.itemNumber,
            branch: r.branch,
            leaveWithoutPay: r.leaveWithoutPay,
            separationDate: r.separationDate || "",
            separationCause: r.separationCause,
            remarks: r.remarks,
          }
        : emptyServiceRecord,
    );
  };
  const save = async () => {
    if (!employeeId) return;
    if (!form.serviceFrom || !form.positionTitle.trim()) {
      toast.error("Service from and position are required");
      return;
    }
    if (form.serviceTo && form.serviceFrom > form.serviceTo) {
      toast.error("Service from cannot be after service to");
      return;
    }
    setBusy(true);
    try {
      await saveServiceRecord(employeeId, form, edit?.id);
      toast.success(edit ? "Legacy service period updated" : "Legacy service period added");
      setEdit(undefined);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const confirmRemove = async () => {
    if (!recordToDelete) return;
    try {
      setBusy(true);
      await deleteServiceRecord(recordToDelete.id);
      toast.success("Legacy period deleted");
      setRecordToDelete(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const doExport = async (format: "xlsx" | "pdf") => {
    if (!employeeId) return;
    setBusy(true);
    try {
      const x = await exportServiceRecord(employeeId, format);
      window.open(x.downloadUrl, "_blank");
      toast.success(`${format.toUpperCase()} generated`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <AppShell
      title="Service Records"
      subtitle="Movement-derived service history, controlled legacy encoding, and HRIS-generated exports"
    >
      <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="hidden rounded-xl border border-border bg-card shadow-sm md:block">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-2 font-semibold">
              <UserRound className="h-4 w-4 text-blue-600" />
              Employees
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Select one employee to view or export service records.
            </p>
          </div>
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search employees..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="mt-3 max-h-[38vh] space-y-1 overflow-y-auto pr-1 lg:max-h-[68vh]">
              {loadingEmployees && (
                <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading employees...
                </div>
              )}
              {filteredEmployees.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setEmployeeId(e.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    employeeId === e.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <AvatarInitials employee={e} selected={employeeId === e.id} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{formatEmployeeName(e)}</div>
                    <div
                      className={cn(
                        "truncate text-xs",
                        employeeId === e.id ? "text-blue-100" : "text-muted-foreground",
                      )}
                    >
                      {e.position || e.department || "No assignment"}
                    </div>
                  </div>
                </button>
              ))}
              {!loadingEmployees && filteredEmployees.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No employees found.
                </div>
              )}
            </div>
          </div>
        </aside>
        <section className="min-w-0">
          <div className="mb-3 space-y-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search employees..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {query.trim() && (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border bg-white p-1 shadow-sm">
                {filteredEmployees.slice(0, 8).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setEmployeeId(e.id);
                      setQuery("");
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${employeeId === e.id ? "bg-blue-50 text-blue-700" : "hover:bg-muted"}`}
                  >
                    <span className="block font-semibold">{formatEmployeeName(e)}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {e.position || e.department || "No assignment"}
                    </span>
                  </button>
                ))}
                {!filteredEmployees.length && (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    No employees found.
                  </div>
                )}
              </div>
            )}
          </div>
          {!employeeId ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
              <FileClock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/70" />
              <div className="font-medium text-foreground">Select an employee</div>
              <p className="mt-1 text-sm">
                Choose an employee from the list to view service periods and generate exports.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 grid grid-cols-[1fr_0.7fr_0.7fr] gap-2 md:hidden">
                {canManage && (
                  <Button variant="outline" onClick={() => openForm()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add legacy period
                  </Button>
                )}
                <Button variant="outline" disabled={busy} onClick={() => doExport("xlsx")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => doExport("pdf")}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
              <div className="mb-3 grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/45 p-4 shadow-sm md:hidden">
                <AvatarInitials employee={selected} size="lg" />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-foreground">
                    {formatEmployeeName(selected)}
                  </h2>
                  <p className="text-sm font-semibold text-blue-700">
                    {records.length} service period(s)
                  </p>
                </div>
              </div>
              <div className="hidden rounded-xl border border-border bg-card p-4 shadow-sm md:block">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AvatarInitials employee={selected} size="lg" />
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">
                        {formatEmployeeName(selected)}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {selected?.position || selected?.department || "No assignment"} -{" "}
                        {records.length} service period(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canManage && (
                      <Button variant="outline" onClick={() => openForm()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add legacy period
                      </Button>
                    )}
                    <Button variant="outline" disabled={busy} onClick={() => doExport("xlsx")}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                    <Button disabled={busy} onClick={() => doExport("pdf")}>
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <SummaryTile
                    label="Total Periods"
                    value={records.length}
                    icon={<FileClock className="h-4 w-4 text-blue-600" />}
                  />
                  <SummaryTile
                    label="Movement Rows"
                    value={summary.automatic}
                    icon={<BriefcaseBusiness className="h-4 w-4 text-emerald-600" />}
                  />
                  <SummaryTile
                    label="Legacy Rows"
                    value={summary.manual}
                    icon={<CalendarDays className="h-4 w-4 text-amber-600" />}
                  />
                </div>
              </div>
              {warnings.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  <div className="flex items-center font-medium">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Validation warnings
                  </div>
                  {warnings.slice(0, 5).map((w) => (
                    <div key={w} className="ml-6">
                      {w}
                    </div>
                  ))}
                </div>
              )}
              <div className="mobile-record-list mt-3 md:hidden">
                {records.map((r) => (
                  <article
                    className="rounded-xl border border-border bg-white p-3 shadow-sm"
                    key={r.id}
                  >
                    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
                      <div className="relative flex justify-center">
                        <span className="mt-1 h-4 w-4 rounded-full border-2 border-blue-600 bg-white" />
                        <span className="absolute top-6 h-[calc(100%-1rem)] border-l border-dashed border-border" />
                      </div>
                      <div className="min-w-0">
                        <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3">
                          <div className="text-sm">
                            <p className="font-semibold text-foreground">
                              {formatDisplayDate(r.serviceFrom)}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              to {r.serviceTo ? formatDisplayDate(r.serviceTo) : "Present"}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-bold text-foreground">
                              {r.positionTitle}
                            </h3>
                            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span className="truncate">{r.department || "-"}</span>
                            </p>
                            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                              <BriefcaseBusiness className="h-4 w-4" />
                              <span>{r.appointmentStatus || "-"}</span>
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5.5rem] items-center gap-3 border-t border-dashed border-border pt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Salary / SG</p>
                            <p className="text-sm font-semibold text-foreground">
                              {r.annualSalary != null
                                ? `PHP ${r.annualSalary.toLocaleString()}`
                                : "-"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {r.salaryGrade != null
                                ? `SG ${r.salaryGrade}, Step ${r.salaryStep ?? "-"}`
                                : ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Item No.</p>
                            <p className="truncate text-sm font-semibold text-foreground">
                              {r.itemNumber || "-"}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2 py-1 text-center text-xs",
                              sourceBadgeClass(r.source),
                            )}
                          >
                            {r.source}
                          </span>
                        </div>
                      </div>
                    </div>
                    {r.separationCause && (
                      <p className="text-sm text-red-700">{r.separationCause}</p>
                    )}
                    {canManage && r.source === "Manual" && (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Edit"
                          onClick={() => openForm(r)}
                        >
                          <FileClock className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Delete"
                          onClick={() => setRecordToDelete(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </article>
                ))}
                {!records.length && (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    {loading ? "Loading..." : "No service periods available."}
                  </div>
                )}
              </div>
              <div className="mobile-desktop-table mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <FileClock className="h-4 w-4 text-blue-600" />
                    Service Periods
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Automatic rows are generated from posted movements; legacy rows are encoded
                    here.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        {[
                          "Period",
                          "Position / Designation",
                          "Department",
                          "Status / Action",
                          "Salary / SG",
                          "Item No.",
                          "Source",
                          "Actions",
                        ].map((x) => (
                          <th className="p-3" key={x}>
                            {x}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr className="border-t" key={r.id}>
                          <td className="whitespace-nowrap p-3">
                            {formatDisplayDate(r.serviceFrom)}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              to {r.serviceTo ? formatDisplayDate(r.serviceTo) : "Present"}
                            </span>
                          </td>
                          <td className="p-3 font-medium">{r.positionTitle}</td>
                          <td className="p-3">{r.department || "-"}</td>
                          <td className="p-3">
                            {r.appointmentStatus || "-"}
                            {r.separationCause && (
                              <div className="text-xs text-red-700">{r.separationCause}</div>
                            )}
                          </td>
                          <td className="p-3">
                            {r.annualSalary != null
                              ? `PHP ${r.annualSalary.toLocaleString()}`
                              : "-"}
                            <div className="text-xs text-muted-foreground">
                              {r.salaryGrade != null
                                ? `SG ${r.salaryGrade}, Step ${r.salaryStep ?? "-"}`
                                : ""}
                            </div>
                          </td>
                          <td className="p-3">{r.itemNumber || "-"}</td>
                          <td className="p-3">
                            <span
                              className={cn(
                                "rounded-full px-2 py-1 text-xs",
                                sourceBadgeClass(r.source),
                              )}
                            >
                              {r.source}
                            </span>
                          </td>
                          <td className="p-3">
                            {canManage && r.source === "Manual" && (
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Edit"
                                  onClick={() => openForm(r)}
                                >
                                  <FileClock className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Delete"
                                  onClick={() => setRecordToDelete(r)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!records.length && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-muted-foreground">
                            {loading ? "Loading..." : "No service periods available."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="mt-3 flex gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Automatic rows come from posted personnel movements and cannot be edited here.
                  <span className="hidden md:inline">
                    {" "}
                    Generic exports are not the official STRH template.
                  </span>
                </span>
              </p>
            </>
          )}
        </section>
      </div>
      <ServiceDialog
        open={edit !== undefined}
        edit={edit}
        form={form}
        setForm={setForm}
        close={() => setEdit(undefined)}
        save={save}
        busy={busy}
      />
      <AlertDialog
        open={Boolean(recordToDelete)}
        onOpenChange={(open) => !open && setRecordToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete legacy service period?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the manually encoded period beginning{" "}
              {recordToDelete ? formatDisplayDate(recordToDelete.serviceFrom) : ""}. Automatic
              movement-derived rows are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void confirmRemove();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Delete Period
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
function ServiceDialog({
  open,
  edit,
  form,
  setForm,
  close,
  save,
  busy,
}: {
  open: boolean;
  edit: ServiceRecord | null | undefined;
  form: ServiceRecordForm;
  setForm: (x: ServiceRecordForm) => void;
  close: () => void;
  save: () => void;
  busy: boolean;
}) {
  const f =
    (key: keyof ServiceRecordForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{edit ? "Edit" : "Add"} legacy service period</DialogTitle>
        </DialogHeader>
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          Use this only for service periods that are not already represented by posted personnel
          movements.
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field l="Service from">
            <Input type="date" value={form.serviceFrom} onChange={f("serviceFrom")} />
          </Field>
          <Field l="Service to">
            <Input type="date" value={form.serviceTo} onChange={f("serviceTo")} />
          </Field>
          <Field l="Position / designation">
            <Input
              value={form.positionTitle}
              onChange={f("positionTitle")}
              placeholder="Required"
            />
          </Field>
          <Field l="Department / office">
            <Input value={form.department} onChange={f("department")} />
          </Field>
          <Field l="Agency">
            <Input value={form.agency} onChange={f("agency")} />
          </Field>
          <Field l="Appointment status">
            <Input
              value={form.appointmentStatus}
              onChange={f("appointmentStatus")}
              placeholder="Permanent, Casual, JO/COS..."
            />
          </Field>
          <Field l="Annual salary">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.annualSalary}
              onChange={f("annualSalary")}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field l="Salary grade">
              <Input type="number" min="0" value={form.salaryGrade} onChange={f("salaryGrade")} />
            </Field>
            <Field l="Step">
              <Input type="number" min="0" value={form.salaryStep} onChange={f("salaryStep")} />
            </Field>
          </div>
          <Field l="Item number">
            <Input value={form.itemNumber} onChange={f("itemNumber")} />
          </Field>
          <Field l="Branch">
            <Input value={form.branch} onChange={f("branch")} />
          </Field>
          <Field l="Leave without pay">
            <Input value={form.leaveWithoutPay} onChange={f("leaveWithoutPay")} />
          </Field>
          <Field l="Separation date">
            <Input type="date" value={form.separationDate} onChange={f("separationDate")} />
          </Field>
          <Field l="Separation cause">
            <Input value={form.separationCause} onChange={f("separationCause")} />
          </Field>
          <div className="sm:col-span-2">
            <Field l="Remarks">
              <Textarea value={form.remarks} onChange={f("remarks")} />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button disabled={busy || !form.serviceFrom || !form.positionTitle.trim()} onClick={save}>
            Save legacy period
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function AvatarInitials({
  employee,
  selected,
  size = "md",
}: {
  employee?: EmployeeRecord | null;
  selected?: boolean;
  size?: "md" | "lg";
}) {
  const initials = employee
    ? `${employee.firstname?.[0] || ""}${employee.lastname?.[0] || ""}`.toUpperCase() || "--"
    : "--";
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold",
        size === "lg" ? "h-14 w-14 text-lg" : "h-9 w-9 text-xs",
        selected ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700",
      )}
    >
      {initials}
    </div>
  );
}
function SummaryTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="mt-1 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
function sourceBadgeClass(source: ServiceRecord["source"]) {
  if (source === "Automatic") return "bg-blue-100 text-blue-800";
  if (source === "Manual") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}
function Field({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{l}</Label>
      {children}
    </div>
  );
}
async function loadAllEmployees() {
  const first = await listEmployees({ pageSize: 100 });
  const pages = Math.ceil(first.total / first.pageSize);
  if (pages <= 1) return first.employees;
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      listEmployees({ page: i + 2, pageSize: first.pageSize }),
    ),
  );
  return [first, ...rest].flatMap((x) => x.employees);
}
