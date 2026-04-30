import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { EMPLOYEES, STORE, DEPARTMENTS } from "@/lib/mock-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leave")({
  component: LeavePage,
});

function LeavePage() {
  const [type, setType] = useState("all");
  const [dept, setDept] = useState("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const all: Array<{ emp: typeof EMPLOYEES[number]; rec: typeof STORE.leave[string][number] }> = [];
    for (const e of EMPLOYEES) {
      const list = STORE.leave[e.id] ?? [];
      for (const r of list) all.push({ emp: e, rec: r });
    }
    return all.filter(({ emp, rec }) => {
      if (type !== "all" && rec.type !== type) return false;
      if (dept !== "all" && emp.department !== dept) return false;
      if (search) {
        const query = search.toLowerCase();
        const fullName = `${emp.firstname} ${emp.lastname}`.toLowerCase();
        if (!fullName.includes(query) && !emp.refId.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [type, dept, search]);

  const isCurrentlyOnLeave = (period: string) => {
    try {
      const parts = period.split(" to ");
      if (parts.length !== 2) return false;
      const start = new Date(parts[0]);
      const end = new Date(parts[1]);
      const now = new Date();
      // Normalize to midnight for comparison
      now.setHours(0, 0, 0, 0);
      return now >= start && now <= end;
    } catch {
      return false;
    }
  };

  const stats = useMemo(() => {
    const total = rows.length;
    const activeCount = rows.filter(({ rec }) => isCurrentlyOnLeave(rec.period)).length;
    return { total, activeCount };
  }, [rows]);

  return (
    <AppShell title="Leave Management" subtitle="All approved leave records across departments">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Total Records</div>
          <div className="text-2xl font-bold tabular-nums">{stats.total}</div>
        </div>
        <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl shadow-sm">
          <div className="text-[10px] text-primary uppercase tracking-widest font-bold mb-1">Currently on Leave</div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-primary tabular-nums">{stats.activeCount}</div>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col lg:flex-row gap-3 border-b border-border items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-[240px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search employee..." 
                className="pl-9 bg-muted/30"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Leave type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leave Types</SelectItem>
                <SelectItem value="Vacation Leave">Vacation Leave</SelectItem>
                <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                <SelectItem value="Special Privilege Leave">Special Privilege Leave</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="w-full lg:w-auto gap-2">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date Approved</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ emp, rec }, i) => {
                const active = isCurrentlyOnLeave(rec.period);
                return (
                  <tr key={rec.id} className={cn(
                    "transition-colors",
                    active ? "bg-primary/5 hover:bg-primary/10" : i % 2 ? "bg-muted/40" : "hover:bg-muted/20"
                  )}>
                    <td className="px-4 py-3 font-medium">
                      <Link to="/employees/$id" params={{ id: emp.id }} className="hover:underline text-foreground">
                        {emp.lastname}, {emp.firstname}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {rec.type}
                        {active && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{rec.period}</td>
                    <td className="px-4 py-3">{(rec.type === "Sick Leave" ? rec.slAbsWP : rec.vlAbsWP) || 0}</td>
                    <td className="px-4 py-3">
                      {active ? (
                        <Badge className="bg-primary text-primary-foreground border-transparent shadow-sm">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-success/15 text-success border-success/30 font-medium">Approved</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{rec.dateAction}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No leave records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
