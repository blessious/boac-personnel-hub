import { createLazyFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  BarChart3,
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  PieChart,
  RefreshCw,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { WorkflowStatusBadge } from "@/components/ui/status-badge";
import {
  exportPersonnelPlantillaReport,
  getPersonnelPlantillaReport,
  type CountSeries,
  type PersonnelPlantillaResponse,
  type PlantillaItemReportRow,
} from "@/lib/reports-api";
import { cn } from "@/lib/utils";
import { useRealtimeRefresh } from "@/lib/realtime";
import { organizationAssignmentLabel } from "@/lib/reference-libraries";
import { useSettings } from "@/lib/settings-context";

export const Route = createLazyFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { agency } = useSettings();
  const organizationLabel = organizationAssignmentLabel(agency.hierarchy);
  const [data, setData] = useState<PersonnelPlantillaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | "">("");

  const report = data?.report;
  const maxDepartment = useMemo(
    () => maxTotal(report?.charts.byDepartment || []),
    [report?.charts.byDepartment],
  );
  const maxPlantillaDivision = useMemo(
    () => maxStacked(report?.charts.plantillaByDivision || [], "occupied", "vacant"),
    [report?.charts.plantillaByDivision],
  );
  const plantillaRows = report?.tables.plantillaItems || [];

  const load = () => {
    setLoading(true);
    setError("");
    getPersonnelPlantillaReport()
      .then(setData)
      .catch((err) => setError(err.message || "Unable to load report"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);
  useRealtimeRefresh(load, ["employees", "plantilla", "movements", "engagements"]);

  const doExport = async (format: "pdf" | "xlsx") => {
    setExporting(format);
    try {
      const result = await exportPersonnelPlantillaReport(format);
      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
      toast.success(`${format.toUpperCase()} report generated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to export report");
    } finally {
      setExporting("");
    }
  };

  return (
    <AppShell
      title="Reports & Analytics"
      subtitle="Personnel statistics, Plantilla occupancy, and export-ready management reports"
    >
      <div className="flex flex-col gap-4">
        <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <BarChart3 className="h-4 w-4" />
                Personnel Statistics & Plantilla Analytics
              </div>
              <h2 className="mt-1 text-xl font-semibold text-foreground">
                {data?.agency.name || "LGU BOAC HRIS"} Management Report
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Current workforce distribution, employment profile, Plantilla authorization,
                occupancy, vacancy, and item-level details from encoded HRIS records.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={load} disabled={loading}>
                <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                variant="outline"
                disabled={!report || Boolean(exporting)}
                onClick={() => doExport("xlsx")}
              >
                <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                {exporting === "xlsx" ? "Preparing..." : "Excel"}
              </Button>
              <Button
                disabled={!report || Boolean(exporting)}
                onClick={() => doExport("pdf")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Download className="mr-1.5 h-4 w-4" />
                {exporting === "pdf" ? "Preparing..." : "PDF Report"}
              </Button>
            </div>
          </div>
        </section>

        {loading && <ReportLoading />}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4" />
              Report could not be loaded
            </div>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {!loading && report && (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total Employees"
                value={formatNumber(report.employeeSummary.total)}
                detail={`${formatNumber(report.employeeSummary.active || 0)} active assignments`}
                icon={Users}
                tone="blue"
              />
              <MetricCard
                title="Filled Plantilla"
                value={formatNumber(report.employeeSummary.regular || 0)}
                detail={`${formatNumber(report.employeeSummary.nonPlantilla || 0)} active non-Plantilla engagements`}
                icon={PieChart}
                tone="green"
              />
              <MetricCard
                title="Authorized Items"
                value={formatNumber(report.plantillaSummary.authorized || 0)}
                detail={`${formatNumber(report.plantillaSummary.active || 0)} active items`}
                icon={Building2}
                tone="indigo"
              />
              <MetricCard
                title="Vacant Plantilla"
                value={formatNumber(report.plantillaSummary.vacant || 0)}
                detail={`${formatDecimal(report.plantillaSummary.vacancyRate || 0)}% vacancy rate`}
                icon={FileText}
                tone={(report.plantillaSummary.vacant || 0) > 0 ? "amber" : "green"}
              />
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
              <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <SectionTitle
                  title={`Employees by ${organizationLabel}`}
                  subtitle={`Active and inactive records by assigned ${organizationLabel.toLowerCase()}`}
                />
                <div className="mt-4 space-y-3">
                  {report.charts.byDepartment.length ? (
                    report.charts.byDepartment.map((row) => (
                      <StackedBarRow
                        key={row.label}
                        label={row.label}
                        first={row.active || 0}
                        second={row.inactive || 0}
                        firstLabel="Active"
                        secondLabel="Inactive"
                        max={maxDepartment}
                      />
                    ))
                  ) : (
                    <EmptyState
                      text={`No ${organizationLabel.toLowerCase()} statistics available.`}
                    />
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <SectionTitle
                  title="Employment Profile"
                  subtitle="Status, age group, and job-level distribution"
                />
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <CompactSeries
                    title="Employment Status"
                    rows={report.charts.byEmploymentStatus}
                  />
                  <CompactSeries title="Age Group" rows={report.charts.byAgeGroup} />
                  <CompactSeries title="Job Level" rows={report.charts.byLevel} />
                </div>
              </section>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
              <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <SectionTitle
                  title="Plantilla Occupancy by Division"
                  subtitle="Occupied and vacant active items by division"
                />
                <div className="mt-4 space-y-3">
                  {report.charts.plantillaByDivision.length ? (
                    report.charts.plantillaByDivision.map((row) => (
                      <StackedBarRow
                        key={row.label}
                        label={row.label}
                        first={row.occupied || 0}
                        second={row.vacant || 0}
                        firstLabel="Occupied"
                        secondLabel="Vacant"
                        max={maxPlantillaDivision}
                        warningSecond
                      />
                    ))
                  ) : (
                    <EmptyState text="No Plantilla divisions available yet." />
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <SectionTitle
                  title="Plantilla by Salary Grade"
                  subtitle="Active items grouped by encoded salary grade"
                />
                <div className="mt-4 space-y-2">
                  {report.charts.plantillaBySalaryGrade.length ? (
                    report.charts.plantillaBySalaryGrade
                      .slice(0, 14)
                      .map((row) => <SalaryGradeRow key={row.label} row={row} />)
                  ) : (
                    <EmptyState text="No salary-grade grouping available yet." />
                  )}
                </div>
              </section>
            </div>

            <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="flex flex-col gap-2 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
                <SectionTitle
                  title="Plantilla Item Preview"
                  subtitle="First 12 items shown here; full listing is included in the exported file"
                />
                <span className="text-xs text-muted-foreground">
                  {formatNumber(report.tables.plantillaItemsTotal)} encoded item records
                </span>
              </div>
              <PlantillaPreview rows={plantillaRows} />
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function ReportLoading() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse rounded-lg border border-border bg-muted/40"
        />
      ))}
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof Users;
  tone: "blue" | "green" | "indigo" | "amber";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-100",
    green: "bg-emerald-50 text-emerald-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal text-foreground">{value}</p>
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-md", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function StackedBarRow({
  label,
  first,
  second,
  firstLabel,
  secondLabel,
  max,
  warningSecond = false,
}: {
  label: string;
  first: number;
  second: number;
  firstLabel: string;
  secondLabel: string;
  max: number;
  warningSecond?: boolean;
}) {
  const total = first + second;
  const width = max > 0 ? Math.max(4, (total / max) * 100) : 0;
  const firstWidth = total > 0 ? (first / total) * 100 : 0;
  const secondWidth = total > 0 ? (second / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="min-w-0 truncate font-medium text-foreground">{label}</span>
        <span className="shrink-0 text-muted-foreground">{formatNumber(total)}</span>
      </div>
      <div className="h-7 rounded-md bg-muted">
        <div
          className="stat-bar-fill flex h-7 overflow-hidden rounded-md"
          style={{ width: `${width}%` }}
        >
          <div
            title={`${firstLabel}: ${first}`}
            className="bg-blue-600"
            style={{ width: `${firstWidth}%` }}
          />
          <div
            title={`${secondLabel}: ${second}`}
            className={warningSecond ? "bg-amber-500" : "bg-slate-300"}
            style={{ width: `${secondWidth}%` }}
          />
        </div>
      </div>
      <div className="mt-1 flex gap-3 text-[11px] text-muted-foreground">
        <span>
          {firstLabel}: {formatNumber(first)}
        </span>
        <span>
          {secondLabel}: {formatNumber(second)}
        </span>
      </div>
    </div>
  );
}

function CompactSeries({ title, rows }: { title: string; rows: CountSeries[] }) {
  const max = maxTotal(rows);
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      <div className="mt-3 space-y-2">
        {rows.length ? (
          rows.slice(0, 7).map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0 truncate text-muted-foreground">{row.label}</span>
                <span className="font-medium text-foreground">{formatNumber(row.total)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-background">
                <div
                  className="stat-bar-fill h-1.5 rounded-full bg-blue-600"
                  style={{ width: `${max ? (row.total / max) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <EmptyState text="No records." />
        )}
      </div>
    </div>
  );
}

function SalaryGradeRow({ row }: { row: CountSeries }) {
  const active = row.active || row.total || 0;
  const occupied = row.occupied || 0;
  const vacant = row.vacant || 0;
  return (
    <div className="grid grid-cols-[56px_minmax(0,1fr)_88px] items-center gap-2 rounded-md border border-border px-3 py-2 text-xs">
      <div className="font-semibold text-foreground">SG {row.label}</div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="stat-bar-fill h-full rounded-full bg-blue-600"
          style={{ width: `${active ? (occupied / active) * 100 : 0}%` }}
        />
      </div>
      <div className="text-right text-muted-foreground">
        {formatNumber(occupied)} / {formatNumber(active)}
        {vacant > 0 && <span className="text-amber-700"> ({formatNumber(vacant)} vacant)</span>}
      </div>
    </div>
  );
}

function PlantillaPreview({ rows }: { rows: PlantillaItemReportRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-sm">
        <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Item No.</th>
            <th className="px-4 py-3 font-medium">Position</th>
            <th className="px-4 py-3 font-medium">SG</th>
            <th className="px-4 py-3 font-medium">Division / Section</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Occupancy</th>
            <th className="px-4 py-3 font-medium">Occupant</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.itemNumber}-${row.occupantNo}`} className="border-t border-border">
              <td className="px-4 py-3 font-medium text-foreground">
                {valueOrDash(row.itemNumber)}
              </td>
              <td className="px-4 py-3">{valueOrDash(row.positionTitle)}</td>
              <td className="px-4 py-3">{valueOrDash(row.salaryGrade)}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {valueOrDash([row.division, row.section].filter(Boolean).join(" / "))}
              </td>
              <td className="px-4 py-3">{valueOrDash(row.itemStatus)}</td>
              <td className="px-4 py-3">
                <WorkflowStatusBadge status={row.occupancyStatus || "-"} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">{valueOrDash(row.occupantName)}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                No Plantilla item records available yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-3 text-center text-xs text-muted-foreground">{text}</p>;
}

function maxTotal(rows: CountSeries[]) {
  return Math.max(0, ...rows.map((row) => row.total || 0));
}

function maxStacked(
  rows: CountSeries[],
  firstKey: "occupied" | "active",
  secondKey: "vacant" | "inactive",
) {
  return Math.max(0, ...rows.map((row) => (row[firstKey] || 0) + (row[secondKey] || 0)));
}

function formatNumber(value: number | string) {
  return Number(value || 0).toLocaleString();
}

function formatDecimal(value: number | string) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function valueOrDash(value?: string | number | null) {
  return value === undefined || value === null || value === "" ? "-" : value;
}
