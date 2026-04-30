import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

const REPORTS = [
  { key: "plantilla", title: "Plantilla of Personnel", desc: "Approved positions, item numbers, salary grades and incumbents.", dateRange: false },
  { key: "service", title: "Service Record", desc: "Per-employee service history with leaves, increments, designations.", dateRange: false },
  { key: "leave", title: "Leave Card", desc: "VL / SL ledger with earned, used, and balance per employee.", dateRange: true },
  { key: "history", title: "Employment History", desc: "Movement of personnel — appointment, promotion, transfer, separation.", dateRange: true },
  { key: "masterlist", title: "Masterlist of Employees", desc: "Complete personnel directory with contact and demographic details.", dateRange: false },
];

function ReportsPage() {
  const handleGenerate = (title: string) => {
    toast.success(`Generating ${title}…`, { description: "PDF download will start in a moment." });
    // simulate download trigger
    setTimeout(() => {
      const blob = new Blob([`${title}\nMunicipality of Boac, Marinduque\nGenerated: ${new Date().toLocaleString()}`], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${title.replace(/\s+/g, "_")}.txt`; a.click();
      URL.revokeObjectURL(url);
    }, 600);
  };

  return (
    <AppShell title="Reports" subtitle="Pre-built report templates for HR and management">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <div key={r.key} className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{r.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
            </div>

            {r.dateRange && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <div className="relative"><Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="date" className="pl-8" /></div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <div className="relative"><Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="date" className="pl-8" /></div>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Button onClick={() => handleGenerate(r.title)} className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90">
                <Download className="h-4 w-4 mr-1.5" /> Generate
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
