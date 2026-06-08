import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <AppShell title="Reports & Analytics" subtitle="Deferred module">
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">Reports are not connected yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Mock report cards and export actions have been removed. Reports will be rebuilt against the employee, attendance,
          leave, and self-service tables once those modules are connected.
        </p>
      </div>
    </AppShell>
  );
}
