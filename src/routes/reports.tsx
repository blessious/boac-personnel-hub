import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  PieChart,
  Printer,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

const REPORTS = [
  {
    title: "Employee Master List",
    description:
      "Complete employee listing by division, position, status, item number, and employment category.",
    icon: Users,
  },
  {
    title: "Personnel Statistics",
    description:
      "Workforce distribution by age, sex, civil status, education, division, cadre, and plantilla status.",
    icon: PieChart,
  },
  {
    title: "Leave Summary",
    description:
      "Leave balances, approved leave, pending applications, late filing, and leave without pay.",
    icon: CalendarDays,
  },
  {
    title: "Attendance Summary",
    description:
      "Absences, tardiness, undertime, official business, overtime, and perfect attendance.",
    icon: BarChart3,
  },
  {
    title: "Plantilla Report",
    description: "Position, salary grade, item, assignment, vacancy, and PSIPOP-style summaries.",
    icon: FileSpreadsheet,
  },
  {
    title: "Certifications",
    description:
      "Certificate of employment, service record, leave credit certification, and related documents.",
    icon: FileText,
  },
];

function ReportsPage() {
  return (
    <AppShell
      title="Reports & Analytics"
      subtitle="HR statistics, summaries, and export-ready reports"
    >
      <div className="mb-5 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Report Center</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Standard HR reports and export actions will be connected here as the remaining
              attendance, leave, and form templates are finalized.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={comingSoon}>
              <Printer className="mr-1.5 h-4 w-4" /> Print
            </Button>
            <Button onClick={comingSoon} className="bg-blue-600 text-white hover:bg-blue-700">
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.title}
              onClick={comingSoon}
              className="rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:bg-muted/30"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{report.title}</h3>
              <p className="mt-2 min-h-14 text-sm leading-6 text-muted-foreground">
                {report.description}
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-700">
                Generate Report
                <ChevronRight className="ml-1 h-4 w-4" />
              </span>
            </button>
          );
        })}
      </div>
    </AppShell>
  );
}

function comingSoon() {
  toast.info("Coming soon");
}
