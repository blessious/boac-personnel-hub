import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

type ReportTab = "employee" | "attendance" | "leave";

const REPORT_CATEGORIES: { key: ReportTab; label: string }[] = [
  { key: "employee", label: "📋 Employee Reports" },
  { key: "attendance", label: "🕐 Attendance Reports" },
  { key: "leave", label: "📅 Leave Reports" },
];

const REPORTS: Record<ReportTab, { key: string; title: string; desc: string; icon: string }[]> = {
  employee: [
    { key: "masterlist", title: "Employee Master List", desc: "Complete directory of all STRH personnel with demographic and employment details.", icon: "👥" },
    { key: "distribution", title: "Distribution by Department/Division", desc: "Breakdown of employees per department, division, and employment status.", icon: "📊" },
    { key: "psipop", title: "Plantilla of Personnel (PSIPOP)", desc: "Approved plantilla positions, item numbers, incumbents, and salary grades.", icon: "📑" },
    { key: "step", title: "Employees for Step Increment", desc: "List of employees qualified for salary step increment based on service.", icon: "📈" },
    { key: "loyalty", title: "Employees for Loyalty Award", desc: "Personnel eligible for loyalty award recognition based on years of service.", icon: "🏅" },
  ],
  attendance: [
    { key: "dtr", title: "Daily Time Records (DTR)", desc: "Individual time-in/time-out records for a selected period.", icon: "🕐" },
    { key: "perfect", title: "Employees with Perfect Attendance", desc: "List of employees with no tardiness, undertime, or absences.", icon: "⭐" },
    { key: "tardiness", title: "Tardiness and Undertime Report", desc: "Summary of late arrivals and undertime incidents per employee.", icon: "⏱️" },
  ],
  leave: [
    { key: "credit-summary", title: "Leave Credit Summary", desc: "Current vacation and sick leave balances for all employees.", icon: "💰" },
    { key: "leave-applications", title: "Summary of Leave Applications", desc: "All filed leave requests with approval status and dates.", icon: "📋" },
    { key: "sick-profile", title: "Sick Leave Profile", desc: "Analysis of sick leave usage patterns per employee and department.", icon: "🏥" },
  ],
};

function ReportCard({ report }: { report: { key: string; title: string; desc: string; icon: string } }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-12 w-12 rounded-xl bg-primary/8 border border-primary/15 grid place-items-center text-2xl shrink-0">
          {report.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground text-[15px] leading-snug">{report.title}</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{report.desc}</p>
        </div>
      </div>
      <div className="mt-auto pt-3 border-t border-border flex items-center gap-2">
        <Button
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-sm"
          onClick={() => toast.success(`Generating "${report.title}"…`)}
        >
          <FileText className="h-4 w-4" /> Generate Report
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => toast.info(`Exporting "${report.title}" to PDF…`)}
          title="Export to PDF"
        >
          <Download className="h-3.5 w-3.5" /> PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => toast.info(`Exporting "${report.title}" to Excel…`)}
          title="Export to Excel"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
        </Button>
      </div>
    </div>
  );
}

function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("employee");

  return (
    <AppShell title="Reports & Analytics" subtitle="Generate and export HR reports">
      {/* Tab Bar */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 w-fit mb-5">
        {REPORT_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveTab(cat.key)}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === cat.key
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORTS[activeTab].map((r) => (
          <ReportCard key={r.key} report={r} />
        ))}
      </div>
    </AppShell>
  );
}
