import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Briefcase,
  UserCheck,
  UserX,
  BarChart3,
  Calendar as CalendarIcon,
  ChevronRight,
  TrendingUp,
  Info,
  Clock,
  UserPlus,
  FileText,
  Search,
  CheckSquare,
  AlertCircle,
  FileWarning,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getDashboard, type DashboardResponse } from "@/lib/employees-api";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || "System Administrator";

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getDashboard()
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((err) => {
        if (alive) setError(err.message || "Unable to load dashboard");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Derived calculations
  const totalEmployees = data?.totalEmployees ?? 0;
  const regularEmployees = data?.regularEmployees ?? 0;
  const joCosEmployees = data?.jobOrderEmployees ?? 0;

  const regularPct = totalEmployees > 0 ? Math.round((regularEmployees / totalEmployees) * 100) : 0;
  const joCosPct = totalEmployees > 0 ? Math.round((joCosEmployees / totalEmployees) * 100) : 0;

  const vacantPositions = (data?.byDivision ?? []).reduce((acc, curr) => acc + curr.unfilled, 0);

  // Age Group Data
  const ageGroupData = data?.byAgeGroup ?? [];
  const getAgeCount = (group: string) => ageGroupData.find((a) => a.ageGroup === group)?.total ?? 0;
  const ageUnder30 = getAgeCount("Under 30");
  const age3039 = getAgeCount("30-39");
  const age4049 = getAgeCount("40-49");
  const age5059 = getAgeCount("50-59");
  const age60Plus = getAgeCount("60+");

  // Employment Type Mix
  const empTypes = data?.byEmploymentStatus ?? [];
  const permanentTotal =
    empTypes.find((e) => e.status === "Permanent" || e.status === "Regular")?.total ??
    regularEmployees;
  const joCosTotal =
    empTypes.find((e) => e.status === "JO/COS" || e.status === "Casual")?.total ?? joCosEmployees;
  const otherTotal = totalEmployees - permanentTotal - joCosTotal;

  // Gender Distribution
  const maleTotal = (data?.bySexLevel ?? []).reduce((acc, curr) => acc + curr.male, 0);
  const femaleTotal = (data?.bySexLevel ?? []).reduce((acc, curr) => acc + curr.female, 0);
  const genderTotal = maleTotal + femaleTotal;
  const femalePct = genderTotal > 0 ? Math.round((femaleTotal / genderTotal) * 100) : 0;
  const malePct = genderTotal > 0 ? Math.round((maleTotal / genderTotal) * 100) : 0;

  // Divisions
  const divisions = [...(data?.byDivision ?? [])].sort((a, b) => b.total - a.total).slice(0, 4);

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-blue-600 mb-1">Good morning, {role}! 👋</div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Overview of the workforce and HR operations.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button className="flex items-center space-x-2 px-4 py-2 border border-border rounded-md bg-card text-card-foreground text-sm font-medium text-foreground/80 hover:bg-muted/50 shadow-sm">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <span>{currentDate}</span>
            </button>
          </div>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Employees"
            value={loading ? "..." : totalEmployees}
            subtext="Current Records"
            subtextColor="text-muted-foreground"
            icon={<Users className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-50"
            chartColor="stroke-blue-500"
            trend="up"
          />
          <StatCard
            title="Permanent Employees"
            value={loading ? "..." : regularEmployees}
            subtext={`${regularPct}% of total`}
            subtextColor="text-muted-foreground"
            subtextDot="bg-emerald-500"
            icon={<Briefcase className="w-5 h-5 text-emerald-600" />}
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
            icon={<UserCheck className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-50"
            chartColor="stroke-amber-500"
            trend="down"
          />
          <StatCard
            title="Near Retirement"
            value={loading ? "..." : 0} // Calculation logic required from DB
            subtext="Turning 65 within 5 years"
            subtextColor="text-muted-foreground"
            icon={<UserX className="w-5 h-5 text-rose-500" />}
            iconBg="bg-rose-50"
            chartColor="stroke-rose-500"
            trend="up"
          />
          <StatCard
            title="Vacant Positions"
            value={loading ? "..." : vacantPositions}
            subtext="Plantilla Items"
            subtextColor="text-muted-foreground"
            icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
            iconBg="bg-purple-50"
            chartColor="stroke-purple-500"
            trend="up"
          />
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Workforce Age Profile */}
          <div className="lg:col-span-5 bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-base font-semibold text-foreground">Workforce Age Profile</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Age distribution based on recorded birthdates.
                </p>
              </div>
            </div>

            <div className="h-48 flex items-end justify-between space-x-2 mt-4 px-2">
              <BarItem label="Under 30" count={ageUnder30} total={totalEmployees} active={false} />
              <BarItem label="30-39" count={age3039} total={totalEmployees} active={true} />
              <BarItem label="40-49" count={age4049} total={totalEmployees} active={false} />
              <BarItem label="50-59" count={age5059} total={totalEmployees} active={false} />
              <BarItem label="60+" count={age60Plus} total={totalEmployees} active={false} />
            </div>

            <div className="flex justify-between text-xs text-muted-foreground/70 mt-2 px-2 border-t border-border/50 pt-2 pb-6">
              <div className="w-1/5 text-center"></div>
              <div className="w-1/5 text-center"></div>
              <div className="w-1/5 text-center"></div>
              <div className="w-1/5 text-center"></div>
              <div className="w-1/5 text-center"></div>
            </div>

            <div className="flex items-center justify-between text-xs mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center text-muted-foreground">
                <Info className="w-4 h-4 text-blue-500 mr-2" />
                <span>Age bands based on employee records.</span>
              </div>
              <div className="font-semibold text-foreground/80">Total: {totalEmployees}</div>
            </div>
          </div>

          {/* Employment Type Mix */}
          <div className="lg:col-span-3 bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5 flex flex-col">
            <div>
              <h3 className="text-base font-semibold text-foreground">Employment Type Mix</h3>
              <p className="text-xs text-muted-foreground mt-1">Distribution by employment type.</p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center mt-6">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
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
                    className="transition-all duration-1000 ease-out"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#2563eb"
                    strokeWidth="20"
                    strokeDasharray={`${(permanentTotal / Math.max(totalEmployees, 1)) * 251.2} 251.2`}
                    strokeDashoffset={`${-(joCosTotal / Math.max(totalEmployees, 1)) * 251.2}`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{totalEmployees}</span>
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
              </div>

              <div className="w-full mt-8 space-y-3">
                <LegendItem
                  color="bg-blue-600"
                  label="Permanent"
                  value={permanentTotal}
                  percent={`(${totalEmployees > 0 ? Math.round((permanentTotal / totalEmployees) * 100) : 0}%)`}
                />
                <LegendItem
                  color="bg-amber-500"
                  label="JO / COS"
                  value={joCosTotal}
                  percent={`(${totalEmployees > 0 ? Math.round((joCosTotal / totalEmployees) * 100) : 0}%)`}
                />
                <LegendItem
                  color="bg-gray-300"
                  label="Other Types"
                  value={otherTotal}
                  percent={`(${totalEmployees > 0 ? Math.round((otherTotal / totalEmployees) * 100) : 0}%)`}
                />
              </div>
            </div>
          </div>

          {/* Action Center */}
          <div className="lg:col-span-4 bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-semibold text-foreground">Action Center</h3>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View all
              </button>
            </div>

            <div className="space-y-3">
              {/* Dynamic data for action center is not provided by getDashboard, rendering zero placeholders to avoid hardcoded mock data */}
              <ActionItem
                icon={<UserX className="w-4 h-4 text-rose-500" />}
                iconBg="bg-rose-50"
                count={0}
                countColor="text-rose-500"
                title="Employees with missing eligibility"
              />
              <ActionItem
                icon={<FileWarning className="w-4 h-4 text-amber-500" />}
                iconBg="bg-amber-50"
                count={0}
                countColor="text-amber-500"
                title="Employees with missing license"
              />
              <ActionItem
                icon={<Clock className="w-4 h-4 text-amber-500" />}
                iconBg="bg-amber-50"
                count={0}
                countColor="text-amber-500"
                title="JO/COS contracts expiring soon"
                subtitle="Within the next 60 days"
              />
              <ActionItem
                icon={<UserX className="w-4 h-4 text-blue-500" />}
                iconBg="bg-blue-50"
                count={0}
                countColor="text-blue-500"
                title="Employees turning 65 this year"
                subtitle="For retirement planning"
              />
              <ActionItem
                icon={<BarChart3 className="w-4 h-4 text-purple-500" />}
                iconBg="bg-purple-50"
                count={vacantPositions}
                countColor="text-purple-500"
                title="Vacant plantilla items"
              />
            </div>
          </div>
        </div>

        {/* Bottom Section 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Gender Distribution */}
          <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5 flex flex-col">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Gender Distribution</h3>
              <p className="text-xs text-muted-foreground mt-1">Workforce by gender.</p>
            </div>
            <div className="flex-1 flex items-center justify-between mt-4">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
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
          </div>

          {/* Employees by Division */}
          <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Employees by Division</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Distribution across hospital divisions.
              </p>
            </div>
            <div className="mt-5 space-y-4">
              {divisions.map((div, i) => {
                const pct = totalEmployees > 0 ? Math.round((div.total / totalEmployees) * 100) : 0;
                const colors = ["bg-blue-500", "bg-amber-500", "bg-emerald-500", "bg-purple-500"];
                return (
                  <ProgressBar
                    key={div.department}
                    label={div.department || "Unassigned"}
                    value={div.total}
                    percent={`${pct}%`}
                    width={`${pct}%`}
                    color={colors[i % colors.length]}
                  />
                );
              })}
              {divisions.length === 0 && (
                <div className="text-sm text-muted-foreground/70 text-center py-4">
                  No division data available
                </div>
              )}
            </div>
          </div>

          {/* Years of Service */}
          <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Years of Service Distribution
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Workforce by length of service.</p>
            </div>
            <div className="mt-5 space-y-3">
              {/* Not available in DashboardResponse, rendering empty state to avoid hardcoded mock data */}
              <div className="text-sm text-muted-foreground/70 text-center py-8">
                Service distribution data not available
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 text-xs font-semibold text-foreground/80">
              Total: {totalEmployees}
            </div>
          </div>

          {/* Upcoming Birthdays */}
          <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5 flex flex-col">
            <div className="flex justify-between items-start mb-1">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Upcoming Birthdays</h3>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
            </div>

            <div className="mt-3 flex-1 space-y-3">
              <div className="text-sm text-muted-foreground/70 text-center py-8">
                Birthday data not available
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Personnel Updates */}
          <div className="lg:col-span-8 bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-foreground">Recent Personnel Updates</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Latest changes and updates in employee records.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground uppercase tracking-wider">
                    <th className="pb-3 font-medium">EMPLOYEE</th>
                    <th className="pb-3 font-medium">ACTION</th>
                    <th className="pb-3 font-medium">DETAILS</th>
                    <th className="pb-3 font-medium">DATE</th>
                    <th className="pb-3 font-medium">UPDATED BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {/* Not available in DashboardResponse, keeping empty to avoid hardcoded mock data */}
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground/70">
                      No recent updates available
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-4 bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-foreground">Quick Links</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <QuickLink
                icon={<UserPlus className="w-5 h-5 text-blue-600" />}
                label="Add Employee"
                bg="bg-blue-50"
              />
              <QuickLink
                icon={<CalendarIcon className="w-5 h-5 text-emerald-600" />}
                label="Leave Requests"
                bg="bg-emerald-50"
              />
              <QuickLink
                icon={<FileText className="w-5 h-5 text-purple-600" />}
                label="Employee Directory"
                bg="bg-purple-50"
              />
              <QuickLink
                icon={<BarChart3 className="w-5 h-5 text-amber-600" />}
                label="Reports & Analytics"
                bg="bg-amber-50"
              />
              <QuickLink
                icon={<CheckSquare className="w-5 h-5 text-teal-600" />}
                label="Requests & Approvals"
                bg="bg-teal-50"
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// Subcomponents

function StatCard({
  title,
  value,
  subtext,
  subtextColor,
  subtextDot,
  subtextIcon,
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
  subtextIcon?: React.ReactNode;
  icon: React.ReactNode;
  iconBg: string;
  chartColor: string;
  trend: "up" | "down";
}) {
  return (
    <div className="bg-card text-card-foreground p-4 rounded-xl border border-border shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs font-semibold text-foreground/80">{title}</p>
          <h2 className="text-2xl font-bold text-foreground mt-1">{value}</h2>
        </div>
        <div className={cn("p-2 rounded-lg", iconBg)}>{icon}</div>
      </div>
      <div className="flex items-center text-[10px] mt-2 z-10 relative">
        {subtextDot && <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", subtextDot)}></span>}
        <span className={subtextColor}>{subtext}</span>
        {subtextIcon}
      </div>
      <div className="absolute bottom-2 right-2 w-24 h-8 opacity-50 z-0">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
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

function BarItem({
  label,
  count,
  total,
  active,
}: {
  label: string;
  count: number;
  total: number;
  active: boolean;
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  const height = percent > 0 ? `${percent}%` : "5%";
  return (
    <div className="flex flex-col items-center flex-1 group h-full justify-end">
      <div className="text-[10px] font-semibold text-foreground/80 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {count} ({percent}%)
      </div>
      <div
        className={cn(
          "w-full max-w-[48px] rounded-t-sm transition-all duration-300",
          active ? "bg-blue-600" : "bg-blue-500/80 hover:bg-blue-500",
        )}
        style={{ height }}
      ></div>
      <div className="text-[10px] text-muted-foreground mt-2 whitespace-nowrap">{label}</div>
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
    <div className="flex items-center justify-between text-xs w-full">
      <div className="flex items-center">
        <div className={cn("rounded-full mr-2", color, small ? "w-2 h-2" : "w-3 h-3")}></div>
        <span
          className={cn(
            small ? "text-muted-foreground font-medium" : "text-foreground/80 font-medium",
          )}
        >
          {label}
        </span>
      </div>
      <div>
        <span className="font-semibold text-foreground mr-1">{value}</span>
        <span className="text-muted-foreground">{percent}</span>
      </div>
    </div>
  );
}

function ActionItem({
  icon,
  iconBg,
  count,
  countColor,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  iconBg: string;
  count: string | number;
  countColor: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
      <div className="flex items-center space-x-3">
        <div className={cn("p-1.5 rounded-md", iconBg)}>{icon}</div>
        <div className={cn("text-lg font-bold w-6 text-center", countColor)}>{count}</div>
        <div>
          <p className="text-xs font-semibold text-foreground">{title}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-muted-foreground" />
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
      <div className="flex justify-between text-[11px] mb-1">
        <span className="font-medium text-foreground/80">{label}</span>
        <div>
          <span className="font-semibold text-foreground mr-1">{value}</span>
          <span className="text-muted-foreground">({percent})</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width }}></div>
      </div>
    </div>
  );
}

function QuickLink({ icon, label, bg }: { icon: React.ReactNode; label: string; bg: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/50 bg-card text-card-foreground hover:border-border hover:shadow-sm transition-all cursor-pointer text-center group">
      <div className={cn("p-2.5 rounded-lg mb-2 group-hover:scale-105 transition-transform", bg)}>
        {icon}
      </div>
      <span className="text-[10px] font-medium text-foreground/80">{label}</span>
    </div>
  );
}
