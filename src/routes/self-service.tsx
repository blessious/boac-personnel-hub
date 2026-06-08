import { createFileRoute } from "@tanstack/react-router";
import { UserCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/self-service")({
  component: SelfServicePage,
});

function SelfServicePage() {
  return (
    <AppShell title="Employee Self-Service Portal" subtitle="Deferred module">
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <UserCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">Self-service is not connected yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Mock requests, notifications, and profile shortcuts have been removed. This screen is reserved for the later
          self-service workflow implementation.
        </p>
      </div>
    </AppShell>
  );
}
