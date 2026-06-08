import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  return (
    <AppShell title="Attendance & Leave" subtitle="Deferred module">
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">Attendance and leave are not connected yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Mock attendance, daily time record, leave request, and leave credit data has been removed. This module is ready for
          a later database-backed implementation.
        </p>
      </div>
    </AppShell>
  );
}
