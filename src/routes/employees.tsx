import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import {
  createEmployee,
  getDashboard,
  deleteEmployee,
  EMPLOYMENT_STATUSES,
  getSettingsOptions,
  listEmployees,
  type EmployeeRecord,
  type SettingsOptions,
} from "@/lib/employees-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employees")({
  component: EmployeesPage,
});

const STATUS_COLOR: Record<string, string> = {
  Permanent:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  Regular:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  "Job Order":
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  Casual:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  Contractual:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
};

const EMPTY_FORM: Partial<EmployeeRecord> = {
  employeeId: "",
  firstname: "",
  middlename: "",
  lastname: "",
  department: "",
  position: "",
  status: "Permanent",
  empStatus: "Active",
  dateHired: "",
  email: "",
  dtrSignatory: "",
  isDtrNoter: false,
};

function EmployeesPage() {
  const location = useLocation();
  const { can } = useAuth();
  const canEdit = can("edit");
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<SettingsOptions>({
    departments: [],
    positions: [],
    salaryGrades: [],
  });
  const [summary, setSummary] = useState({
    regularEmployees: 0,
    jobOrderEmployees: 0,
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState<Partial<EmployeeRecord>>(EMPTY_FORM);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = () => {
    setLoading(true);
    setError("");
    listEmployees({ q, department: dept, status, page, pageSize })
      .then((result) => {
        setEmployees(result.employees);
        setTotal(result.total);
      })
      .catch((err) => setError(err.message || "Unable to load employees"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [q, dept, status, page, pageSize]);

  useEffect(() => {
    getSettingsOptions()
      .then(setOptions)
      .catch(() => setOptions({ departments: [], positions: [], salaryGrades: [] }));
  }, []);

  useEffect(() => {
    getDashboard()
      .then((result) =>
        setSummary({
          regularEmployees: result.regularEmployees,
          jobOrderEmployees: result.jobOrderEmployees,
        }),
      )
      .catch(() =>
        setSummary({
          regularEmployees: 0,
          jobOrderEmployees: 0,
        }),
      );
  }, []);

  const departments = useMemo(
    () => options.departments.map((department) => department.name),
    [options.departments],
  );
  const positions = useMemo(
    () => options.positions.map((position) => position.title),
    [options.positions],
  );

  if (location.pathname !== "/employees") return <Outlet />;

  const submit = async () => {
    try {
      const result = await createEmployee(form);
      toast.success("Employee added");
      setShowAddDialog(false);
      setForm(EMPTY_FORM);
      setPage(1);
      load();
      return result.employee;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to add employee");
    }
  };

  const remove = async (employee: EmployeeRecord) => {
    if (
      !window.confirm(
        `Delete ${employee.lastname}, ${employee.firstname}? This removes the 201 file and related records.`,
      )
    )
      return;
    try {
      await deleteEmployee(employee.id);
      toast.success("Employee deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete employee");
    }
  };

  return (
    <AppShell
      title="Employee Management - 201 Files"
      subtitle={`${total} employee record${total === 1 ? "" : "s"} from MySQL`}
    >
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <SummaryCard label="Total Records" value={total} icon={Users} />
        <SummaryCard
          label="Regular Employees"
          value={summary.regularEmployees}
          icon={Activity}
        />
        <SummaryCard
          label="Job Order / COS"
          value={summary.jobOrderEmployees}
          icon={ClipboardList}
        />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="emp-search"
              placeholder="Search name, ID, or email"
              className="pl-9"
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={dept}
            onValueChange={(value) => {
              setDept(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full lg:w-[240px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full lg:w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {EMPLOYMENT_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={!canEdit}
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 text-white hover:bg-blue-700 lg:ml-auto"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Employee
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Employee ID</th>
                <th className="px-4 py-3 font-semibold">Full Name</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Position</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">Department</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="hidden px-4 py-3 font-semibold xl:table-cell">Date Hired</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No employee records found in MySQL.
                  </td>
                </tr>
              ) : (
                employees.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className={cn(
                      "border-b border-border/50 last:border-0 hover:bg-muted/40",
                      index % 2 === 1 && "bg-muted/10",
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {employee.employeeId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-8 shrink-0 place-items-center overflow-hidden rounded border border-border bg-muted/30">
                          {employee.photoUrl ? (
                            <img
                              src={employee.photoUrl}
                              alt={`${employee.firstname} ${employee.lastname}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {employee.lastname}, {employee.firstname} {employee.middlename}
                          </div>
                          <div className="hidden text-xs text-muted-foreground sm:block">
                            {employee.email || "No email recorded"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      className="hidden max-w-[240px] px-4 py-3 text-muted-foreground md:table-cell"
                      title={employee.position}
                    >
                      <span className="block truncate">{employee.position}</span>
                    </td>
                    <td
                      className="hidden max-w-[260px] px-4 py-3 text-muted-foreground lg:table-cell"
                      title={employee.department}
                    >
                      <span className="block truncate">{employee.department}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn("text-[11px]", STATUS_COLOR[employee.status] ?? "")}
                      >
                        {employee.status}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                      {employee.dateHired || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to="/employees/$id"
                          params={{ id: employee.id }}
                          className="inline-grid h-8 w-8 place-items-center rounded-md text-primary hover:bg-primary/10"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="inline-grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent"
                              title="More actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem asChild>
                              <Link to="/employees/$id" params={{ id: employee.id }}>
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!canEdit}
                              onClick={() => remove(employee)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
          <div>
            Showing {employees.length} of {total} employees
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-8 items-center rounded-md bg-muted/30 px-3 font-medium">
              {page} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-2 md:grid-cols-2">
            <Field label="Employee ID">
              <Input
                value={form.employeeId ?? ""}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                placeholder="Auto-generated if blank"
              />
            </Field>
            <Field label="First Name *">
              <Input
                value={form.firstname ?? ""}
                onChange={(e) => setForm({ ...form, firstname: e.target.value })}
              />
            </Field>
            <Field label="Middle Name">
              <Input
                value={form.middlename ?? ""}
                onChange={(e) => setForm({ ...form, middlename: e.target.value })}
              />
            </Field>
            <Field label="Last Name *">
              <Input
                value={form.lastname ?? ""}
                onChange={(e) => setForm({ ...form, lastname: e.target.value })}
              />
            </Field>
            <Field label="Department *">
              <Select
                value={form.department ?? ""}
                onValueChange={(value) => setForm({ ...form, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Position *">
              <Select
                value={form.position ?? ""}
                onValueChange={(value) => setForm({ ...form, position: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Employment Status">
              <Select
                value={form.status ?? "Permanent"}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as EmployeeRecord["status"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_STATUSES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="DTR Noter">
              <Select
                value={form.isDtrNoter ? "yes" : "no"}
                onValueChange={(value) => setForm({ ...form, isDtrNoter: value === "yes" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="DTR Signatory">
              <Input
                value={form.dtrSignatory ?? ""}
                onChange={(e) => setForm({ ...form, dtrSignatory: e.target.value })}
                placeholder={`${form.firstname ?? ""} ${form.lastname ?? ""}`.trim()}
              />
            </Field>
            <Field label="Date Hired">
              <Input
                type="date"
                value={form.dateHired ?? ""}
                onChange={(e) => setForm({ ...form, dateHired: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canEdit}
              onClick={submit}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
