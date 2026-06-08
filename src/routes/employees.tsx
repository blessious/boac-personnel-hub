import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search, Plus, Eye, ChevronLeft, ChevronRight, X,
  User, Briefcase, History, BookOpen, Calendar,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  EMPLOYEES, STRH_DEPARTMENTS, STRH_POSITIONS, LEAVE_CREDITS,
  WORK_HISTORY, TRAININGS, type Employee, type Department,
} from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employees")({
  component: EmployeesPage,
});

const STATUS_COLOR: Record<string, string> = {
  "Permanent": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Regular": "bg-blue-100 text-blue-700 border-blue-200",
  "Job Order": "bg-amber-100 text-amber-700 border-amber-200",
  "Casual": "bg-purple-100 text-purple-700 border-purple-200",
  "Contractual": "bg-rose-100 text-rose-700 border-rose-200",
};



function EmployeesPage() {
  const location = useLocation();

  if (location.pathname !== "/employees") {
    return <Outlet />;
  }

  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ firstname: "", middlename: "", lastname: "", department: "" as Department | "", position: "", status: "Permanent" as Employee["status"] });

  const filtered = useMemo(() => {
    return EMPLOYEES.filter((e) => {
      const name = `${e.firstname} ${e.lastname} ${e.employeeId}`.toLowerCase();
      if (q && !name.includes(q.toLowerCase())) return false;
      if (dept !== "all" && e.department !== dept) return false;
      if (status !== "all" && e.status !== status) return false;
      return true;
    });
  }, [q, dept, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, totalPages);
  const slice = filtered.slice((cur - 1) * pageSize, cur * pageSize);

  return (
    <AppShell title="Employee Management — 201 Files" subtitle={`${EMPLOYEES.length} total employees`}>
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        {/* Filters */}
        <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-3 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="emp-search"
              placeholder="Search name or Employee ID…"
              className="pl-9"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={dept} onValueChange={(v) => { setDept(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-[200px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {STRH_DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Permanent">Permanent</SelectItem>
              <SelectItem value="Regular">Regular</SelectItem>
              <SelectItem value="Job Order">Job Order</SelectItem>
              <SelectItem value="Casual">Casual</SelectItem>
              <SelectItem value="Contractual">Contractual</SelectItem>
            </SelectContent>
          </Select>
          <div className="lg:ml-auto">
            <Button id="add-employee-btn" onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="h-4 w-4 mr-1.5" /> Add Employee
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="px-4 py-3 font-semibold">Employee ID</th>
                <th className="px-4 py-3 font-semibold">Full Name</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Position</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Department</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold hidden xl:table-cell">Date Hired</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((e, i) => (
                <tr
                  key={e.id}
                  className={cn(
                    "border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors",
                    i % 2 === 1 && "bg-muted/10"
                  )}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.employeeId}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                          {e.firstname[0]}{e.lastname[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{e.lastname}, {e.firstname} {e.middlename?.[0]}.</div>
                        <div className="text-xs text-muted-foreground hidden sm:block">{e.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{e.position}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{e.department}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn("text-[11px]", STATUS_COLOR[e.status] ?? "")}>
                      {e.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground">{e.dateHired}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/employees/$id"
                      params={{ id: e.id }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline px-2 py-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </Link>
                  </td>
                </tr>
              ))}
              {slice.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No employees match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex items-center justify-between border-t border-border text-sm text-muted-foreground">
          <div>Showing {slice.length} of {filtered.length} employees</div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={cur === 1} className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-3 h-8 flex items-center bg-muted/30 rounded-md font-medium">
              {cur} / {totalPages}
            </div>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={cur === totalPages} className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>



      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>First Name *</Label>
                <Input value={addForm.firstname} onChange={(e) => setAddForm({ ...addForm, firstname: e.target.value })} placeholder="First name" />
              </div>
              <div className="space-y-1">
                <Label>Last Name *</Label>
                <Input value={addForm.lastname} onChange={(e) => setAddForm({ ...addForm, lastname: e.target.value })} placeholder="Last name" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Middle Name</Label>
                <Input value={addForm.middlename} onChange={(e) => setAddForm({ ...addForm, middlename: e.target.value })} placeholder="Middle name" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Department *</Label>
                <Select value={addForm.department} onValueChange={(v) => setAddForm({ ...addForm, department: v as Department, position: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>{STRH_DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Position *</Label>
                <Select value={addForm.position} onValueChange={(v) => setAddForm({ ...addForm, position: v })} disabled={!addForm.department}>
                  <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                  <SelectContent>
                    {(addForm.department ? STRH_POSITIONS[addForm.department as Department] : []).map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Employment Status *</Label>
                <Select value={addForm.status} onValueChange={(v) => setAddForm({ ...addForm, status: v as Employee["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Permanent">Permanent</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Job Order">Job Order</SelectItem>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Contractual">Contractual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowAddDialog(false)}>
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
