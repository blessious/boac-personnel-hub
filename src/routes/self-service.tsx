import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  IdCard,
  Mail,
  Newspaper,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  generateEmployeePdsExcel,
  getEmployee,
  type EmployeeDetailResponse,
  type EmployeeRecord,
  type SectionRow,
} from "@/lib/employees-api";
import {
  getEmployeeLeave,
  type EmployeeLeaveResponse,
  type LeaveApplication,
  type LeaveBalance,
  type LeaveType,
  listLeaveTypes,
} from "@/lib/leave-api";
import { listDtr, type DtrEntry, type DtrListResponse } from "@/lib/attendance-api";
import { submitLeaveRequest } from "@/lib/requests-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/self-service")({
  component: SelfServicePage,
});

function SelfServicePage() {
  return <SelfServiceHome />;
}

export function SelfServiceHome() {
  return <EmployeeServicesHome />;
}

export function EmployeeDashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EmployeeDetailResponse | null>(null);
  const [leave, setLeave] = useState<EmployeeLeaveResponse | null>(null);
  const [todayStatus, setTodayStatus] = useState<string>("Loading...");
  const [todayDtr, setTodayDtr] = useState<DtrEntry | null>(null);
  const [dtrSummary, setDtrSummary] = useState<DtrListResponse["summary"]>({
    total: 0,
    present: 0,
    incomplete: 0,
    lateMinutes: 0,
  });
  const [loading, setLoading] = useState(Boolean(user?.employeeId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.employeeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const now = new Date();
    const today = now.toLocaleDateString("en-CA");
    const monthFrom = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString("en-CA");
    const monthTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString("en-CA");
    Promise.all([
      getEmployee(user.employeeId),
      getEmployeeLeave(user.employeeId),
      listDtr({
        employeeId: user.employeeId,
        from: monthFrom,
        to: monthTo,
      }).catch(() => null),
    ])
      .then(([employeeResult, leaveResult, dtrResult]) => {
        setProfile(employeeResult);
        setLeave(leaveResult);
        if (dtrResult) setDtrSummary(dtrResult.summary);
        const todayEntry = dtrResult?.entries.find((entry) => entry.workDate === today);
        setTodayDtr(todayEntry || null);
        if (todayEntry) {
          setTodayStatus(todayEntry.status);
        } else {
          setTodayStatus("No Record");
        }
      })
      .catch((err) => setError(err.message || "Unable to load your dashboard"))
      .finally(() => setLoading(false));
  }, [user?.employeeId]);

  const employee = profile?.employee || leave?.employee || null;
  const pendingRequests =
    leave?.applications.filter((item) => item.status === "Pending").length || 0;
  const primaryLeave = leave?.balances[0] || null;
  const availableLeaveCredits = (leave?.balances || []).reduce(
    (total, balance) => total + Number(balance.balance || 0),
    0,
  );
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long" });
  const otherAttendanceRecords = Math.max(
    dtrSummary.total - dtrSummary.present - dtrSummary.incomplete,
    0,
  );
  const attendanceSummaryText = [
    `${dtrSummary.present} present/late`,
    dtrSummary.incomplete ? `${dtrSummary.incomplete} incomplete` : "",
    otherAttendanceRecords ? `${otherAttendanceRecords} other` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const openProfile = () => navigate({ to: "/my-profile" });
  const openServices = () => navigate({ to: "/self-service" });
  const openRequests = () => navigate({ to: "/requests" });
  const openAttendance = () => navigate({ to: "/attendance" });

  return (
    <AppShell title="My Dashboard" subtitle="Your HR snapshot for today">
      {loading ? (
        <ProfileLoading />
      ) : error ? (
        <EmptyProfile
          title="We could not load your dashboard"
          description={error}
          actionLabel="Try again"
          onAction={() => window.location.reload()}
        />
      ) : !employee ? (
        <EmptyProfile
          title="Your account is ready, but it is not linked yet"
          description="Ask HR or the system admin to connect your user account to your employee record. After that, this dashboard will show your profile, leave credits, and request status."
        />
      ) : (
        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="relative p-5 lg:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                  <Avatar className="h-20 w-20 border border-border bg-muted shadow-sm">
                    {employee.photoUrl ? (
                      <AvatarImage src={employee.photoUrl} alt={formatFullName(employee)} />
                    ) : null}
                    <AvatarFallback className="bg-sky-50 text-xl font-semibold text-sky-700">
                      {getInitials(employee)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      Employee Dashboard
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                      Welcome, {employee.firstname || user?.name}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {employee.position || "Position not set"} -{" "}
                      {employee.department || "Department not set"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        {todayStatus}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-full border-amber-200 bg-amber-50 text-amber-700"
                      >
                        {pendingRequests} pending request{pendingRequests === 1 ? "" : "s"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:w-[300px]">
                  <Button variant="outline" onClick={openProfile} className="w-full">
                    My Profile
                  </Button>
                  <Button
                    onClick={openServices}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Self-Service
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard
              title="Today's DTR"
              value={formatPunchRange(todayDtr?.amIn, todayDtr?.amOut)}
              subtext={formatPunchRange(todayDtr?.pmIn, todayDtr?.pmOut)}
              details={[
                `AM In: ${formatDtrTime(todayDtr?.amIn)}`,
                `AM Out: ${formatDtrTime(todayDtr?.amOut)}`,
                `PM In: ${formatDtrTime(todayDtr?.pmIn)}`,
                `PM Out: ${formatDtrTime(todayDtr?.pmOut)}`,
              ]}
              icon={<Clock className="h-5 w-5 text-blue-600" />}
              iconBg="bg-blue-50"
              chartColor="stroke-blue-500"
              trend="up"
            />
            <DashboardMetricCard
              title={`${monthLabel} Attendance`}
              value={dtrSummary.total}
              subtext={attendanceSummaryText || "No attendance entries"}
              icon={<CalendarCheck className="h-5 w-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
              chartColor="stroke-emerald-500"
              trend="up"
            />
            <DashboardMetricCard
              title="Tardiness"
              value={dtrSummary.lateMinutes}
              subtext="Month-to-date total"
              icon={<CalendarClock className="h-5 w-5 text-amber-600" />}
              iconBg="bg-amber-50"
              chartColor="stroke-amber-500"
              trend="down"
            />
            <DashboardMetricCard
              title="Leave Credits"
              value={formatNumber(availableLeaveCredits)}
              subtext={
                primaryLeave
                  ? `${primaryLeave.code}: ${formatNumber(primaryLeave.balance)} available`
                  : "No active leave balances"
              }
              icon={<ClipboardCheck className="h-5 w-5 text-rose-600" />}
              iconBg="bg-rose-50"
              chartColor="stroke-rose-500"
              trend="up"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <CleanPanel title="Quick Actions" icon={Sparkles}>
              <div className="grid gap-3 md:grid-cols-2">
                <ActionButton
                  icon={ClipboardCheck}
                  title="Apply Leave"
                  description="Start a leave request from self-service."
                  onClick={openServices}
                />
                <ActionButton
                  icon={CalendarClock}
                  title="View Attendance"
                  description="Check DTR and correction options."
                  onClick={openAttendance}
                />
                <ActionButton
                  icon={FileText}
                  title="Request Certificate"
                  description="Prepare COE and HR document requests."
                  onClick={openServices}
                />
                <ActionButton
                  icon={UserCircle}
                  title="Review Profile"
                  description="Check your personal and employment details."
                  onClick={openProfile}
                />
              </div>
            </CleanPanel>

            <CleanPanel title="Recent Requests" icon={Bell}>
              <RequestList applications={leave?.applications.slice(0, 4) || []} />
              <Button variant="outline" onClick={openRequests} className="mt-3 w-full">
                View All Requests
              </Button>
            </CleanPanel>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export function EmployeeProfileHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EmployeeDetailResponse | null>(null);
  const [leave, setLeave] = useState<EmployeeLeaveResponse | null>(null);
  const [todayStatus, setTodayStatus] = useState<string>("Loading...");
  const [loading, setLoading] = useState(Boolean(user?.employeeId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.employeeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    Promise.all([
      getEmployee(user.employeeId),
      getEmployeeLeave(user.employeeId),
      listDtr({
        employeeId: user.employeeId,
        from: new Date().toLocaleDateString("en-CA"),
        to: new Date().toLocaleDateString("en-CA"),
      }).catch(() => null),
    ])
      .then(([employeeResult, leaveResult, dtrResult]) => {
        setProfile(employeeResult);
        setLeave(leaveResult);
        if (dtrResult && dtrResult.entries && dtrResult.entries.length > 0) {
          setTodayStatus(dtrResult.entries[0].status);
        } else {
          setTodayStatus("No Record");
        }
      })
      .catch((err) => setError(err.message || "Unable to load your profile"))
      .finally(() => setLoading(false));
  }, [user?.employeeId]);

  const employee = profile?.employee || leave?.employee || null;
  const sections = profile?.sections || {};

  const openFullProfile = () => {
    if (!user?.employeeId) {
      toast.info("No employee record is linked to this account yet");
      return;
    }
    navigate({ to: "/employees/$id", params: { id: user.employeeId } });
  };

  return (
    <AppShell title="My Profile" subtitle="Your personal HR home">
      {loading ? (
        <ProfileLoading />
      ) : error ? (
        <EmptyProfile
          title="We could not load your employee profile"
          description={error}
          actionLabel="Try again"
          onAction={() => window.location.reload()}
        />
      ) : !employee ? (
        <EmptyProfile
          title="Your account is ready, but it is not linked yet"
          description="Ask HR or the system admin to connect your user account to your employee record. After that, this page will show your 201 data, leave credits, and HR requests."
        />
      ) : (
        <div className="space-y-5">
          <ProfileHeader employee={employee} onOpenProfile={openFullProfile} />
          <ProfileQuickStats
            employee={employee}
            balances={leave?.balances || []}
            applications={leave?.applications || []}
            sections={sections}
          />
          <ProfileTabs
            employee={employee}
            sections={sections}
            balances={leave?.balances || []}
            applications={leave?.applications || []}
          />
        </div>
      )}
    </AppShell>
  );
}

function EmployeeServicesHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leave, setLeave] = useState<EmployeeLeaveResponse | null>(null);
  const [todayStatus, setTodayStatus] = useState<string>("Loading...");
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(true);
  const [leaveTypesError, setLeaveTypesError] = useState("");
  const [loading, setLoading] = useState(Boolean(user?.employeeId));
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [generatingPds, setGeneratingPds] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveTypeId: "",
    dateFrom: "",
    dateTo: "",
    daysRequested: "",
    reason: "",
    detailLocationType: "",
    detailLocationText: "",
    detailSickType: "",
    detailIllness: "",
    detailStudyPurpose: "",
    detailOtherPurpose: "",
    detailOtherText: "",
    commutationRequested: "no",
  });
  const selectedLeaveType =
    leaveTypes.find((type) => String(type.id) === leaveForm.leaveTypeId) || null;
  const minimumLeaveDate = getMinimumLeaveDate(selectedLeaveType);
  const calculatedDays = calculateWeekdayLeaveDays(leaveForm.dateFrom, leaveForm.dateTo);

  useEffect(() => {
    if (!user?.employeeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getEmployeeLeave(user.employeeId)
      .then(setLeave)
      .catch(() => setLeave(null))
      .finally(() => setLoading(false));
  }, [user?.employeeId]);

  useEffect(() => {
    setLeaveTypesLoading(true);
    setLeaveTypesError("");
    listLeaveTypes()
      .then((result) => setLeaveTypes(result.leaveTypes.filter((item) => item.isActive)))
      .catch((error) => {
        setLeaveTypes([]);
        setLeaveTypesError((error as Error).message || "Unable to load leave types");
      })
      .finally(() => setLeaveTypesLoading(false));
  }, []);

  const reloadLeave = () => {
    if (!user?.employeeId) return;
    getEmployeeLeave(user.employeeId)
      .then(setLeave)
      .catch(() => setLeave(null));
  };

  const submitLeave = async () => {
    if (!user?.employeeId) {
      toast.info("No employee record is linked to this account yet");
      return;
    }
    if (!leaveForm.leaveTypeId || !leaveForm.dateFrom || !leaveForm.dateTo || calculatedDays <= 0) {
      toast.error("Leave type and valid inclusive dates are required");
      return;
    }
    try {
      setSubmittingLeave(true);
      await submitLeaveRequest({
        employeeId: user.employeeId,
        leaveTypeId: Number(leaveForm.leaveTypeId),
        dateFrom: leaveForm.dateFrom,
        dateTo: leaveForm.dateTo,
        daysRequested: calculatedDays,
        reason: leaveForm.reason,
        detailLocationType: leaveForm.detailLocationType,
        detailLocationText: leaveForm.detailLocationText,
        detailSickType: leaveForm.detailSickType,
        detailIllness: leaveForm.detailIllness,
        detailStudyPurpose: leaveForm.detailStudyPurpose,
        detailOtherPurpose: leaveForm.detailOtherPurpose,
        detailOtherText: leaveForm.detailOtherText,
        commutationRequested: leaveForm.commutationRequested === "yes",
        formPayload: {
          clearanceRequired:
            selectedLeaveType?.code === "TERMINAL" ||
            calendarDaySpan(leaveForm.dateFrom, leaveForm.dateTo) >= 30,
        },
      });
      toast.success("Leave request submitted");
      setShowLeaveForm(false);
      setLeaveForm(emptyLeaveForm());
      reloadLeave();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubmittingLeave(false);
    }
  };

  const downloadPds = async () => {
    if (!user?.employeeId) {
      toast.info("No employee record is linked to this account yet");
      return;
    }
    try {
      setGeneratingPds(true);
      const result = await generateEmployeePdsExcel(user.employeeId);
      toast.success("Personal Data Sheet generated");
      window.location.href = result.downloadUrl;
    } catch (error) {
      toast.error((error as Error).message || "Unable to generate Personal Data Sheet");
    } finally {
      setGeneratingPds(false);
    }
  };

  return (
    <AppShell title="Self-Service Portal" subtitle="Employee requests, records, and HR services">
      <div className="space-y-5">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="mt-1 text-xl font-semibold text-foreground">Choose a service</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Start with the task you need, then track the result in request history.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate({ to: "/requests" })}>
              View Request History
            </Button>
          </div>
        </section>

        <Tabs defaultValue="requests" className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="h-auto justify-start gap-1 bg-muted/50 p-1">
              <TabsTrigger
                value="requests"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Requests
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Attendance
              </TabsTrigger>
              <TabsTrigger
                value="records"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Records
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="requests" className="mt-0">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <ActionButton
                icon={ClipboardCheck}
                title="Apply for Leave"
                description="Prepare vacation, sick, or special leave requests."
                onClick={() => setShowLeaveForm(true)}
              />
              <ActionButton
                icon={CalendarClock}
                title="File Overtime"
                description="Submit overtime or compensatory time requests."
                onClick={comingSoon}
              />
              <ActionButton
                icon={FileText}
                title="Request Certificate"
                description="Request COE, service record, and certifications."
                onClick={comingSoon}
              />
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="mt-0">
            <div className="grid gap-3 md:grid-cols-2">
              <ActionButton
                icon={Clock}
                title="Attendance Logs"
                description="Review DTR, missed punches, and corrections."
                onClick={() => navigate({ to: "/attendance" })}
              />
              <ActionButton
                icon={CalendarCheck}
                title="Schedule Change"
                description="Request a shift or work schedule adjustment."
                onClick={comingSoon}
              />
            </div>
          </TabsContent>

          <TabsContent value="records" className="mt-0">
            <div className="grid gap-3 md:grid-cols-2">
              <ActionButton
                icon={UserCircle}
                title="My Profile"
                description="Review personal information and 201 records."
                onClick={() => navigate({ to: "/my-profile" })}
              />
              <ActionButton
                icon={FileText}
                title={generatingPds ? "Generating PDS" : "Generate PDS"}
                description="Download your filled Personal Data Sheet."
                onClick={downloadPds}
              />
              <ActionButton
                icon={Bell}
                title="Request History"
                description="Track leave, attendance, and document requests."
                onClick={() => navigate({ to: "/requests" })}
              />
            </div>
          </TabsContent>
        </Tabs>

        <CleanPanel title="Current Request Status" icon={Bell}>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading request history...</p>
          ) : (
            <RequestList applications={leave?.applications.slice(0, 5) || []} />
          )}
        </CleanPanel>
      </div>

      <Dialog open={showLeaveForm} onOpenChange={setShowLeaveForm}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <FormField label="Leave Type">
              <Select
                value={leaveForm.leaveTypeId}
                onValueChange={(value) => setLeaveForm({ ...emptyLeaveForm(), leaveTypeId: value })}
                disabled={leaveTypesLoading || leaveTypes.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={leaveTypesLoading ? "Loading leave types..." : "Select leave type"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!leaveTypesLoading && leaveTypesError ? (
                <p className="text-xs text-destructive">{leaveTypesError}</p>
              ) : null}
              {!leaveTypesLoading && !leaveTypesError && leaveTypes.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No leave types are configured yet. Ask HR to add leave types.
                </p>
              ) : null}
            </FormField>
            <FormField label="Days">
              <Input
                value={calculatedDays > 0 ? formatNumber(calculatedDays) : ""}
                readOnly
                placeholder="Auto-calculated"
              />
              <p className="text-xs text-muted-foreground">
                Counted automatically from weekdays in the selected range.
              </p>
            </FormField>
            <FormField label="From">
              <Input
                type="date"
                min={minimumLeaveDate}
                value={leaveForm.dateFrom}
                onChange={(event) => setLeaveForm({ ...leaveForm, dateFrom: event.target.value })}
              />
            </FormField>
            <FormField label="To">
              <Input
                type="date"
                min={leaveForm.dateFrom || minimumLeaveDate}
                value={leaveForm.dateTo}
                onChange={(event) => setLeaveForm({ ...leaveForm, dateTo: event.target.value })}
              />
            </FormField>
            <FormField label="Reason" className="sm:col-span-2">
              <Textarea
                rows={3}
                value={leaveForm.reason}
                onChange={(event) => setLeaveForm({ ...leaveForm, reason: event.target.value })}
              />
            </FormField>
            {selectedLeaveType ? (
              <LeaveTypeGuidance leaveType={selectedLeaveType} className="sm:col-span-2" />
            ) : null}
            {selectedLeaveType?.detailSchema.includes("location") ? (
              <>
                <FormField label="Location" className="sm:col-span-2">
                  <RadioGroup
                    value={leaveForm.detailLocationType}
                    onValueChange={(value) =>
                      setLeaveForm({ ...leaveForm, detailLocationType: value })
                    }
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    <RadioChoice value="Philippines" label="Within the Philippines" />
                    <RadioChoice value="Abroad" label="Abroad" />
                  </RadioGroup>
                </FormField>
                {leaveForm.detailLocationType === "Abroad" ? (
                  <FormField label="Specify Abroad Location" className="sm:col-span-2">
                    <Input
                      value={leaveForm.detailLocationText}
                      onChange={(event) =>
                        setLeaveForm({ ...leaveForm, detailLocationText: event.target.value })
                      }
                    />
                  </FormField>
                ) : null}
              </>
            ) : null}
            {selectedLeaveType?.detailSchema.includes("sick") ? (
              <>
                <FormField label="Sick Leave Detail" className="sm:col-span-2">
                  <RadioGroup
                    value={leaveForm.detailSickType}
                    onValueChange={(value) => setLeaveForm({ ...leaveForm, detailSickType: value })}
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    <RadioChoice value="Hospital" label="In hospital" />
                    <RadioChoice value="OutPatient" label="Out patient" />
                  </RadioGroup>
                </FormField>
                <FormField label="Specify Illness" className="sm:col-span-2">
                  <Input
                    value={leaveForm.detailIllness}
                    onChange={(event) =>
                      setLeaveForm({ ...leaveForm, detailIllness: event.target.value })
                    }
                  />
                </FormField>
              </>
            ) : null}
            {selectedLeaveType?.detailSchema.includes("women") ? (
              <FormField label="Specify Illness / Surgery Detail" className="sm:col-span-2">
                <Input
                  value={leaveForm.detailIllness}
                  onChange={(event) =>
                    setLeaveForm({ ...leaveForm, detailIllness: event.target.value })
                  }
                />
              </FormField>
            ) : null}
            {selectedLeaveType?.detailSchema.includes("study") ? (
              <FormField label="Study Leave Purpose" className="sm:col-span-2">
                <RadioGroup
                  value={leaveForm.detailStudyPurpose}
                  onValueChange={(value) =>
                    setLeaveForm({ ...leaveForm, detailStudyPurpose: value })
                  }
                  className="grid gap-2 sm:grid-cols-2"
                >
                  <RadioChoice value="MastersDegree" label="Completion of Master's Degree" />
                  <RadioChoice value="BarBoardReview" label="BAR / Board Examination Review" />
                </RadioGroup>
              </FormField>
            ) : null}
            {selectedLeaveType?.detailSchema.includes("otherPurpose") ? (
              <>
                <FormField label="Other Purpose" className="sm:col-span-2">
                  <RadioGroup
                    value={leaveForm.detailOtherPurpose}
                    onValueChange={(value) =>
                      setLeaveForm({ ...leaveForm, detailOtherPurpose: value })
                    }
                    className="grid gap-2 sm:grid-cols-3"
                  >
                    <RadioChoice value="Monetization" label="Monetization" />
                    <RadioChoice value="TerminalLeave" label="Terminal Leave" />
                    <RadioChoice value="Other" label="Others" />
                  </RadioGroup>
                </FormField>
                {leaveForm.detailOtherPurpose === "Other" ? (
                  <FormField label="Specify Other Purpose" className="sm:col-span-2">
                    <Input
                      value={leaveForm.detailOtherText}
                      onChange={(event) =>
                        setLeaveForm({ ...leaveForm, detailOtherText: event.target.value })
                      }
                    />
                  </FormField>
                ) : null}
              </>
            ) : null}
            {selectedLeaveType?.detailSchema.includes("commutation") ? (
              <FormField label="Commutation" className="sm:col-span-2">
                <RadioGroup
                  value={leaveForm.commutationRequested}
                  onValueChange={(value) =>
                    setLeaveForm({ ...leaveForm, commutationRequested: value })
                  }
                  className="grid gap-2 sm:grid-cols-2"
                >
                  <RadioChoice value="no" label="Not requested" />
                  <RadioChoice value="yes" label="Requested" />
                </RadioGroup>
              </FormField>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveForm(false)}>
              Cancel
            </Button>
            <Button
              disabled={submittingLeave || leaveTypes.length === 0}
              onClick={submitLeave}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function ProfileHeader({
  employee,
  onOpenProfile,
}: {
  employee: EmployeeRecord;
  onOpenProfile: () => void;
}) {
  const fullName = formatFullName(employee);
  const initials = getInitials(employee);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/20 px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Personal 201 Record
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">My Profile</h2>
          </div>
          <Button variant="outline" onClick={onOpenProfile} className="w-full sm:w-auto">
            Full 201 File
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-5 lg:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
            <Avatar className="h-24 w-24 shrink-0 border border-border bg-muted shadow-sm">
              {employee.photoUrl ? <AvatarImage src={employee.photoUrl} alt={fullName} /> : null}
              <AvatarFallback className="bg-sky-50 text-2xl font-semibold text-sky-700">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                <UserCircle className="h-3.5 w-3.5" />
                Employee Identity
              </div>
              <div className="flex flex-wrap items-start gap-2">
                <h3 className="max-w-full break-words text-3xl font-bold tracking-tight text-foreground">
                  {fullName}
                </h3>
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  {employee.empStatus || "Active"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {employee.position || "Position not set"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-muted-foreground">
                  ID: {valueOrDash(employee.employeeId)}
                </span>
                <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-muted-foreground">
                  {valueOrDash(employee.department)}
                </span>
                <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-muted-foreground">
                  {valueOrDash(employee.status)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid content-start gap-3 rounded-lg border border-border bg-background/60 p-4">
            <DetailItem label="Employee No" value={employee.employeeId} />
            <DetailItem label="Department" value={employee.department} />
            <DetailItem label="Employment Status" value={employee.status || employee.empStatus} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileQuickStats({
  employee,
  balances,
  applications,
  sections,
}: {
  employee: EmployeeRecord;
  balances: LeaveBalance[];
  applications: LeaveApplication[];
  sections: Record<string, SectionRow[]>;
}) {
  const pending = applications.filter((item) => item.status === "Pending").length;
  const availableLeaveCredits = balances.reduce(
    (total, balance) => total + Number(balance.balance || 0),
    0,
  );
  const recordCount = Object.values(sections).reduce((total, rows) => total + countRows(rows), 0);
  const governmentIds = [
    employee.gsis,
    employee.sss,
    employee.pagibig,
    employee.philhealth,
    employee.tin,
  ].filter(Boolean).length;
  const contactStatus = employee.cellphoneNo || employee.email ? "Available" : "Needs Update";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ProfileRecordCard
        title="Contact"
        value={contactStatus}
        subtext={employee.email || employee.cellphoneNo || "No contact details recorded"}
        icon={<Phone className="h-5 w-5 text-blue-600" />}
        iconBg="bg-blue-50"
      />
      <ProfileRecordCard
        title="Employment"
        value={employee.status || "-"}
        subtext={
          employee.dateHired || employee.dateEmployed
            ? `Hired ${formatDate(employee.dateHired || employee.dateEmployed)}`
            : "Hire date not set"
        }
        icon={<IdCard className="h-5 w-5 text-emerald-600" />}
        iconBg="bg-emerald-50"
      />
      <ProfileRecordCard
        title="201 Records"
        value={recordCount}
        subtext={`${governmentIds}/5 government IDs recorded`}
        icon={<ShieldCheck className="h-5 w-5 text-amber-600" />}
        iconBg="bg-amber-50"
      />
      <ProfileRecordCard
        title="Leave & Requests"
        value={formatNumber(availableLeaveCredits)}
        subtext={`${pending} pending request${pending === 1 ? "" : "s"}`}
        icon={<ClipboardCheck className="h-5 w-5 text-rose-600" />}
        iconBg="bg-rose-50"
      />
    </div>
  );
}

function ProfileRecordCard({
  title,
  value,
  subtext,
  icon,
  iconBg,
}: {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", iconBg)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className="mt-1 break-words text-lg font-semibold text-foreground">{value}</p>
          <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{subtext}</p>
        </div>
      </div>
    </div>
  );
}

function ProfileTabs({
  employee,
  sections,
  balances,
  applications,
}: {
  employee: EmployeeRecord;
  sections: Record<string, SectionRow[]>;
  balances: LeaveBalance[];
  applications: LeaveApplication[];
}) {
  return (
    <Tabs defaultValue="personal" className="space-y-4">
      <div className="overflow-x-auto">
        <TabsList className="h-auto justify-start gap-1 bg-muted/50 p-1">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="work">Work</TabsTrigger>
          <TabsTrigger value="ids">IDs</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="personal" className="mt-0">
        <CleanPanel title="Personal Information" icon={UserCircle}>
          <DetailGrid>
            <DetailItem label="Birthday" value={formatDate(employee.birthday)} />
            <DetailItem label="Gender" value={employee.gender} />
            <DetailItem label="Civil Status" value={employee.civilStatus} />
            <DetailItem label="Citizenship" value={employee.citizenship} />
            <DetailItem label="Blood Type" value={employee.bloodType} />
            <DetailItem label="Place of Birth" value={employee.placeOfBirth} wide />
          </DetailGrid>
        </CleanPanel>
      </TabsContent>

      <TabsContent value="contact" className="mt-0">
        <CleanPanel title="Contact Details" icon={Mail}>
          <DetailGrid>
            <DetailItem label="Email" value={employee.email} />
            <DetailItem label="Mobile" value={employee.cellphoneNo || employee.residentialTelNo} />
            <DetailItem label="Residential Address" value={employee.residentialAddress} wide />
            <DetailItem label="Permanent Address" value={employee.permanentAddress} wide />
          </DetailGrid>
        </CleanPanel>
      </TabsContent>

      <TabsContent value="work" className="mt-0">
        <CleanPanel title="Work Information" icon={IdCard}>
          <DetailGrid>
            <DetailItem label="Department" value={employee.department} />
            <DetailItem label="Position" value={employee.position} />
            <DetailItem label="Employee Level" value={employee.level} />
            <DetailItem label="Employment Status" value={employee.status} />
            <DetailItem
              label="Date Hired"
              value={formatDate(employee.dateHired || employee.dateEmployed)}
            />
            <DetailItem label="Item No" value={employee.itemNo} />
          </DetailGrid>
        </CleanPanel>
      </TabsContent>

      <TabsContent value="ids" className="mt-0">
        <CleanPanel title="Government IDs" icon={ShieldCheck}>
          <DetailGrid>
            <DetailItem label="GSIS" value={employee.gsis} />
            <DetailItem label="SSS" value={employee.sss} />
            <DetailItem label="Pag-IBIG" value={employee.pagibig} />
            <DetailItem label="PhilHealth" value={employee.philhealth} />
            <DetailItem label="TIN" value={employee.tin} />
          </DetailGrid>
        </CleanPanel>
      </TabsContent>

      <TabsContent value="records" className="mt-0">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <CleanPanel title="201 Records" icon={Newspaper}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <RecordCount label="Family" value={countRows(sections.family)} />
              <RecordCount label="Education" value={countRows(sections.education)} />
              <RecordCount label="Civil Service" value={countRows(sections.civilService)} />
              <RecordCount label="Work Experience" value={countRows(sections.work)} />
              <RecordCount label="Training" value={countRows(sections.training)} />
              <RecordCount label="Service Record" value={countRows(sections.service)} />
            </div>
          </CleanPanel>
          <CleanPanel title="Leave" icon={ClipboardCheck}>
            <div className="space-y-3">
              {balances.slice(0, 3).map((balance) => (
                <DetailItem
                  key={balance.id}
                  label={balance.code || balance.name}
                  value={formatNumber(balance.balance)}
                />
              ))}
              <div className="pt-1">
                <RequestList applications={applications.slice(0, 3)} />
              </div>
            </div>
          </CleanPanel>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function CleanStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function DashboardMetricCard({
  title,
  value,
  subtext,
  details,
  icon,
  iconBg,
  chartColor,
  trend,
}: {
  title: string;
  value: string | number;
  subtext: string;
  details?: string[];
  icon: React.ReactNode;
  iconBg: string;
  chartColor: string;
  trend: "up" | "down";
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-muted/10">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <h2 className="mt-2 truncate text-2xl font-bold text-foreground">{value}</h2>
        </div>
        <div className={cn("rounded-xl p-2.5 ring-1 ring-black/5", iconBg)}>{icon}</div>
      </div>
      <div className="relative z-10 mt-3 flex items-center text-[11px]">
        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="truncate text-muted-foreground">{subtext}</span>
      </div>
      {details?.length ? (
        <div className="relative z-10 mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          {details.map((detail) => (
            <span key={detail} className="truncate">
              {detail}
            </span>
          ))}
        </div>
      ) : null}
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

function CleanPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-sky-50 text-sky-700">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function DetailItem({
  label,
  value,
  wide,
}: {
  label: string;
  value?: string | number | null;
  wide?: boolean;
}) {
  return (
    <div className={cn("min-w-0 border-b border-border/60 pb-3", wide && "sm:col-span-2")}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium leading-6 text-foreground">
        {valueOrDash(value)}
      </p>
    </div>
  );
}

function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function RadioChoice({ value, label }: { value: string; label: string }) {
  const id = `leave-${value}`;
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
    leaveTypeId: "",
    dateFrom: "",
    dateTo: "",
    daysRequested: "",
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

function RecordCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex min-h-24 items-start gap-3 rounded-lg border border-border bg-card p-4 pr-10 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/30 hover:shadow-md"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
      <span>
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-muted-foreground">{description}</span>
      </span>
      <ChevronRight className="absolute right-3 top-3 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
    </button>
  );
}

function RequestList({ applications }: { applications: LeaveApplication[] }) {
  if (!applications.length) {
    return (
      <p className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        No requests are recorded yet.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {applications.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-2 border-b border-border p-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-medium text-foreground">{item.leaveName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(item.dateFrom)} to {formatDate(item.dateTo)} -{" "}
              {formatNumber(item.daysRequested)} day(s)
            </p>
          </div>
          <StatusBadge status={item.status} />
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: LeaveApplication["status"] }) {
  const className =
    status === "Approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Pending"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-700";
  return <Badge className={className}>{status}</Badge>;
}

function EmptyProfile({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-500/10 text-blue-600">
        <UserCircle className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button onClick={onAction} className="mt-5 bg-blue-600 text-white hover:bg-blue-700">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function ProfileLoading() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

function formatFullName(employee: EmployeeRecord) {
  return (
    [employee.firstname, employee.middlename, employee.lastname, employee.nameExt]
      .filter(Boolean)
      .join(" ") || "Employee"
  );
}

function getInitials(employee: EmployeeRecord) {
  return (
    [employee.firstname, employee.lastname]
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "ME"
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatNumber(value?: number | string | null) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 3 }).format(number);
}

function formatPunchRange(timeIn?: string | null, timeOut?: string | null) {
  if (!timeIn && !timeOut) return "-";
  return `${formatDtrTime(timeIn)} - ${formatDtrTime(timeOut)}`;
}

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

function valueOrDash(value?: string | number | null) {
  return value === undefined || value === null || value === "" ? "-" : value;
}

function countRows(rows?: SectionRow[]) {
  return rows?.length || 0;
}

function comingSoon() {
  toast.info("Coming soon");
}
