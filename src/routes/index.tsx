import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { UserPlus, FileBarChart, CalendarPlus, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/StatCard";
import { EMPLOYEES, DEPARTMENTS } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function initials(ln: string, fn: string) {
  return (fn[0] ?? "") + (ln[0] ?? "");
}

function Dashboard() {
  const total = EMPLOYEES.length;
  const permanent = EMPLOYEES.filter((e) => e.status === "PERMANENT").length;
  const casual = EMPLOYEES.filter((e) => e.status === "CASUAL" || e.status === "CONTRACTUAL").length;
  const newThisMonth = 4;

  const byDept = DEPARTMENTS.map((d) => ({
    name: d.replace("Municipal ", "").replace("Office of the ", "").slice(0, 14),
    full: d,
    count: EMPLOYEES.filter((e) => e.department === d).length,
  })).filter((x) => x.count > 0);

  const statusData = (["PERMANENT", "CASUAL", "CONTRACTUAL", "COTERMINOUS", "ELECTED"] as const).map((s) => ({
    name: s,
    value: EMPLOYEES.filter((e) => e.status === s).length,
  })).filter((x) => x.value > 0);

  const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

  const recent = EMPLOYEES.slice(0, 6);

  return (
    <AppShell title="Dashboard" subtitle="Today's report and personnel performance">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={total} delta={{ value: "1.8%", positive: true }} footnote="Update: April 30, 2026" />
        <StatCard label="Permanent" value={permanent} delta={{ value: "1.2%", positive: true }} footnote="Plantilla items" />
        <StatCard label="Casual / Contractual" value={casual} delta={{ value: "0.6%", positive: false }} footnote="Job orders" />
        <StatCard label="New This Month" value={newThisMonth} delta={{ value: "1.8%", positive: true }} footnote="Onboarded April 2026" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        {/* Bar chart */}
        <div className="xl:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Employees by Department</h3>
              <p className="text-xs text-muted-foreground">Distribution across LGU Boac offices</p>
            </div>
          </div>
          <div className="h-[320px] mt-4">
            <ResponsiveContainer>
              <BarChart data={byDept} margin={{ top: 10, right: 10, left: -10, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <Tooltip
                  cursor={{ fill: "var(--color-accent)", opacity: 0.4 }}
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }}
                  labelFormatter={(_, p) => p?.[0]?.payload?.full ?? ""}
                />
                <Bar dataKey="count" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut chart */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold">Employment Status</h3>
          <p className="text-xs text-muted-foreground">Breakdown by status type</p>
          <div className="h-[260px] mt-2">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={2}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 rounded-lg border border-border p-3 text-center">
            <div className="text-xs text-muted-foreground">Total Personnel</div>
            <div className="text-2xl font-semibold mt-0.5">{total}</div>
          </div>
        </div>
      </div>

      {/* Quick links + recent activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold">Quick Actions</h3>
          <p className="text-xs text-muted-foreground">Frequently used shortcuts</p>
          <div className="mt-4 grid gap-2">
            <Link to="/employees" className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent transition-colors">
              <div className="h-9 w-9 grid place-items-center rounded-lg bg-primary/10 text-primary"><UserPlus className="h-4 w-4" /></div>
              <div className="text-sm"><div className="font-medium">Add Employee</div><div className="text-xs text-muted-foreground">Create new 201 file</div></div>
            </Link>
            <Link to="/reports" className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent transition-colors">
              <div className="h-9 w-9 grid place-items-center rounded-lg bg-primary/10 text-primary"><FileBarChart className="h-4 w-4" /></div>
              <div className="text-sm"><div className="font-medium">Generate Report</div><div className="text-xs text-muted-foreground">Plantilla, masterlist, etc.</div></div>
            </Link>
            <Link to="/leave" className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent transition-colors">
              <div className="h-9 w-9 grid place-items-center rounded-lg bg-primary/10 text-primary"><CalendarPlus className="h-4 w-4" /></div>
              <div className="text-sm"><div className="font-medium">Leave Management</div><div className="text-xs text-muted-foreground">Track VL/SL balances</div></div>
            </Link>
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Recent Employee Activity</h3>
              <p className="text-xs text-muted-foreground">Latest updates to 201 files</p>
            </div>
            <Link to="/employees" className="text-xs font-medium text-primary inline-flex items-center gap-1">
              View all <Plus className="h-3 w-3" />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {recent.map((e, i) => (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {initials(e.lastname, e.firstname)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{e.firstname} {e.lastname}</div>
                  <div className="text-xs text-muted-foreground truncate">{e.position} · {e.department}</div>
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">{["Updated profile","Added training","Salary increment","New leave entry","Edited family","Added IPCR"][i]}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
