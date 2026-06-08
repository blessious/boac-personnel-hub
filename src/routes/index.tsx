import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { Activity, CalendarCheck, ClipboardList, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getDashboard, type DashboardResponse } from "@/lib/employees-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const chartConfig = {
  active: { label: "Active", color: "var(--chart-3)" },
  inactive: { label: "Inactive", color: "var(--chart-5)" },
  total: { label: "Total", color: "var(--chart-1)" },
  male: { label: "Male", color: "var(--chart-1)" },
  female: { label: "Female", color: "var(--chart-2)" },
  hired: { label: "Hired", color: "var(--chart-3)" },
} satisfies ChartConfig;

const pieColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function Dashboard() {
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

  const cards = [
    {
      label: "Total Employees",
      value: data?.totalEmployees ?? 0,
      sub: "Total registered records",
      icon: Users,
      color: "bg-blue-500/10 text-blue-600",
      border: "border-blue-200",
    },
    {
      label: "Regular Employees",
      value: data?.regularEmployees ?? 0,
      sub: "Permanent and Regular",
      icon: Activity,
      color: "bg-emerald-500/10 text-emerald-600",
      border: "border-emerald-200",
    },
    {
      label: "Job Order / COS",
      value: data?.jobOrderEmployees ?? 0,
      sub: "Job Order, COS, Contractual",
      icon: ClipboardList,
      color: "bg-amber-500/10 text-amber-600",
      border: "border-amber-200",
    },
  ];

  return (
    <AppShell title="Dashboard" subtitle="STRH HRIS overview">
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn(
                "flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm",
                card.border,
              )}
            >
              <div
                className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-lg", card.color)}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums">
                  {loading ? "..." : card.value}
                </div>
                <div className="text-sm font-medium text-foreground">{card.label}</div>
                <div className="text-xs text-muted-foreground">{card.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">


        <ChartPanel
          title="Employment Type Mix"
          description="Breakdown by plantilla, regular, job order, casual, and contractual records."
          emptyText="No employment status data is available yet."
          hasData={(data?.byEmploymentStatus ?? []).length > 0}
        >
          <ChartContainer config={chartConfig} className="h-[310px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
              <Pie
                data={data?.byEmploymentStatus ?? []}
                dataKey="total"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={96}
                paddingAngle={2}
              >
                {(data?.byEmploymentStatus ?? []).map((entry, index) => (
                  <Cell key={entry.status} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <LegendList
            rows={(data?.byEmploymentStatus ?? []).map((row, index) => ({
              label: row.status,
              value: row.total,
              color: pieColors[index % pieColors.length],
            }))}
          />
        </ChartPanel>

        <ChartPanel
          title="Workforce Age Profile"
          description="Age bands based on recorded birthdays."
          emptyText="No birthday data is available yet."
          hasData={(data?.byAgeGroup ?? []).length > 0}
        >
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={data?.byAgeGroup ?? []} margin={{ left: 0, right: 12, top: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="ageGroup" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </ChartPanel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartPanel
          title="Sex Distribution by Division"
          description="Compares recorded male and female employees per division."
          emptyText="No sex distribution data is available yet."
          hasData={(data?.bySexLevel ?? []).length > 0}
        >
          <ChartContainer config={chartConfig} className="h-[310px] w-full">
            <BarChart data={data?.bySexLevel ?? []} margin={{ left: 0, right: 12, top: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="department"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={70}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="male" fill="var(--color-male)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="female" fill="var(--color-female)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </ChartPanel>

        <SummaryTable
          title="Status of Employee Records by Division"
          emptyText="No employees are recorded in MySQL yet."
          headers={["Division", "Active", "Inactive", "Total"]}
          rows={(data?.byDivision ?? []).map((row) => [
            row.department,
            row.filled,
            row.unfilled,
            row.total,
          ])}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SummaryTable
          title="Distribution by Level, Division and Sex"
          emptyText="No employee demographic data is available yet."
          headers={["Division", "1st", "2nd", "3rd", "Male", "Female", "Total"]}
          rows={(data?.bySexLevel ?? []).map((row) => [
            row.department,
            row.firstLevel,
            row.secondLevel,
            row.thirdLevel,
            row.male,
            row.female,
            row.total,
          ])}
        />
        <SummaryTable
          title="Distribution by Cadre"
          emptyText="Cadre data will appear after employees are added."
          headers={["Division", "Cadre", "Active", "Inactive", "Total"]}
          rows={(data?.byCadre ?? []).map((row) => [
            row.department,
            row.cadre,
            row.filled,
            row.unfilled,
            row.total,
          ])}
        />
      </div>

      <div className="mt-6">
        <SummaryTable
          title="Distribution by Position"
          emptyText="Position data will appear after employees are added."
          headers={["Division", "Position", "Active", "Inactive", "Total"]}
          rows={(data?.byPosition ?? []).map((row) => [
            row.department,
            row.position,
            row.filled,
            row.unfilled,
            row.total,
          ])}
        />
      </div>
    </AppShell>
  );
}

function ChartPanel({
  title,
  description,
  emptyText,
  hasData,
  children,
}: {
  title: string;
  description: string;
  emptyText: string;
  hasData: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {hasData ? (
        children
      ) : (
        <div className="grid h-[280px] place-items-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      )}
    </div>
  );
}

function LegendList({ rows }: { rows: Array<{ label: string; value: number; color: string }> }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: row.color }} />
          <span className="truncate text-muted-foreground">{row.label}</span>
          <span className="ml-auto font-medium tabular-nums text-foreground">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function SummaryTable({
  title,
  headers,
  rows,
  emptyText,
}: {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  emptyText: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/20 p-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-muted-foreground"
                  colSpan={headers.length}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={`${row.join("-")}-${index}`}
                  className={cn(
                    "border-b border-border/50 last:border-0",
                    index % 2 === 1 && "bg-muted/10",
                  )}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${cell}-${cellIndex}`}
                      className={cn("px-4 py-3", cellIndex > 0 && "text-center tabular-nums")}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
