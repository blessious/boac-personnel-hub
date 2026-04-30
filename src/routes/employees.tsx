import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Eye, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EMPLOYEES, DEPARTMENTS, type EmploymentStatus } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/employees")({
  component: EmployeesPage,
});

const STATUS_COLOR: Record<EmploymentStatus, string> = {
  PERMANENT: "bg-success/15 text-success border-success/30",
  CASUAL: "bg-warning/15 text-warning-foreground border-warning/30",
  CONTRACTUAL: "bg-primary/15 text-primary border-primary/30",
  COTERMINOUS: "bg-accent text-accent-foreground border-accent",
  ELECTED: "bg-destructive/10 text-destructive border-destructive/30",
};

const PAGE_SIZE = 10;

function EmployeesPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return EMPLOYEES.filter((e) => {
      const fullName = `${e.firstname} ${e.middlename} ${e.lastname}`.toLowerCase();
      if (q && !fullName.includes(q.toLowerCase()) && !e.refId.toLowerCase().includes(q.toLowerCase())) return false;
      if (dept !== "all" && e.department !== dept) return false;
      if (status !== "all" && e.status !== status) return false;
      return true;
    });
  }, [q, dept, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, totalPages);
  const slice = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);

  return (
    <AppShell title="Employees" subtitle={`${filtered.length} total personnel records`}>
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        {/* Filters */}
        <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-3 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or Ref ID…"
              className="pl-9"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={dept} onValueChange={(v) => { setDept(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-[260px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PERMANENT">Permanent</SelectItem>
              <SelectItem value="CASUAL">Casual</SelectItem>
              <SelectItem value="CONTRACTUAL">Contractual</SelectItem>
              <SelectItem value="COTERMINOUS">Co-terminous</SelectItem>
              <SelectItem value="ELECTED">Elected</SelectItem>
            </SelectContent>
          </Select>
          <div className="lg:ml-auto">
            <Button
              className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"
              disabled={!can("edit")}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Employee
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Full Name</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Position</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((e, i) => (
                <tr
                  key={e.id}
                  className={i % 2 ? "bg-muted/40" : ""}
                  onClick={() => navigate({ to: "/employees/$id", params: { id: e.id } })}
                >
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{e.refId}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-medium">
                          {(e.firstname[0] ?? "") + (e.lastname[0] ?? "")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{e.lastname}, {e.firstname} {e.middlename?.[0]}.</div>
                        <div className="text-xs text-muted-foreground">{e.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.department}</td>
                  <td className="px-4 py-3">{e.position}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`${STATUS_COLOR[e.status]} font-medium`}>{e.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.statusClass}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                      <Link
                        to="/employees/$id"
                        params={{ id: e.id }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline px-2 py-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> View 201
                      </Link>
                      <button className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent text-muted-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {slice.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No employees match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex items-center justify-between border-t border-border text-sm text-muted-foreground">
          <div>Showing {slice.length} of {filtered.length}</div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={cur === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3">Page {cur} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={cur === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
