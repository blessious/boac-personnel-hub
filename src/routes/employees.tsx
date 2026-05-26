import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Eye, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EMPLOYEES, DEPARTMENTS, POSITIONS, SALARY_GRADES, uid, type EmploymentStatus } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  const location = useLocation();

  if (location.pathname !== "/employees") {
    return <Outlet />;
  }

  const navigate = useNavigate();
  const { can } = useAuth();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    email: "",
    department: "",
    position: "",
    status: "PERMANENT" as EmploymentStatus,
  });

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

  const handleAddEmployee = () => {
    if (!formData.firstname.trim() || !formData.lastname.trim() || !formData.department || !formData.position) {
      alert("Please fill in all required fields");
      return;
    }
    
    const newEmployee = {
      id: uid(),
      refId: `EMP-${Date.now()}`,
      firstname: formData.firstname.trim(),
      middlename: formData.middlename.trim(),
      lastname: formData.lastname.trim(),
      email: formData.email.trim(),
      department: formData.department,
      position: formData.position,
      status: formData.status,
      level: "First Level" as const,
      statusClass: "Administrative" as const,
      dateEmployed: new Date().toISOString().split("T")[0],
      empStatus: "Employed" as const,
      birthday: "",
      gender: "Male" as const,
      civilStatus: "Single" as const,
      citizenship: "Filipino" as const,
    };
    
    EMPLOYEES.push(newEmployee);
    setShowAddDialog(false);
    setFormData({
      firstname: "",
      middlename: "",
      lastname: "",
      email: "",
      department: "",
      position: "",
      status: "PERMANENT",
    });
    setPage(1);
  };

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
              onClick={() => setShowAddDialog(true)}
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
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    <Link
                      to="/employees/$id"
                      params={{ id: e.id }}
                      className="hover:text-primary hover:underline"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      {e.refId}
                    </Link>
                  </td>
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

      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">First Name *</label>
              <Input
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                placeholder="First name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Middle Name</label>
              <Input
                value={formData.middlename}
                onChange={(e) => setFormData({ ...formData, middlename: e.target.value })}
                placeholder="Middle name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name *</label>
              <Input
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                placeholder="Last name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email address"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Department *</label>
              <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Position *</label>
              <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Employment Status *</label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as EmploymentStatus })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERMANENT">Permanent</SelectItem>
                  <SelectItem value="CASUAL">Casual</SelectItem>
                  <SelectItem value="CONTRACTUAL">Contractual</SelectItem>
                  <SelectItem value="COTERMINOUS">Co-terminous</SelectItem>
                  <SelectItem value="ELECTED">Elected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90" onClick={handleAddEmployee}>Add Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
