import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardCheck, FilePlus2, Plus, Search, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { listEmployees, type EmployeeRecord } from "@/lib/employees-api";
import {
  createLeaveApplication,
  createLeaveType,
  decideLeaveApplication,
  deleteLeaveApplication,
  listLeaveApplications,
  listLeaveTypes,
  type LeaveApplication,
  type LeaveStatus,
  type LeaveType,
} from "@/lib/leave-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leave")({
  component: LeavePage,
});

const STATUS_COLOR: Record<LeaveStatus, string> = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Disapproved: "bg-rose-100 text-rose-700 border-rose-200",
  Cancelled: "bg-muted text-muted-foreground border-border",
};

function LeavePage() {
  const { can } = useAuth();
  const canEdit = can("edit");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    disapproved: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showApplication, setShowApplication] = useState(false);
  const [showType, setShowType] = useState(false);
  const [decision, setDecision] = useState<{
    application: LeaveApplication;
    status: Exclude<LeaveStatus, "Pending">;
    remarks: string;
  } | null>(null);
  const [applicationForm, setApplicationForm] = useState({
    employeeId: "",
    leaveTypeId: "",
    dateFrom: "",
    dateTo: "",
    daysRequested: "",
    reason: "",
  });
  const [typeForm, setTypeForm] = useState({ code: "", name: "", isPaid: "yes" });

  const activeLeaveTypes = useMemo(() => leaveTypes.filter((item) => item.isActive), [leaveTypes]);

  const load = () => {
    setLoading(true);
    Promise.all([
      listLeaveApplications({ status, q }),
      listLeaveTypes(),
      listEmployees({ page: 1, pageSize: 100 }),
    ])
      .then(([leaveResult, typeResult, employeeResult]) => {
        setApplications(leaveResult.applications);
        setSummary(leaveResult.summary);
        setLeaveTypes(typeResult.leaveTypes);
        setEmployees(employeeResult.employees);
      })
      .catch((error) => toast.error((error as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, q]);

  const submitApplication = async () => {
    try {
      await createLeaveApplication({
        employeeId: applicationForm.employeeId,
        leaveTypeId: Number(applicationForm.leaveTypeId),
        dateFrom: applicationForm.dateFrom,
        dateTo: applicationForm.dateTo,
        daysRequested: Number(applicationForm.daysRequested),
        reason: applicationForm.reason,
      });
      toast.success("Leave application recorded");
      setShowApplication(false);
      setApplicationForm({
        employeeId: "",
        leaveTypeId: "",
        dateFrom: "",
        dateTo: "",
        daysRequested: "",
        reason: "",
      });
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const submitType = async () => {
    try {
      const result = await createLeaveType({
        code: typeForm.code,
        name: typeForm.name,
        isPaid: typeForm.isPaid === "yes",
      });
      setLeaveTypes((current) => [...current, result.leaveType]);
      setTypeForm({ code: "", name: "", isPaid: "yes" });
      setShowType(false);
      toast.success("Leave type added");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const submitDecision = async () => {
    if (!decision) return;
    try {
      await decideLeaveApplication(decision.application.id, {
        status: decision.status,
        remarks: decision.remarks,
      });
      toast.success(`Leave ${decision.status.toLowerCase()}`);
      setDecision(null);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const remove = async (application: LeaveApplication) => {
    if (!window.confirm("Delete this leave application? Approved leave credits will be restored."))
      return;
    try {
      await deleteLeaveApplication(application.id);
      toast.success("Leave application deleted");
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <AppShell title="HR Approvals" subtitle="Review, approve, and track employee leave requests">
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <SummaryCard label="Pending" value={summary.pending} />
        <SummaryCard label="Approved" value={summary.approved} />
        <SummaryCard label="Disapproved" value={summary.disapproved} />
        <SummaryCard label="Total" value={summary.total} />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employee, ID, or department"
              className="pl-9"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>
          <div className="flex overflow-x-auto rounded-lg bg-muted/50 p-1">
            {(["all", "Pending", "Approved", "Disapproved", "Cancelled"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setStatus(item)}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  status === item
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item === "all" ? "All" : item}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            disabled={!canEdit}
            onClick={() => setShowType(true)}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-border dark:text-slate-300 dark:hover:bg-muted/40"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Leave Type
          </Button>
          <Button
            disabled={!canEdit}
            onClick={() => setShowApplication(true)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <FilePlus2 className="mr-1.5 h-4 w-4" /> File Leave
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Employee</th>
                <th className="px-4 py-3 font-semibold">Leave Type</th>
                <th className="px-4 py-3 font-semibold">Dates</th>
                <th className="px-4 py-3 font-semibold">Days</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Loading leave records...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No leave applications found.
                  </td>
                </tr>
              ) : (
                applications.map((application, index) => (
                  <tr
                    key={application.id}
                    className={cn(
                      "border-b border-border/50 last:border-0 hover:bg-muted/40",
                      index % 2 === 1 && "bg-muted/10",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{application.employeeName}</div>
                      <div className="text-xs text-muted-foreground">
                        {application.employeeNo} · {application.department}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{application.leaveName}</div>
                      <div className="text-xs text-muted-foreground">{application.leaveCode}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {application.dateFrom} to {application.dateTo}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatNumber(application.daysRequested)}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
                      {application.reason || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={STATUS_COLOR[application.status]}>
                        {application.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canEdit || application.status === "Approved"}
                          onClick={() =>
                            setDecision({
                              application,
                              status: "Approved",
                              remarks: application.decisionRemarks || "",
                            })
                          }
                          className="h-8 px-2"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canEdit || application.status === "Disapproved"}
                          onClick={() =>
                            setDecision({
                              application,
                              status: "Disapproved",
                              remarks: application.decisionRemarks || "",
                            })
                          }
                          className="h-8 px-2"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canEdit}
                          onClick={() => remove(application)}
                          className="h-8 px-2 text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showApplication} onOpenChange={setShowApplication}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>File Leave Application</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 md:grid-cols-2">
            <Field label="Employee">
              <Select
                value={applicationForm.employeeId}
                onValueChange={(value) =>
                  setApplicationForm({ ...applicationForm, employeeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.lastname}, {employee.firstname} · {employee.employeeId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Leave Type">
              <Select
                value={applicationForm.leaveTypeId}
                onValueChange={(value) =>
                  setApplicationForm({ ...applicationForm, leaveTypeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {activeLeaveTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date From">
              <Input
                type="date"
                value={applicationForm.dateFrom}
                onChange={(e) =>
                  setApplicationForm({ ...applicationForm, dateFrom: e.target.value })
                }
              />
            </Field>
            <Field label="Date To">
              <Input
                type="date"
                value={applicationForm.dateTo}
                onChange={(e) => setApplicationForm({ ...applicationForm, dateTo: e.target.value })}
              />
            </Field>
            <Field label="Days Requested">
              <Input
                type="number"
                step="0.001"
                value={applicationForm.daysRequested}
                onChange={(e) =>
                  setApplicationForm({ ...applicationForm, daysRequested: e.target.value })
                }
              />
            </Field>
            <Field label="Reason" className="md:col-span-2">
              <Textarea
                rows={3}
                value={applicationForm.reason}
                onChange={(e) => setApplicationForm({ ...applicationForm, reason: e.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplication(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canEdit}
              onClick={submitApplication}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Save Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(decision)} onOpenChange={(open) => !open && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decision?.status} Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
              <div className="font-medium text-foreground">
                {decision?.application.employeeName}
              </div>
              <div className="text-muted-foreground">
                {decision?.application.leaveName} - {decision?.application.dateFrom} to{" "}
                {decision?.application.dateTo}
              </div>
            </div>
            <Field label="Remarks">
              <Textarea
                rows={3}
                value={decision?.remarks || ""}
                onChange={(event) =>
                  decision && setDecision({ ...decision, remarks: event.target.value })
                }
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button onClick={submitDecision} className="bg-blue-600 text-white hover:bg-blue-700">
              Save Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showType} onOpenChange={setShowType}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Leave Type</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Field label="Code">
              <Input
                value={typeForm.code}
                onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                placeholder="e.g. CTO"
              />
            </Field>
            <Field label="Name">
              <Input
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                placeholder="e.g. Compensatory Time-Off"
              />
            </Field>
            <Field label="Paid Leave">
              <Select
                value={typeForm.isPaid}
                onValueChange={(value) => setTypeForm({ ...typeForm, isPaid: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowType(false)}>
              Cancel
            </Button>
            <Button disabled={!canEdit} onClick={submitType}>
              Add Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
        <ClipboardCheck className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}
