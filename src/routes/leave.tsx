import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  FilePlus2,
  FileText,
  Plus,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { GenerationLoader } from "@/components/GenerationLoader";
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
import { useRealtimeRefresh } from "@/lib/realtime";
import {
  createLeaveApplication,
  createLeaveType,
  decideLeaveApplication,
  deleteLeaveApplication,
  generateLeaveForm6Excel,
  generateLeaveForm6Pdf,
  getEmployeeLeave,
  listLeaveApplications,
  listLeaveTypes,
  type EmployeeLeaveResponse,
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
  const canApprove = can("approve");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [view, setView] = useState<"applications" | "ledger">("applications");
  const [ledgerEmployeeId, setLedgerEmployeeId] = useState("");
  const [ledgerData, setLedgerData] = useState<EmployeeLeaveResponse | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [generationLoader, setGenerationLoader] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [hideGenerationLoader, setHideGenerationLoader] = useState(false);
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
  const calculatedDays = calculateWeekdayLeaveDays(
    applicationForm.dateFrom,
    applicationForm.dateTo,
  );
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
        setLedgerEmployeeId((current) => current || employeeResult.employees[0]?.id || "");
      })
      .catch((error) => toast.error((error as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, q]);
  useRealtimeRefresh(load, ["leave", "employees"]);

  useEffect(() => {
    if (view !== "ledger" || !ledgerEmployeeId) return;
    setLedgerLoading(true);
    setLedgerData(null);
    getEmployeeLeave(ledgerEmployeeId)
      .then(setLedgerData)
      .catch((error) => toast.error((error as Error).message))
      .finally(() => setLedgerLoading(false));
  }, [ledgerEmployeeId, view]);

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

  const downloadForm6 = async (application: LeaveApplication) => {
    setHideGenerationLoader(false);
    setGenerationLoader({
      title: "Generating CS Form No. 6",
      description: "Preparing the leave application workbook for download.",
    });
    try {
      const result = await generateLeaveForm6Excel(application.id);
      downloadGeneratedFile(result.downloadUrl, result.fileName);
      toast.success("CS Form No. 6 generated");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGenerationLoader(null);
    }
  };

  const previewForm6Pdf = async (application: LeaveApplication) => {
    setHideGenerationLoader(false);
    setGenerationLoader({
      title: "Generating CS Form No. 6 PDF",
      description: "Preparing the leave application PDF preview.",
    });
    try {
      const result = await generateLeaveForm6Pdf(application.id);
      window.open(result.previewUrl, "_blank", "noopener,noreferrer");
      toast.success("CS Form No. 6 PDF generated");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setGenerationLoader(null);
    }
  };

  return (
    <AppShell title="HR Approvals" subtitle="Review, approve, and track employee leave requests">
      <GenerationLoader
        open={Boolean(generationLoader) && !hideGenerationLoader}
        title={generationLoader?.title}
        description={generationLoader?.description}
        onDismiss={() => setHideGenerationLoader(true)}
      />
      <div className="mb-4 grid grid-cols-4 gap-2 md:gap-3">
        <StatCard
          title="Pending"
          value={summary.pending || 0}
          subtext="Awaiting review"
          subtextColor="text-muted-foreground"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50 dark:bg-amber-500/15"
          chartColor="stroke-amber-500"
          trend="up"
        />
        <StatCard
          title="Approved"
          value={summary.approved || 0}
          subtext="Processed"
          subtextColor="text-muted-foreground"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50 dark:bg-emerald-500/15"
          chartColor="stroke-emerald-500"
          trend="up"
        />
        <StatCard
          title="Disapproved"
          value={summary.disapproved || 0}
          subtext="Denied requests"
          subtextColor="text-muted-foreground"
          icon={<XCircle className="h-5 w-5 text-rose-600" />}
          iconBg="bg-rose-50 dark:bg-rose-500/15"
          chartColor="stroke-rose-500"
          trend="down"
        />
        <StatCard
          title="Total"
          value={summary.total || 0}
          subtext="All applications"
          subtextColor="text-muted-foreground"
          icon={<ClipboardCheck className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50 dark:bg-blue-500/15"
          chartColor="stroke-blue-500"
          trend="up"
        />
      </div>

      <div className="mb-4 inline-flex w-full rounded-xl bg-muted/50 p-1 md:w-auto">
        {[
          { value: "applications", label: "Applications" },
          { value: "ledger", label: "Credit Ledger" },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setView(item.value as "applications" | "ledger")}
            className={cn(
              "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors md:flex-none md:py-1.5",
              view === item.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {view === "ledger" ? (
        <CreditLedgerPanel
          employees={employees}
          selectedEmployeeId={ledgerEmployeeId}
          onEmployeeChange={setLedgerEmployeeId}
          data={ledgerData}
          loading={ledgerLoading}
        />
      ) : (
        <div className="border-0 bg-transparent shadow-none md:rounded-xl md:border md:border-border md:bg-card md:shadow-sm">
          <div className="flex flex-col gap-3 border-border pb-3 md:border-b md:p-4 xl:flex-row xl:items-center">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employee, ID, or department"
                className="pl-9 md:h-10"
                value={q}
                onChange={(event) => setQ(event.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto rounded-none bg-transparent p-0 md:rounded-lg md:bg-muted/50 md:p-1">
              {(["all", "Pending", "Approved", "Disapproved", "Cancelled"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  className={cn(
                    "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-colors md:rounded-md md:px-3 md:py-1.5 md:font-medium",
                    status === item
                      ? "bg-background text-blue-700 shadow-sm ring-1 ring-blue-100"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground md:bg-transparent",
                  )}
                >
                  {item === "all" ? "All" : item}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 xl:flex">
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
          </div>

          <div className="mobile-record-list">
            {loading ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Loading leave records...
              </div>
            ) : applications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No leave applications found.
              </div>
            ) : (
              applications.map((application) => (
                <article
                  key={application.id}
                  className="rounded-xl border border-border bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-foreground">
                        {application.employeeName}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {application.employeeNo}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {application.department}
                      </p>
                    </div>
                    <Badge variant="outline" className={STATUS_COLOR[application.status]}>
                      {application.status}
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-[2.5rem_1.15fr_1.15fr_0.55fr_1fr] items-center gap-2 border-t border-border/70 pt-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                      <FilePlus2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {application.leaveName}
                      </p>
                      <p className="text-xs text-muted-foreground">{application.leaveCode}</p>
                    </div>
                    <div className="border-l border-border/70 pl-3 text-sm text-muted-foreground">
                      <p>{application.dateFrom} to</p>
                      <p>{application.dateTo}</p>
                    </div>
                    <div className="border-l border-border/70 pl-3 text-center">
                      <p className="text-sm font-bold text-foreground">
                        {formatNumber(application.daysRequested)}
                      </p>
                      <p className="text-xs text-muted-foreground">days</p>
                    </div>
                    <div className="min-w-0 border-l border-border/70 pl-3">
                      <p className="text-xs text-muted-foreground">Reason</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {application.reason || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-5 gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      title="Approve"
                      disabled={!canApprove || application.status === "Approved"}
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
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      title="Disapprove"
                      disabled={!canApprove || application.status === "Disapproved"}
                      onClick={() =>
                        setDecision({
                          application,
                          status: "Disapproved",
                          remarks: application.decisionRemarks || "",
                          approvedDaysWithPay: application.approvedDaysWithPay?.toString() || "",
                          approvedDaysWithoutPay:
                            application.approvedDaysWithoutPay?.toString() || "",
                          approvedDaysOther: application.approvedDaysOther?.toString() || "",
                          approvedDaysOtherText: application.approvedDaysOtherText || "",
                          finalDisapprovalReason:
                            application.finalDisapprovalReason || application.decisionRemarks || "",
                        })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      title="Download Excel"
                      onClick={() => downloadForm6(application)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      title="Preview PDF"
                      onClick={() => previewForm6Pdf(application)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      title="Delete"
                      disabled={!canEdit}
                      onClick={() => remove(application)}
                      className="text-destructive hover:text-destructive"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="mobile-desktop-table overflow-x-auto">
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
                            disabled={!canApprove || application.status === "Approved"}
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
                            disabled={!canApprove || application.status === "Disapproved"}
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
                            onClick={() => downloadForm6(application)}
                            className="h-8 px-2"
                            title="Download CS Form No. 6 Excel"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => previewForm6Pdf(application)}
                            className="h-8 px-2"
                            title="Preview CS Form No. 6 PDF"
                          >
                            <FileText className="h-3.5 w-3.5" />
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
      )}

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
    <div className="relative min-h-[7.25rem] overflow-hidden rounded-xl border border-border bg-card p-2.5 text-card-foreground shadow-sm md:min-h-0 md:p-4">
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

function CreditLedgerPanel({
  employees,
  selectedEmployeeId,
  onEmployeeChange,
  data,
  loading,
}: {
  employees: EmployeeRecord[];
  selectedEmployeeId: string;
  onEmployeeChange: (value: string) => void;
  data: EmployeeLeaveResponse | null;
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(260px,420px)_1fr] md:items-end">
          <Field label="Employee">
            <Select value={selectedEmployeeId} onValueChange={onEmployeeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.lastname}, {employee.firstname} - {employee.employeeId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {data ? (
            <div className="text-sm text-muted-foreground">
              {data.employee.position} - {data.employee.department}
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground shadow-sm">
          Loading leave credit ledger...
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground shadow-sm">
          Select an employee to view leave credits.
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.balances.map((balance) => (
              <div
                key={balance.leaveTypeId}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {balance.code}
                </div>
                <div className="mt-1 min-h-10 text-sm font-semibold text-foreground">
                  {balance.name}
                </div>
                <div className="mt-3 text-2xl font-semibold text-primary">
                  {formatNumber(balance.balance)}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span>Earned {formatNumber(balance.earned)}</span>
                  <span>Used {formatNumber(balance.used)}</span>
                  <span>Adj {formatNumber(balance.adjusted)}</span>
                </div>
              </div>
            ))}
          </div>

          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Leave Credit Ledger</h3>
              <p className="text-xs text-muted-foreground">
                Credit additions, deductions, adjustments, and reversals for the selected employee.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2.5 font-medium">Date</th>
                    <th className="px-3 py-2.5 font-medium">Type</th>
                    <th className="px-3 py-2.5 font-medium">Entry</th>
                    <th className="px-3 py-2.5 font-medium">Amount</th>
                    <th className="px-3 py-2.5 font-medium">Change</th>
                    <th className="px-3 py-2.5 font-medium">Balance After</th>
                    <th className="px-3 py-2.5 font-medium">Description</th>
                    <th className="px-3 py-2.5 font-medium">By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ledger.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                        No ledger entries recorded yet.
                      </td>
                    </tr>
                  ) : (
                    data.ledger.map((entry) => (
                      <tr key={entry.id} className="border-b border-border/50 last:border-0">
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2.5">{entry.name}</td>
                        <td className="px-3 py-2.5">{formatLedgerType(entry.entryType)}</td>
                        <td className="px-3 py-2.5 font-medium">{formatNumber(entry.amount)}</td>
                        <td className="px-3 py-2.5 font-medium">
                          {formatNumber(entry.balanceDelta)}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-primary">
                          {formatNumber(entry.balanceAfter)}
                        </td>
                        <td className="max-w-[260px] truncate px-3 py-2.5 text-muted-foreground">
                          {entry.description || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {entry.createdByName || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
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

function LeaveTypeGuidance({ leaveType, className }: { leaveType: LeaveType; className?: string }) {
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

function downloadGeneratedFile(downloadUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.click();
}

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function formatLedgerType(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
}
