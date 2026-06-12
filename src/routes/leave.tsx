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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
    approvedDaysWithPay: string;
    approvedDaysWithoutPay: string;
    approvedDaysOther: string;
    approvedDaysOtherText: string;
    finalDisapprovalReason: string;
  } | null>(null);
  const [applicationForm, setApplicationForm] = useState(emptyLeaveForm());
  const [typeForm, setTypeForm] = useState({ code: "", name: "", isPaid: "yes" });

  const activeLeaveTypes = useMemo(() => leaveTypes.filter((item) => item.isActive), [leaveTypes]);
  const selectedLeaveType =
    activeLeaveTypes.find((type) => String(type.id) === applicationForm.leaveTypeId) || null;
  const minimumLeaveDate = getMinimumLeaveDate(selectedLeaveType);
  const calculatedDays = calculateWeekdayLeaveDays(applicationForm.dateFrom, applicationForm.dateTo);
  const daysRequested = applicationForm.overrideDays
    ? Number(applicationForm.daysRequested)
    : calculatedDays;

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
      if (!Number.isFinite(daysRequested) || daysRequested <= 0) {
        toast.error("Please select a valid date range or enter a valid day override");
        return;
      }
      await createLeaveApplication({
        employeeId: applicationForm.employeeId,
        leaveTypeId: Number(applicationForm.leaveTypeId),
        dateFrom: applicationForm.dateFrom,
        dateTo: applicationForm.dateTo,
        daysRequested,
        reason: applicationForm.reason,
        salarySnapshot: applicationForm.salarySnapshot
          ? Number(applicationForm.salarySnapshot)
          : null,
        detailLocationType: applicationForm.detailLocationType,
        detailLocationText: applicationForm.detailLocationText,
        detailSickType: applicationForm.detailSickType,
        detailIllness: applicationForm.detailIllness,
        detailStudyPurpose: applicationForm.detailStudyPurpose,
        detailOtherPurpose: applicationForm.detailOtherPurpose,
        detailOtherText: applicationForm.detailOtherText,
        commutationRequested: applicationForm.commutationRequested === "yes",
        formPayload: {
          clearanceRequired:
            selectedLeaveType?.code === "TERMINAL" ||
            calendarDaySpan(applicationForm.dateFrom, applicationForm.dateTo) >= 30,
        },
      });
      toast.success("Leave application recorded");
      setShowApplication(false);
      setApplicationForm(emptyLeaveForm());
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
        approvedDaysWithPay: numberOrNull(decision.approvedDaysWithPay),
        approvedDaysWithoutPay: numberOrNull(decision.approvedDaysWithoutPay),
        approvedDaysOther: numberOrNull(decision.approvedDaysOther),
        approvedDaysOtherText: decision.approvedDaysOtherText,
        finalDisapprovalReason: decision.finalDisapprovalReason,
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
                              approvedDaysWithPay:
                                application.approvedDaysWithPay?.toString() ||
                                application.daysRequested.toString(),
                              approvedDaysWithoutPay:
                                application.approvedDaysWithoutPay?.toString() || "",
                              approvedDaysOther: application.approvedDaysOther?.toString() || "",
                              approvedDaysOtherText: application.approvedDaysOtherText || "",
                              finalDisapprovalReason: application.finalDisapprovalReason || "",
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
                              approvedDaysWithPay:
                                application.approvedDaysWithPay?.toString() || "",
                              approvedDaysWithoutPay:
                                application.approvedDaysWithoutPay?.toString() || "",
                              approvedDaysOther: application.approvedDaysOther?.toString() || "",
                              approvedDaysOtherText: application.approvedDaysOtherText || "",
                              finalDisapprovalReason:
                                application.finalDisapprovalReason ||
                                application.decisionRemarks ||
                                "",
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
                  setApplicationForm({
                    ...emptyLeaveForm(),
                    employeeId: applicationForm.employeeId,
                    leaveTypeId: value,
                  })
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
                min={minimumLeaveDate}
                value={applicationForm.dateFrom}
                onChange={(e) =>
                  setApplicationForm({ ...applicationForm, dateFrom: e.target.value })
                }
              />
            </Field>
            <Field label="Date To">
              <Input
                type="date"
                min={applicationForm.dateFrom || minimumLeaveDate}
                value={applicationForm.dateTo}
                onChange={(e) => setApplicationForm({ ...applicationForm, dateTo: e.target.value })}
              />
            </Field>
            <Field label="Days Requested">
              <Input
                type={applicationForm.overrideDays ? "number" : "text"}
                step="0.001"
                value={
                  applicationForm.overrideDays
                    ? applicationForm.daysRequested
                    : calculatedDays > 0
                      ? formatNumber(calculatedDays)
                      : ""
                }
                readOnly={!applicationForm.overrideDays}
                placeholder="Auto-calculated"
                onChange={(e) =>
                  setApplicationForm({ ...applicationForm, daysRequested: e.target.value })
                }
              />
              <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={applicationForm.overrideDays}
                  onChange={(event) =>
                    setApplicationForm({
                      ...applicationForm,
                      overrideDays: event.target.checked,
                      daysRequested: event.target.checked
                        ? applicationForm.daysRequested || String(calculatedDays || "")
                        : "",
                    })
                  }
                  className="h-4 w-4 rounded border-border"
                />
                Override for half-day, shift, holiday, or special HR cases
              </label>
            </Field>
            <Field label="Salary" className="md:col-span-2">
              <Input
                type="number"
                step="0.01"
                value={applicationForm.salarySnapshot}
                onChange={(e) =>
                  setApplicationForm({ ...applicationForm, salarySnapshot: e.target.value })
                }
                placeholder="Optional snapshot for CS Form No. 6"
              />
            </Field>
            <Field label="Reason" className="md:col-span-2">
              <Textarea
                rows={3}
                value={applicationForm.reason}
                onChange={(e) => setApplicationForm({ ...applicationForm, reason: e.target.value })}
              />
            </Field>
            {selectedLeaveType ? (
              <LeaveTypeGuidance leaveType={selectedLeaveType} className="md:col-span-2" />
            ) : null}
            {selectedLeaveType?.detailSchema.includes("location") ? (
              <>
                <Field label="Location" className="md:col-span-2">
                  <RadioGroup
                    value={applicationForm.detailLocationType}
                    onValueChange={(value) =>
                      setApplicationForm({ ...applicationForm, detailLocationType: value })
                    }
                    className="grid gap-2 md:grid-cols-2"
                  >
                    <RadioChoice value="Philippines" label="Within the Philippines" />
                    <RadioChoice value="Abroad" label="Abroad" />
                  </RadioGroup>
                </Field>
                {applicationForm.detailLocationType === "Abroad" ? (
                  <Field label="Specify Abroad Location" className="md:col-span-2">
                    <Input
                      value={applicationForm.detailLocationText}
                      onChange={(e) =>
                        setApplicationForm({
                          ...applicationForm,
                          detailLocationText: e.target.value,
                        })
                      }
                    />
                  </Field>
                ) : null}
              </>
            ) : null}
            {selectedLeaveType?.detailSchema.includes("sick") ? (
              <>
                <Field label="Sick Leave Detail" className="md:col-span-2">
                  <RadioGroup
                    value={applicationForm.detailSickType}
                    onValueChange={(value) =>
                      setApplicationForm({ ...applicationForm, detailSickType: value })
                    }
                    className="grid gap-2 md:grid-cols-2"
                  >
                    <RadioChoice value="Hospital" label="In hospital" />
                    <RadioChoice value="OutPatient" label="Out patient" />
                  </RadioGroup>
                </Field>
                <Field label="Specify Illness" className="md:col-span-2">
                  <Input
                    value={applicationForm.detailIllness}
                    onChange={(e) =>
                      setApplicationForm({ ...applicationForm, detailIllness: e.target.value })
                    }
                  />
                </Field>
              </>
            ) : null}
            {selectedLeaveType?.detailSchema.includes("women") ? (
              <Field label="Specify Illness / Surgery Detail" className="md:col-span-2">
                <Input
                  value={applicationForm.detailIllness}
                  onChange={(e) =>
                    setApplicationForm({ ...applicationForm, detailIllness: e.target.value })
                  }
                />
              </Field>
            ) : null}
            {selectedLeaveType?.detailSchema.includes("study") ? (
              <Field label="Study Leave Purpose" className="md:col-span-2">
                <RadioGroup
                  value={applicationForm.detailStudyPurpose}
                  onValueChange={(value) =>
                    setApplicationForm({ ...applicationForm, detailStudyPurpose: value })
                  }
                  className="grid gap-2 md:grid-cols-2"
                >
                  <RadioChoice value="MastersDegree" label="Completion of Master's Degree" />
                  <RadioChoice value="BarBoardReview" label="BAR / Board Examination Review" />
                </RadioGroup>
              </Field>
            ) : null}
            {selectedLeaveType?.detailSchema.includes("otherPurpose") ? (
              <>
                <Field label="Other Purpose" className="md:col-span-2">
                  <RadioGroup
                    value={applicationForm.detailOtherPurpose}
                    onValueChange={(value) =>
                      setApplicationForm({ ...applicationForm, detailOtherPurpose: value })
                    }
                    className="grid gap-2 md:grid-cols-3"
                  >
                    <RadioChoice value="Monetization" label="Monetization" />
                    <RadioChoice value="TerminalLeave" label="Terminal Leave" />
                    <RadioChoice value="Other" label="Others" />
                  </RadioGroup>
                </Field>
                {applicationForm.detailOtherPurpose === "Other" ? (
                  <Field label="Specify Other Purpose" className="md:col-span-2">
                    <Input
                      value={applicationForm.detailOtherText}
                      onChange={(e) =>
                        setApplicationForm({ ...applicationForm, detailOtherText: e.target.value })
                      }
                    />
                  </Field>
                ) : null}
              </>
            ) : null}
            {selectedLeaveType?.detailSchema.includes("commutation") ? (
              <Field label="Commutation" className="md:col-span-2">
                <RadioGroup
                  value={applicationForm.commutationRequested}
                  onValueChange={(value) =>
                    setApplicationForm({ ...applicationForm, commutationRequested: value })
                  }
                  className="grid gap-2 md:grid-cols-2"
                >
                  <RadioChoice value="no" label="Not requested" />
                  <RadioChoice value="yes" label="Requested" />
                </RadioGroup>
              </Field>
            ) : null}
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
            {decision?.status === "Approved" ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Days With Pay">
                  <Input
                    type="number"
                    step="0.001"
                    value={decision.approvedDaysWithPay}
                    onChange={(event) =>
                      setDecision({ ...decision, approvedDaysWithPay: event.target.value })
                    }
                  />
                </Field>
                <Field label="Days Without Pay">
                  <Input
                    type="number"
                    step="0.001"
                    value={decision.approvedDaysWithoutPay}
                    onChange={(event) =>
                      setDecision({ ...decision, approvedDaysWithoutPay: event.target.value })
                    }
                  />
                </Field>
                <Field label="Other Days">
                  <Input
                    type="number"
                    step="0.001"
                    value={decision.approvedDaysOther}
                    onChange={(event) =>
                      setDecision({ ...decision, approvedDaysOther: event.target.value })
                    }
                  />
                </Field>
                <Field label="Other Days Details" className="sm:col-span-3">
                  <Input
                    value={decision.approvedDaysOtherText}
                    onChange={(event) =>
                      setDecision({ ...decision, approvedDaysOtherText: event.target.value })
                    }
                  />
                </Field>
              </div>
            ) : null}
            {decision?.status === "Disapproved" ? (
              <Field label="Disapproved Due To">
                <Textarea
                  rows={3}
                  value={decision.finalDisapprovalReason}
                  onChange={(event) =>
                    setDecision({ ...decision, finalDisapprovalReason: event.target.value })
                  }
                />
              </Field>
            ) : null}
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

function RadioChoice({ value, label }: { value: string; label: string }) {
  const id = `hr-leave-${value}`;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
      <RadioGroupItem value={value} id={id} />
      <Label htmlFor={id} className="text-sm font-normal">
        {label}
      </Label>
    </div>
  );
}

function LeaveTypeGuidance({
  leaveType,
  className,
}: {
  leaveType: LeaveType;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-blue-100 bg-blue-50/60 p-3", className)}>
      <div className="flex flex-wrap gap-2">
        {leaveType.maxDays ? (
          <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
            Up to {formatNumber(leaveType.maxDays)} days
          </Badge>
        ) : null}
        {leaveType.advanceNoticeDays ? (
          <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
            File {leaveType.advanceNoticeDays} days ahead
          </Badge>
        ) : null}
      </div>
      {leaveType.legalBasis ? (
        <p className="mt-2 text-xs font-medium text-blue-900">{leaveType.legalBasis}</p>
      ) : null}
      {leaveType.filingRule ? (
        <p className="mt-1 text-xs leading-5 text-blue-900/80">{leaveType.filingRule}</p>
      ) : null}
      {leaveType.requirements.length ? (
        <ul className="mt-2 space-y-1 text-xs leading-5 text-blue-900/80">
          {leaveType.requirements.map((requirement) => (
            <li key={requirement}>- {requirement}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function emptyLeaveForm() {
  return {
    employeeId: "",
    leaveTypeId: "",
    dateFrom: "",
    dateTo: "",
    daysRequested: "",
    overrideDays: false,
    salarySnapshot: "",
    reason: "",
    detailLocationType: "",
    detailLocationText: "",
    detailSickType: "",
    detailIllness: "",
    detailStudyPurpose: "",
    detailOtherPurpose: "",
    detailOtherText: "",
    commutationRequested: "no",
  };
}

function numberOrNull(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function calendarDaySpan(from: string, to: string) {
  if (!from || !to) return 0;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function calculateWeekdayLeaveDays(from: string, to: string) {
  if (!from || !to) return 0;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  let days = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) days += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function getMinimumLeaveDate(leaveType: LeaveType | null) {
  const days = leaveType?.advanceNoticeDays || 0;
  if (days <= 0) return undefined;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-CA");
}

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}
