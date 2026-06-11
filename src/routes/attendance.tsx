import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  bulkUpdateSchedule,
  bulkUpdateScheduleOverrides,
  checkBiometricStatus,
  checkUnimportedDtrs,
  createBiometricDevice,
  downloadGeneratedFile,
  downloadDtrCsv,
  generateDtrExcel,
  generateDtrPdf,
  importAllDtr,
  importSingleDtr,
  listBiometricDevices,
  listDtrNoters,
  listDtr,
  openGeneratedFile,
  refreshDtr,
  updateDtr,
  type BiometricDevice,
  type DtrNoter,
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

  const [showImportAllDialog, setShowImportAllDialog] = useState(false);
  const [massImportSource, setMassImportSource] = useState<"biometric" | "file">("biometric");
  const [massImportFile, setMassImportFile] = useState<File | null>(null);
  const [massImportBiometricId, setMassImportBiometricId] = useState("");
  const [massImportStartDate, setMassImportStartDate] = useState(from);
  const [massImportEndDate, setMassImportEndDate] = useState(to);
  const [showBiometricDialog, setShowBiometricDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editing, setEditing] = useState<DtrEntry | null>(null);
  const [form, setForm] = useState<DtrPayload>(EMPTY_DTR_FORM);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSource, setImportSource] = useState<"biometric" | "file">("biometric");
  const [importSearch, setImportSearch] = useState("");
  const [selectedImportEmployeeId, setSelectedImportEmployeeId] = useState("");
  const [biometricDevices, setBiometricDevices] = useState<BiometricDevice[]>([]);
  const [selectedBiometricId, setSelectedBiometricId] = useState("");
  const [deviceStatus, setDeviceStatus] = useState<Record<string, "online" | "offline">>({});
  const [unimportedCount, setUnimportedCount] = useState<number | null>(null);
  const [importStartDate, setImportStartDate] = useState(DEFAULT_FROM);
  const [importEndDate, setImportEndDate] = useState(DEFAULT_TO);
  const [deviceForm, setDeviceForm] = useState({
    name: "",
    ip_address: "",
    port: "4370",
    active: true,
  });
  const [noters, setNoters] = useState<DtrNoter[]>([]);
  const [exportForm, setExportForm] = useState({
    employeeId: "all",
    noterSignatory: "",
    noterPosition: "",
    firstStartDate: DEFAULT_FROM,
    firstEndDate: DEFAULT_TO,
    useSecondPeriod: false,
    secondStartDate: DEFAULT_FROM,
    secondEndDate: DEFAULT_TO,
  });
  const [scheduleForm, setScheduleForm] = useState({
    target: "override" as "default" | "override",
    employeeIds: [] as string[],
    startDate: DEFAULT_FROM,
    endDate: DEFAULT_TO,
    skipWeekends: true,
    amIn: "08:00",
    amOut: "12:00",
    pmIn: "13:00",
    pmOut: "17:00",
  });

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

  useEffect(() => {
    if (!canManage && !isEmployee) return;
    listDtrNoters()
      .then((result) => {
        setNoters(result.noters);
        if (result.noters[0]) {
          setExportForm((current) => ({
            ...current,
            noterSignatory: current.noterSignatory || result.noters[0].signatory,
            noterPosition: current.noterPosition || result.noters[0].position,
          }));
        }
      })
      .catch(() => setNoters([]));
  }, [canManage, isEmployee]);

  useEffect(() => {
    if (!showImportDialog || !canManage) return;
    listBiometricDevices()
      .then((result) => {
        setBiometricDevices(result.devices);
        setSelectedBiometricId((current) => current || result.devices.find((device) => device.active)?.id || "");
      })
      .catch(() => setBiometricDevices([]));
  }, [showImportDialog, canManage]);

  useEffect(() => {
    if (!showImportDialog || !selectedImportEmployeeId) {
      setUnimportedCount(null);
      return;
    }
    let cancelled = false;
    checkUnimportedDtrs(selectedImportEmployeeId)
      .then((result) => {
        if (!cancelled) setUnimportedCount(result.count);
      })
      .catch(() => {
        if (!cancelled) setUnimportedCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [showImportDialog, selectedImportEmployeeId]);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        id: employee.id,
        label: `${employee.lastname}, ${employee.firstname} (${employee.employeeId})`,
      })),
    [employees],
  );

  const importEmployees = useMemo(
    () =>
      employees.map((employee) => ({
        id: employee.id,
        employeeNo: employee.employeeId,
        name: [employee.lastname, employee.firstname].filter(Boolean).join(", "),
        position: employee.position || "",
        office: employee.department || "",
      })),
    [employees],
  );

  const filteredImportEmployees = useMemo(() => {
    const search = importSearch.trim().toLowerCase();
    if (!search) return importEmployees;
    return importEmployees.filter((employee) =>
      [employee.name, employee.employeeNo, employee.office, employee.position]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [importEmployees, importSearch]);

  const selectedImportEmployee = useMemo(
    () => importEmployees.find((employee) => employee.id === selectedImportEmployeeId) || null,
    [importEmployees, selectedImportEmployeeId],
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

  const openImport = () => {
    setImportSource("biometric");
    setImportSearch("");
    setImportFile(null);
    setImportStartDate(from);
    setImportEndDate(to);
    setSelectedImportEmployeeId(employeeId === "all" ? "" : employeeId);
    setShowImportDialog(true);
  };

  const openImportAll = () => {
    setMassImportSource("biometric");
    setMassImportFile(null);
    setMassImportStartDate(from);
    setMassImportEndDate(to);
    setMassImportBiometricId("");
    listBiometricDevices()
      .then((result) => {
        setBiometricDevices(result.devices);
        const defaultDevice = result.devices.find((device) => device.active);
        if (defaultDevice) setMassImportBiometricId(defaultDevice.id);
      })
      .catch(() => setBiometricDevices([]));
    setShowImportAllDialog(true);
  };

  const runImportAll = async () => {
    if (!massImportStartDate || !massImportEndDate) {
      toast.error("Select a start date and end date");
      return;
    }
    if (massImportSource === "biometric" && !massImportBiometricId) {
      toast.error("Select a biometric device first");
      return;
    }
    if (massImportSource === "file" && !massImportFile) {
      toast.error("Select a DTR file first");
      return;
    }
    setBusy(true);
    try {
      const payload: Parameters<typeof importAllDtr>[0] = {
        source: massImportSource,
        startDate: massImportStartDate,
        endDate: massImportEndDate,
      };
      if (massImportSource === "biometric") {
        payload.biometricId = massImportBiometricId;
      } else if (massImportFile) {
        payload.fileName = massImportFile.name;
        payload.fileBase64 = await fileToBase64(massImportFile);
      }
      const result = await importAllDtr(payload);
      toast.success(
        `Import DTR complete: ${result.imported} punch(es) imported; ${result.refreshed?.recordsProcessed || 0} DTR row(s) refreshed`,
      );
      if (result.errors?.length) toast.warning(`${result.errors.length} row(s) had errors`);
      setShowImportAllDialog(false);
      setMassImportFile(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to import DTR");
    } finally {
      setBusy(false);
    }
  };

  const reloadBiometricDevices = async (selectId = "") => {
    const result = await listBiometricDevices();
    setBiometricDevices(result.devices);
    setSelectedBiometricId(selectId || result.devices.find((device) => device.active)?.id || "");
  };

  const checkSelectedDevice = async () => {
    const device = biometricDevices.find((item) => item.id === selectedBiometricId);
    if (!device) {
      toast.error("Select a biometric device first");
      return;
    }
    try {
      const result = await checkBiometricStatus({
        ip_address: device.ip_address,
        port: device.port,
      });
      setDeviceStatus((current) => ({ ...current, [device.id]: result.status }));
      toast[result.online ? "success" : "error"](
        `${device.name} is ${result.online ? "online" : "offline"}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to check device");
    }
  };

  const saveBiometricDevice = async () => {
    const name = deviceForm.name.trim();
    const ipAddress = deviceForm.ip_address.trim();
    const port = Number(deviceForm.port);
    const ipPattern =
      /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
    if (name.length < 2) {
      toast.error("Device name must be at least 2 characters");
      return;
    }
    if (!ipPattern.test(ipAddress)) {
      toast.error("Enter a valid IP address");
      return;
    }
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      toast.error("Port must be between 1 and 65535");
      return;
    }
    setBusy(true);
    try {
      const result = await createBiometricDevice({
        name,
        ip_address: ipAddress,
        port,
        active: deviceForm.active,
      });
      toast.success("Biometric device added");
      setShowBiometricDialog(false);
      setDeviceForm({ name: "", ip_address: "", port: "4370", active: true });
      await reloadBiometricDevices(result.device.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to add biometric device");
    } finally {
      setBusy(false);
    }
  };

  const importRows = async () => {
    if (!selectedImportEmployeeId) {
      toast.error("Select an employee first");
      return;
    }
    if (!importStartDate || !importEndDate) {
      toast.error("Select a start date and end date");
      return;
    }
    if (importSource === "file" && !importFile) {
      toast.error("Select a DTR file first");
      return;
    }
    if (importSource === "biometric" && !selectedBiometricId) {
      toast.error("Select a biometric device first");
      return;
    }
    setBusy(true);
    try {
      const result = await importSingleDtr({
        source: importSource,
        employeeId: selectedImportEmployeeId,
        biometricId: importSource === "biometric" ? selectedBiometricId : undefined,
        fileName: importFile?.name,
        fileBase64: importFile ? await fileToBase64(importFile) : undefined,
        startDate: importStartDate,
        endDate: importEndDate,
      });
      toast.success(
        `Imported ${result.imported} punch(es); refreshed ${result.refreshed.recordsProcessed} DTR row(s)`,
      );
      if (result.errors?.length) toast.warning(`${result.errors.length} row(s) need checking`);
      setShowImportDialog(false);
      setImportFile(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to import DTR");
    } finally {
      setBusy(false);
    }
  };

  const openExport = () => {
    const targetEmployeeId = isEmployee ? user?.employeeId || "" : employeeId;
    setExportForm((current) => ({
      ...current,
      employeeId: targetEmployeeId || "all",
    }));
    setShowExportDialog(true);
  };

  const buildDtrExportPayload = () => {
    const targetEmployeeId = isEmployee
      ? user?.employeeId || ""
      : exportForm.employeeId === "all"
        ? employeeId === "all"
          ? ""
          : employeeId
        : exportForm.employeeId;
    if (!targetEmployeeId) {
      toast.error("Select one employee to view or export DTR");
      return null;
    }
    if (!exportForm.noterSignatory || !exportForm.noterPosition) {
      toast.error("Select a DTR noter first");
      return null;
    }
    if (!exportForm.firstStartDate || !exportForm.firstEndDate) {
      toast.error("Select a DTR date range first");
      return null;
    }
    if (exportForm.firstStartDate > exportForm.firstEndDate) {
      toast.error("Start date cannot be after end date");
      return null;
    }
    if (exportForm.useSecondPeriod) {
      if (!exportForm.secondStartDate || !exportForm.secondEndDate) {
        toast.error("Select the second DTR date range");
        return null;
      }
      if (exportForm.secondStartDate > exportForm.secondEndDate) {
        toast.error("Second start date cannot be after second end date");
        return null;
      }
    }
    return {
      employeeId: targetEmployeeId,
      noterSignatory: exportForm.noterSignatory,
      noterPosition: exportForm.noterPosition,
      firstStartDate: exportForm.firstStartDate,
      firstEndDate: exportForm.firstEndDate,
      secondStartDate: exportForm.useSecondPeriod ? exportForm.secondStartDate : undefined,
      secondEndDate: exportForm.useSecondPeriod ? exportForm.secondEndDate : undefined,
      periods: [
        { from: exportForm.firstStartDate, to: exportForm.firstEndDate },
        ...(exportForm.useSecondPeriod
          ? [{ from: exportForm.secondStartDate, to: exportForm.secondEndDate }]
          : []),
      ],
    };
  };

  const exportExcel = async () => {
    const payload = buildDtrExportPayload();
    if (!payload) return;
    setBusy(true);
    try {
      const result = await generateDtrExcel(payload);
      downloadGeneratedFile(result.downloadUrl, result.fileName);
      toast.success(`DTR Excel generated with ${result.rowCount} row(s)`);
      setShowExportDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to generate DTR Excel");
    } finally {
      setBusy(false);
    }
  };

  const viewPdf = async () => {
    const payload = buildDtrExportPayload();
    if (!payload) return;
    setBusy(true);
    try {
      const result = await generateDtrPdf(payload);
      openGeneratedFile(result.previewUrl);
      toast.success(`DTR PDF generated with ${result.rowCount} row(s)`);
      setShowExportDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to generate DTR PDF");
    } finally {
      setBusy(false);
    }
  };

  const saveSchedule = async () => {
    if (!scheduleForm.employeeIds.length) {
      toast.error("Select at least one employee");
      return;
    }
    setBusy(true);
    try {
      if (scheduleForm.target === "default") {
        await bulkUpdateSchedule({
          employeeIds: scheduleForm.employeeIds,
          schedule: {
            amIn: scheduleForm.amIn,
            amOut: scheduleForm.amOut,
            pmIn: scheduleForm.pmIn,
            pmOut: scheduleForm.pmOut,
          },
        });
      } else {
        await bulkUpdateScheduleOverrides({
          employeeIds: scheduleForm.employeeIds,
          startDate: scheduleForm.startDate,
          endDate: scheduleForm.endDate,
          skipWeekends: scheduleForm.skipWeekends,
          schedule: {
            amIn: scheduleForm.amIn,
            amOut: scheduleForm.amOut,
            pmIn: scheduleForm.pmIn,
            pmOut: scheduleForm.pmOut,
          },
        });
      }
      toast.success(`Schedule saved for ${scheduleForm.employeeIds.length} employee(s)`);
      setShowScheduleDialog(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save schedule");
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
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={load} disabled={loading}>
                <RefreshCw className="mr-1.5 h-4 w-4" /> Reload
              </Button>
              {canManage && (
                <>
                  <Button variant="outline" onClick={refresh} disabled={busy}>
                    <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh DTR
                  </Button>
                  <Button variant="outline" onClick={() => setShowScheduleDialog(true)} disabled={busy}>
                    <Settings2 className="mr-1.5 h-4 w-4" /> Schedule
                  </Button>
                  <Button onClick={openImportAll} disabled={busy} className="bg-blue-600 text-white hover:bg-blue-700">
                    <Upload className="mr-1.5 h-4 w-4" /> Import DTR
                  </Button>
                  <Button onClick={openAdd} className="bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="mr-1.5 h-4 w-4" /> Add DTR
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Actions
                    <ChevronDown className="ml-1.5 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {canManage && (
                    <DropdownMenuItem onClick={openImport}>
                      <Upload className="h-4 w-4" />
                      Import Single DTR
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={openExport}>
                    <FileSpreadsheet className="h-4 w-4" />
                    View DTR Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportRows(false)}>
                    <Download className="h-4 w-4" />
                    Quick CSV
                  </DropdownMenuItem>
                  {!isEmployee && (
                    <DropdownMenuItem onClick={() => exportRows(true)}>
                      <FileDown className="h-4 w-4" />
                      Mass Export
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
            <table className="w-full min-w-[1080px] table-fixed text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Biometric ID</th>
                  <th className="w-[260px] px-4 py-3 font-semibold">Name</th>
                  <th className="w-[360px] px-4 py-3 font-semibold">Office</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">AM In</th>
                  <th className="px-4 py-3 font-semibold">AM Out</th>
                  <th className="px-4 py-3 font-semibold">PM In</th>
                  <th className="px-4 py-3 font-semibold">PM Out</th>
                  <th className="px-4 py-3 font-semibold">Tardiness</th>
                  {canManage && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-muted-foreground">
                      {entry.biometricId || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {entry.employeeName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {entry.department || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{entry.workDate}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">{entry.amIn || "-"}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">{entry.amOut || "-"}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">{entry.pmIn || "-"}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">{entry.pmOut || "-"}</td>
                    <td className="px-4 py-3 text-destructive font-medium">
                      {entry.lateMinutes ? `${entry.lateMinutes} min` : "-"}
                    </td>
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
                      colSpan={canManage ? 10 : 9}
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
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Import DTR</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Select Employee</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={importSearch}
                    onChange={(event) => setImportSearch(event.target.value)}
                    placeholder="Search by name, ID, or office"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto rounded-md border border-border">
                {filteredImportEmployees.map((employee) => {
                  const selected = employee.id === selectedImportEmployeeId;
                  return (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => setSelectedImportEmployeeId(employee.id)}
                      className={`flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted ${
                        selected ? "bg-blue-50" : ""
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">
                          {employee.name || employee.employeeNo}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {employee.employeeNo} {employee.office ? `- ${employee.office}` : ""}
                        </span>
                        {employee.position && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {employee.position}
                          </span>
                        )}
                      </span>
                      {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-700" />}
                    </button>
                  );
                })}
                {!filteredImportEmployees.length && (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No employees found.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {selectedImportEmployee && (
                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">Unimported Records Check</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        checkUnimportedDtrs(selectedImportEmployee.id)
                          .then((result) => setUnimportedCount(result.count))
                          .catch(() => setUnimportedCount(null))
                      }
                    >
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Refresh
                    </Button>
                  </div>
                  <p className="mt-1 text-xs">
                    {unimportedCount === null
                      ? "Checking records..."
                      : `${unimportedCount} unimported record(s) found for ${selectedImportEmployee.name}`}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Import Source</Label>
                <Select value={importSource} onValueChange={(value: "biometric" | "file") => setImportSource(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="biometric">Biometric</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {importSource === "biometric" ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Biometric Device</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBiometricDialog(true)}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add Device
                    </Button>
                  </div>
                  <Select value={selectedBiometricId} onValueChange={setSelectedBiometricId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select biometric device" />
                    </SelectTrigger>
                    <SelectContent>
                      {biometricDevices.map((device) => (
                        <SelectItem key={device.id} value={device.id} disabled={!device.active}>
                          {device.name} - {device.ip_address}:{device.port}
                          {!device.active ? " (Inactive)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {selectedBiometricId && deviceStatus[selectedBiometricId]
                        ? `Status: ${deviceStatus[selectedBiometricId]}`
                        : "Select a device or add one first."}
                    </span>
                    <Button type="button" size="sm" variant="outline" onClick={checkSelectedDevice}>
                      Check
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>DTR File</Label>
                  <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center hover:bg-muted/50">
                    <Upload className="mb-2 h-7 w-7 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {importFile ? importFile.name : "Click to upload DTR file"}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      TXT, XLSX, or DAT files only. Maximum size 10MB.
                    </span>
                    <Input
                      type="file"
                      accept=".txt,.xlsx,.xls,.dat"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        if (!/\.(txt|xlsx|xls|dat)$/i.test(file.name)) {
                          toast.error("Only TXT, XLSX, XLS, and DAT files are supported");
                          event.target.value = "";
                          return;
                        }
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error("File size must not exceed 10MB");
                          event.target.value = "";
                          return;
                        }
                        setImportFile(file);
                      }}
                    />
                  </label>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Start Date" type="date" value={importStartDate} onChange={setImportStartDate} />
                <Field label="End Date" type="date" value={importEndDate} onChange={setImportEndDate} />
              </div>
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
              Import Single DTR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* â”€â”€â”€ MASS IMPORT DTR (all employees) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog open={showImportAllDialog} onOpenChange={setShowImportAllDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import DTR</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Import attendance for <span className="font-semibold text-foreground">all employees</span> from a biometric device or file.
              DTR records are automatically refreshed after import.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Import Source</Label>
              <Select
                value={massImportSource}
                onValueChange={(value: "biometric" | "file") => setMassImportSource(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="biometric">Biometric Device</SelectItem>
                  <SelectItem value="file">File (TXT / XLSX / DAT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {massImportSource === "biometric" ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label>Biometric Device</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowBiometricDialog(true)}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Device
                  </Button>
                </div>
                <Select value={massImportBiometricId} onValueChange={setMassImportBiometricId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select biometric device" />
                  </SelectTrigger>
                  <SelectContent>
                    {biometricDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id} disabled={!device.active}>
                        {device.name} â€” {device.ip_address}:{device.port}
                        {!device.active ? " (Inactive)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!biometricDevices.length && (
                  <p className="text-xs text-muted-foreground">No biometric devices configured yet.</p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>DTR File</Label>
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 px-4 py-5 text-center hover:bg-muted/50">
                  <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {massImportFile ? massImportFile.name : "Click to upload DTR file"}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    TXT, XLSX, or DAT â€” max 10 MB
                  </span>
                  <Input
                    type="file"
                    accept=".txt,.xlsx,.xls,.dat"
                    className="hidden"
                    onChange={(event: any) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (!/\.(txt|xlsx|xls|dat)$/i.test(file.name)) {
                        toast.error("Only TXT, XLSX, XLS, and DAT files are supported");
                        event.target.value = "";
                        return;
                      }
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error("File size must not exceed 10 MB");
                        event.target.value = "";
                        return;
                      }
                      setMassImportFile(file);
                    }}
                  />
                </label>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Start Date" type="date" value={massImportStartDate} onChange={setMassImportStartDate} />
              <Field label="End Date" type="date" value={massImportEndDate} onChange={setMassImportEndDate} />
            </div>

            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              <strong>All employees</strong> â€” punches are matched by Employee No. or Biometric ID. Unmatched records are skipped. DTR is refreshed automatically after import.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportAllDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={runImportAll}
              disabled={busy}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {busy ? "Importingâ€¦" : "Import DTR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBiometricDialog} onOpenChange={setShowBiometricDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Biometric Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field
              label="Device Name"
              type="text"
              value={deviceForm.name}
              onChange={(name) => setDeviceForm({ ...deviceForm, name })}
            />
            <Field
              label="IP Address"
              type="text"
              value={deviceForm.ip_address}
              onChange={(ip_address) => setDeviceForm({ ...deviceForm, ip_address })}
            />
            <Field
              label="Port"
              type="number"
              value={deviceForm.port}
              onChange={(port) => setDeviceForm({ ...deviceForm, port })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={deviceForm.active}
                onChange={(event) =>
                  setDeviceForm({ ...deviceForm, active: event.target.checked })
                }
              />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBiometricDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveBiometricDevice}
              disabled={busy}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Add Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>View DTR Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {!isEmployee && (
              <div className="space-y-1.5">
                <Label>Employee</Label>
                <Select
                  value={exportForm.employeeId}
                  onValueChange={(value) => setExportForm({ ...exportForm, employeeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Current selected employee</SelectItem>
                    {employeeOptions.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Noter Signatory</Label>
                <Select
                  value={noters.find((item) => item.signatory === exportForm.noterSignatory)?.id || ""}
                  onValueChange={(value) => {
                    const noter = noters.find((item) => item.id === value);
                    setExportForm({
                      ...exportForm,
                      noterSignatory: noter?.signatory || "",
                      noterPosition: noter?.position || exportForm.noterPosition,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select noter" />
                  </SelectTrigger>
                  <SelectContent>
                    {noters.map((noter) => (
                      <SelectItem key={noter.id} value={noter.id}>
                        {noter.signatory} - {noter.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Noter Position</Label>
                <Input
                  value={exportForm.noterPosition}
                  onChange={(event) =>
                    setExportForm({ ...exportForm, noterPosition: event.target.value })
                  }
                  placeholder="Position title"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field
                label="Start Date"
                type="date"
                value={exportForm.firstStartDate}
                onChange={(firstStartDate) => setExportForm({ ...exportForm, firstStartDate })}
              />
              <Field
                label="End Date"
                type="date"
                value={exportForm.firstEndDate}
                onChange={(firstEndDate) => setExportForm({ ...exportForm, firstEndDate })}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={exportForm.useSecondPeriod}
                onChange={(event) =>
                  setExportForm({ ...exportForm, useSecondPeriod: event.target.checked })
                }
              />
              Include second period
            </label>

            {exportForm.useSecondPeriod && (
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="Second Start Date"
                  type="date"
                  value={exportForm.secondStartDate}
                  onChange={(secondStartDate) => setExportForm({ ...exportForm, secondStartDate })}
                />
                <Field
                  label="Second End Date"
                  type="date"
                  value={exportForm.secondEndDate}
                  onChange={(secondEndDate) => setExportForm({ ...exportForm, secondEndDate })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={viewPdf}
              disabled={busy}
              variant="outline"
            >
              <FileText className="mr-1.5 h-4 w-4" />
              View PDF
            </Button>
            <Button
              onClick={exportExcel}
              disabled={busy}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              Generate Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bulk Edit Schedule</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
            <div className="space-y-3">
              <Label>Employees</Label>
              <div className="max-h-80 overflow-y-auto rounded-md border border-border p-2">
                <label className="mb-2 flex items-center gap-2 rounded px-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={
                      employeeOptions.length > 0 &&
                      scheduleForm.employeeIds.length === employeeOptions.length
                    }
                    onChange={(event) =>
                      setScheduleForm({
                        ...scheduleForm,
                        employeeIds: event.target.checked
                          ? employeeOptions.map((item) => item.id)
                          : [],
                      })
                    }
                  />
                  Select all
                </label>
                {employeeOptions.map((employee) => (
                  <label
                    key={employee.id}
                    className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={scheduleForm.employeeIds.includes(employee.id)}
                      onChange={(event) => {
                        setScheduleForm({
                          ...scheduleForm,
                          employeeIds: event.target.checked
                            ? [...scheduleForm.employeeIds, employee.id]
                            : scheduleForm.employeeIds.filter((id) => id !== employee.id),
                        });
                      }}
                    />
                    <span className="truncate">{employee.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Edit Target</Label>
                <Select
                  value={scheduleForm.target}
                  onValueChange={(value: "default" | "override") =>
                    setScheduleForm({ ...scheduleForm, target: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="override">Specific Date Override</SelectItem>
                    <SelectItem value="default">Employee Default Schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {scheduleForm.target === "override" && (
                <div className="grid gap-3 md:grid-cols-2">
                  <Field
                    label="Start Date"
                    type="date"
                    value={scheduleForm.startDate}
                    onChange={(startDate) => setScheduleForm({ ...scheduleForm, startDate })}
                  />
                  <Field
                    label="End Date"
                    type="date"
                    value={scheduleForm.endDate}
                    onChange={(endDate) => setScheduleForm({ ...scheduleForm, endDate })}
                  />
                  <label className="flex items-center gap-2 text-sm md:col-span-2">
                    <input
                      type="checkbox"
                      checked={scheduleForm.skipWeekends}
                      onChange={(event) =>
                        setScheduleForm({ ...scheduleForm, skipWeekends: event.target.checked })
                      }
                    />
                    Skip weekends
                  </label>
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="AM In" type="time" value={scheduleForm.amIn} onChange={(amIn) => setScheduleForm({ ...scheduleForm, amIn })} />
                <Field label="AM Out" type="time" value={scheduleForm.amOut} onChange={(amOut) => setScheduleForm({ ...scheduleForm, amOut })} />
                <Field label="PM In" type="time" value={scheduleForm.pmIn} onChange={(pmIn) => setScheduleForm({ ...scheduleForm, pmIn })} />
                <Field label="PM Out" type="time" value={scheduleForm.pmOut} onChange={(pmOut) => setScheduleForm({ ...scheduleForm, pmOut })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveSchedule}
              disabled={busy}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Save Schedule
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

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error || new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}
