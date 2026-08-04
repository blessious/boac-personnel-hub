import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Eye,
  FileEdit,
  Plus,
  Search,
  Send,
  Undo2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDisplayDate, formatDisplayDateTime, formatEmployeeName } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { OrganizationHierarchyFields } from "@/components/organization/OrganizationHierarchyFields";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Textarea } from "@/components/ui/textarea";
import { TablePagination } from "@/components/ui/table-pagination";
import { api, isAbortError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRealtimeRefresh } from "@/lib/realtime";
import { listEmployees, type EmployeeRecord, type SettingsOptions } from "@/lib/employees-api";
import {
  emptyMovement,
  listMovements,
  MOVEMENT_TYPES,
  saveMovement,
  transitionMovement,
  type Movement,
  type MovementForm,
} from "@/lib/movements-api";
import { listPlantilla, type PlantillaItem } from "@/lib/plantilla-api";
import {
  DEFAULT_ORGANIZATION_HIERARCHY,
  type OrganizationHierarchy,
  type ReferenceCategory,
  type ReferenceRow,
} from "@/lib/reference-libraries";
import {
  organizationSelectionFromReferenceId,
  selectedAssignableOrganization,
  type OrganizationSelection,
} from "@/lib/organization-selection";
import {
  dataTableBodyClass,
  dataTableCellClass,
  dataTableClass,
  dataTableEmptyCellClass,
  dataTableHeadClass,
  dataTableHeaderCellClass,
  dataTableHeadRowClass,
  dataTableRowClass,
  dataTableShellClass,
} from "@/lib/data-table-styles";

type MovementEvent = {
  id: string;
  eventType: string;
  fromStatus: string;
  toStatus: string;
  actor: string;
  remarks: string;
  createdAt: string;
};

export const Route = createFileRoute("/movements")({
  validateSearch: (search: Record<string, unknown>) => {
    const actionType =
      typeof search.actionType === "string" &&
      MOVEMENT_TYPES.includes(search.actionType as (typeof MOVEMENT_TYPES)[number])
        ? search.actionType
        : undefined;
    return {
      prepare: search.prepare === "1" ? "1" : undefined,
      employeeId: typeof search.employeeId === "string" ? search.employeeId : undefined,
      targetPlantillaItemId:
        typeof search.targetPlantillaItemId === "string" ? search.targetPlantillaItemId : undefined,
      actionType,
      status: typeof search.status === "string" ? search.status : undefined,
    };
  },
  component: MovementsPage,
});
const selectClass = "h-9 w-full rounded-md border bg-background px-3 text-sm";
const ITEM_ACTIONS = new Set(["Original Appointment", "Promotion", "Transfer"]);
const PROFILE_ACTIONS = new Set(["Detail", "Designation"]);
const TEMPORARY_ACTIONS = new Set(["Detail", "Designation", "Reassignment", "Job Rotation"]);
const SEPARATIONS = new Set(["Resignation", "Retirement", "Termination", "Death"]);
const optionCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const BASE_QUEUE_STATUSES = [
  "all",
  "Draft",
  "Submitted",
  "Reviewed",
  "Approved",
  "Scheduled",
  "Posted",
  "Rejected",
];
const DERIVED_QUEUE_STATUSES = new Set([
  "needs-action",
  "preparation",
  "ready-post",
  "activation-failed",
]);
const today = () => new Date().toISOString().slice(0, 10);
const canPostMovement = (movement: Movement) =>
  movement.status === "Approved" ||
  (movement.status === "Scheduled" && movement.effectiveDate <= today());
function MovementsPage() {
  const navigate = useNavigate({ from: "/movements" });
  const prepareSearch = useSearch({ from: "/movements" });
  const { user, can, hasPermission } = useAuth(),
    canPrepare = hasPermission("movements.write"),
    canApprove = can("approve"),
    canPost = canPrepare;
  const [movements, setMovements] = useState<Movement[]>([]),
    [summary, setSummary] = useState<Record<string, number>>({}),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(prepareSearch.status || "needs-action"),
    [actionFilter, setActionFilter] = useState("all"),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10),
    [loadError, setLoadError] = useState("");
  const apiStatus = DERIVED_QUEUE_STATUSES.has(status) ? "all" : status;
  const queueStatuses = useMemo(() => {
    if (canPrepare)
      return [
        "needs-action",
        "preparation",
        "ready-post",
        "activation-failed",
        ...BASE_QUEUE_STATUSES,
      ];
    return ["needs-action", ...BASE_QUEUE_STATUSES];
  }, [canPrepare]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]),
    [items, setItems] = useState<PlantillaItem[]>([]),
    [organizationLibraries, setOrganizationLibraries] = useState<
      Record<ReferenceCategory, ReferenceRow[]>
    >({} as Record<ReferenceCategory, ReferenceRow[]>),
    [organizationHierarchy, setOrganizationHierarchy] = useState<OrganizationHierarchy>(
      DEFAULT_ORGANIZATION_HIERARCHY,
    ),
    [settings, setSettings] = useState<SettingsOptions>({
      departments: [],
      positions: [],
      salaryGrades: [],
    });
  const [edit, setEdit] = useState<Movement | null | undefined>(undefined),
    [form, setForm] = useState<MovementForm>(emptyMovement),
    [movementOrganizationSelection, setMovementOrganizationSelection] =
      useState<OrganizationSelection>({}),
    [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<{ movement: Movement; action: string } | null>(null),
    [decisionRemarks, setDecisionRemarks] = useState(""),
    [events, setEvents] = useState<MovementEvent[]>([]),
    [detailMovement, setDetailMovement] = useState<Movement | null>(null);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const x = await listMovements(q, apiStatus, actionFilter, { signal });
        if (signal?.aborted) return;
        setMovements(x.movements);
        setSummary(x.summary);
        setLoadError("");
      } catch (e) {
        if (!isAbortError(e)) {
          const message = (e as Error).message;
          setLoadError(message);
          toast.error(message);
        }
      }
    },
    [q, apiStatus, actionFilter],
  );
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    const timer = setTimeout(() => load(controller.signal), 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load, user]);
  useRealtimeRefresh(() => {
    void load();
  }, ["movements", "plantilla", "employees", "engagements"]);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    Promise.all([
      api<SettingsOptions>("/api/settings", { signal: controller.signal }),
      listPlantilla("", "Active", "all", { signal: controller.signal }),
      loadAllEmployees(controller.signal),
      api<{
        libraries: Record<ReferenceCategory, ReferenceRow[]>;
        hierarchy: OrganizationHierarchy;
      }>("/api/settings/references", { signal: controller.signal }),
    ])
      .then(([s, p, e, references]) => {
        if (controller.signal.aborted) return;
        setSettings(s);
        setItems(p.items);
        setEmployees(e);
        const hierarchy = references.hierarchy || DEFAULT_ORGANIZATION_HIERARCHY;
        setOrganizationLibraries(references.libraries);
        setOrganizationHierarchy(hierarchy);
      })
      .catch((e) => {
        if (!isAbortError(e)) toast.error(e.message);
      });

    return () => controller.abort();
  }, [user]);
  const openForm = useCallback(
    (m?: Movement, prefill: Partial<MovementForm> = {}) => {
      setEdit(m || null);
      const targetOrganizationId = m?.targetOrganizationId || prefill.targetOrganizationId || "";
      setMovementOrganizationSelection(
        organizationSelectionFromReferenceId(
          targetOrganizationId,
          organizationLibraries,
          organizationHierarchy,
        ),
      );
      setForm(
        m
          ? {
              controlNumber: m.controlNumber,
              employeeId: m.employeeId,
              actionType: m.actionType,
              effectiveDate: m.effectiveDate,
              endDate: m.endDate || "",
              authorityNumber: m.authorityNumber,
              authorityDate: m.authorityDate || "",
              targetPlantillaItemId: m.targetPlantillaItemId || "",
              targetPositionId: m.targetPositionId ? String(m.targetPositionId) : "",
              targetSalaryGradeId: m.targetSalaryGradeId ? String(m.targetSalaryGradeId) : "",
              targetDepartment: m.targetDepartment,
              targetOrganizationId: m.targetOrganizationId ? String(m.targetOrganizationId) : "",
              remarks: m.remarks,
              documentsText: m.supportingDocuments
                .map((x) => `${x.name}${x.reference ? ` | ${x.reference}` : ""}`)
                .join("\n"),
            }
          : { ...emptyMovement, effectiveDate: today(), ...prefill },
      );
    },
    [organizationHierarchy, organizationLibraries],
  );
  useEffect(() => {
    if (prepareSearch.prepare !== "1") return;
    if (!canPrepare) {
      toast.error("Only HR users can prepare personnel movements");
      navigate({ search: {}, replace: true });
      return;
    }
    openForm(undefined, {
      employeeId: prepareSearch.employeeId || "",
      actionType:
        prepareSearch.actionType ||
        (prepareSearch.targetPlantillaItemId ? "Original Appointment" : "Transfer"),
      targetPlantillaItemId: prepareSearch.targetPlantillaItemId || "",
    });
    navigate({ search: {}, replace: true });
  }, [
    canPrepare,
    navigate,
    openForm,
    prepareSearch.actionType,
    prepareSearch.employeeId,
    prepareSearch.prepare,
    prepareSearch.targetPlantillaItemId,
  ]);
  useEffect(() => {
    if (
      edit === undefined ||
      !ITEM_ACTIONS.has(form.actionType) ||
      !form.targetPlantillaItemId ||
      form.targetSalaryGradeId
    )
      return;
    const item = items.find((candidate) => candidate.id === form.targetPlantillaItemId);
    const stepOne = item?.salaryGrade
      ? settings.salaryGrades.find(
          (row) =>
            row.isActive &&
            row.ordinance === item.salaryGrade?.ordinance &&
            row.grade === item.salaryGrade?.grade &&
            row.step === 1,
        )
      : null;
    if (stepOne) setForm((current) => ({ ...current, targetSalaryGradeId: String(stepOne.id) }));
  }, [
    edit,
    form.actionType,
    form.targetPlantillaItemId,
    form.targetSalaryGradeId,
    items,
    settings.salaryGrades,
  ]);
  const save = async () => {
    setBusy(true);
    try {
      await saveMovement(form, edit?.id);
      toast.success(edit ? "Movement updated" : "Movement prepared");
      setEdit(undefined);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const runAction = async (m: Movement, action: string, remarks = "") => {
    setBusy(true);
    try {
      if (action === "reviewApprove") {
        await transitionMovement(m.id, "review", remarks);
        const result = await transitionMovement(m.id, "approve", remarks);
        toast.success(
          result.movement.status === "Scheduled"
            ? "Movement reviewed, approved, and scheduled"
            : "Movement reviewed, approved, and posted",
        );
      } else {
        const result = await transitionMovement(m.id, action, remarks);
        toast.success(
          action === "approve"
            ? result.movement.status === "Scheduled"
              ? "Movement approved and scheduled"
              : "Movement approved and posted"
            : `Movement ${action} completed`,
        );
      }
      setDecision(null);
      setDecisionRemarks("");
      setDetailMovement(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const openDetails = async (m: Movement) => {
    setDetailMovement(m);
    setEvents([]);
    try {
      const x = await api<{ events: MovementEvent[] }>(`/api/movements/${m.id}/events`);
      setEvents(x.events);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const openDecision = (m: Movement, action: string) => {
    setDetailMovement(null);
    setDecisionRemarks("");
    setDecision({ movement: m, action });
  };
  const fromText = (m: Movement) => {
    const source = m.beforeSnapshot?.employee || m.sourceSnapshot?.employee;
    return source?.position || "-";
  };
  const fromMeta = (m: Movement) => {
    const source = m.beforeSnapshot?.employee || m.sourceSnapshot?.employee;
    return [source?.itemNo, source?.department].filter(Boolean).join(" / ") || "No current item";
  };
  const toText = (m: Movement) => {
    const afterEmployee = m.afterSnapshot?.employee;
    if (SEPARATIONS.has(m.actionType)) return "Vacate current item";
    if (afterEmployee?.position && m.status === "Posted") return afterEmployee.position;
    if (m.targetItemNumber || m.targetPositionTitle)
      return m.targetPositionTitle || m.targetItemNumber;
    if (m.targetSalaryGrade) {
      return `SG ${m.targetSalaryGrade.grade}, Step ${m.targetSalaryGrade.step}`;
    }
    return m.targetDepartment || "-";
  };
  const toMeta = (m: Movement) => {
    const afterEmployee = m.afterSnapshot?.employee;
    if (afterEmployee && m.status === "Posted") {
      return [afterEmployee.itemNo, afterEmployee.department].filter(Boolean).join(" / ");
    }
    if (m.targetItemNumber && m.targetPositionTitle) {
      return [m.targetItemNumber, m.targetDepartment].filter(Boolean).join(" / ");
    }
    if (m.targetItemNumber) return m.targetItemNumber;
    if (m.targetSalaryGrade) {
      return `PHP ${m.targetSalaryGrade.amount.toLocaleString()}`;
    }
    return m.targetDepartment || "";
  };
  const canUserApproveMovement = useCallback(
    (movement: Movement) =>
      canApprove &&
      (!movement.preparedById || !user?.id || Number(movement.preparedById) !== Number(user.id)),
    [canApprove, user?.id],
  );
  const canUnsubmitMovement = useCallback(
    (movement: Movement) =>
      canPrepare &&
      movement.status === "Submitted" &&
      (user?.role === "Super Admin" ||
        (movement.preparedById && user?.id && Number(movement.preparedById) === Number(user.id))),
    [canPrepare, user?.id, user?.role],
  );
  const requiresUserAction = useCallback(
    (movement: Movement) =>
      (canPrepare &&
        (["Draft", "Rejected", "Approved"].includes(movement.status) ||
          (movement.status === "Scheduled" &&
            (Boolean(movement.activationError) || movement.effectiveDate <= today())) ||
          canUnsubmitMovement(movement))) ||
      (canUserApproveMovement(movement) &&
        (movement.status === "Submitted" || movement.status === "Reviewed")),
    [canPrepare, canUnsubmitMovement, canUserApproveMovement],
  );
  const displayedMovements = useMemo(() => {
    if (status === "needs-action") {
      return movements.filter(requiresUserAction);
    }
    if (status === "preparation") {
      return movements.filter((m) => m.status === "Draft" || m.status === "Rejected");
    }
    if (status === "ready-post") {
      return movements.filter((m) => m.status === "Approved" || m.status === "Scheduled");
    }
    if (status === "activation-failed") {
      return movements.filter((m) => Boolean(m.activationError));
    }
    return movements;
  }, [movements, requiresUserAction, status]);
  const totalPages = Math.max(1, Math.ceil(displayedMovements.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pagedMovements = useMemo(
    () => displayedMovements.slice((safePage - 1) * pageSize, safePage * pageSize),
    [displayedMovements, safePage, pageSize],
  );
  useEffect(() => {
    setPage(1);
  }, [q, status, actionFilter, pageSize]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const activationFailureCount = useMemo(
    () => movements.filter((movement) => Boolean(movement.activationError)).length,
    [movements],
  );
  const queueLabel = (queueStatus: string) =>
    queueStatus === "needs-action"
      ? "Action needed"
      : queueStatus === "preparation"
        ? "Preparation"
        : queueStatus === "ready-post"
          ? "Ready to post"
          : queueStatus === "activation-failed"
            ? "Activation failed"
            : queueStatus === "all"
              ? "All"
              : queueStatus;
  const actionButtons = (m: Movement) => (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground hover:ring-1 hover:ring-border dark:hover:bg-white/10"
        onClick={() => openDetails(m)}
        title={
          canUserApproveMovement(m) && ["Submitted", "Reviewed"].includes(m.status)
            ? "Review"
            : "Details"
        }
        aria-label={
          canUserApproveMovement(m) && ["Submitted", "Reviewed"].includes(m.status)
            ? "Review"
            : "Details"
        }
      >
        <Eye className="h-4 w-4" />
      </Button>
      {canPrepare && ["Draft", "Rejected"].includes(m.status) && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground hover:ring-1 hover:ring-border dark:hover:bg-white/10"
          onClick={() => openForm(m)}
          title="Edit draft"
          aria-label="Edit draft"
        >
          <FileEdit className="h-4 w-4" />
        </Button>
      )}
      {canPrepare && m.status === "Draft" && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground hover:ring-1 hover:ring-border dark:hover:bg-white/10"
          onClick={() => openDecision(m, "submit")}
          title="Submit"
          aria-label="Submit"
        >
          <Send className="h-4 w-4" />
        </Button>
      )}
      {canUnsubmitMovement(m) && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground hover:ring-1 hover:ring-border dark:hover:bg-white/10"
          onClick={() => openDecision(m, "unsubmit")}
          title="Unsubmit"
          aria-label="Unsubmit"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
      )}
      {canPost && canPostMovement(m) && (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground hover:ring-1 hover:ring-border dark:hover:bg-white/10"
            onClick={() => openDecision(m, "post")}
            title="Post"
            aria-label="Post"
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        </>
      )}
      {canPost && (m.status === "Approved" || m.status === "Scheduled") && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground hover:ring-1 hover:ring-border dark:hover:bg-white/10"
          onClick={() => openDecision(m, "return")}
          title="Return"
          aria-label="Return"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
      )}
      {canPost && m.status === "Posted" && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground hover:ring-1 hover:ring-border dark:hover:bg-white/10"
          onClick={() => openDecision(m, "reverse")}
          title="Reverse"
          aria-label="Reverse"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
      )}
    </>
  );
  return (
    <AppShell
      title="Employee Movements"
      subtitle="Prepare, review, approve, post, and reverse governed personnel actions"
    >
      <div className="grid grid-cols-3 gap-2 md:gap-3 lg:grid-cols-6">
        <StatCard
          title="Draft"
          value={summary["Draft"] || 0}
          subtext="Saved drafts"
          subtextColor="text-muted-foreground"
          icon={<FileEdit className="h-5 w-5 text-slate-600" />}
          iconBg="bg-slate-50 dark:bg-slate-500/15"
          chartColor="stroke-slate-500"
          trend="up"
        />
        <StatCard
          title="Submitted"
          value={summary["Submitted"] || 0}
          subtext="Pending review"
          subtextColor="text-muted-foreground"
          icon={<Send className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50 dark:bg-blue-500/15"
          chartColor="stroke-blue-500"
          trend="up"
        />
        <StatCard
          title="Reviewed"
          value={summary["Reviewed"] || 0}
          subtext="Pending approval"
          subtextColor="text-muted-foreground"
          icon={<Clock3 className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-50 dark:bg-purple-500/15"
          chartColor="stroke-purple-500"
          trend="up"
        />
        <StatCard
          title="Ready"
          value={(summary["Approved"] || 0) + (summary["Scheduled"] || 0)}
          subtext="Approved/scheduled"
          subtextColor="text-muted-foreground"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50 dark:bg-emerald-500/15"
          chartColor="stroke-emerald-500"
          trend="up"
        />
        <StatCard
          title="Posted"
          value={summary["Posted"] || 0}
          subtext="Implemented"
          subtextColor="text-muted-foreground"
          icon={<ArrowRightLeft className="h-5 w-5 text-teal-600" />}
          iconBg="bg-teal-50 dark:bg-teal-500/15"
          chartColor="stroke-teal-500"
          trend="up"
        />
        <StatCard
          title="Rejected"
          value={summary["Rejected"] || 0}
          subtext="Denied/Returned"
          subtextColor="text-muted-foreground"
          icon={<XCircle className="h-5 w-5 text-rose-600" />}
          iconBg="bg-rose-50 dark:bg-rose-500/15"
          chartColor="stroke-rose-500"
          trend="down"
        />
        <StatCard
          title="Failed"
          value={activationFailureCount}
          subtext="Scheduled activation"
          subtextColor={activationFailureCount ? "text-red-600" : "text-muted-foreground"}
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          iconBg="bg-red-50 dark:bg-red-500/15"
          chartColor="stroke-red-500"
          trend="down"
        />
      </div>
      <WorkflowStrip />
      <div className="mt-4 flex flex-wrap gap-2">
        {queueStatuses.map((queueStatus) => (
          <Button
            key={queueStatus}
            type="button"
            size="sm"
            variant={status === queueStatus ? "default" : "outline"}
            onClick={() => setStatus(queueStatus)}
          >
            {queueLabel(queueStatus)}
          </Button>
        ))}
      </div>
      <div className="mt-5 grid gap-2 md:flex md:flex-wrap">
        <div className="relative min-w-0 flex-1 md:min-w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search control number or employee"
          />
        </div>
        <select
          className={selectClass + " md:max-w-52"}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="all">All action types</option>
          {MOVEMENT_TYPES.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        {canPrepare && (
          <Button
            onClick={() => openForm()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Prepare movement
          </Button>
        )}
      </div>
      {loadError && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold">Unable to load personnel movements</div>
            <div>{loadError}</div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => load()}>
            Retry
          </Button>
        </div>
      )}
      <div className="mobile-record-list mt-4 md:hidden">
        {pagedMovements.map((m) => (
          <article
            className="rounded-lg border border-border bg-background p-3 shadow-sm"
            key={m.id}
            onDoubleClick={() => openDetails(m)}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_5rem] items-start gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">
                  {m.controlNumber}
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-foreground">
                  {m.employeeName}
                </div>
              </div>
              <Status value={m.status} />
              {m.activationError && (
                <div className="mt-1 flex items-center justify-end gap-1 text-xs font-medium text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Failed
                </div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {formatDisplayDate(m.effectiveDate)}
                    {m.endDate ? ` to ${formatDisplayDate(m.endDate)}` : ""}
                  </span>
                </div>
              </div>
              <div className="min-w-0 border-l border-border/70 pl-3">
                <div className="text-sm font-semibold text-foreground">{m.actionType}</div>
                <div className="mt-1 text-xs leading-4 text-muted-foreground">
                  {fromText(m)} <span aria-hidden="true">-&gt;</span> {toText(m)}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {toMeta(m) || fromMeta(m) || m.authorityNumber || "-"}
                </div>
              </div>
            </div>
            <div
              className="mt-3 flex justify-end gap-2"
              onDoubleClick={(event) => event.stopPropagation()}
            >
              {actionButtons(m)}
            </div>
          </article>
        ))}
        {!pagedMovements.length && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No personnel movements found.
          </div>
        )}
      </div>
      <div className={cn("mobile-desktop-table mt-4", dataTableShellClass)}>
        <table className={dataTableClass}>
          <thead className={dataTableHeadClass}>
            <tr className={dataTableHeadRowClass}>
              {[
                "Control no.",
                "Employee",
                "Personnel action",
                "From",
                "To",
                "Effectivity",
                "Status",
                "Actions",
              ].map((x) => (
                <th className={dataTableHeaderCellClass} key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={dataTableBodyClass}>
            {pagedMovements.map((m) => (
              <tr
                className={cn(dataTableRowClass, "cursor-pointer")}
                key={m.id}
                onDoubleClick={() => openDetails(m)}
              >
                <td className={cn(dataTableCellClass, "whitespace-nowrap font-medium")}>
                  {m.controlNumber}
                </td>
                <td className={dataTableCellClass}>{m.employeeName}</td>
                <td className={dataTableCellClass}>
                  {m.actionType}
                  <div className="text-xs text-muted-foreground">{m.authorityNumber || "-"}</div>
                </td>
                <td className={dataTableCellClass}>
                  <div className="font-medium">{fromText(m)}</div>
                  <div className="text-xs text-muted-foreground">{fromMeta(m)}</div>
                </td>
                <td className={dataTableCellClass}>
                  <div className="font-medium">{toText(m)}</div>
                  {toMeta(m) && <div className="text-xs text-muted-foreground">{toMeta(m)}</div>}
                </td>
                <td className={cn(dataTableCellClass, "whitespace-nowrap")}>
                  {formatDisplayDate(m.effectiveDate)}
                  {m.endDate && (
                    <div className="text-xs text-muted-foreground">
                      until {formatDisplayDate(m.endDate)}
                    </div>
                  )}
                </td>
                <td className={dataTableCellClass}>
                  <Status value={m.status} />
                  {m.activationError && (
                    <div className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Activation failed
                    </div>
                  )}
                </td>
                <td
                  className={dataTableCellClass}
                  onDoubleClick={(event) => event.stopPropagation()}
                >
                  <div className="flex flex-wrap gap-1">{actionButtons(m)}</div>
                </td>
              </tr>
            ))}
            {!pagedMovements.length && (
              <tr>
                <td colSpan={8} className={dataTableEmptyCellClass}>
                  No personnel movements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={safePage}
        totalPages={totalPages}
        total={displayedMovements.length}
        pageSize={pageSize}
        itemLabel="movements"
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        className="mt-0 rounded-b-lg border border-t-0 border-border bg-card"
      />
      <MovementDialog
        open={edit !== undefined}
        movement={edit}
        form={form}
        setForm={setForm}
        employees={employees}
        items={items}
        settings={settings}
        organizationLibraries={organizationLibraries}
        organizationHierarchy={organizationHierarchy}
        organizationSelection={movementOrganizationSelection}
        setOrganizationSelection={setMovementOrganizationSelection}
        busy={busy}
        close={() => setEdit(undefined)}
        save={save}
      />
      <MovementDetailDialog
        movement={detailMovement}
        events={events}
        canApprove={detailMovement ? canUserApproveMovement(detailMovement) : false}
        canUnsubmit={detailMovement ? canUnsubmitMovement(detailMovement) : false}
        canPost={canPost}
        onClose={() => setDetailMovement(null)}
        onDecision={openDecision}
      />
      <Dialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionLabel(decision?.action || "")} movement - {decision?.movement.controlNumber}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {decision?.action === "post"
              ? decision.movement.status === "Scheduled"
                ? "Posting now activates the scheduled movement because its effective date is due. This updates the employee and Plantilla occupancy."
                : "Posting atomically updates the employee and Plantilla occupancy. If the effective date is in the future, the movement will be scheduled for automatic posting."
              : decision?.action === "reverse"
                ? "Reversal restores the recorded before-state and is blocked if a later movement exists."
                : decision?.action === "reviewApprove"
                  ? "This records review and final approval in sequence, then immediately posts the movement. A future-effective movement will be scheduled automatically."
                  : decision?.action === "approve"
                    ? "Final approval immediately posts the movement. A future-effective movement will be scheduled automatically."
                    : decision?.action === "return"
                      ? "Returning to Draft refreshes the source employee/occupancy snapshot and clears prior approvals."
                      : decision?.action === "unsubmit"
                        ? "Unsubmitting pulls this movement back to Draft before review starts."
                        : decision?.action === "reject"
                          ? "Record the reason for this decision."
                          : "Confirm this workflow step before the movement continues."}
          </p>
          <div className="space-y-1">
            <Label>
              {decision?.action === "reject" ||
              decision?.action === "reverse" ||
              decision?.action === "return"
                ? "Reason (required)"
                : "Remarks (optional)"}
            </Label>
            <Textarea
              value={decisionRemarks}
              onChange={(e) => setDecisionRemarks(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
              disabled={
                busy ||
                ((decision?.action === "reject" ||
                  decision?.action === "reverse" ||
                  decision?.action === "return") &&
                  !decisionRemarks.trim())
              }
              onClick={() =>
                decision && runAction(decision.movement, decision.action, decisionRemarks)
              }
            >
              Confirm {actionLabel(decision?.action || "")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function WorkflowStrip() {
  const steps = ["Plantilla", "Movement Draft", "Review", "Approve", "Post"];
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
      {steps.map((step, index) => (
        <div className="flex items-center gap-2" key={step}>
          <span className={index === 1 ? "text-foreground" : ""}>{step}</span>
          {index < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
        </div>
      ))}
    </div>
  );
}

function MovementDetailDialog({
  movement,
  events,
  canApprove,
  canUnsubmit,
  canPost,
  onClose,
  onDecision,
}: {
  movement: Movement | null;
  events: MovementEvent[];
  canApprove: boolean;
  canUnsubmit: boolean;
  canPost: boolean;
  onClose: () => void;
  onDecision: (movement: Movement, action: string) => void;
}) {
  const source = movement?.beforeSnapshot || movement?.sourceSnapshot || null;
  const after = movement?.afterSnapshot || null;
  return (
    <Dialog open={!!movement} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl overflow-hidden p-4 sm:p-5">
        {movement && (
          <>
            <DialogHeader className="space-y-1">
              <DialogTitle>Review movement - {movement.controlNumber}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_15rem]">
              <div className="space-y-3">
                <section className="rounded-lg border p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold">{movement.employeeName}</h3>
                    </div>
                    <Status value={movement.status} />
                  </div>
                  <div className="grid gap-x-3 gap-y-2 sm:grid-cols-4">
                    <DetailValue label="Personnel action" value={movement.actionType} />
                    <DetailValue label="Effectivity" value={dateRange(movement)} />
                    <DetailValue label="Authority" value={movement.authorityNumber || "-"} />
                    <DetailValue
                      label="Authority date"
                      value={formatDisplayDate(movement.authorityDate)}
                    />
                  </div>
                </section>

                <div className="grid gap-3 lg:grid-cols-2">
                  <SnapshotCard title="Current record" snapshot={source} />
                  <SnapshotCard
                    title={movement.status === "Posted" ? "Posted result" : "Proposed change"}
                    snapshot={after}
                    fallback={[
                      ["Target item", movement.targetItemNumber || "-"],
                      ["Target position", movement.targetPositionTitle || "-"],
                      ["Target department", movement.targetDepartment || "-"],
                      [
                        "Target salary",
                        movement.targetSalaryGrade
                          ? `SG ${movement.targetSalaryGrade.grade}, Step ${
                              movement.targetSalaryGrade.step
                            } - PHP ${movement.targetSalaryGrade.amount.toLocaleString()}`
                          : "-",
                      ],
                    ]}
                  />
                </div>

                <section className="rounded-lg border p-3">
                  <h3 className="mb-2 text-sm font-semibold">Remarks and document references</h3>
                  <div className="grid gap-3 text-sm lg:grid-cols-[1fr_1fr_1.2fr]">
                    <DetailValue label="Remarks" value={movement.remarks || "-"} />
                    <DetailValue label="Decision remarks" value={movement.decisionRemarks || "-"} />
                    <div>
                      <div className="text-xs font-medium uppercase text-muted-foreground">
                        Document references
                      </div>
                      {movement.supportingDocuments.length ? (
                        <div className="mt-1 space-y-1">
                          {movement.supportingDocuments.map((doc, index) => (
                            <div className="rounded border bg-muted/30 px-2 py-1.5" key={index}>
                              <span className="font-medium">{doc.name || "Document"}</span>
                              {doc.reference && (
                                <span className="text-muted-foreground"> - {doc.reference}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-1 text-muted-foreground">No references listed.</div>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-3">
                <section className="rounded-lg border p-3">
                  <h3 className="mb-2 text-sm font-semibold">Workflow</h3>
                  <div className="space-y-1.5 text-sm">
                    <DetailValue label="Prepared by" value={movement.preparedBy || "-"} />
                    <DetailValue label="Reviewed by" value={movement.reviewedBy || "-"} />
                    <DetailValue label="Approved by" value={movement.approvedBy || "-"} />
                    <DetailValue label="Posted by" value={movement.postedBy || "-"} />
                    <DetailValue
                      label="Scheduled at"
                      value={
                        movement.scheduledAt ? formatDisplayDateTime(movement.scheduledAt) : "-"
                      }
                    />
                  </div>
                </section>
                {movement.activationError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <div className="font-semibold">Scheduled activation needs attention</div>
                    <div className="mt-1">{movement.activationError}</div>
                  </div>
                )}

                <section className="rounded-lg border p-3">
                  <h3 className="mb-2 text-sm font-semibold">Action history</h3>
                  <div className="space-y-1.5">
                    {events.map((event) => (
                      <div className="rounded border bg-muted/20 p-2 text-xs" key={event.id}>
                        <div className="font-medium">
                          {event.eventType}: {event.fromStatus || "New"} to {event.toStatus}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDisplayDateTime(event.createdAt)} - {event.actor}
                        </div>
                        {event.remarks && <p className="mt-1">{event.remarks}</p>}
                      </div>
                    ))}
                    {!events.length && (
                      <div className="text-sm text-muted-foreground">No action history yet.</div>
                    )}
                  </div>
                </section>
              </aside>
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <div className="flex flex-wrap justify-end gap-2">
                {canUnsubmit && movement.status === "Submitted" && (
                  <Button variant="outline" onClick={() => onDecision(movement, "unsubmit")}>
                    Unsubmit
                  </Button>
                )}
                {canApprove && movement.status === "Submitted" && (
                  <>
                    <Button variant="outline" onClick={() => onDecision(movement, "return")}>
                      Return to Draft
                    </Button>
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDecision(movement, "reject")}
                    >
                      Reject
                    </Button>
                    <Button onClick={() => onDecision(movement, "reviewApprove")}>
                      Review, approve and post
                    </Button>
                  </>
                )}
                {canApprove && movement.status === "Reviewed" && (
                  <>
                    <Button variant="outline" onClick={() => onDecision(movement, "return")}>
                      Return to Draft
                    </Button>
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDecision(movement, "reject")}
                    >
                      Reject
                    </Button>
                    <Button onClick={() => onDecision(movement, "approve")}>
                      Approve and post
                    </Button>
                  </>
                )}
                {canPost && canPostMovement(movement) && (
                  <Button onClick={() => onDecision(movement, "post")}>Post</Button>
                )}
                {canPost && (movement.status === "Approved" || movement.status === "Scheduled") && (
                  <Button variant="outline" onClick={() => onDecision(movement, "return")}>
                    Return to Draft
                  </Button>
                )}
                {canPost && movement.status === "Posted" && (
                  <Button variant="outline" onClick={() => onDecision(movement, "reverse")}>
                    Reverse
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium uppercase leading-tight text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 break-words text-xs leading-snug text-foreground">{value}</div>
    </div>
  );
}

function SnapshotCard({
  title,
  snapshot,
  fallback = [],
}: {
  title: string;
  snapshot: Movement["sourceSnapshot"];
  fallback?: Array<[string, React.ReactNode]>;
}) {
  const employee = snapshot?.employee;
  const occupancy = snapshot?.occupancy;
  return (
    <section className="rounded-lg border p-3">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="grid gap-x-3 gap-y-2 text-sm sm:grid-cols-2">
        {employee || occupancy ? (
          <>
            <DetailValue label="Position" value={employee?.position || "-"} />
            <DetailValue label="Department" value={employee?.department || "-"} />
            <DetailValue
              label="Item number"
              value={employee?.itemNo || occupancy?.itemNumber || "-"}
            />
            <DetailValue label="Employee status" value={employee?.empStatus || "-"} />
            <DetailValue
              label="Salary grade"
              value={occupancy?.salaryGradeId ? `Salary grade ID ${occupancy.salaryGradeId}` : "-"}
            />
          </>
        ) : (
          fallback.map(([label, value]) => <DetailValue key={label} label={label} value={value} />)
        )}
      </div>
    </section>
  );
}

function MovementDialog({
  open,
  movement,
  form,
  setForm,
  employees,
  items,
  settings,
  organizationLibraries,
  organizationHierarchy,
  organizationSelection,
  setOrganizationSelection,
  busy,
  close,
  save,
}: {
  open: boolean;
  movement: Movement | null | undefined;
  form: MovementForm;
  setForm: (x: MovementForm) => void;
  employees: EmployeeRecord[];
  items: PlantillaItem[];
  settings: SettingsOptions;
  organizationLibraries: Record<ReferenceCategory, ReferenceRow[]>;
  organizationHierarchy: OrganizationHierarchy;
  organizationSelection: OrganizationSelection;
  setOrganizationSelection: (selection: OrganizationSelection) => void;
  busy: boolean;
  close: () => void;
  save: () => void;
}) {
  const selectedItem = items.find((item) => item.id === form.targetPlantillaItemId);
  const isAppointmentDraft = form.actionType === "Original Appointment" && Boolean(selectedItem);
  const needsItem = ITEM_ACTIONS.has(form.actionType),
    needsPosition = PROFILE_ACTIONS.has(form.actionType) || form.actionType === "Reclassification",
    needsOrganization = TEMPORARY_ACTIONS.has(form.actionType),
    needsGrade =
      ITEM_ACTIONS.has(form.actionType) ||
      ["Step Increment", "Reclassification"].includes(form.actionType),
    separation = SEPARATIONS.has(form.actionType);
  const selectedEmployee = employees.find((employee) => employee.id === form.employeeId);
  const contextTitle =
    form.actionType === "Original Appointment" && selectedItem
      ? "Filling vacancy"
      : selectedEmployee
        ? "Preparing employee movement"
        : "";
  const appointmentSalarySteps = selectedItem
    ? settings.salaryGrades
        .filter(
          (s) =>
            (s.isActive || String(s.id) === form.targetSalaryGradeId) &&
            selectedItem.salaryGrade &&
            s.ordinance === selectedItem.salaryGrade.ordinance &&
            s.grade === selectedItem.salaryGrade.grade,
        )
        .sort((left, right) => left.step - right.step || left.amount - right.amount)
    : [];

  if (isAppointmentDraft) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {movement ? "Edit appointment draft" : "Existing employee"} -{" "}
              {selectedItem?.itemNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="notice-info rounded-lg border px-3 py-2 text-sm">
              <div className="font-semibold">{selectedItem.positionTitle}</div>
              <div className="mt-1 text-muted-foreground">
                {selectedItem.salaryGrade
                  ? `SG ${selectedItem.salaryGrade.grade}, authorized Step ${selectedItem.salaryGrade.step}`
                  : "No salary grade"}
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Employee"
              value={form.employeeId}
              set={(v) => setForm({ ...form, employeeId: v })}
              rows={employees.map((e) => [
                e.id,
                formatEmployeeName(e),
                [e.employeeId, e.department, e.position].filter(Boolean).join(" "),
              ])}
            />
            <Field label="Appointment start date">
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
              />
            </Field>
            <SelectField
              label="Salary Step"
              value={form.targetSalaryGradeId}
              set={(v) => setForm({ ...form, targetSalaryGradeId: v })}
              rows={appointmentSalarySteps.map((step) => [
                String(step.id),
                `Step ${step.step} - PHP ${step.amount.toLocaleString()} monthly`,
              ])}
            />
            <Field label="Authority / appointment number">
              <Input
                value={form.authorityNumber}
                onChange={(e) => setForm({ ...form, authorityNumber: e.target.value })}
              />
            </Field>
            <Field label="Authority date">
              <Input
                type="date"
                value={form.authorityDate}
                onChange={(e) => setForm({ ...form, authorityDate: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Document references (one per line: Name | reference/location)">
                <Textarea
                  rows={3}
                  value={form.documentsText}
                  onChange={(e) => setForm({ ...form, documentsText: e.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Remarks">
                <Textarea
                  rows={3}
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              disabled={
                busy ||
                !form.employeeId ||
                !form.effectiveDate ||
                !form.targetPlantillaItemId ||
                !form.targetSalaryGradeId
              }
              onClick={save}
            >
              Save draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{movement ? "Edit" : "Prepare"} personnel movement</DialogTitle>
        </DialogHeader>
        {contextTitle && (
          <div className="notice-info rounded-lg border px-3 py-2 text-sm">
            <div className="font-semibold">{contextTitle}</div>
            <div className="mt-1 grid gap-1 sm:grid-cols-2">
              {selectedEmployee && (
                <div className="min-w-0">
                  <span className="font-medium">Employee: </span>
                  <span className="break-words">{formatEmployeeName(selectedEmployee)}</span>
                </div>
              )}
              {selectedItem && (
                <div className="min-w-0">
                  <span className="font-medium">Target item: </span>
                  <span className="break-words">
                    {selectedItem.itemNumber} - {selectedItem.positionTitle}
                    {selectedItem.salaryGrade
                      ? ` / SG ${selectedItem.salaryGrade.grade}, Step ${selectedItem.salaryGrade.step}`
                      : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Control number">
            <Input
              placeholder="Auto-generated when blank"
              value={form.controlNumber}
              onChange={(e) => setForm({ ...form, controlNumber: e.target.value })}
            />
          </Field>
          <SelectField
            label="Employee"
            value={form.employeeId}
            set={(v) => setForm({ ...form, employeeId: v })}
            rows={employees.map((e) => [
              e.id,
              formatEmployeeName(e),
              [e.employeeId, e.department, e.position].join(" "),
            ])}
          />
          <SelectField
            label="Personnel action"
            value={form.actionType}
            set={(v) => {
              setOrganizationSelection({});
              setForm({
                ...form,
                actionType: v,
                targetPlantillaItemId: "",
                targetPositionId: "",
                targetSalaryGradeId: "",
                targetDepartment: "",
                targetOrganizationId: "",
              });
            }}
            rows={MOVEMENT_TYPES.map((x) => [x, x])}
          />
          {TEMPORARY_ACTIONS.has(form.actionType) || form.actionType === "Renewal" ? (
            <Field label="Date Range">
              <DateRangePicker
                from={form.effectiveDate}
                to={form.endDate}
                allowOpenEnded={form.actionType === "Reassignment"}
                onApply={(effectiveDate, endDate) => setForm({ ...form, effectiveDate, endDate })}
              />
            </Field>
          ) : (
            <Field label="Effective date">
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
              />
            </Field>
          )}
          <Field label="Authority / appointment number">
            <Input
              value={form.authorityNumber}
              onChange={(e) => setForm({ ...form, authorityNumber: e.target.value })}
            />
          </Field>
          <Field label="Authority date">
            <Input
              type="date"
              value={form.authorityDate}
              onChange={(e) => setForm({ ...form, authorityDate: e.target.value })}
            />
          </Field>
          {needsItem && (
            <SelectField
              label="Target vacant plantilla item"
              value={form.targetPlantillaItemId}
              set={(v) => {
                const item = items.find((candidate) => candidate.id === v);
                const stepOne = item?.salaryGrade
                  ? settings.salaryGrades.find(
                      (row) =>
                        row.isActive &&
                        row.ordinance === item.salaryGrade?.ordinance &&
                        row.grade === item.salaryGrade?.grade &&
                        row.step === 1,
                    )
                  : null;
                setForm({
                  ...form,
                  targetPlantillaItemId: v,
                  targetSalaryGradeId: stepOne ? String(stepOne.id) : "",
                });
              }}
              rows={items
                .filter((i) => !i.occupant)
                .map((i) => [i.id, `${i.itemNumber} - ${i.positionTitle}`])}
            />
          )}{" "}
          {needsPosition && (
            <SelectField
              label="Target position"
              value={form.targetPositionId}
              set={(v) => setForm({ ...form, targetPositionId: v })}
              rows={[...settings.positions]
                .sort((left, right) => optionCollator.compare(left.title, right.title))
                .map((p) => [String(p.id), p.title])}
            />
          )}{" "}
          {needsGrade && (
            <SelectField
              label={
                ITEM_ACTIONS.has(form.actionType)
                  ? "Employee salary step"
                  : "Target salary grade / step"
              }
              value={form.targetSalaryGradeId}
              set={(v) => setForm({ ...form, targetSalaryGradeId: v })}
              rows={settings.salaryGrades
                .filter(
                  (s) =>
                    (s.isActive || String(s.id) === form.targetSalaryGradeId) &&
                    (!ITEM_ACTIONS.has(form.actionType) ||
                      (selectedItem?.salaryGrade &&
                        s.ordinance === selectedItem.salaryGrade.ordinance &&
                        s.grade === selectedItem.salaryGrade.grade)),
                )
                .map((s) => [
                  String(s.id),
                  `SG ${s.grade}, Step ${s.step} - PHP ${s.amount.toLocaleString()} monthly`,
                ])}
            />
          )}{" "}
          {needsOrganization && (
            <OrganizationHierarchyFields
              libraries={organizationLibraries}
              hierarchy={organizationHierarchy}
              value={organizationSelection}
              onValueChange={(selection) => {
                const organization = selectedAssignableOrganization(
                  selection,
                  organizationLibraries,
                  organizationHierarchy,
                );
                setOrganizationSelection(selection);
                setForm({
                  ...form,
                  targetOrganizationId: organization ? String(organization.id) : "",
                  targetDepartment: organization?.name || "",
                });
              }}
              disabled={busy}
              fieldKey="movement-organization"
            />
          )}
          {form.actionType === "Reclassification" && (
            <div className="notice-info rounded-lg border p-3 text-sm sm:col-span-2">
              This effective-dated staffing action changes the classification and authorized salary
              of the employee&apos;s current Plantilla item while preserving its former values in
              history.
            </div>
          )}
          <div className="sm:col-span-2">
            <Field label="Document references (one per line: Name | reference/location)">
              <Textarea
                rows={3}
                value={form.documentsText}
                onChange={(e) => setForm({ ...form, documentsText: e.target.value })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label={separation ? "Separation remarks" : "Remarks"}>
              <Textarea
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={
              busy ||
              !form.employeeId ||
              !form.effectiveDate ||
              (needsOrganization && !form.targetOrganizationId)
            }
            onClick={save}
          >
            Save draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtext,
  subtextColor,
  subtextDot,
  icon,
  iconBg,
  chartColor,
  trend,
}: {
  title: string;
  value: string | number;
  subtext: string;
  subtextColor?: string;
  subtextDot?: string;
  icon: React.ReactNode;
  iconBg: string;
  chartColor: string;
  trend: "up" | "down";
}) {
  return (
    <div className="relative min-h-[6.25rem] overflow-hidden rounded-lg border border-border bg-card p-2.5 text-card-foreground shadow-sm md:min-h-0 md:p-4">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground/80">{title}</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground md:text-2xl">{value}</h2>
        </div>
        <div className={cn("rounded-md p-1.5 md:p-2", iconBg)}>{icon}</div>
      </div>
      <div className="relative z-10 mt-2 flex items-center text-[10px]">
        {subtextDot && <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", subtextDot)} />}
        <span className={subtextColor}>{subtext}</span>
      </div>
      <div className="absolute bottom-2 right-2 z-0 h-7 w-16 opacity-50 md:h-8 md:w-24">
        <svg
          viewBox="0 0 100 30"
          preserveAspectRatio="none"
          className="stat-trend-chart h-full w-full"
        >
          {trend === "up" ? (
            <path
              d="M0,25 C20,20 40,30 60,10 C80,-5 100,5 100,5"
              fill="none"
              className={cn("stat-trend-line", chartColor)}
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M0,5 C20,5 40,-5 60,15 C80,30 100,20 100,20"
              fill="none"
              className={cn("stat-trend-line", chartColor)}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
function SelectField({
  label,
  value,
  set,
  rows,
}: {
  label: string;
  value: string;
  set: (x: string) => void;
  rows: readonly (readonly string[])[];
}) {
  return (
    <Field label={label}>
      <Combobox
        value={value}
        onValueChange={set}
        options={[...rows]
          .sort((left, right) => optionCollator.compare(left[1], right[1]))
          .map(([id, name, ...details]) => ({
            value: id,
            label: name,
            description: details.filter(Boolean).join(" · "),
            keywords: details,
          }))}
        searchPlaceholder={`Search ${label.toLowerCase()}...`}
        clearable
      />
    </Field>
  );
}
function Status({ value }: { value: string }) {
  const tone =
    value === "Posted"
      ? "bg-emerald-100 text-emerald-800"
      : value === "Rejected" || value === "Reversed"
        ? "bg-red-100 text-red-800"
        : value === "Approved" || value === "Scheduled"
          ? "bg-primary/10 text-primary"
          : "bg-amber-100 text-amber-800";
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${tone}`}>{value}</span>;
}
function actionLabel(x: string) {
  if (x === "reviewApprove") return "Review, approve and post";
  if (x === "approve") return "Approve and post";
  if (x === "unsubmit") return "Unsubmit";
  return titleCase(x);
}
function titleCase(x: string) {
  return x ? x[0].toUpperCase() + x.slice(1) : "";
}
function dateRange(movement: Movement) {
  return movement.endDate
    ? `${formatDisplayDate(movement.effectiveDate)} to ${formatDisplayDate(movement.endDate)}`
    : formatDisplayDate(movement.effectiveDate);
}
async function loadAllEmployees(signal?: AbortSignal) {
  const first = await listEmployees({ pageSize: 100 }, { signal });
  const pages = Math.ceil(first.total / first.pageSize);
  if (pages <= 1) return first.employees;
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      listEmployees({ page: i + 2, pageSize: first.pageSize }, { signal }),
    ),
  );
  return [first, ...rest].flatMap((x) => x.employees);
}
