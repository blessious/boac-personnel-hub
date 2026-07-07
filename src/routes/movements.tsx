import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  CalendarDays,
  Check,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Eye,
  FileEdit,
  Plus,
  Search,
  Send,
  Undo2,
  ChevronsUpDown,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDisplayDate, formatDisplayDateTime, formatEmployeeName } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/lib/api";
import { canWriteHrRecords, useAuth } from "@/lib/auth";
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
    };
  },
  component: MovementsPage,
});
const ITEM_ACTIONS = new Set([
  "Original Appointment",
  "Promotion",
  "Transfer",
  "Reassignment",
  "Job Rotation",
  "Reclassification",
]);
const PROFILE_ACTIONS = new Set(["Detail", "Designation"]);
const SEPARATIONS = new Set(["Resignation", "Retirement", "Termination", "Death"]);
const BASE_QUEUE_STATUSES = [
  "all",
  "Draft",
  "Submitted",
  "Reviewed",
  "Approved",
  "Posted",
  "Rejected",
];
const DERIVED_QUEUE_STATUSES = new Set(["needs-action", "preparation", "ready-post"]);
const today = () => new Date().toISOString().slice(0, 10);
function MovementsPage() {
  const navigate = useNavigate({ from: "/movements" });
  const prepareSearch = useSearch({ from: "/movements" });
  const { user, can } = useAuth(),
    canPrepare = canWriteHrRecords(user?.role),
    canApprove = can("approve"),
    canPost = canPrepare;
  const [movements, setMovements] = useState<Movement[]>([]),
    [summary, setSummary] = useState<Record<string, number>>({}),
    [q, setQ] = useState(""),
    [status, setStatus] = useState("all"),
    [actionFilter, setActionFilter] = useState("all"),
    [didSetApproverQueue, setDidSetApproverQueue] = useState(false),
    [didSetHrQueue, setDidSetHrQueue] = useState(false);
  const apiStatus = DERIVED_QUEUE_STATUSES.has(status) ? "all" : status;
  const queueStatuses = useMemo(() => {
    if (canPrepare) return ["preparation", "ready-post", ...BASE_QUEUE_STATUSES];
    if (canApprove) return ["needs-action", ...BASE_QUEUE_STATUSES];
    return BASE_QUEUE_STATUSES;
  }, [canApprove, canPrepare]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]),
    [items, setItems] = useState<PlantillaItem[]>([]),
    [settings, setSettings] = useState<SettingsOptions>({
      departments: [],
      positions: [],
      salaryGrades: [],
    });
  const [edit, setEdit] = useState<Movement | null | undefined>(undefined),
    [form, setForm] = useState<MovementForm>(emptyMovement),
    [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<{ movement: Movement; action: string } | null>(null),
    [decisionRemarks, setDecisionRemarks] = useState(""),
    [events, setEvents] = useState<MovementEvent[]>([]),
    [detailMovement, setDetailMovement] = useState<Movement | null>(null);
  const load = useCallback(async () => {
    try {
      const x = await listMovements(q, apiStatus, actionFilter);
      setMovements(x.movements);
      setSummary(x.summary);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [q, apiStatus, actionFilter]);
  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (didSetApproverQueue || !canApprove || canPrepare) return;
    setStatus("needs-action");
    setDidSetApproverQueue(true);
  }, [canApprove, canPrepare, didSetApproverQueue]);
  useEffect(() => {
    if (didSetHrQueue || !canPrepare) return;
    setStatus("preparation");
    setDidSetHrQueue(true);
  }, [canPrepare, didSetHrQueue]);
  useEffect(() => {
    Promise.all([
      api<SettingsOptions>("/api/settings"),
      listPlantilla("", "Active", "all"),
      loadAllEmployees(),
    ])
      .then(([s, p, e]) => {
        setSettings(s);
        setItems(p.items);
        setEmployees(e);
      })
      .catch((e) => toast.error(e.message));
  }, []);
  const openForm = useCallback((m?: Movement, prefill: Partial<MovementForm> = {}) => {
    setEdit(m || null);
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
            remarks: m.remarks,
            documentsText: m.supportingDocuments
              .map((x) => `${x.name}${x.reference ? ` | ${x.reference}` : ""}`)
              .join("\n"),
          }
        : { ...emptyMovement, effectiveDate: today(), ...prefill },
    );
  }, []);
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
        await transitionMovement(m.id, "approve", remarks);
        toast.success("Movement reviewed and approved");
      } else {
        await transitionMovement(m.id, action, remarks);
        toast.success(`Movement ${action} completed`);
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
  const displayedMovements = useMemo(() => {
    if (status === "needs-action") {
      return movements.filter((m) => m.status === "Submitted" || m.status === "Reviewed");
    }
    if (status === "preparation") {
      return movements.filter((m) => m.status === "Draft" || m.status === "Rejected");
    }
    if (status === "ready-post") {
      return movements.filter((m) => m.status === "Approved");
    }
    return movements;
  }, [movements, status]);
  const queueLabel = (queueStatus: string) =>
    queueStatus === "needs-action"
      ? "Needs action"
      : queueStatus === "preparation"
        ? "Preparation"
        : queueStatus === "ready-post"
          ? "Ready to post"
          : queueStatus === "all"
            ? "All"
            : queueStatus;
  const actionButtons = (m: Movement, variant: "ghost" | "outline") => (
    <>
      <Button size="sm" variant="outline" onClick={() => openDetails(m)}>
        <Eye className="mr-1.5 h-4 w-4" />
        {canApprove && ["Submitted", "Reviewed"].includes(m.status) ? "Review" : "Details"}
      </Button>
      {canPrepare && ["Draft", "Rejected"].includes(m.status) && (
        <Button size="sm" variant={variant} onClick={() => openForm(m)}>
          <ArrowRightLeft className="mr-1.5 h-4 w-4" />
          Edit draft
        </Button>
      )}
      {canPrepare && m.status === "Draft" && (
        <Button size="sm" variant={variant} onClick={() => openDecision(m, "submit")}>
          <Send className="mr-1.5 h-4 w-4" />
          Submit
        </Button>
      )}
      {canPost && m.status === "Approved" && (
        <>
          <Button size="sm" variant="outline" onClick={() => openDecision(m, "post")}>
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Post
          </Button>
          <Button size="sm" variant={variant} onClick={() => openDecision(m, "return")}>
            <Undo2 className="mr-1.5 h-4 w-4" />
            Return
          </Button>
        </>
      )}
      {canPost && m.status === "Posted" && (
        <Button size="sm" variant={variant} onClick={() => openDecision(m, "reverse")}>
          <Undo2 className="mr-1.5 h-4 w-4" />
          Reverse
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
          title="Approved"
          value={summary["Approved"] || 0}
          subtext="Ready to post"
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
          <Button onClick={() => openForm()} className="bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Prepare movement
          </Button>
        )}
      </div>
      <div className="mobile-record-list mt-4 md:hidden">
        {displayedMovements.map((m) => (
          <article className="rounded-xl border border-border bg-white p-3 shadow-sm" key={m.id}>
            <div className="grid grid-cols-[minmax(0,1fr)_5rem] items-start gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-foreground">{m.controlNumber}</div>
                <div className="mt-1 truncate text-sm font-semibold text-foreground">
                  {m.employeeName}
                </div>
              </div>
              <Status value={m.status} />
            </div>
            <div className="mt-3 grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3">
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {formatDisplayDate(m.effectiveDate)}
                    {m.endDate ? ` to ${formatDisplayDate(m.endDate)}` : ""}
                  </span>
                </div>
              </div>
              <div className="min-w-0 border-l border-border/70 pl-3">
                <div className="text-sm font-bold text-foreground">{m.actionType}</div>
                <div className="mt-1 text-xs leading-4 text-muted-foreground">
                  {fromText(m)} <span aria-hidden="true">-&gt;</span> {toText(m)}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {toMeta(m) || fromMeta(m) || m.authorityNumber || "-"}
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">{actionButtons(m, "outline")}</div>
          </article>
        ))}
        {!displayedMovements.length && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No personnel movements found.
          </div>
        )}
      </div>
      <div className="mobile-desktop-table mt-4 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
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
                <th className="p-3" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedMovements.map((m) => (
              <tr className="border-t" key={m.id}>
                <td className="whitespace-nowrap p-3 font-medium">{m.controlNumber}</td>
                <td className="p-3">{m.employeeName}</td>
                <td className="p-3">
                  {m.actionType}
                  <div className="text-xs text-muted-foreground">{m.authorityNumber || "-"}</div>
                </td>
                <td className="p-3">
                  <div className="font-medium">{fromText(m)}</div>
                  <div className="text-xs text-muted-foreground">{fromMeta(m)}</div>
                </td>
                <td className="p-3">
                  <div className="font-medium">{toText(m)}</div>
                  {toMeta(m) && <div className="text-xs text-muted-foreground">{toMeta(m)}</div>}
                </td>
                <td className="whitespace-nowrap p-3">
                  {formatDisplayDate(m.effectiveDate)}
                  {m.endDate && (
                    <div className="text-xs text-muted-foreground">
                      until {formatDisplayDate(m.endDate)}
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <Status value={m.status} />
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">{actionButtons(m, "ghost")}</div>
                </td>
              </tr>
            ))}
            {!displayedMovements.length && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No personnel movements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <MovementDialog
        open={edit !== undefined}
        movement={edit}
        form={form}
        setForm={setForm}
        employees={employees}
        items={items}
        settings={settings}
        busy={busy}
        close={() => setEdit(undefined)}
        save={save}
      />
      <MovementDetailDialog
        movement={detailMovement}
        events={events}
        canApprove={canApprove}
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
              ? "Posting atomically updates the employee and Plantilla occupancy. Confirm that the approved action is ready for effectivity."
              : decision?.action === "reverse"
                ? "Reversal restores the recorded before-state and is blocked if a later movement exists."
                : decision?.action === "reviewApprove"
                  ? "This records review and approval in sequence. HR can post the movement after approval."
                  : decision?.action === "return"
                    ? "Returning to Draft refreshes the source employee/occupancy snapshot and clears prior approvals."
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
  canPost,
  onClose,
  onDecision,
}: {
  movement: Movement | null;
  events: MovementEvent[];
  canApprove: boolean;
  canPost: boolean;
  onClose: () => void;
  onDecision: (movement: Movement, action: string) => void;
}) {
  const source = movement?.beforeSnapshot || movement?.sourceSnapshot || null;
  const after = movement?.afterSnapshot || null;
  return (
    <Dialog open={!!movement} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        {movement && (
          <>
            <DialogHeader>
              <DialogTitle>Review movement - {movement.controlNumber}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
              <div className="space-y-4">
                <section className="rounded-lg border p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold">{movement.employeeName}</h3>
                    </div>
                    <Status value={movement.status} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailValue label="Personnel action" value={movement.actionType} />
                    <DetailValue label="Effectivity" value={dateRange(movement)} />
                    <DetailValue label="Authority" value={movement.authorityNumber || "-"} />
                    <DetailValue
                      label="Authority date"
                      value={formatDisplayDate(movement.authorityDate)}
                    />
                  </div>
                </section>

                <div className="grid gap-4 lg:grid-cols-2">
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

                <section className="rounded-lg border p-4">
                  <h3 className="mb-3 text-sm font-semibold">Remarks and supporting documents</h3>
                  <div className="space-y-3 text-sm">
                    <DetailValue label="Remarks" value={movement.remarks || "-"} />
                    <DetailValue label="Decision remarks" value={movement.decisionRemarks || "-"} />
                    <div>
                      <div className="text-xs font-medium uppercase text-muted-foreground">
                        Supporting documents
                      </div>
                      {movement.supportingDocuments.length ? (
                        <div className="mt-1 space-y-1">
                          {movement.supportingDocuments.map((doc, index) => (
                            <div className="rounded border bg-muted/30 px-3 py-2" key={index}>
                              <span className="font-medium">{doc.name || "Document"}</span>
                              {doc.reference && (
                                <span className="text-muted-foreground"> - {doc.reference}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-1 text-muted-foreground">No documents listed.</div>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-4">
                <section className="rounded-lg border p-4">
                  <h3 className="mb-3 text-sm font-semibold">Workflow</h3>
                  <div className="space-y-2 text-sm">
                    <DetailValue label="Prepared by" value={movement.preparedBy || "-"} />
                    <DetailValue label="Reviewed by" value={movement.reviewedBy || "-"} />
                    <DetailValue label="Approved by" value={movement.approvedBy || "-"} />
                    <DetailValue label="Posted by" value={movement.postedBy || "-"} />
                  </div>
                </section>

                <section className="rounded-lg border p-4">
                  <h3 className="mb-3 text-sm font-semibold">Action history</h3>
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {events.map((event) => (
                      <div className="rounded border bg-muted/20 p-2 text-sm" key={event.id}>
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
                      Review and approve
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
                    <Button onClick={() => onDecision(movement, "approve")}>Approve</Button>
                  </>
                )}
                {canPost && movement.status === "Approved" && (
                  <Button onClick={() => onDecision(movement, "post")}>Post</Button>
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
    <div>
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm text-foreground">{value}</div>
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
    <section className="rounded-lg border p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="grid gap-3 text-sm">
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
  busy: boolean;
  close: () => void;
  save: () => void;
}) {
  const needsItem = ITEM_ACTIONS.has(form.actionType),
    needsPosition = PROFILE_ACTIONS.has(form.actionType),
    needsGrade = form.actionType === "Step Increment",
    separation = SEPARATIONS.has(form.actionType);
  const selectedEmployee = employees.find((employee) => employee.id === form.employeeId);
  const selectedItem = items.find((item) => item.id === form.targetPlantillaItemId);
  const contextTitle =
    form.actionType === "Original Appointment" && selectedItem
      ? "Filling vacancy"
      : selectedEmployee
        ? "Preparing employee movement"
        : "";
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{movement ? "Edit" : "Prepare"} personnel movement</DialogTitle>
        </DialogHeader>
        {contextTitle && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-950">
            <div className="font-semibold">{contextTitle}</div>
            <div className="mt-1 grid gap-1 text-blue-900 sm:grid-cols-2">
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
            set={(v) =>
              setForm({
                ...form,
                actionType: v,
                targetPlantillaItemId: "",
                targetPositionId: "",
                targetSalaryGradeId: "",
              })
            }
            rows={MOVEMENT_TYPES.map((x) => [x, x])}
          />
          <Field label="Effective date">
            <Input
              type="date"
              value={form.effectiveDate}
              onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
            />
          </Field>
          {(PROFILE_ACTIONS.has(form.actionType) || form.actionType === "Renewal") && (
            <Field label="End date (optional)">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
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
              set={(v) => setForm({ ...form, targetPlantillaItemId: v })}
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
              rows={settings.positions.map((p) => [String(p.id), p.title])}
            />
          )}{" "}
          {needsGrade && (
            <SelectField
              label="Target salary grade / step"
              value={form.targetSalaryGradeId}
              set={(v) => setForm({ ...form, targetSalaryGradeId: v })}
              rows={settings.salaryGrades.map((s) => [
                String(s.id),
                `SG ${s.grade}, Step ${s.step} - PHP ${s.amount.toLocaleString()}`,
              ])}
            />
          )}{" "}
          {(needsItem || needsPosition) && (
            <Field label="Target department (optional override)">
              <Input
                value={form.targetDepartment}
                onChange={(e) => setForm({ ...form, targetDepartment: e.target.value })}
              />
            </Field>
          )}
          <div className="sm:col-span-2">
            <Field label="Supporting documents (one per line: Name | reference/location)">
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
          <Button disabled={busy || !form.employeeId || !form.effectiveDate} onClick={save}>
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
    <div className="relative min-h-[6.25rem] overflow-hidden rounded-xl border border-border bg-card p-2.5 text-card-foreground shadow-sm md:min-h-0 md:p-4">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground/80">{title}</p>
          <h2 className="mt-1 text-xl font-bold text-foreground md:text-2xl">{value}</h2>
        </div>
        <div className={cn("rounded-lg p-1.5 md:p-2", iconBg)}>{icon}</div>
      </div>
      <div className="relative z-10 mt-2 flex items-center text-[10px]">
        {subtextDot && <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", subtextDot)} />}
        <span className={subtextColor}>{subtext}</span>
      </div>
      <div className="absolute bottom-2 right-2 z-0 h-7 w-16 opacity-50 md:h-8 md:w-24">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-full w-full">
          {trend === "up" ? (
            <path
              d="M0,25 C20,20 40,30 60,10 C80,-5 100,5 100,5"
              fill="none"
              className={chartColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M0,5 C20,5 40,-5 60,15 C80,30 100,20 100,20"
              fill="none"
              className={chartColor}
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
  const [open, setOpen] = useState(false);
  const selectedRow = rows.find(([id]) => id === value);

  return (
    <Field label={label}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-9 w-full justify-between px-3 font-normal"
          >
            <span className={cn("truncate", !selectedRow && "text-muted-foreground")}>
              {selectedRow?.[1] || "Select..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
          <Command
            filter={(candidateValue, search) => {
              const row = rows.find(([id]) => id === candidateValue);
              if (!row) return 0;
              return row.join(" ").toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No matches found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__empty__"
                  onSelect={() => {
                    set("");
                    setOpen(false);
                  }}
                >
                  <Check className={cn("h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                  <span>Select...</span>
                </CommandItem>
                {rows.map(([id, name]) => (
                  <CommandItem
                    key={id}
                    value={id}
                    onSelect={() => {
                      set(id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("h-4 w-4", value === id ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </Field>
  );
}
function Status({ value }: { value: string }) {
  const tone =
    value === "Posted"
      ? "bg-emerald-100 text-emerald-800"
      : value === "Rejected" || value === "Reversed"
        ? "bg-red-100 text-red-800"
        : value === "Approved"
          ? "bg-blue-100 text-blue-800"
          : "bg-amber-100 text-amber-800";
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${tone}`}>{value}</span>;
}
function actionLabel(x: string) {
  if (x === "reviewApprove") return "Review and approve";
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
