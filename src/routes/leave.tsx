import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { EMPLOYEES, STORE, DEPARTMENTS } from "@/lib/mock-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/leave")({
  component: LeavePage,
});

function LeavePage() {
  const [type, setType] = useState("all");
  const [dept, setDept] = useState("all");

  const rows = useMemo(() => {
    const all: Array<{ emp: typeof EMPLOYEES[number]; rec: typeof STORE.leave[string][number] }> = [];
    for (const e of EMPLOYEES) {
      const list = STORE.leave[e.id] ?? [];
      for (const r of list) all.push({ emp: e, rec: r });
    }
    return all.filter(({ emp, rec }) => {
      if (type !== "all" && rec.type !== type) return false;
      if (dept !== "all" && emp.department !== dept) return false;
      return true;
    });
  }, [type, dept]);

  return (
    <AppShell title="Leave Management" subtitle="All approved leave records across departments">
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-4 flex flex-col lg:flex-row gap-3 border-b border-border">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full lg:w-[220px]"><SelectValue placeholder="Leave type" /></SelectTrigger>
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
            <SelectTrigger className="w-full lg:w-[280px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
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
              {rows.map(({ emp, rec }, i) => (
                <tr key={rec.id} className={i % 2 ? "bg-muted/40" : ""}>
                  <td className="px-4 py-3 font-medium">{emp.lastname}, {emp.firstname}</td>
                  <td className="px-4 py-3">{rec.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{rec.period}</td>
                  <td className="px-4 py-3">{(rec.type === "Sick Leave" ? rec.slAbsWP : rec.vlAbsWP) || 0}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="bg-success/15 text-success border-success/30">Approved</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{rec.dateAction}</td>
                </tr>
              ))}
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
