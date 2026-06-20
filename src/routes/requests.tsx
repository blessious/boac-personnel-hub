import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, FilePlus2, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { getEmployeeLeave } from "@/lib/leave-api";
import { listDtrCorrectionRequests } from "@/lib/attendance-api";
import {
  requestsFromDtrCorrections,
  requestsFromLeave,
  type RequestRecord,
  type RequestStatus,
} from "@/lib/requests-api";
import { cn } from "@/lib/utils";
import { useRealtimeRefresh } from "@/lib/realtime";

export const Route = createFileRoute("/requests")({
  component: RequestsPage,
});

const STATUS_COLOR: Record<RequestStatus, string> = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Disapproved: "bg-rose-100 text-rose-700 border-rose-200",
  Cancelled: "bg-muted text-muted-foreground border-border",
  Reversed: "bg-violet-100 text-violet-700 border-violet-200",
};

function RequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(Boolean(user?.employeeId));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RequestStatus | "all">("all");
  const [error, setError] = useState("");

  const load = () => {
    if (!user?.employeeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    Promise.all([getEmployeeLeave(user.employeeId), listDtrCorrectionRequests()])
      .then(([leave, dtr]) =>
        setRecords([
          ...requestsFromLeave(leave.applications),
          ...requestsFromDtrCorrections(dtr.requests),
        ]),
      )
      .catch((err) => setError(err.message || "Unable to load requests"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [user?.employeeId]);
  useRealtimeRefresh(load, ["leave", "attendance"]);

  const applications = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records
      .slice()
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .filter((item) => {
        const matchesStatus = status === "all" || item.status === status;
        const text = `${item.kind} ${item.title} ${item.details} ${item.status}`.toLowerCase();
        return matchesStatus && (!normalized || text.includes(normalized));
      });
  }, [records, query, status]);

  const summary = useMemo(() => summarize(records), [records]);

  return (
    <AppShell title="My Requests" subtitle="Track leave, attendance, and HR request status">
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="Pending" value={summary.Pending} />
          <SummaryCard label="Approved" value={summary.Approved} />
          <SummaryCard label="Disapproved" value={summary.Disapproved} />
          <SummaryCard label="Total" value={summary.total} />
        </div>

        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search requests"
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="flex overflow-x-auto rounded-lg bg-muted/50 p-1">
              {(
                ["all", "Pending", "Approved", "Disapproved", "Cancelled", "Reversed"] as const
              ).map((item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  className={cn(
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    status === item
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item === "all" ? "All" : item}
                </button>
              ))}
            </div>
            <Button
              onClick={() => navigate({ to: "/self-service" })}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <FilePlus2 className="mr-1.5 h-4 w-4" />
              New Request
            </Button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Loading requests...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-sm text-destructive">{error}</div>
          ) : !user?.employeeId ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No employee record is linked to this account yet.
            </div>
          ) : (
            <RequestsTable applications={applications} />
          )}
        </section>
      </div>
    </AppShell>
  );
}

function RequestsTable({ applications }: { applications: RequestRecord[] }) {
  if (!applications.length) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">
        No requests match the current filters.
      </div>
    );
  }

  return (
    <>
      <div className="mobile-record-list">
        {applications.map((application) => (
          <article key={application.id} className="mobile-record-card">
            <div className="mobile-record-card__header">
              <div className="min-w-0">
                <h3 className="mobile-record-card__title">{application.title}</h3>
                <p className="mobile-record-card__meta">{application.kind}</p>
              </div>
              <Badge variant="outline" className={STATUS_COLOR[application.status]}>
                {application.status}
              </Badge>
            </div>
            <div className="mobile-record-card__grid">
              <div className="mobile-record-card__field">
                <span className="mobile-record-card__label">From</span>
                <span className="mobile-record-card__value">
                  {formatDate(application.dateFrom)}
                </span>
              </div>
              <div className="mobile-record-card__field">
                <span className="mobile-record-card__label">To</span>
                <span className="mobile-record-card__value">{formatDate(application.dateTo)}</span>
              </div>
              <div className="mobile-record-card__field">
                <span className="mobile-record-card__label">{application.metricLabel}</span>
                <span className="mobile-record-card__value">{application.metricValue}</span>
              </div>
              <div className="mobile-record-card__field">
                <span className="mobile-record-card__label">Remarks</span>
                <span className="mobile-record-card__value">
                  {application.remarks || application.details || "-"}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mobile-desktop-table overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Request</th>
              <th className="px-4 py-3 font-semibold">Dates</th>
              <th className="px-4 py-3 font-semibold">Detail</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application, index) => (
              <tr
                key={application.id}
                className={cn(
                  "border-b border-border/50 last:border-0",
                  index % 2 === 1 && "bg-muted/10",
                )}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{application.title}</div>
                  <div className="text-xs text-muted-foreground">{application.kind}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(application.dateFrom)} to {formatDate(application.dateTo)}
                </td>
                <td className="px-4 py-3 font-medium">{application.metricValue}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={STATUS_COLOR[application.status]}>
                    {application.status}
                  </Badge>
                </td>
                <td className="max-w-[260px] px-4 py-3 text-muted-foreground">
                  {application.remarks || application.details || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
        <ClipboardCheck className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function summarize(applications: RequestRecord[]) {
  return applications.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      acc.total += 1;
      return acc;
    },
    { Pending: 0, Approved: 0, Disapproved: 0, Cancelled: 0, Reversed: 0, total: 0 },
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
