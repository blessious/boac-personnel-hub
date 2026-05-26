import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Eye, MoreHorizontal, ChevronLeft, ChevronRight, Camera, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { uid, type EmploymentStatus } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Edit, Archive, Trash2 as TrashIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/employees")({
  component: EmployeesPage,
});

const STATUS_DOT: Record<string, string> = {
  PERMANENT: "bg-emerald-500",
  CASUAL: "bg-amber-500",
  CONTRACTUAL: "bg-blue-500",
  COTERMINOUS: "bg-purple-500",
  ELECTED: "bg-rose-500",
  ACTIVE: "bg-emerald-500"
};

function EmployeesPage() {
  const location = useLocation();

  if (location.pathname !== "/employees") {
    return <Outlet />;
  }

  const navigate = useNavigate();
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    email: "",
    departmentId: "1",
    positionId: "1",
    status: "PERMANENT" as EmploymentStatus,
    photoUrl: "",
  });

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee added successfully");
      setShowAddDialog(false);
      setFormData({
        firstname: "", middlename: "", lastname: "", email: "",
        departmentId: "1", positionId: "1", status: "PERMANENT", photoUrl: "",
      });
    },
    onError: () => toast.error("Failed to add employee")
  });

  const filtered = useMemo(() => {
    return employees.filter((e: any) => {
      const fullName = `${e.firstName} ${e.middleName || ""} ${e.lastName}`.toLowerCase();
      if (q && !fullName.includes(q.toLowerCase())) return false;
      if (dept !== "all" && e.departmentName !== dept) return false;
      if (status !== "all" && e.status !== status) return false;
      return true;
    });
  }, [q, dept, status, employees]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, totalPages);
  const slice = filtered.slice((cur - 1) * pageSize, cur * pageSize);

  const handleAddEmployee = () => {
    if (!formData.firstname.trim() || !formData.lastname.trim()) {
      alert("Please fill in all required fields");
      return;
    }
    
    createEmployeeMutation.mutate({
      firstName: formData.firstname.trim(),
      lastName: formData.lastname.trim(),
      middleName: formData.middlename.trim(),
      email: formData.email.trim(),
      departmentId: formData.departmentId,
      positionId: formData.positionId,
      status: formData.status,
    });
  };

  if (loadingEmployees || loadingSettings) {
    return (
      <AppShell title="Employees" subtitle="Loading data...">
        <div className="flex h-full items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const DEPARTMENTS = settings?.departments || [];

  return (
    <AppShell title="Employees" subtitle={`${filtered.length} total personnel records`}>
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-3 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name…"
              className="pl-9"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={dept} onValueChange={(v) => { setDept(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-[260px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
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
              className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-md hover:shadow-blue-500/20 transition-all duration-200"
              disabled={!can("edit")}
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Employee
            </Button>
          </div>
        </div>

          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Full Name</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Department</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Position</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((e: any, i: number) => (
                <tr
                  key={e.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/60 transition-colors border-b border-border/50 last:border-0",
                    i % 2 ? "bg-muted/20" : ""
                  )}
                  onClick={() => navigate({ to: "/employees/$id", params: { id: e.id.toString() } })}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-medium">
                          {(e.firstName[0] ?? "") + (e.lastName[0] ?? "")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{e.lastName}, {e.firstName} {e.middleName?.[0]}</div>
                        <div className="text-xs text-muted-foreground hidden sm:block">{e.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{e.departmentName}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{e.positionTitle}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT[e.status] || "bg-emerald-500")} />
                      <span className="text-[13px] font-medium text-foreground/80">{e.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                      <Link
                        to="/employees/$id"
                        params={{ id: e.id.toString() }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline px-2 py-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent text-muted-foreground outline-none">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toast.info(`Editing ${e.firstName}…`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          {can("delete") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  toast.error("Deletion API not hooked up yet in this mockup");
                                }}
                              >
                                <TrashIcon className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
              {slice.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">No employees match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium">First Name *</Label>
                <Input value={formData.firstname} onChange={(e) => setFormData({ ...formData, firstname: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Last Name *</Label>
                <Input value={formData.lastname} onChange={(e) => setFormData({ ...formData, lastname: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]" onClick={handleAddEmployee} disabled={createEmployeeMutation.isPending}>Add Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
