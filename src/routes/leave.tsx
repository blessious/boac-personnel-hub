import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/leave")({
  component: LeavePage,
});

function LeavePage() {
  const [type, setType] = useState("all");
  const [dept, setDept] = useState("all");
  const [search, setSearch] = useState("");

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      return res.json();
    }
  });

  const DEPARTMENTS = settings?.departments || [];

  const rows = useMemo(() => {
    const all: Array<{ emp: any; rec: any }> = [];
    for (const e of employees) {
      const list = e.leaves || [];
      for (const r of list) all.push({ emp: e, rec: r });
    }
    return all.filter(({ emp, rec }) => {
      if (type !== "all" && rec.type !== type) return false;
      if (dept !== "all" && emp.departmentName !== dept) return false;
      if (search) {
        const query = search.toLowerCase();
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        if (!fullName.includes(query)) return false;
      }
      return true;
    });
  }, [type, dept, search, employees]);

  const isCurrentlyOnLeave = (start: string, end: string) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return now >= s && now <= e;
    } catch {
      return false;
    }
  };

  const stats = useMemo(() => {
    const total = rows.length;
    const activeCount = rows.filter(({ rec }) => isCurrentlyOnLeave(rec.startDate, rec.endDate)).length;
    return { total, activeCount };
  }, [rows]);

  if (isLoading) {
    return (
      <AppShell title="Leave Management" subtitle="Loading data...">
        <div className="flex h-full items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

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
                {DEPARTMENTS.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
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
                <th className="px-4 py-3 font-medium hidden md:table-cell">Period</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ emp, rec }, i) => {
                const active = isCurrentlyOnLeave(rec.startDate, rec.endDate);
                const sDate = new Date(rec.startDate).toLocaleDateString();
                const eDate = new Date(rec.endDate).toLocaleDateString();
                const period = `${sDate} to ${eDate}`;
                return (
                  <tr key={rec.id} className={cn(
                    "transition-colors",
                    active ? "bg-primary/5 hover:bg-primary/10" : i % 2 ? "bg-muted/40" : "hover:bg-muted/20"
                  )}>
                    <td className="px-4 py-3 font-medium">
                      <Link to="/employees/$id" params={{ id: emp.id.toString() }} className="hover:underline text-foreground">
                        {emp.lastName}, {emp.firstName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{rec.type}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground hidden md:inline">{period}</span>
                        <span className="text-muted-foreground inline md:hidden text-xs">{sDate}</span>
                        {active && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 shadow-sm text-[10px] h-5 px-1.5">
                            Active
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">{rec.status}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No leave records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
