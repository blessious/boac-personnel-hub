import { createFileRoute } from "@tanstack/react-router";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RadioTower,
  RefreshCw,
  Search,
  Settings2,
  SquareTerminal,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { MassDtrPrintModal } from "@/components/MassDtrPrintModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createDtr,
  createDtrCorrectionRequest,
  decideDtrCorrectionRequest,
  deleteDtr,
  bulkUpdateSchedule,
  bulkUpdateScheduleOverrides,
  checkBiometricStatus,
  checkUnimportedDtrs,
  closeGeneratedFileTab,
  createBiometricDevice,
  deleteBiometricDevice,
  downloadGeneratedFile,
  generateDtrExcel,
  generateDtrPdf,
  getBiometricRealtimeLogs,
  getBiometricRealtimeStatus,
  importAllDtr,
  importSingleDtr,
  listBiometricDevices,
  listDtrNoters,
  listDtr,
  listDtrCorrectionRequests,
  openGeneratedFile,
  openGeneratedFileTab,
  refreshDtr,
  reverseDtrCorrectionRequest,
  syncBiometricNow,
  updateBiometricDevice,
  updateDtr,
  type BiometricRealtimeLog,
  type BiometricRealtimeStatus,
  type BiometricDevice,
  type DtrNoter,
  type DtrEntry,
  type DtrCorrectionPayload,
  type DtrCorrectionRequest,
  type DtrCorrectionStatus,
  type DtrPayload,
} from "@/lib/attendance-api";
import { canReadHrRecords, canWriteHrRecords, useAuth } from "@/lib/auth";
import { listEmployees, type EmployeeRecord } from "@/lib/employees-api";
import { useRealtimeRefresh } from "@/lib/realtime";

export const Route = createFileRoute("/attendance")({
  component: AttendancePage,
});

const today = new Date();
const formatLocalDate = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
const DEFAULT_FROM = formatLocalDate(today);
const DEFAULT_TO = formatLocalDate(today);
const DTR_PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

function formatDtrTime(value?: string | null) {
  if (!value) return "-";
  const match = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = match[2];
  if (Number.isNaN(hours) || hours > 23) return value;
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
}

function formatDtrRangeLabel(from: string, to: string) {
  const parse = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };
  const fromDate = parse(from);
  const toDate = parse(to);
  if (!fromDate || !toDate) return `${from} - ${to}`;
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(fromDate);
  const fromDay = fromDate.getDate();
  const toMonth = new Intl.DateTimeFormat("en-US", { month: "short" }).format(toDate);
  const toDay = toDate.getDate();
  const year = toDate.getFullYear();
  return month === toMonth
    ? `${month} ${fromDay} - ${toDay}, ${year}`
    : `${month} ${fromDay} - ${toMonth} ${toDay}, ${year}`;
}

function shiftDateString(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

function filterEmployeeOptions(options: Array<{ id: string; label: string }>, searchValue: string) {
  const search = searchValue.trim().toLowerCase();
  if (!search) return options;
  return options.filter((employee) => employee.label.toLowerCase().includes(search));
}

const EMPTY_DTR_FORM: DtrPayload = {
  employeeDbId: "",
  workDate: formatLocalDate(new Date()),
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

const CORRECTION_STATUS_CLASS: Record<DtrCorrectionStatus, string> = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Disapproved: "border-rose-200 bg-rose-50 text-rose-700",
  Cancelled: "border-slate-200 bg-slate-50 text-slate-600",
  Reversed: "border-violet-200 bg-violet-50 text-violet-700",
};

const EMPTY_CORRECTION_FORM: DtrCorrectionPayload = {
  workDate: formatLocalDate(new Date()),
  requestType: "Times",
  amIn: "",
  amOut: "",
  pmIn: "",
  pmOut: "",
  label: "",
  reason: "",
};

function AttendancePage() {
  const { user, can } = useAuth();
  const canManage = canWriteHrRecords(user?.role);
  const canApprove = can("approve");
  const isEmployee = user?.role === "Employee";
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
  const [q, setQ] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [debouncedRecordSearch, setDebouncedRecordSearch] = useState("");
  const [dtrPage, setDtrPage] = useState(1);
  const [dtrPageSize, setDtrPageSize] = useState(50);
  const [dtrPagination, setDtrPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  });
  const [employeeId, setEmployeeId] = useState("all");
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [entries, setEntries] = useState<DtrEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showDtrDialog, setShowDtrDialog] = useState(false);
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false);
  const [correctionForm, setCorrectionForm] = useState<DtrCorrectionPayload>(EMPTY_CORRECTION_FORM);
  const [correctionRequests, setCorrectionRequests] = useState<DtrCorrectionRequest[]>([]);
  const [selectedCorrection, setSelectedCorrection] = useState<DtrCorrectionRequest | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [reverseReason, setReverseReason] = useState("");
  const [correctionQuery, setCorrectionQuery] = useState("");
  const [correctionStatus, setCorrectionStatus] = useState<DtrCorrectionStatus | "all">("all");
  const [correctionType, setCorrectionType] = useState<"all" | "Times" | "Label">("all");
  const [showImportDialog, setShowImportDialog] = useState(false);

  const [showImportAllDialog, setShowImportAllDialog] = useState(false);
  const [massImportSource, setMassImportSource] = useState<"biometric" | "file">("biometric");
  const [massImportFile, setMassImportFile] = useState<File | null>(null);
  const [massImportBiometricId, setMassImportBiometricId] = useState("");
  const [massImportStartDate, setMassImportStartDate] = useState(from);
  const [massImportEndDate, setMassImportEndDate] = useState(to);
  const [showBiometricDialog, setShowBiometricDialog] = useState(false);
  const [editingBiometricDevice, setEditingBiometricDevice] = useState<BiometricDevice | null>(
    null,
  );
  const [biometricDeviceToDelete, setBiometricDeviceToDelete] = useState<BiometricDevice | null>(
    null,
  );
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showMassPrintDialog, setShowMassPrintDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editing, setEditing] = useState<DtrEntry | null>(null);
  const [form, setForm] = useState<DtrPayload>(EMPTY_DTR_FORM);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSource, setImportSource] = useState<"biometric" | "file">("biometric");
  const [importSearch, setImportSearch] = useState("");
  const [filterEmployeeSearch, setFilterEmployeeSearch] = useState("");
  const [formEmployeeSearch, setFormEmployeeSearch] = useState("");
  const [exportEmployeeSearch, setExportEmployeeSearch] = useState("");
  const [exportNoterSearch, setExportNoterSearch] = useState("");
  const [scheduleDepartment, setScheduleDepartment] = useState("all");
  const [scheduleEmployeeSearch, setScheduleEmployeeSearch] = useState("");
  const [selectedImportEmployeeId, setSelectedImportEmployeeId] = useState("");
  const [biometricDevices, setBiometricDevices] = useState<BiometricDevice[]>([]);
  const [selectedBiometricId, setSelectedBiometricId] = useState("");
  const [deviceStatus, setDeviceStatus] = useState<Record<string, "online" | "offline">>({});
  const [checkingBiometricDeviceId, setCheckingBiometricDeviceId] = useState("");
  const [unimportedCount, setUnimportedCount] = useState<number | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<BiometricRealtimeStatus["status"] | null>(
    null,
  );
  const [realtimeQueue, setRealtimeQueue] = useState<BiometricRealtimeStatus["queue"] | null>(null);
  const [realtimeLogs, setRealtimeLogs] = useState<BiometricRealtimeLog[]>([]);
  const [showRealtimeLogs, setShowRealtimeLogs] = useState(false);
  const [manualSyncDeviceId, setManualSyncDeviceId] = useState("all");
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
    useSecondPeriod: true,
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
    listDtr({
      employeeId: selectedEmployeeId,
      from,
      to,
      q: isEmployee ? "" : q,
      recordSearch: debouncedRecordSearch,
      page: dtrPage,
      pageSize: dtrPageSize,
    })
      .then((result) => {
        setEntries(result.entries);
        const nextPagination = result.pagination || {
          total: result.summary.total,
          page: dtrPage,
          pageSize: dtrPageSize,
          totalPages: Math.max(1, Math.ceil(result.summary.total / dtrPageSize)),
        };
        setDtrPagination(nextPagination);
        if (nextPagination.total > 0 && dtrPage > nextPagination.totalPages) {
          setDtrPage(nextPagination.totalPages);
        }
      })
      .catch((err) => toast.error(err.message || "Unable to load DTR"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [
    selectedEmployeeId,
    from,
    to,
    q,
    debouncedRecordSearch,
    dtrPage,
    dtrPageSize,
    isEmployee,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedRecordSearch(recordSearch.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [recordSearch]);

  useEffect(() => {
    setDtrPage(1);
  }, [selectedEmployeeId, from, to, q, debouncedRecordSearch, dtrPageSize]);

  const loadCorrections = () => {
    if (!canApprove && !isEmployee) {
      setCorrectionRequests([]);
      return;
    }
    listDtrCorrectionRequests({
      employeeId: isEmployee ? undefined : selectedEmployeeId,
      status: correctionStatus === "all" ? undefined : correctionStatus,
      requestType: correctionType === "all" ? undefined : correctionType,
      q: correctionQuery,
      from,
      to,
    })
      .then((result) => setCorrectionRequests(result.requests))
      .catch((error) => toast.error(error.message || "Unable to load DTR requests"));
  };

  useEffect(loadCorrections, [
    canApprove,
    isEmployee,
    selectedEmployeeId,
    correctionStatus,
    correctionType,
    correctionQuery,
    from,
    to,
  ]);
  useRealtimeRefresh(() => {
    load();
    loadCorrections();
  }, ["attendance"]);

  useEffect(() => {
    if (!canManage && !canReadHrRecords(user?.role)) return;
    let cancelled = false;

    const loadEmployees = async () => {
      const pageSize = 100;
      const loadedEmployees: EmployeeRecord[] = [];
      let page = 1;
      let total = 0;

      do {
        const result = await listEmployees({ page, pageSize });
        total = result.total;
        loadedEmployees.push(...result.employees);
        page += 1;
      } while (loadedEmployees.length < total);

      if (!cancelled) setEmployees(loadedEmployees);
    };

    loadEmployees().catch(() => {
      if (!cancelled) setEmployees([]);
    });

    return () => {
      cancelled = true;
    };
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
    if (!canManage) return;
    let cancelled = false;
    let logOffset = 0;

    const loadRealtime = async () => {
      try {
        const [statusResult, logsResult] = await Promise.all([
          getBiometricRealtimeStatus(),
          getBiometricRealtimeLogs(logOffset),
        ]);
        if (cancelled) return;
        setRealtimeStatus(statusResult.status);
        setRealtimeQueue(statusResult.queue);
        setBiometricDevices(statusResult.devices);
        setManualSyncDeviceId((current) => {
          if (current !== "all") return current;
          return statusResult.devices.some((device) => device.active) ? "all" : current;
        });
        if (logsResult.logs.length) {
          setRealtimeLogs((current) => [...current, ...logsResult.logs].slice(-80));
          logOffset = logsResult.total;
        }
      } catch {
        if (!cancelled) {
          setRealtimeStatus((current) => current || null);
        }
      }
    };

    loadRealtime();
    const timer = window.setInterval(loadRealtime, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [canManage]);

  useEffect(() => {
    if (!showImportDialog || !canManage) return;
    listBiometricDevices()
      .then((result) => {
        setBiometricDevices(result.devices);
        setSelectedBiometricId(
          (current) => current || result.devices.find((device) => device.active)?.id || "",
        );
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
  const filteredEmployeeOptions = useMemo(
    () => filterEmployeeOptions(employeeOptions, filterEmployeeSearch),
    [employeeOptions, filterEmployeeSearch],
  );
  const filteredFormEmployeeOptions = useMemo(
    () => filterEmployeeOptions(employeeOptions, formEmployeeSearch),
    [employeeOptions, formEmployeeSearch],
  );
  const filteredExportEmployeeOptions = useMemo(
    () => filterEmployeeOptions(employeeOptions, exportEmployeeSearch),
    [employeeOptions, exportEmployeeSearch],
  );
  const scheduleDepartments = useMemo(
    () =>
      Array.from(new Set(employees.map((employee) => employee.department).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }),
      ),
    [employees],
  );
  const scheduleEmployeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        id: employee.id,
        label: `${employee.lastname}, ${employee.firstname} (${employee.employeeId})`,
        department: employee.department || "",
      })),
    [employees],
  );
  const filteredScheduleEmployeeOptions = useMemo(() => {
    const search = scheduleEmployeeSearch.trim().toLowerCase();
    return scheduleEmployeeOptions.filter((employee) => {
      const matchesDepartment =
        scheduleDepartment === "all" || employee.department === scheduleDepartment;
      const matchesSearch = !search || employee.label.toLowerCase().includes(search);
      return matchesDepartment && matchesSearch;
    });
  }, [scheduleDepartment, scheduleEmployeeOptions, scheduleEmployeeSearch]);
  const filteredExportNoters = useMemo(() => {
    const search = exportNoterSearch.trim().toLowerCase();
    if (!search) return noters;
    return noters.filter((noter) =>
      [noter.signatory, noter.name, noter.position, noter.office]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [noters, exportNoterSearch]);

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

  const openCorrection = (entry: DtrEntry, requestType: "Times" | "Label") => {
    setCorrectionForm({
      ...EMPTY_CORRECTION_FORM,
      employeeId: isEmployee ? user?.employeeId : entry.employeeId || selectedEmployeeId,
      workDate: entry.workDate,
      requestType,
      amIn: entry.amIn || "",
      amOut: entry.amOut || "",
      pmIn: entry.pmIn || "",
      pmOut: entry.pmOut || "",
      label: requestType === "Label" ? entry.displayLabel || "" : "",
    });
    setShowCorrectionDialog(true);
  };

  const openActivityLabelRequest = () => {
    setCorrectionForm({
      ...EMPTY_CORRECTION_FORM,
      employeeId: isEmployee ? user?.employeeId : selectedEmployeeId,
      workDate: formatLocalDate(new Date()),
      requestType: "Label",
    });
    setShowCorrectionDialog(true);
  };

  const submitCorrection = async () => {
    if (!correctionForm.workDate) {
      toast.error("Select a DTR date");
      return;
    }
    if (correctionForm.requestType === "Label" && !correctionForm.label?.trim()) {
      toast.error("Enter the DTR activity label");
      return;
    }
    if (!correctionForm.reason.trim()) {
      toast.error("Enter the reason for the DTR correction");
      return;
    }
    try {
      setBusy(true);
      await createDtrCorrectionRequest(correctionForm);
      toast.success("DTR correction request submitted");
      setShowCorrectionDialog(false);
      loadCorrections();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const reviewCorrection = (request: DtrCorrectionRequest) => {
    setSelectedCorrection(request);
    setReviewRemarks(request.reviewRemarks || "");
    setReverseReason("");
  };

  const decideCorrection = async (status: "Approved" | "Disapproved") => {
    if (!selectedCorrection) return;
    try {
      setBusy(true);
      const result = await decideDtrCorrectionRequest(selectedCorrection.id, {
        status,
        reviewRemarks,
      });
      setSelectedCorrection(result.request);
      toast.success(`DTR request ${status.toLowerCase()}`);
      load();
      loadCorrections();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const reverseCorrection = async () => {
    if (!selectedCorrection) return;
    try {
      setBusy(true);
      const result = await reverseDtrCorrectionRequest(selectedCorrection.id, reverseReason);
      setSelectedCorrection(result.request);
      toast.success("DTR approval reversed");
      load();
      loadCorrections();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

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
    const selectedDevice = result.devices.find((device) => device.id === selectId && device.active);
    const fallbackDevice = result.devices.find((device) => device.active);
    setSelectedBiometricId(selectedDevice?.id || fallbackDevice?.id || "");
    setMassImportBiometricId((current) => {
      const currentDevice = result.devices.find((device) => device.id === current && device.active);
      return currentDevice?.id || selectedDevice?.id || fallbackDevice?.id || "";
    });
    setManualSyncDeviceId((current) => {
      if (current === "all") return current;
      return result.devices.some((device) => device.id === current && device.active)
        ? current
        : "all";
    });
  };

  const checkBiometricDevice = async (device: BiometricDevice | undefined) => {
    if (!device) {
      toast.error("Select a biometric device first");
      return;
    }
    setCheckingBiometricDeviceId(device.id);
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
    } finally {
      setCheckingBiometricDeviceId("");
    }
  };

  const checkSelectedDevice = async () => {
    await checkBiometricDevice(biometricDevices.find((item) => item.id === selectedBiometricId));
  };

  const runManualBiometricSync = async () => {
    setBusy(true);
    try {
      const result = await syncBiometricNow({
        deviceId: manualSyncDeviceId === "all" ? undefined : manualSyncDeviceId,
        from,
        to,
      });
      setRealtimeStatus(result.status);
      toast.success(
        `Biometric sync complete: ${result.recordsInserted} of ${result.recordsFetched} punch(es) imported`,
      );
      if (result.errors?.length) toast.warning(`${result.errors.length} device(s) need checking`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to sync biometric devices");
    } finally {
      setBusy(false);
    }
  };

  const openAddBiometricDevice = () => {
    setEditingBiometricDevice(null);
    setDeviceForm({ name: "", ip_address: "", port: "4370", active: true });
    setShowBiometricDialog(true);
  };

  const openEditBiometricDevice = (device: BiometricDevice) => {
    setEditingBiometricDevice(device);
    setDeviceForm({
      name: device.name,
      ip_address: device.ip_address,
      port: String(device.port || 4370),
      active: device.active,
    });
    setShowBiometricDialog(true);
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
      const payload = {
        name,
        ip_address: ipAddress,
        port,
        active: deviceForm.active,
      };
      const result = editingBiometricDevice
        ? await updateBiometricDevice(editingBiometricDevice.id, payload)
        : await createBiometricDevice(payload);
      toast.success(editingBiometricDevice ? "Biometric device updated" : "Biometric device added");
      setShowBiometricDialog(false);
      setEditingBiometricDevice(null);
      setDeviceForm({ name: "", ip_address: "", port: "4370", active: true });
      await reloadBiometricDevices(result.device.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save biometric device");
    } finally {
      setBusy(false);
    }
  };

  const toggleBiometricDevice = async (device: BiometricDevice, active: boolean) => {
    setBusy(true);
    try {
      await updateBiometricDevice(device.id, {
        name: device.name,
        ip_address: device.ip_address,
        port: device.port,
        active,
      });
      toast.success(active ? "Biometric device activated" : "Biometric device deactivated");
      await reloadBiometricDevices(active ? device.id : "");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update biometric device");
    } finally {
      setBusy(false);
    }
  };

  const removeBiometricDevice = async () => {
    if (!biometricDeviceToDelete) return;
    setBusy(true);
    try {
      await deleteBiometricDevice(biometricDeviceToDelete.id);
      toast.success("Biometric device deleted");
      setDeviceStatus((current) => {
        const next = { ...current };
        delete next[biometricDeviceToDelete.id];
        return next;
      });
      if (selectedBiometricId === biometricDeviceToDelete.id) setSelectedBiometricId("");
      if (massImportBiometricId === biometricDeviceToDelete.id) setMassImportBiometricId("");
      if (manualSyncDeviceId === biometricDeviceToDelete.id) setManualSyncDeviceId("all");
      setBiometricDeviceToDelete(null);
      await reloadBiometricDevices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete biometric device");
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
      useSecondPeriod: true,
    }));
    setShowExportDialog(true);
  };

  const openMassPrint = () => {
    setShowMassPrintDialog(true);
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
    const previewWindow = openGeneratedFileTab("Preparing DTR PDF preview...");
    setBusy(true);
    try {
      const result = await generateDtrPdf(payload);
      openGeneratedFile(result.previewUrl, previewWindow);
      toast.success(`DTR PDF generated with ${result.rowCount} row(s)`);
      setShowExportDialog(false);
    } catch (err) {
      closeGeneratedFileTab(previewWindow);
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

  const generatePdf = async () => {
    const payload = buildDtrExportPayload();
    if (!payload) return;
    const previewWindow = openGeneratedFileTab("Preparing DTR PDF preview...");
    setBusy(true);
    try {
      const result = await generateDtrPdf(payload);
      openGeneratedFile(result.previewUrl, previewWindow);
      toast.success(`DTR PDF generated with ${result.rowCount} row(s)`);
      setShowExportDialog(false);
    } catch (err) {
      closeGeneratedFileTab(previewWindow);
      toast.error(err instanceof Error ? err.message : "Unable to generate DTR PDF");
    } finally {
      setBusy(false);
    }
  };

  const activeBiometricDevices = biometricDevices.filter((device) => device.active);
  const realtimeState = realtimeStatus?.status || "idle";
  const realtimeBadgeClass =
    realtimeState === "syncing"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : realtimeState === "failed"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : realtimeState === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-700";
  const dtrTotal = dtrPagination.total;
  const dtrTotalPages = Math.max(1, dtrPagination.totalPages);
  const dtrStart = dtrTotal === 0 ? 0 : (dtrPagination.page - 1) * dtrPagination.pageSize + 1;
  const dtrEnd = Math.min(dtrTotal, dtrStart + entries.length - 1);
  const dtrRangeLabel = formatDtrRangeLabel(from, to);
  const shiftDateRange = (days: number) => {
    setFrom((value) => shiftDateString(value, days));
    setTo((value) => shiftDateString(value, days));
    setDtrPage(1);
  };

  return (
    <AppShell
      title={isEmployee ? "My Attendance" : "Attendance DTR"}
      subtitle={
        isEmployee
          ? "View your daily time record and preview your DTR when needed"
          : "Import, refresh, view, edit, delete, and export daily time records"
      }
    >
      <div className="space-y-4">
        <section className="hidden rounded-xl border border-border bg-card p-4 shadow-sm md:block">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {!isEmployee && (
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold">
                    Employee
                  </Label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 z-10 bg-popover p-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                          <Input
                            value={filterEmployeeSearch}
                            onChange={(event) => setFilterEmployeeSearch(event.target.value)}
                            onKeyDown={(event) => event.stopPropagation()}
                            placeholder="Search employees..."
                            className="h-8 pl-9"
                          />
                        </div>
                      </div>
                      <SelectItem value="all">All employees</SelectItem>
                      {filteredEmployeeOptions.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.label}
                        </SelectItem>
                      ))}
                      {filteredEmployeeOptions.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No employees found.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-muted-foreground font-semibold">
                  From
                </Label>
                <Input
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-muted-foreground font-semibold">To</Label>
                <Input
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  className="h-9"
                />
              </div>
              {!isEmployee && (
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold">
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Name, ID, department"
                      value={q}
                      onChange={(event) => setQ(event.target.value)}
                      className="h-9 pl-9"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="mobile-action-row flex flex-wrap items-center justify-end gap-2 border-t border-border/50 pt-4 mt-2">
              <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-9">
                <RefreshCw className="mr-1.5 h-4 w-4" /> Reload
              </Button>
              {canManage && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    disabled={busy}
                    className="h-9"
                  >
                    <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh DTR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowScheduleDialog(true)}
                    disabled={busy}
                    className="h-9"
                  >
                    <Settings2 className="mr-1.5 h-4 w-4" /> Schedule
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openImportAll}
                    disabled={busy}
                    className="h-9"
                  >
                    <Upload className="mr-1.5 h-4 w-4" /> Import DTR
                  </Button>
                  <Button variant="outline" size="sm" onClick={openAdd} className="h-9">
                    <Plus className="mr-1.5 h-4 w-4" /> Add DTR
                  </Button>
                </>
              )}
              {isEmployee ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openExport}
                  disabled={busy}
                  className="h-9"
                >
                  <FileText className="mr-1.5 h-4 w-4" />
                  View DTR PDF
                </Button>
              ) : (
                <>
                  {canManage && (
                    <Button variant="outline" size="sm" onClick={openImport} className="h-9">
                      <Upload className="mr-1.5 h-4 w-4" /> Import Single DTR
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={openExport} className="h-9">
                    <FileSpreadsheet className="mr-1.5 h-4 w-4" /> View DTR
                  </Button>
                  <Button variant="outline" size="sm" onClick={openMassPrint} className="h-9">
                    <FileDown className="mr-1.5 h-4 w-4" /> Mass Export
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-3 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => shiftDateRange(-1)}
            className="h-11 w-11 rounded-xl bg-white shadow-sm"
            aria-label="Previous date range"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-[#334155] shadow-sm">
            <span className="truncate">{dtrRangeLabel}</span>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => shiftDateRange(1)}
            className="h-11 w-11 rounded-xl bg-white shadow-sm"
            aria-label="Next date range"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="records" className="space-y-3 md:space-y-4">
          <TabsList className="h-auto w-full justify-start overflow-x-auto border border-border bg-muted/50 p-1">
            <TabsTrigger
              value="records"
              className="flex flex-1 items-center gap-2 py-2 md:flex-none"
            >
              <CalendarClock className="hidden h-4 w-4 md:block" />
              Daily Time Records
            </TabsTrigger>
            {(canApprove || isEmployee) && (
              <TabsTrigger
                value="corrections"
                className="flex flex-1 items-center gap-2 py-2 md:flex-none"
              >
                <FileText className="hidden h-4 w-4 md:block" />
                Corrections
              </TabsTrigger>
            )}
            {canManage && (
              <TabsTrigger
                value="biometrics"
                className="flex flex-1 items-center gap-2 py-2 md:flex-none"
              >
                <RadioTower className="hidden h-4 w-4 md:block" />
                Biometric
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent
            value="biometrics"
            className="m-0 focus-visible:outline-none focus-visible:ring-0"
          >
            {canManage && (
              <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <RadioTower className="h-4 w-4 text-emerald-700" />
                        <div>
                          <h2 className="text-sm font-semibold text-foreground">
                            Real-Time Biometric
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            ADMS receiver on port {realtimeStatus?.admsPort || 6000}; active devices
                            are synced by biometric ID or employee number.
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={realtimeBadgeClass}>
                        <Activity className="mr-1 h-3.5 w-3.5" />
                        {realtimeState}
                      </Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      <RealtimeStat label="Active Devices" value={activeBiometricDevices.length} />
                      <RealtimeStat label="Fetched" value={realtimeStatus?.recordsFetched || 0} />
                      <RealtimeStat label="Imported" value={realtimeStatus?.recordsInserted || 0} />
                      <RealtimeStat
                        label="DTR Queue"
                        value={realtimeQueue?.pendingEmployees || 0}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                      <div className="space-y-1.5">
                        <Label>Manual Sync Device</Label>
                        <Select value={manualSyncDeviceId} onValueChange={setManualSyncDeviceId}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All active devices</SelectItem>
                            {biometricDevices.map((device) => (
                              <SelectItem
                                key={device.id}
                                value={device.id}
                                disabled={!device.active}
                              >
                                {device.name} - {device.ip_address}:{device.port}
                                {!device.active ? " (Inactive)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowRealtimeLogs((value) => !value)}
                      >
                        <SquareTerminal className="mr-1.5 h-4 w-4" />
                        {showRealtimeLogs ? "Hide Logs" : "Logs"}
                      </Button>
                      <Button
                        onClick={runManualBiometricSync}
                        disabled={
                          busy || !activeBiometricDevices.length || realtimeState === "syncing"
                        }
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <RefreshCw className="mr-1.5 h-4 w-4" />
                        Sync Now
                      </Button>
                    </div>

                    <div className="rounded-md border border-border">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            Biometric Devices
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Manage device names, network addresses, ports, and sync availability.
                          </p>
                        </div>
                        <Button type="button" size="sm" onClick={openAddBiometricDevice}>
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Add Device
                        </Button>
                      </div>

                      {biometricDevices.length ? (
                        <div className="divide-y divide-border">
                          {biometricDevices.map((device) => (
                            <div
                              key={device.id}
                              className="grid gap-3 px-3 py-3 md:grid-cols-[1fr_auto] md:items-center"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-medium text-foreground">
                                    {device.name}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={
                                      device.active
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 bg-slate-50 text-slate-600"
                                    }
                                  >
                                    {device.active ? "Active" : "Inactive"}
                                  </Badge>
                                  {deviceStatus[device.id] && (
                                    <Badge
                                      variant="outline"
                                      className={
                                        deviceStatus[device.id] === "online"
                                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                          : "border-rose-200 bg-rose-50 text-rose-700"
                                      }
                                    >
                                      {deviceStatus[device.id]}
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {device.ip_address}:{device.port}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                                <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
                                  <Label
                                    htmlFor={`biometric-active-${device.id}`}
                                    className="text-xs text-muted-foreground"
                                  >
                                    Active
                                  </Label>
                                  <Switch
                                    id={`biometric-active-${device.id}`}
                                    checked={device.active}
                                    disabled={busy}
                                    onCheckedChange={(checked) =>
                                      toggleBiometricDevice(device, checked)
                                    }
                                  />
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedBiometricId(device.id);
                                    void checkBiometricDevice(device);
                                  }}
                                  disabled={busy || checkingBiometricDeviceId === device.id}
                                >
                                  {checkingBiometricDeviceId === device.id ? (
                                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                  ) : null}
                                  {checkingBiometricDeviceId === device.id
                                    ? "Checking..."
                                    : "Check"}
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="Edit device"
                                  onClick={() => openEditBiometricDevice(device)}
                                  disabled={busy}
                                  className="h-9 w-9"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="Delete device"
                                  onClick={() => setBiometricDeviceToDelete(device)}
                                  disabled={busy}
                                  className="h-9 w-9"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                          No biometric devices configured. Add a device, then point ADMS devices to
                          this computer on port {realtimeStatus?.admsPort || 6000}.
                        </p>
                      )}
                    </div>
                  </div>

                  {showRealtimeLogs && (
                    <div className="rounded-md border border-border bg-muted/30">
                      <div className="flex items-center justify-between border-b border-border px-3 py-2">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Recent Events
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {realtimeStatus?.lastSyncTime
                            ? new Date(realtimeStatus.lastSyncTime).toLocaleString()
                            : "Waiting for ADMS"}
                        </p>
                      </div>
                      <div className="max-h-56 overflow-y-auto px-3 py-2 font-mono text-xs">
                        {realtimeLogs.length ? (
                          realtimeLogs
                            .slice()
                            .reverse()
                            .map((log, index) => (
                              <div key={`${log.time}-${index}`} className="mb-1 flex gap-2">
                                <span className="shrink-0 text-muted-foreground">
                                  {new Date(log.time).toLocaleTimeString()}
                                </span>
                                <span
                                  className={
                                    log.level === "error"
                                      ? "text-rose-600"
                                      : log.level === "warn"
                                        ? "text-amber-600"
                                        : log.level === "success"
                                          ? "text-emerald-600"
                                          : "text-foreground"
                                  }
                                >
                                  {log.message}
                                </span>
                              </div>
                            ))
                        ) : (
                          <p className="py-6 text-center font-sans text-sm text-muted-foreground">
                            No biometric events yet.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </TabsContent>

          <TabsContent
            value="corrections"
            className="m-0 focus-visible:outline-none focus-visible:ring-0"
          >
            {(canApprove || isEmployee) && (
              <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">DTR Correction Audit</h2>
                    <p className="text-xs text-muted-foreground">
                      Original, requested, applied, and reversal history
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 border-b border-border p-4 md:grid-cols-3">
                  <Input
                    value={correctionQuery}
                    onChange={(event) => setCorrectionQuery(event.target.value)}
                    placeholder="Search employee, reason, or remarks"
                  />
                  <Select
                    value={correctionStatus}
                    onValueChange={(value) =>
                      setCorrectionStatus(value as DtrCorrectionStatus | "all")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {(
                        ["Pending", "Approved", "Disapproved", "Cancelled", "Reversed"] as const
                      ).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={correctionType}
                    onValueChange={(value) => setCorrectionType(value as typeof correctionType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All request types</SelectItem>
                      <SelectItem value="Times">Time Correction</SelectItem>
                      <SelectItem value="Label">DTR Activity Label</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Request</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {correctionRequests.map((request) => (
                        <tr key={request.id} className="border-t border-border">
                          <td className="px-4 py-3">
                            <p className="font-medium">{request.employeeName}</p>
                            <p className="text-xs text-muted-foreground">{request.employeeNo}</p>
                          </td>
                          <td className="px-4 py-3">{request.workDate}</td>
                          <td className="px-4 py-3">
                            {request.requestType === "Label" ? "DTR Label" : "Time Correction"}
                          </td>
                          <td className="max-w-[260px] truncate px-4 py-3 text-muted-foreground">
                            {request.reason}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={CORRECTION_STATUS_CLASS[request.status]}
                            >
                              {request.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => reviewCorrection(request)}
                            >
                              {request.status === "Pending" && canApprove ? "Review" : "View Audit"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {!correctionRequests.length && (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                            No DTR correction requests found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </TabsContent>

          <TabsContent
            value="records"
            className="m-0 focus-visible:outline-none focus-visible:ring-0"
          >
            <section className="overflow-hidden border-0 bg-transparent shadow-none md:rounded-xl md:border md:border-border md:bg-card md:shadow-sm">
              <div className="hidden flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:flex">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-blue-700" />
                  <h2 className="text-sm font-semibold text-foreground">Daily Time Records</h2>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={recordSearch}
                      onChange={(event) => setRecordSearch(event.target.value)}
                      placeholder="Search DTR records"
                      className="h-9 pl-9"
                    />
                  </div>
                  <p className="whitespace-nowrap text-xs text-muted-foreground">
                    {loading
                      ? "Loading..."
                      : dtrTotal
                        ? `Showing ${dtrStart}-${dtrEnd} of ${dtrTotal}`
                        : "0 record(s)"}
                  </p>
                  {isEmployee && (
                    <Button variant="outline" size="sm" onClick={openActivityLabelRequest}>
                      <Plus className="mr-1.5 h-4 w-4" />
                      Add DTR Activity Label
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 md:hidden">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={recordSearch}
                    onChange={(event) => setRecordSearch(event.target.value)}
                    placeholder="Search DTR records..."
                    className="h-11 rounded-xl bg-white pl-10 shadow-sm"
                  />
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {loading
                    ? "Loading..."
                    : dtrTotal
                      ? `Showing ${dtrStart}-${dtrEnd} of ${dtrTotal}`
                      : "0 record(s)"}
                </p>
              </div>

              <div className="mobile-record-list">
                {entries.map((entry, index) => {
                  const nameParts = entry.employeeName
                    .split(/[\s,]+/)
                    .filter(Boolean)
                    .slice(0, 2);
                  const initials =
                    nameParts
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase() ||
                    entry.employeeName.slice(0, 2).toUpperCase() ||
                    "DT";
                  const avatarClasses = [
                    "bg-blue-100 text-blue-700",
                    "bg-indigo-100 text-indigo-700",
                    "bg-violet-100 text-violet-700",
                    "bg-emerald-100 text-emerald-700",
                  ];
                  const avatarClass = avatarClasses[index % avatarClasses.length];

                  return (
                    <article
                      key={entry.id}
                      className="grid grid-cols-[2.75rem_minmax(0,1fr)_7.8rem_1.25rem] items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-sm"
                    >
                      <div
                        className={`grid h-10 w-10 place-items-center rounded-full text-xs font-extrabold ${avatarClass}`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-extrabold text-[#111827]">
                          {entry.employeeName}
                        </h3>
                        <p className="truncate text-xs font-medium text-muted-foreground">
                          {entry.department || "No office"}
                        </p>
                        <p className="mt-1 text-xs font-medium text-[#53637f]">{entry.workDate}</p>
                      </div>

                      {entry.displayLabel ? (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-3 text-center text-xs font-semibold text-blue-800">
                          {entry.displayLabel}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-center">
                          <DtrMobileTime label="AM In" value={formatDtrTime(entry.amIn)} />
                          <DtrMobileTime label="AM Out" value={formatDtrTime(entry.amOut)} />
                          <DtrMobileTime label="PM In" value={formatDtrTime(entry.pmIn)} />
                          <DtrMobileTime
                            label="Tardiness"
                            value={entry.lateMinutes ? `${entry.lateMinutes}m` : "-"}
                            danger={Boolean(entry.lateMinutes)}
                          />
                        </div>
                      )}

                      {isEmployee ? (
                        <button
                          type="button"
                          onClick={() => openCorrection(entry, "Times")}
                          title="Correct Time Entries"
                          aria-label={`Correct time entries for ${entry.workDate}`}
                          className="grid h-8 w-5 place-items-center text-[#64748b]"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : canManage ? (
                        <button
                          type="button"
                          onClick={() => openEdit(entry)}
                          title="Edit DTR"
                          aria-label={`Edit DTR for ${entry.workDate}`}
                          className="grid h-8 w-5 place-items-center text-[#64748b]"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[#64748b]" />
                      )}
                    </article>
                  );
                })}
                {!entries.length && !loading && (
                  <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    {debouncedRecordSearch
                      ? "No DTR records match this table search."
                      : "No DTR records found for this filter."}
                  </div>
                )}
              </div>

              <div className="pb-1 md:hidden">
                <Button
                  type="button"
                  onClick={canManage ? refresh : load}
                  disabled={busy || loading}
                  className="h-12 w-full rounded-xl bg-[#0b57d0] text-sm font-bold text-white shadow-[0_10px_18px_rgba(11,87,208,0.18)] hover:bg-[#0647ad]"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh DTR
                </Button>
              </div>

              <div className="mobile-desktop-table overflow-x-auto">
                <table className="w-full min-w-[1180px] table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[120px]" />
                    <col className="w-[240px]" />
                    <col className="w-[280px]" />
                    <col className="w-[120px]" />
                    <col className="w-[95px]" />
                    <col className="w-[95px]" />
                    <col className="w-[95px]" />
                    <col className="w-[95px]" />
                    <col className="w-[120px]" />
                    {(canManage || isEmployee) && <col className="w-[120px]" />}
                  </colgroup>
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Biometric ID</th>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Office</th>
                      <th className="px-4 py-3 text-center font-semibold">Date</th>
                      <th className="px-3 py-3 text-center font-semibold">AM In</th>
                      <th className="px-3 py-3 text-center font-semibold">AM Out</th>
                      <th className="px-3 py-3 text-center font-semibold">PM In</th>
                      <th className="px-3 py-3 text-center font-semibold">PM Out</th>
                      <th className="px-3 py-3 text-center font-semibold">Tardiness</th>
                      {(canManage || isEmployee) && (
                        <th className="px-3 py-3 text-right font-semibold">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="border-t border-border">
                        <td className="px-4 py-3 font-medium text-muted-foreground">
                          {entry.biometricId || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <p className="truncate font-medium text-foreground">
                            {entry.employeeName}
                          </p>
                        </td>
                        <td className="truncate px-4 py-3 text-muted-foreground">
                          {entry.department || "-"}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-foreground">
                          {entry.workDate}
                        </td>
                        {entry.displayLabel ? (
                          <td
                            colSpan={4}
                            className="bg-blue-50 px-4 py-3 text-center font-semibold text-blue-800"
                          >
                            {entry.displayLabel}
                          </td>
                        ) : (
                          <>
                            <td className="px-3 py-3 text-center font-medium text-emerald-600">
                              {formatDtrTime(entry.amIn)}
                            </td>
                            <td className="px-3 py-3 text-center font-medium text-emerald-600">
                              {formatDtrTime(entry.amOut)}
                            </td>
                            <td className="px-3 py-3 text-center font-medium text-emerald-600">
                              {formatDtrTime(entry.pmIn)}
                            </td>
                            <td className="px-3 py-3 text-center font-medium text-emerald-600">
                              {formatDtrTime(entry.pmOut)}
                            </td>
                          </>
                        )}
                        <td className="px-3 py-3 text-center font-medium text-destructive">
                          {entry.lateMinutes ? `${entry.lateMinutes} min` : "-"}
                        </td>
                        {(canManage || isEmployee) && (
                          <td className="px-3 py-3">
                            <div className="flex flex-nowrap items-center justify-end gap-2">
                              {isEmployee && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openCorrection(entry, "Times")}
                                  title="Correct Time Entries"
                                  aria-label={`Correct time entries for ${entry.workDate}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {canManage && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEdit(entry)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => remove(entry)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {!entries.length && !loading && (
                      <tr>
                        <td
                          colSpan={canManage || isEmployee ? 10 : 9}
                          className="px-4 py-10 text-center text-muted-foreground"
                        >
                          {debouncedRecordSearch
                            ? "No DTR records match this table search."
                            : "No DTR records found for this filter."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="hidden flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:flex">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Page {dtrPagination.page} of {dtrTotalPages}
                  </span>
                  <span className="hidden sm:inline">-</span>
                  <span>
                    {dtrTotal ? `${dtrStart}-${dtrEnd} of ${dtrTotal} record(s)` : "No records"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Select
                    value={String(dtrPageSize)}
                    onValueChange={(value) => {
                      setDtrPageSize(Number(value));
                      setDtrPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DTR_PAGE_SIZE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option} / page
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    disabled={loading || dtrPagination.page <= 1}
                    onClick={() => setDtrPage((page) => Math.max(1, page - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    disabled={loading || dtrPagination.page >= dtrTotalPages}
                    onClick={() => setDtrPage((page) => Math.min(dtrTotalPages, page + 1))}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>
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
                  <div className="sticky top-0 z-10 bg-popover p-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                      <Input
                        value={formEmployeeSearch}
                        onChange={(event) => setFormEmployeeSearch(event.target.value)}
                        onKeyDown={(event) => event.stopPropagation()}
                        placeholder="Search employees..."
                        className="h-8 pl-9"
                      />
                    </div>
                  </div>
                  {filteredFormEmployeeOptions.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.label}
                    </SelectItem>
                  ))}
                  {filteredFormEmployeeOptions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No employees found.
                    </div>
                  )}
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
                <Select
                  value={importSource}
                  onValueChange={(value: "biometric" | "file") => setImportSource(value)}
                >
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
                      onClick={openAddBiometricDevice}
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
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={checkSelectedDevice}
                      disabled={Boolean(checkingBiometricDeviceId)}
                    >
                      {checkingBiometricDeviceId === selectedBiometricId ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      {checkingBiometricDeviceId === selectedBiometricId ? "Checking..." : "Check"}
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
                <Field
                  label="Start Date"
                  type="date"
                  value={importStartDate}
                  onChange={setImportStartDate}
                />
                <Field
                  label="End Date"
                  type="date"
                  value={importEndDate}
                  onChange={setImportEndDate}
                />
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
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {busy ? "Importing..." : "Import Single DTR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* MASS IMPORT DTR (all employees) */}
      <Dialog open={showImportAllDialog} onOpenChange={setShowImportAllDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import DTR</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Import attendance for{" "}
              <span className="font-semibold text-foreground">all employees</span> from a biometric
              device or file. DTR records are automatically refreshed after import.
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
                    onClick={openAddBiometricDevice}
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
                        {device.name} - {device.ip_address}:{device.port}
                        {!device.active ? " (Inactive)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!biometricDevices.length && (
                  <p className="text-xs text-muted-foreground">
                    No biometric devices configured yet.
                  </p>
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
                    TXT, XLSX, or DAT - max 10 MB
                  </span>
                  <Input
                    type="file"
                    accept=".txt,.xlsx,.xls,.dat"
                    className="hidden"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
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
              <Field
                label="Start Date"
                type="date"
                value={massImportStartDate}
                onChange={setMassImportStartDate}
              />
              <Field
                label="End Date"
                type="date"
                value={massImportEndDate}
                onChange={setMassImportEndDate}
              />
            </div>

            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              <strong>All employees</strong> - punches are matched by Employee No. or Biometric ID.
              Unmatched records are skipped. DTR is refreshed automatically after import.
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
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {busy ? "Importing..." : "Import DTR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showBiometricDialog}
        onOpenChange={(open) => {
          setShowBiometricDialog(open);
          if (!open) {
            setEditingBiometricDevice(null);
            setDeviceForm({ name: "", ip_address: "", port: "4370", active: true });
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBiometricDevice ? "Edit Biometric Device" : "Add Biometric Device"}
            </DialogTitle>
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
            <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
              <Label htmlFor="biometric-device-active" className="text-sm">
                Active for sync and imports
              </Label>
              <Switch
                id="biometric-device-active"
                checked={deviceForm.active}
                onCheckedChange={(active) => setDeviceForm({ ...deviceForm, active })}
              />
            </div>
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
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              {editingBiometricDevice ? "Save Changes" : "Add Device"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(biometricDeviceToDelete)}
        onOpenChange={(open) => {
          if (!open) setBiometricDeviceToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete biometric device?</AlertDialogTitle>
            <AlertDialogDescription>
              {biometricDeviceToDelete
                ? `${biometricDeviceToDelete.name} will be removed from biometric sync and import device selections. Existing attendance logs will remain unchanged.`
                : "This device will be removed from biometric sync and import device selections."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void removeBiometricDevice();
              }}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Delete Device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="grid max-h-[90vh] w-[calc(100vw-2rem)] grid-rows-[auto_1fr_auto] gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-border px-5 py-4 pr-12">
            <DialogTitle>{isEmployee ? "View DTR PDF" : "View DTR"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 overflow-y-auto px-5 py-4">
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
                    <div className="sticky top-0 z-10 bg-popover p-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                        <Input
                          value={exportEmployeeSearch}
                          onChange={(event) => setExportEmployeeSearch(event.target.value)}
                          onKeyDown={(event) => event.stopPropagation()}
                          placeholder="Search employees..."
                          className="h-8 pl-9"
                        />
                      </div>
                    </div>
                    <SelectItem value="all">Current selected employee</SelectItem>
                    {filteredExportEmployeeOptions.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.label}
                      </SelectItem>
                    ))}
                    {filteredExportEmployeeOptions.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No employees found.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Noter Signatory</Label>
                <Select
                  value={
                    noters.find((item) => item.signatory === exportForm.noterSignatory)?.id || ""
                  }
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
                    <div className="sticky top-0 z-10 bg-popover p-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                        <Input
                          value={exportNoterSearch}
                          onChange={(event) => setExportNoterSearch(event.target.value)}
                          onKeyDown={(event) => event.stopPropagation()}
                          placeholder="Search noters..."
                          className="h-8 pl-9"
                        />
                      </div>
                    </div>
                    {filteredExportNoters.map((noter) => (
                      <SelectItem key={noter.id} value={noter.id}>
                        {noter.signatory} - {noter.position}
                      </SelectItem>
                    ))}
                    {filteredExportNoters.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No noters found.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Noter Position</Label>
                <Input value={exportForm.noterPosition} placeholder="Position title" disabled />
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
          <DialogFooter className="flex-row flex-wrap justify-end gap-2 border-t border-border px-5 py-4 sm:space-x-0">
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            {isEmployee ? (
              <Button
                onClick={viewPdf}
                disabled={busy}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {busy ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-1.5 h-4 w-4" />
                )}
                {busy ? "Generating..." : "View DTR PDF"}
              </Button>
            ) : (
              <>
                <Button onClick={viewPdf} disabled={busy} variant="outline">
                  {busy ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-1.5 h-4 w-4" />
                  )}
                  {busy ? "Generating..." : "View PDF"}
                </Button>
                <Button
                  onClick={exportExcel}
                  disabled={busy}
                  className="border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {busy ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                  )}
                  {busy ? "Generating..." : "Generate Excel"}
                </Button>
                <Button
                  onClick={generatePdf}
                  disabled={busy}
                  className="border-red-600 bg-red-600 text-white hover:bg-red-700"
                >
                  {busy ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-1.5 h-4 w-4" />
                  )}
                  {busy ? "Generating..." : "Generate PDF"}
                </Button>
              </>
            )}
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
                <div className="sticky top-0 z-10 space-y-2 bg-card pb-2">
                  <Select value={scheduleDepartment} onValueChange={setScheduleDepartment}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {scheduleDepartments.map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                    <Input
                      value={scheduleEmployeeSearch}
                      onChange={(event) => setScheduleEmployeeSearch(event.target.value)}
                      placeholder="Search employees..."
                      className="h-8 pl-9"
                    />
                  </div>
                </div>
                <label className="mb-2 flex items-center gap-2 rounded px-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={
                      filteredScheduleEmployeeOptions.length > 0 &&
                      filteredScheduleEmployeeOptions.every((employee) =>
                        scheduleForm.employeeIds.includes(employee.id),
                      )
                    }
                    onChange={(event) => {
                      const visibleEmployeeIds = filteredScheduleEmployeeOptions.map(
                        (employee) => employee.id,
                      );
                      setScheduleForm({
                        ...scheduleForm,
                        employeeIds: event.target.checked
                          ? Array.from(
                              new Set([...scheduleForm.employeeIds, ...visibleEmployeeIds]),
                            )
                          : scheduleForm.employeeIds.filter(
                              (id) => !visibleEmployeeIds.includes(id),
                            ),
                      });
                    }}
                  />
                  Select all visible
                </label>
                <div className="mb-2 px-2 text-xs text-muted-foreground">
                  Showing {filteredScheduleEmployeeOptions.length} employee(s)
                  {scheduleForm.employeeIds.length
                    ? ` - ${scheduleForm.employeeIds.length} selected`
                    : ""}
                </div>
                {filteredScheduleEmployeeOptions.map((employee) => (
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
                {filteredScheduleEmployeeOptions.length === 0 && (
                  <div className="px-2 py-3 text-sm text-muted-foreground">No employees found.</div>
                )}
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
                <Field
                  label="AM In"
                  type="time"
                  value={scheduleForm.amIn}
                  onChange={(amIn) => setScheduleForm({ ...scheduleForm, amIn })}
                />
                <Field
                  label="AM Out"
                  type="time"
                  value={scheduleForm.amOut}
                  onChange={(amOut) => setScheduleForm({ ...scheduleForm, amOut })}
                />
                <Field
                  label="PM In"
                  type="time"
                  value={scheduleForm.pmIn}
                  onChange={(pmIn) => setScheduleForm({ ...scheduleForm, pmIn })}
                />
                <Field
                  label="PM Out"
                  type="time"
                  value={scheduleForm.pmOut}
                  onChange={(pmOut) => setScheduleForm({ ...scheduleForm, pmOut })}
                />
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

      <Dialog open={showCorrectionDialog} onOpenChange={setShowCorrectionDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request DTR Correction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {canManage && (
              <div className="space-y-1.5 md:col-span-2">
                <Label>Employee</Label>
                <Select
                  value={correctionForm.employeeId || ""}
                  onValueChange={(value) =>
                    setCorrectionForm((current) => ({ ...current, employeeId: value }))
                  }
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
            )}
            <div className="space-y-1.5">
              <Label>DTR Date</Label>
              <Input
                type="date"
                max={formatLocalDate(new Date())}
                value={correctionForm.workDate}
                onChange={(event) =>
                  setCorrectionForm((current) => ({ ...current, workDate: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Request Type</Label>
              <Select
                value={correctionForm.requestType}
                onValueChange={(value) =>
                  setCorrectionForm((current) => ({
                    ...current,
                    requestType: value as "Times" | "Label",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Times">Correct Time Entries</SelectItem>
                  <SelectItem value="Label">Add DTR Activity Label</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {correctionForm.requestType === "Times" ? (
              <>
                <Field
                  label="AM In"
                  type="time"
                  value={correctionForm.amIn || ""}
                  onChange={(amIn) => setCorrectionForm((current) => ({ ...current, amIn }))}
                />
                <Field
                  label="AM Out"
                  type="time"
                  value={correctionForm.amOut || ""}
                  onChange={(amOut) => setCorrectionForm((current) => ({ ...current, amOut }))}
                />
                <Field
                  label="PM In"
                  type="time"
                  value={correctionForm.pmIn || ""}
                  onChange={(pmIn) => setCorrectionForm((current) => ({ ...current, pmIn }))}
                />
                <Field
                  label="PM Out"
                  type="time"
                  value={correctionForm.pmOut || ""}
                  onChange={(pmOut) => setCorrectionForm((current) => ({ ...current, pmOut }))}
                />
                <p className="text-xs text-muted-foreground md:col-span-2">
                  Blank original punches are allowed. Leave a requested field blank only when it
                  should remain blank.
                </p>
              </>
            ) : (
              <div className="space-y-1.5 md:col-span-2">
                <Label>Activity Label</Label>
                <Input
                  value={correctionForm.label || ""}
                  placeholder="Example: Attended Seminar in Pasig City"
                  onChange={(event) =>
                    setCorrectionForm((current) => ({ ...current, label: event.target.value }))
                  }
                />
              </div>
            )}
            <div className="space-y-1.5 md:col-span-2">
              <Label>Reason</Label>
              <Textarea
                value={correctionForm.reason}
                onChange={(event) =>
                  setCorrectionForm((current) => ({ ...current, reason: event.target.value }))
                }
                placeholder="Explain why the DTR needs correction"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCorrectionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitCorrection} disabled={busy}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedCorrection)}
        onOpenChange={(open) => !open && setSelectedCorrection(null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>DTR Correction Audit</DialogTitle>
          </DialogHeader>
          {selectedCorrection && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{selectedCorrection.employeeName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCorrection.workDate} -{" "}
                    {selectedCorrection.requestType === "Label" ? "DTR Label" : "Time Correction"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={CORRECTION_STATUS_CLASS[selectedCorrection.status]}
                >
                  {selectedCorrection.status}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <AuditValues title="Original" values={selectedCorrection.original} />
                <AuditValues title="Requested" values={selectedCorrection.requested} />
                <AuditValues title="Applied" values={selectedCorrection.applied} />
              </div>
              <div className="rounded-lg border border-border p-3 text-sm">
                <p>
                  <span className="font-medium">Employee reason:</span> {selectedCorrection.reason}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Filed by {selectedCorrection.createdByName || "Employee"} on{" "}
                  {new Date(selectedCorrection.createdAt).toLocaleString()}
                  {selectedCorrection.requestIp ? ` - IP ${selectedCorrection.requestIp}` : ""}
                </p>
                {selectedCorrection.reviewedAt && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Reviewed by {selectedCorrection.reviewedByName} on{" "}
                    {new Date(selectedCorrection.reviewedAt).toLocaleString()}
                    {selectedCorrection.reviewIp ? ` - IP ${selectedCorrection.reviewIp}` : ""}
                  </p>
                )}
              </div>
              {canApprove && selectedCorrection.status === "Pending" && (
                <div className="space-y-2">
                  <Label>Review Remarks</Label>
                  <Textarea
                    value={reviewRemarks}
                    onChange={(event) => setReviewRemarks(event.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => decideCorrection("Disapproved")}
                      disabled={busy}
                    >
                      Disapprove
                    </Button>
                    <Button onClick={() => decideCorrection("Approved")} disabled={busy}>
                      Approve and Apply
                    </Button>
                  </div>
                </div>
              )}
              {canApprove && selectedCorrection.status === "Approved" && (
                <div className="space-y-2 rounded-lg border border-violet-200 bg-violet-50 p-3">
                  <Label>Reverse Approval</Label>
                  <Textarea
                    value={reverseReason}
                    onChange={(event) => setReverseReason(event.target.value)}
                    placeholder="Required reason for restoring the previous DTR values"
                  />
                  <Button variant="destructive" onClick={reverseCorrection} disabled={busy}>
                    Reverse and Restore Previous DTR
                  </Button>
                </div>
              )}
              <div>
                <h3 className="mb-3 text-sm font-semibold">Immutable Timeline</h3>
                <div className="space-y-3">
                  {selectedCorrection.events.map((event) => (
                    <div key={event.id} className="border-l-2 border-primary/30 pl-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{event.eventType}</p>
                        <time className="text-xs text-muted-foreground">
                          {new Date(event.createdAt).toLocaleString()}
                        </time>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {event.actorName}
                        {event.ipAddress ? ` - IP ${event.ipAddress}` : ""}
                      </p>
                      {event.remarks && <p className="mt-1 text-sm">{event.remarks}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {!isEmployee && (
        <MassDtrPrintModal
          open={showMassPrintDialog}
          onOpenChange={setShowMassPrintDialog}
          employees={employees}
          noters={noters}
          defaultOffice={
            employeeId === "all"
              ? ""
              : employees.find((employee) => employee.id === employeeId)?.department || ""
          }
        />
      )}
    </AppShell>
  );
}

function AuditValues({
  title,
  values,
}: {
  title: string;
  values: {
    amIn?: string;
    amOut?: string;
    pmIn?: string;
    pmOut?: string;
    label?: string;
    status?: string;
    remarks?: string;
  };
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{title}</h3>
      {values.label ? (
        <p className="text-sm font-medium">{values.label}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span>
            AM In: <b>{formatDtrTime(values.amIn)}</b>
          </span>
          <span>
            AM Out: <b>{formatDtrTime(values.amOut)}</b>
          </span>
          <span>
            PM In: <b>{formatDtrTime(values.pmIn)}</b>
          </span>
          <span>
            PM Out: <b>{formatDtrTime(values.pmOut)}</b>
          </span>
        </div>
      )}
      {values.status && (
        <p className="mt-2 text-xs text-muted-foreground">Status: {values.status}</p>
      )}
    </div>
  );
}

function RealtimeStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function DtrMobileTime({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div
        className={`truncate text-[0.72rem] font-extrabold leading-4 ${
          danger ? "text-red-600" : "text-emerald-600"
        }`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[0.55rem] font-bold uppercase leading-3 text-[#64748b]">
        {label}
      </div>
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
