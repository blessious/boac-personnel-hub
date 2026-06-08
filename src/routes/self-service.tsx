import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  HeartHandshake,
  IdCard,
  Mail,
  MapPin,
  MessageSquare,
  Newspaper,
  Phone,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { getEmployee, type EmployeeDetailResponse, type EmployeeRecord, type SectionRow } from "@/lib/employees-api";
import { getEmployeeLeave, type EmployeeLeaveResponse, type LeaveApplication, type LeaveBalance } from "@/lib/leave-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/self-service")({
  component: SelfServicePage,
});

const SERVICE_ACTIONS = [
  {
    key: "leave",
    title: "Leave Application",
    description: "File and monitor your leave request.",
    icon: ClipboardCheck,
  },
  {
    key: "dtr",
    title: "My DTR",
    description: "Review attendance, missed punches, and corrections.",
    icon: CalendarCheck,
  },
  {
    key: "ob",
    title: "Official Business",
    description: "Prepare OB pass, travel, and permission slips.",
    icon: IdCard,
  },
  {
    key: "certificates",
    title: "Certificates",
    description: "Request COE, service record, and HR certifications.",
    icon: FileText,
  },
  {
    key: "messages",
    title: "HR Messages",
    description: "Send questions and receive HR updates.",
    icon: MessageSquare,
  },
  {
    key: "announcements",
    title: "Announcements",
    description: "Read memoranda, reminders, and deadlines.",
    icon: Bell,
  },
];

function SelfServicePage() {
  return <SelfServiceHome />;
}

export function SelfServiceHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EmployeeDetailResponse | null>(null);
  const [leave, setLeave] = useState<EmployeeLeaveResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(user?.employeeId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.employeeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    Promise.all([getEmployee(user.employeeId), getEmployeeLeave(user.employeeId)])
      .then(([employeeResult, leaveResult]) => {
        setProfile(employeeResult);
        setLeave(leaveResult);
      })
      .catch((err) => setError(err.message || "Unable to load your profile"))
      .finally(() => setLoading(false));
  }, [user?.employeeId]);

  const employee = profile?.employee || leave?.employee || null;
  const sections = profile?.sections || {};

  const completion = useMemo(() => {
    if (!employee) return { done: 0, total: PROFILE_CHECKS.length, missing: PROFILE_CHECKS.map((item) => item.label) };
    const missing = PROFILE_CHECKS.filter((item) => !item.isComplete(employee)).map((item) => item.label);
    return { done: PROFILE_CHECKS.length - missing.length, total: PROFILE_CHECKS.length, missing };
  }, [employee]);

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
          <ProfileHero employee={employee} completion={completion} onOpenProfile={openFullProfile} />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
            <div className="space-y-5">
              <PersonalSnapshot employee={employee} />
              <LeaveSnapshot balances={leave?.balances || []} applications={leave?.applications || []} />
              <RecordsSnapshot sections={sections} />
            </div>

            <div className="space-y-5">
              <ProfileReadiness completion={completion} />
              <GovernmentIds employee={employee} />
              <ContactCard employee={employee} />
            </div>
          </div>

          <ServicesPanel onOpenProfile={openFullProfile} />
        </div>
      )}
    </AppShell>
  );
}

function ProfileHero({
  employee,
  completion,
  onOpenProfile,
}: {
  employee: EmployeeRecord;
  completion: { done: number; total: number; missing: string[] };
  onOpenProfile: () => void;
}) {
  const fullName = formatFullName(employee);
  const initials = getInitials(employee);
  const percent = Math.round((completion.done / completion.total) * 100);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-800 p-5 text-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-24 w-24 border-4 border-white/20 bg-white/10">
              {employee.photoUrl ? <AvatarImage src={employee.photoUrl} alt={fullName} /> : null}
              <AvatarFallback className="bg-white/15 text-2xl font-semibold text-white">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-normal">{fullName}</h2>
                <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/20">{employee.empStatus || "Active"}</Badge>
              </div>
              <p className="mt-2 text-sm text-white/80">
                {employee.position || "Position not set"} - {employee.department || "Department not set"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/75">
                <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1">Employee No: {valueOrDash(employee.employeeId)}</span>
                <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1">Item No: {valueOrDash(employee.itemNo)}</span>
                <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1">{valueOrDash(employee.status)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/15 bg-white/10 p-4 lg:min-w-64">
            <p className="text-xs uppercase text-white/65">Profile readiness</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-3xl font-semibold">{percent}%</span>
              <span className="pb-1 text-sm text-white/70">{completion.done} of {completion.total} essentials</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/15">
              <div className="h-2 rounded-full bg-emerald-300" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          This is the record HR keeps for you. Review it often so requests and reports use the right details.
        </p>
        <Button onClick={onOpenProfile} className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
          Open Full 201 File
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function PersonalSnapshot({ employee }: { employee: EmployeeRecord }) {
  return (
    <Panel title="Personal Snapshot" icon={UserCircle}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label="Date hired" value={formatDate(employee.dateHired || employee.dateEmployed)} />
        <Fact label="Employment status" value={employee.status} />
        <Fact label="Employee level" value={employee.level} />
        <Fact label="Birthday" value={formatDate(employee.birthday)} />
        <Fact label="Civil status" value={employee.civilStatus} />
        <Fact label="Blood type" value={employee.bloodType} />
        <Fact label="Citizenship" value={employee.citizenship} />
        <Fact label="Gender" value={employee.gender} />
        <Fact label="Place of birth" value={employee.placeOfBirth} />
      </div>
    </Panel>
  );
}

function LeaveSnapshot({
  balances,
  applications,
}: {
  balances: LeaveBalance[];
  applications: LeaveApplication[];
}) {
  const pending = applications.filter((item) => item.status === "Pending").length;
  const approved = applications.filter((item) => item.status === "Approved").length;
  const recent = applications.slice(0, 4);

  return (
    <Panel title="Leave At A Glance" icon={ClipboardCheck}>
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Pending" value={pending} tone="amber" />
        <Metric label="Approved" value={approved} tone="emerald" />
        {balances.slice(0, 2).map((balance) => (
          <Metric key={balance.id} label={balance.code || balance.name} value={formatNumber(balance.balance)} tone="blue" />
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        {recent.length ? (
          recent.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 border-b border-border p-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{item.leaveName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(item.dateFrom)} to {formatDate(item.dateTo)} - {formatNumber(item.daysRequested)} day(s)
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))
        ) : (
          <p className="p-4 text-sm text-muted-foreground">No leave applications yet.</p>
        )}
      </div>
    </Panel>
  );
}

function RecordsSnapshot({ sections }: { sections: Record<string, SectionRow[]> }) {
  const items = [
    { label: "Family records", value: countRows(sections.family) },
    { label: "Education", value: countRows(sections.education) },
    { label: "Civil service", value: countRows(sections.civilService) },
    { label: "Work experience", value: countRows(sections.work) },
    { label: "Training", value: countRows(sections.training) },
    { label: "Service record", value: countRows(sections.service) },
  ];
  const latestTraining = firstPayloadText(sections.training, ["name", "conductedBy"]);
  const latestService = firstPayloadText(sections.service, ["designation", "department", "status"]);

  return (
    <Panel title="201 File Summary" icon={Newspaper}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <RecordNote title="Latest training" value={latestTraining || "No training record yet"} />
        <RecordNote title="Latest service entry" value={latestService || "No service entry yet"} />
      </div>
    </Panel>
  );
}

function ProfileReadiness({ completion }: { completion: { done: number; total: number; missing: string[] } }) {
  const complete = completion.missing.length === 0;
  return (
    <Panel title="Record Health" icon={complete ? CheckCircle2 : AlertCircle}>
      <div className="flex items-start gap-3">
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", complete ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>
          {complete ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {complete ? "Your basic profile looks complete." : `${completion.missing.length} item(s) need attention.`}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {complete ? "Your contact details and primary IDs are already present." : completion.missing.join(", ")}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function GovernmentIds({ employee }: { employee: EmployeeRecord }) {
  return (
    <Panel title="Government IDs" icon={ShieldCheck}>
      <div className="grid gap-3">
        <Fact label="GSIS" value={employee.gsis} />
        <Fact label="SSS" value={employee.sss} />
        <Fact label="Pag-IBIG" value={employee.pagibig} />
        <Fact label="PhilHealth" value={employee.philhealth} />
        <Fact label="TIN" value={employee.tin} />
      </div>
    </Panel>
  );
}

function ContactCard({ employee }: { employee: EmployeeRecord }) {
  return (
    <Panel title="Contact Details" icon={HeartHandshake}>
      <div className="space-y-3">
        <ContactLine icon={Mail} label="Email" value={employee.email} />
        <ContactLine icon={Phone} label="Mobile" value={employee.cellphoneNo || employee.residentialTelNo} />
        <ContactLine icon={MapPin} label="Residential" value={employee.residentialAddress} />
        <ContactLine icon={MapPin} label="Permanent" value={employee.permanentAddress} />
      </div>
    </Panel>
  );
}

function ServicesPanel({ onOpenProfile }: { onOpenProfile: () => void }) {
  return (
    <Panel title="Requests And Services" icon={CalendarCheck}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <button
          onClick={onOpenProfile}
          className="flex min-h-24 items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/70 p-4 text-left transition-colors hover:bg-blue-50"
        >
          <UserCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <span>
            <span className="block text-sm font-semibold text-foreground">Full 201 File</span>
            <span className="mt-1 block text-sm leading-6 text-muted-foreground">Open your complete HR profile and records.</span>
          </span>
        </button>
        {SERVICE_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              onClick={comingSoon}
              className="flex min-h-24 items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/30"
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <span>
                <span className="block text-sm font-semibold text-foreground">{action.title}</span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">{action.description}</span>
                <span className="mt-2 inline-flex rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">Coming soon</span>
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">{valueOrDash(value)}</p>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone: "amber" | "blue" | "emerald" }) {
  const tones = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <div className={cn("rounded-lg border p-3", tones[tone])}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function RecordNote({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-1 text-sm font-medium leading-6 text-foreground">{value}</p>
    </div>
  );
}

function ContactLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-background p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-foreground">{valueOrDash(value)}</p>
      </div>
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
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
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

const PROFILE_CHECKS = [
  { label: "Photo", isComplete: (employee: EmployeeRecord) => Boolean(employee.photoUrl) },
  { label: "Email", isComplete: (employee: EmployeeRecord) => Boolean(employee.email) },
  { label: "Mobile number", isComplete: (employee: EmployeeRecord) => Boolean(employee.cellphoneNo) },
  { label: "Birthday", isComplete: (employee: EmployeeRecord) => Boolean(employee.birthday) },
  { label: "Residential address", isComplete: (employee: EmployeeRecord) => Boolean(employee.residentialAddress) },
  { label: "GSIS", isComplete: (employee: EmployeeRecord) => Boolean(employee.gsis) },
  { label: "SSS", isComplete: (employee: EmployeeRecord) => Boolean(employee.sss) },
  { label: "Pag-IBIG", isComplete: (employee: EmployeeRecord) => Boolean(employee.pagibig) },
  { label: "PhilHealth", isComplete: (employee: EmployeeRecord) => Boolean(employee.philhealth) },
  { label: "TIN", isComplete: (employee: EmployeeRecord) => Boolean(employee.tin) },
];

function formatFullName(employee: EmployeeRecord) {
  return [employee.firstname, employee.middlename, employee.lastname, employee.nameExt].filter(Boolean).join(" ") || "Employee";
}

function getInitials(employee: EmployeeRecord) {
  return [employee.firstname, employee.lastname]
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "ME";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatNumber(value?: number | string | null) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 3 }).format(number);
}

function valueOrDash(value?: string | number | null) {
  return value === undefined || value === null || value === "" ? "-" : value;
}

function countRows(rows?: SectionRow[]) {
  return rows?.length || 0;
}

function firstPayloadText(rows: SectionRow[] | undefined, keys: string[]) {
  const row = rows?.[0];
  if (!row) return "";
  return keys.map((key) => row.payload[key]).filter(Boolean).join(" - ");
}

function comingSoon() {
  toast.info("Coming soon");
}
