import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, CalendarClock, Clock, Fingerprint, LockKeyhole, Plane, RefreshCw, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/attendance")({
  component: AttendancePage,
});

const FEATURES = [
  {
    title: "Biometric Import",
    description: "Connect fingerprint and facial biometric devices, pull logs, and prepare DTR entries.",
    icon: Fingerprint,
  },
  {
    title: "Daily Time Records",
    description: "Review AM/PM punches, missing scans, tardiness, undertime, and absences.",
    icon: CalendarClock,
  },
  {
    title: "DTR Corrections",
    description: "Receive correction requests, verify supporting details, and record approved changes.",
    icon: ScrollText,
  },
  {
    title: "Schedule Management",
    description: "Assign regular schedules, shift schedules, holidays, and special work arrangements.",
    icon: Clock,
  },
  {
    title: "Official Business",
    description: "Track OB passes, travel orders, permission slips, and authorized field work.",
    icon: Plane,
  },
  {
    title: "Lock Processed DTR",
    description: "Lock or unlock processed attendance periods with audit trail protection.",
    icon: LockKeyhole,
  },
];

function AttendancePage() {
  return (
    <AppShell title="Attendance" subtitle="DTR, biometric imports, schedules, and corrections">
      <div className="mb-5 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Attendance Operations</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              These are the attendance functions planned for the HRIS. The biometric/DTR integration can be connected from the existing DTR system in the next implementation pass.
            </p>
          </div>
          <Button onClick={comingSoon} className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
            <RefreshCw className="mr-1.5 h-4 w-4" /> Sync Attendance
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <button
              key={feature.title}
              onClick={comingSoon}
              className="rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:bg-muted/30"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-blue-500/10 text-blue-600">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{feature.description}</p>
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
