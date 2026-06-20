import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Briefcase,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getDashboard, type DashboardResponse } from "@/lib/employees-api";
import { EmployeeDashboardHome } from "@/routes/self-service";
import { useRealtimeRefresh } from "@/lib/realtime";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(user?.role !== "Employee");
  const [error, setError] = useState("");

  const load = () => {
    if (user?.role === "Employee") {
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    getDashboard()
      .then(setData)
      .catch((err) => setError(err.message || "Unable to load dashboard"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [user?.role]);
  useRealtimeRefresh(load, ["employees", "leave", "attendance"]);

  if (user?.role === "Employee") {
    return <EmployeeDashboardHome />;
  }

  const totalEmployees = data?.totalEmployees ?? 0;
  const permanentRegularEmployees = data?.regularEmployees ?? 0;
  const joCosEmployees = data?.jobOrderEmployees ?? 0;
  const activeEmployees = (data?.byEmploymentStatus ?? []).reduce(
    (total, row) => total + row.active,
    0,
  );

  const permanentRegularPct =
    totalEmployees > 0 ? Math.round((permanentRegularEmployees / totalEmployees) * 100) : 0;
  const joCosPct = totalEmployees > 0 ? Math.round((joCosEmployees / totalEmployees) * 100) : 0;
  const activePct = totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0;

  const ageGroupData = data?.byAgeGroup ?? [];
  const getAgeCount = (group: string) =>
    ageGroupData.find((row) => row.ageGroup === group)?.total ?? 0;

  const permanentRegularTotal = sumStatuses(
    data,
    ["Permanent", "Regular"],
    permanentRegularEmployees,
  );
  const joCosTotal = sumStatuses(data, ["JO/COS", "Casual"], joCosEmployees);
  const otherTotal = Math.max(0, totalEmployees - permanentRegularTotal - joCosTotal);

  const maleTotal = (data?.bySexLevel ?? []).reduce((total, row) => total + row.male, 0);
  const femaleTotal = (data?.bySexLevel ?? []).reduce((total, row) => total + row.female, 0);
  const genderTotal = maleTotal + femaleTotal;
  const femalePct = genderTotal > 0 ? Math.round((femaleTotal / genderTotal) * 100) : 0;
  const malePct = genderTotal > 0 ? Math.round((maleTotal / genderTotal) * 100) : 0;

  const divisions = [...(data?.byDivision ?? [])].sort((a, b) => b.total - a.total).slice(0, 4);
  const firstName = getFirstName(user?.employeeName || user?.name || user?.username);
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <AppShell title="" subtitle="">
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col space-y-6 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 text-sm font-medium text-blue-600">Good morning, {firstName}</div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Overview of the workforce and HR operations.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center space-x-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/80 shadow-sm">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{currentDate}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={loading ? "..." : totalEmployees}
            subtext="Current records"
            subtextColor="text-muted-foreground"
            icon={<Users className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-50"
            chartColor="stroke-blue-500"
            trend="up"
          />
          <StatCard
            title="Permanent / Regular"
            value={loading ? "..." : permanentRegularEmployees}
            subtext={`${permanentRegularPct}% of total`}
            subtextColor="text-muted-foreground"
            subtextDot="bg-emerald-500"
            icon={<Briefcase className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-50"
            chartColor="stroke-emerald-500"
            trend="up"
          />
          <StatCard
            title="JO / COS Employees"
            value={loading ? "..." : joCosEmployees}
            subtext={`${joCosPct}% of total`}
            subtextColor="text-muted-foreground"
            subtextDot="bg-amber-500"
            icon={<UserCheck className="h-5 w-5 text-amber-600" />}
            iconBg="bg-amber-50"
            chartColor="stroke-amber-500"
            trend="down"
          />
          <StatCard
            title="Active Employees"
            value={loading ? "..." : activeEmployees}
            subtext={`${activePct}% of total`}
            subtextColor="text-muted-foreground"
            subtextDot="bg-blue-500"
            icon={<UserCheck className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-50"
            chartColor="stroke-blue-500"
            trend="up"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="flex h-full flex-col rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm lg:col-span-5">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-foreground">Workforce Age Profile</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Age distribution based on recorded birthdates.
              </p>
            </div>
            <div className="mb-4 grid grid-cols-[72px_minmax(0,1fr)_72px] items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.02em] text-muted-foreground">
              <div>Age Group</div>
              <div />
              <div className="text-right">% of Total</div>
            </div>
            <div className="mt-1 flex-1 space-y-4">
              <AgeBar label="Under 30" count={getAgeCount("Under 30")} total={totalEmployees} />
              <AgeBar label="30-39" count={getAgeCount("30-39")} total={totalEmployees} active />
              <AgeBar label="40-49" count={getAgeCount("40-49")} total={totalEmployees} />
              <AgeBar label="50-59" count={getAgeCount("50-59")} total={totalEmployees} />
              <AgeBar label="60+" count={getAgeCount("60+")} total={totalEmployees} />
            </div>
            <div className="mt-6 border-t border-border/50 pt-4 text-right">
              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Total: {totalEmployees}
              </span>
            </div>
          </section>

          <section className="flex h-full flex-col rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm lg:col-span-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Employment Type Mix</h3>
              <p className="mt-1 text-xs text-muted-foreground">Distribution by employment type.</p>
            </div>
            <div className="mt-6 flex flex-1 flex-col items-center justify-center">
              <div className="relative h-40 w-40">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f3f4f6"
                    strokeWidth="20"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="20"
                    strokeDasharray={`${(joCosTotal / Math.max(totalEmployees, 1)) * 251.2} 251.2`}
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#2563eb"
                    strokeWidth="20"
                    strokeDasharray={`${(permanentRegularTotal / Math.max(totalEmployees, 1)) * 251.2} 251.2`}
                    strokeDashoffset={`${-(joCosTotal / Math.max(totalEmployees, 1)) * 251.2}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{totalEmployees}</span>
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
              </div>
              <div className="mt-8 w-full space-y-3">
                <LegendItem
                  color="bg-blue-600"
                  label="Permanent / Regular"
                  value={permanentRegularTotal}
                  percent={`(${percentOf(permanentRegularTotal, totalEmployees)}%)`}
                />
                <LegendItem
                  color="bg-amber-500"
                  label="JO / COS"
                  value={joCosTotal}
                  percent={`(${percentOf(joCosTotal, totalEmployees)}%)`}
                />
                <LegendItem
                  color="bg-gray-300"
                  label="Other Types"
                  value={otherTotal}
                  percent={`(${percentOf(otherTotal, totalEmployees)}%)`}
                />
              </div>
            </div>
          </section>

          <section className="flex h-full flex-col rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm lg:col-span-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Employees by Division</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Distribution across hospital divisions.
              </p>
            </div>
            <div className="mt-5 flex-1 space-y-4">
              {divisions.map((division, index) => {
                const pct = percentOf(division.total, totalEmployees);
                const colors = ["bg-blue-500", "bg-amber-500", "bg-emerald-500", "bg-purple-500"];
                return (
                  <ProgressBar
                    key={division.department || "Unassigned"}
                    label={division.department || "Unassigned"}
                    value={division.total}
                    percent={`${pct}%`}
                    width={`${pct}%`}
                    color={colors[index % colors.length]}
                  />
                );
              })}
              {divisions.length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground/70">
                  No division data available
                </div>
              )}
            </div>
            <div className="mt-6 border-t border-border/50 pt-4 text-sm font-semibold text-foreground/85">
              Total: {totalEmployees}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="flex flex-col rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm lg:col-span-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Gender Distribution</h3>
              <p className="mt-1 text-xs text-muted-foreground">Workforce by gender.</p>
            </div>
            <div className="mt-4 flex flex-1 items-center justify-between">
              <div className="relative h-28 w-28">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#2563eb"
                    strokeWidth="20"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f43f5e"
                    strokeWidth="20"
                    strokeDasharray={`${(femaleTotal / Math.max(genderTotal, 1)) * 251.2} 251.2`}
                    strokeDashoffset="0"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-foreground">{genderTotal}</span>
                  <span className="text-[10px] text-muted-foreground">Total</span>
                </div>
              </div>
              <div className="space-y-4">
                <LegendItem
                  color="bg-rose-500"
                  label="Female"
                  value={femaleTotal}
                  percent={`(${femalePct}%)`}
                  small
                />
                <LegendItem
                  color="bg-blue-600"
                  label="Male"
                  value={maleTotal}
                  percent={`(${malePct}%)`}
                  small
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm lg:col-span-8">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-foreground">Quick Links</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              <QuickLink
                to="/employees"
                icon={<UserPlus className="h-5 w-5 text-blue-600" />}
                label="Add Employee"
                bg="bg-blue-50"
              />
              <QuickLink
                to="/leave"
                icon={<CalendarIcon className="h-5 w-5 text-emerald-600" />}
                label="Leave Requests"
                bg="bg-emerald-50"
              />
              <QuickLink
                to="/employees"
                icon={<FileText className="h-5 w-5 text-purple-600" />}
                label="Employee Directory"
                bg="bg-purple-50"
              />
              <QuickLink
                to="/reports"
                icon={<BarChart3 className="h-5 w-5 text-amber-600" />}
                label="Reports"
                bg="bg-amber-50"
              />
              <QuickLink
                to="/attendance"
                icon={<Clock className="h-5 w-5 text-teal-600" />}
                label="Attendance"
                bg="bg-teal-50"
              />
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function sumStatuses(data: DashboardResponse | null, statuses: string[], fallback: number) {
  const rows = data?.byEmploymentStatus ?? [];
  const sum = rows
    .filter((row) => statuses.includes(row.status))
    .reduce((total, row) => total + row.total, 0);
  return sum || fallback;
}

function percentOf(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function getFirstName(value?: string) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "there";
  if (cleaned.includes(",")) {
    return cleaned.split(",")[1]?.trim().split(/\s+/)[0] || cleaned.split(",")[0].trim();
  }
  return cleaned.split(/\s+/)[0];
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

function AgeBar({
  label,
  count,
  total,
  active = false,
}: {
  label: string;
  count: number;
  total: number;
  active?: boolean;
}) {
  const percent = percentOf(count, total);
  const width = percent > 0 ? `${percent}%` : "4px";
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)_72px] items-center gap-3">
      <div className="text-xs font-medium text-foreground/80">{label}</div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            active ? "bg-blue-600" : "bg-blue-500/80",
          )}
          style={{ width }}
        />
      </div>
      <div className="text-right text-xs font-semibold tabular-nums text-foreground">
        {count}
        <span className="ml-1 font-medium text-muted-foreground">({percent}%)</span>
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  value,
  percent,
  small,
}: {
  color: string;
  label: string;
  value: string | number;
  percent: string;
  small?: boolean;
}) {
  return (
    <div className="flex w-full items-center justify-between text-xs">
      <div className="flex items-center">
        <div className={cn("mr-2 rounded-full", color, small ? "h-2 w-2" : "h-3 w-3")} />
        <span
          className={cn(
            small ? "font-medium text-muted-foreground" : "font-medium text-foreground/80",
          )}
        >
          {label}
        </span>
      </div>
      <div>
        <span className="mr-1 font-semibold text-foreground">{value}</span>
        <span className="text-muted-foreground">{percent}</span>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  percent,
  width,
  color,
}: {
  label: string;
  value: string | number;
  percent: string;
  width: string;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px]">
        <span className="font-medium text-foreground/80">{label}</span>
        <div>
          <span className="mr-1 font-semibold text-foreground">{value}</span>
          <span className="text-muted-foreground">({percent})</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width }} />
      </div>
    </div>
  );
}

function QuickLink({
  to,
  icon,
  label,
  bg,
}: {
  to: "/" | "/employees" | "/attendance" | "/leave" | "/reports";
  icon: React.ReactNode;
  label: string;
  bg: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card p-3 text-center text-card-foreground transition-all hover:border-border hover:shadow-sm"
    >
      <div className={cn("mb-2 rounded-lg p-2.5 transition-transform", bg)}>{icon}</div>
      <span className="text-[10px] font-medium text-foreground/80">{label}</span>
    </Link>
  );
}
