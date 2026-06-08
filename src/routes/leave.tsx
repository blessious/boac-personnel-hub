import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/leave")({
  component: LeavePage,
});

function LeavePage() {
  return (
    <AppShell title="Leave Management" subtitle="Deferred module">
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">Leave records are not connected yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Mock leave records have been removed. Leave balances and leave workflows will be connected in the attendance and
          leave implementation pass.
        </p>
      </div>
    </AppShell>
  );
}
