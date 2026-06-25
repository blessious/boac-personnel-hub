import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRightLeft,
  CheckCircle2,
  Clock3,
  FileEdit,
  History,
  Plus,
  Search,
  Send,
  Undo2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

export const Route = createFileRoute("/movements")({ component: MovementsPage });
const selectClass = "h-9 w-full rounded-md border bg-background px-3 text-sm";
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
const statuses = [
  "all",
  "Draft",
  "Submitted",
  "Reviewed",
  "Approved",
  "Posted",
  "Rejected",
  "Reversed",
];
function MovementsPage() {
  const { user, can } = useAuth(),
    canPrepare = canWriteHrRecords(user?.role),
    canApprove = can("approve"),
    canPost = canPrepare;
  const [movements, setMovements] = useState<Movement[]>([]),
    [summary, setSummary] = useState<Record<string, number>>({}),
    [q, setQ] = useState(""),
    [status, setStatus] = useState("all"),
    [actionFilter, setActionFilter] = useState("all");
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
    [events, setEvents] = useState<
      Array<{
        id: string;
        eventType: string;
        fromStatus: string;
        toStatus: string;
        actor: string;
        remarks: string;
        createdAt: string;
      }>
    >([]),
    [eventMovement, setEventMovement] = useState<Movement | null>(null);
  const load = useCallback(async () => {
    try {
      const x = await listMovements(q, status, actionFilter);
      setMovements(x.movements);
      setSummary(x.summary);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [q, status, actionFilter]);
  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);
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
  const openForm = (m?: Movement) => {
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
        : emptyMovement,
    );
  };
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
      await transitionMovement(m.id, action, remarks);
      toast.success(`Movement ${action} completed`);
      setDecision(null);
      setDecisionRemarks("");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const showEvents = async (m: Movement) => {
    try {
      const x = await api<{ events: typeof events }>(`/api/movements/${m.id}/events`);
      setEvents(x.events);
      setEventMovement(m);
    } catch (e) {
      toast.error((e as Error).message);
    }
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
  return (
    <AppShell
      title="Employee Movements"
      subtitle="Prepare, review, approve, post, and reverse governed personnel actions"
    >
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
      <div className="mt-5 flex flex-wrap gap-2">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search control number or employee"
          />
        </div>
        <select
          className={selectClass + " max-w-40"}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {statuses.map((x) => (
            <option key={x} value={x}>
              {x === "all" ? "All statuses" : x}
            </option>
          ))}
        </select>
        <select
          className={selectClass + " max-w-52"}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="all">All action types</option>
          {MOVEMENT_TYPES.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        {canPrepare && (
          <Button onClick={() => openForm()}>
            <Plus className="mr-2 h-4 w-4" />
            Prepare movement
          </Button>
        )}
      </div>
      <div className="mobile-record-list mt-4 md:hidden">
        {movements.map((m) => (
          <article className="mobile-record-card" key={m.id}>
            <div className="mobile-record-card__header">
              <div>
                <div className="mobile-record-card__title">{m.controlNumber}</div>
                <div className="mobile-record-card__meta">
                  {m.employeeName} - {m.employeeNo}
                </div>
              </div>
              <Status value={m.status} />
            </div>
            <div className="mobile-record-card__grid">
              <div className="mobile-record-card__field">
                <span className="mobile-record-card__label">Action</span>
                <span className="mobile-record-card__value">{m.actionType}</span>
              </div>
              <div className="mobile-record-card__field">
                <span className="mobile-record-card__label">Effectivity</span>
                <span className="mobile-record-card__value">
                  {m.effectiveDate}
                  {m.endDate ? ` to ${m.endDate}` : ""}
                </span>
              </div>
              <div className="mobile-record-card__field">
                <span className="mobile-record-card__label">Authority</span>
                <span className="mobile-record-card__value">{m.authorityNumber || "-"}</span>
              </div>
              <div className="mobile-record-card__field">
                <span className="mobile-record-card__label">From</span>
                <span className="mobile-record-card__value">
                  {fromText(m)}
                  <span className="block text-[11px] text-muted-foreground">{fromMeta(m)}</span>
                </span>
              </div>
              <div className="mobile-record-card__field">
                <span className="mobile-record-card__label">To</span>
                <span className="mobile-record-card__value">
                  {toText(m)}
                  {toMeta(m) && (
                    <span className="block text-[11px] text-muted-foreground">{toMeta(m)}</span>
                  )}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              <Button size="icon" variant="ghost" title="History" onClick={() => showEvents(m)}>
                <History className="h-4 w-4" />
              </Button>
              {canPrepare && ["Draft", "Rejected"].includes(m.status) && (
                <Button size="icon" variant="ghost" title="Edit" onClick={() => openForm(m)}>
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
              )}
              {canPrepare && m.status === "Draft" && (
                <Button
                  size="icon"
                  variant="ghost"
                  title="Submit"
                  onClick={() => setDecision({ movement: m, action: "submit" })}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
              {canApprove && m.status === "Submitted" && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Review"
                    onClick={() => setDecision({ movement: m, action: "review" })}
                  >
                    <Clock3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Reject"
                    onClick={() => setDecision({ movement: m, action: "reject" })}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Return to Draft"
                    onClick={() => setDecision({ movement: m, action: "return" })}
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              {canApprove && m.status === "Reviewed" && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Approve"
                    onClick={() => setDecision({ movement: m, action: "approve" })}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Reject"
                    onClick={() => setDecision({ movement: m, action: "reject" })}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Return to Draft"
                    onClick={() => setDecision({ movement: m, action: "return" })}
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              {canPost && m.status === "Approved" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDecision({ movement: m, action: "post" })}
                  >
                    Post
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Reject"
                    onClick={() => setDecision({ movement: m, action: "reject" })}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Return to Draft"
                    onClick={() => setDecision({ movement: m, action: "return" })}
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              {canPost && m.status === "Posted" && (
                <Button
                  size="icon"
                  variant="ghost"
                  title="Reverse"
                  onClick={() => setDecision({ movement: m, action: "reverse" })}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </article>
        ))}
        {!movements.length && (
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
            {movements.map((m) => (
              <tr className="border-t" key={m.id}>
                <td className="whitespace-nowrap p-3 font-medium">{m.controlNumber}</td>
                <td className="p-3">
                  {m.employeeName}
                  <div className="text-xs text-muted-foreground">{m.employeeNo}</div>
                </td>
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
                  {m.effectiveDate}
                  {m.endDate && (
                    <div className="text-xs text-muted-foreground">until {m.endDate}</div>
                  )}
                </td>
                <td className="p-3">
                  <Status value={m.status} />
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="History"
                      onClick={() => showEvents(m)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    {canPrepare && ["Draft", "Rejected"].includes(m.status) && (
                      <Button size="icon" variant="ghost" title="Edit" onClick={() => openForm(m)}>
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    )}
                    {canPrepare && m.status === "Draft" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Submit"
                        onClick={() => setDecision({ movement: m, action: "submit" })}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {canApprove && m.status === "Submitted" && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Review"
                          onClick={() => setDecision({ movement: m, action: "review" })}
                        >
                          <Clock3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Reject"
                          onClick={() => setDecision({ movement: m, action: "reject" })}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Return to Draft"
                          onClick={() => setDecision({ movement: m, action: "return" })}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {canApprove && m.status === "Reviewed" && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Approve"
                          onClick={() => setDecision({ movement: m, action: "approve" })}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Reject"
                          onClick={() => setDecision({ movement: m, action: "reject" })}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Return to Draft"
                          onClick={() => setDecision({ movement: m, action: "return" })}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {canPost && m.status === "Approved" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDecision({ movement: m, action: "post" })}
                        >
                          Post
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Reject"
                          onClick={() => setDecision({ movement: m, action: "reject" })}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Return to Draft"
                          onClick={() => setDecision({ movement: m, action: "return" })}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {canPost && m.status === "Posted" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Reverse"
                        onClick={() => setDecision({ movement: m, action: "reverse" })}
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!movements.length && (
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
      <Dialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {titleCase(decision?.action || "")} movement - {decision?.movement.controlNumber}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {decision?.action === "post"
              ? "Posting atomically updates the employee and Plantilla occupancy. Confirm that the approved action is ready for effectivity."
              : decision?.action === "reverse"
                ? "Reversal restores the recorded before-state and is blocked if a later movement exists."
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
              Confirm {decision?.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!eventMovement} onOpenChange={(o) => !o && setEventMovement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Action history - {eventMovement?.controlNumber}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {events.map((e) => (
              <div className="rounded border p-3" key={e.id}>
                <div className="font-medium">
                  {e.eventType}: {e.fromStatus || "New"} to {e.toStatus}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString()} - {e.actor}
                </div>
                {e.remarks && <p className="mt-1 text-sm">{e.remarks}</p>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
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
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{movement ? "Edit" : "Prepare"} personnel movement</DialogTitle>
        </DialogHeader>
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
            rows={employees.map((e) => [e.id, `${e.lastname}, ${e.firstname} (${e.employeeId})`])}
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
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground/80">{title}</p>
          <h2 className="mt-1 text-2xl font-bold text-foreground">{value}</h2>
        </div>
        <div className={cn("rounded-lg p-2", iconBg)}>{icon}</div>
      </div>
      <div className="relative z-10 mt-2 flex items-center text-[10px]">
        {subtextDot && <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", subtextDot)} />}
        <span className={subtextColor}>{subtext}</span>
      </div>
      <div className="absolute bottom-2 right-2 z-0 h-8 w-24 opacity-50">
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
  return (
    <Field label={label}>
      <select className={selectClass} value={value} onChange={(e) => set(e.target.value)}>
        <option value="">Select...</option>
        {rows.map(([id, name]) => (
          <option value={id} key={id}>
            {name}
          </option>
        ))}
      </select>
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
function titleCase(x: string) {
  return x ? x[0].toUpperCase() + x.slice(1) : "";
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
