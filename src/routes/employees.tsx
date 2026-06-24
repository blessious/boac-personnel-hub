import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  Briefcase,
  UserCheck,
  SlidersHorizontal,
  LayoutGrid,
  List,
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
  GENDERS,
  getSettingsOptions,
  listEmployees,
  type EmployeeRecord,
  type SettingsOptions,
  type DashboardResponse,
} from "@/lib/employees-api";
import { cn } from "@/lib/utils";
import { useRealtimeRefresh } from "@/lib/realtime";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/employees")({
  validateSearch: (search: Record<string, unknown>) => ({
    department: typeof search.department === "string" ? search.department : undefined,
  }),
  component: EmployeesPage,
});

const EMP_TYPE_COLOR: Record<string, string> = {
  Permanent:
    "text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-200 dark:border-emerald-500/30 dark:bg-emerald-500/15",
  Regular:
    "text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-200 dark:border-blue-500/30 dark:bg-blue-500/15",
  Casual:
    "text-purple-700 border-purple-200 bg-purple-50 dark:text-purple-200 dark:border-purple-500/30 dark:bg-purple-500/15",
  "JO/COS":
    "text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-200 dark:border-amber-500/30 dark:bg-amber-500/15",
};

const EMP_STATUS_COLOR: Record<string, string> = {
  Active:
    "text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-200 dark:border-emerald-500/30 dark:bg-emerald-500/15",
  Inactive:
    "text-rose-700 border-rose-200 bg-rose-50 dark:text-rose-200 dark:border-rose-500/30 dark:bg-rose-500/15",
};

const EMPTY_FORM: Partial<EmployeeRecord> = {
  employeeId: "",
  biometricId: "",
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
  const navigate = useNavigate({ from: "/employees" });
  const search = useSearch({ from: "/employees" });
  const { can } = useAuth();
  const isMobile = useIsMobile();
  const canEdit = can("edit");
  const [q, setQ] = useState("");
  const [dept, setDept] = useState(search.department?.trim() || "all");
  const [status, setStatus] = useState("all");
  const [empStatus, setEmpStatus] = useState("all");
  const [gender, setGender] = useState("all");
  const [filterDepartmentQuery, setFilterDepartmentQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<SettingsOptions>({
    departments: [],
    positions: [],
    salaryGrades: [],
  });

  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState<Partial<EmployeeRecord>>(EMPTY_FORM);
  const [departmentQuery, setDepartmentQuery] = useState("");
  const [positionQuery, setPositionQuery] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const selectedDepartment = search.department?.trim() || "all";

  const load = () => {
    setLoading(true);
    setError("");
    listEmployees({ q, department: dept, status, empStatus, gender, page, pageSize })
      .then((result) => {
        setEmployees(result.employees);
        setTotal(result.total);
      })
      .catch((err) => setError(err.message || "Unable to load employees"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [q, dept, status, empStatus, gender, page, pageSize]);
  useRealtimeRefresh(load, ["employees", "settings"]);

  useEffect(() => {
    setDept(selectedDepartment);
    setPage(1);
  }, [selectedDepartment]);

  useEffect(() => {
    getSettingsOptions()
      .then(setOptions)
      .catch(() => setOptions({ departments: [], positions: [], salaryGrades: [] }));
  }, []);

  useEffect(() => {
    getDashboard()
      .then(setDashboardData)
      .catch(() => setDashboardData(null));
  }, []);

  useEffect(() => {
    setViewMode(isMobile ? "grid" : "table");
  }, [isMobile]);

  const departments = useMemo(
    () => options.departments.map((department) => department.name),
    [options.departments],
  );
  const filteredDepartments = useMemo(() => {
    const query = departmentQuery.trim().toLowerCase();
    if (!query) return departments;
    return departments.filter((department) => department.toLowerCase().includes(query));
  }, [departmentQuery, departments]);
  const filteredFilterDepartments = useMemo(() => {
    const query = filterDepartmentQuery.trim().toLowerCase();
    if (!query) return departments;
    return departments.filter((department) => department.toLowerCase().includes(query));
  }, [filterDepartmentQuery, departments]);
  const positions = useMemo(
    () => options.positions.map((position) => position.title),
    [options.positions],
  );
  const filteredPositions = useMemo(() => {
    const query = positionQuery.trim().toLowerCase();
    if (!query) return positions;
    return positions.filter((position) => position.toLowerCase().includes(query));
  }, [positionQuery, positions]);

  if (location.pathname !== "/employees") return <Outlet />;

  const submit = async () => {
    try {
      const result = await createEmployee(form);
      toast.success("Employee added");
      setShowAddDialog(false);
      setForm(EMPTY_FORM);
      setDepartmentQuery("");
      setPositionQuery("");
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
        `Delete ${employee.lastname}, ${employee.firstname} from Employee Management? The database record will be kept.`,
      )
    )
      return;
    try {
      await deleteEmployee(employee.id);
      toast.success("Employee deleted from the list");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete employee");
    }
  };

  // Dashboard calculations
  const totalEmployees = dashboardData?.totalEmployees ?? 0;
  const permanentRegularEmployees = dashboardData?.regularEmployees ?? 0;
  const joCosEmployees = dashboardData?.jobOrderEmployees ?? 0;
  const activeEmployees = (dashboardData?.byEmploymentStatus ?? []).reduce(
    (acc, curr) => acc + curr.active,
    0,
  );

  const permanentRegularPct =
    totalEmployees > 0 ? Math.round((permanentRegularEmployees / totalEmployees) * 100) : 0;
  const joCosPct = totalEmployees > 0 ? Math.round((joCosEmployees / totalEmployees) * 100) : 0;
  const activePct = totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <AppShell title="" subtitle="">
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Employee Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage employee records, employment status, and workforce information.
            </p>
          </div>
          <div className="mobile-action-row mt-4 flex flex-wrap gap-2 sm:mt-0">
            <Button variant="outline" asChild>
              <Link to="/employees/references" search={{ department: undefined }}>
                Employee References
              </Link>
            </Button>
            <Button
              disabled={!canEdit}
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Employee
            </Button>
          </div>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Employees"
            value={dashboardData === null ? "..." : totalEmployees}
            subtext="Current records"
            subtextColor="text-muted-foreground"
            icon={<Users className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-50 dark:bg-blue-500/15"
            chartColor="stroke-blue-500"
            trend="up"
          />
          <StatCard
            title="Permanent / Regular"
            value={dashboardData === null ? "..." : permanentRegularEmployees}
            subtext={`${permanentRegularPct}% of total`}
            subtextColor="text-muted-foreground"
            subtextDot="bg-emerald-500"
            icon={<Briefcase className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-50 dark:bg-emerald-500/15"
            chartColor="stroke-emerald-500"
            trend="up"
          />
          <StatCard
            title="JO / COS Employees"
            value={dashboardData === null ? "..." : joCosEmployees}
            subtext={`${joCosPct}% of total`}
            subtextColor="text-muted-foreground"
            subtextDot="bg-amber-500"
            icon={<UserCheck className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-50 dark:bg-amber-500/15"
            chartColor="stroke-amber-500"
            trend="down"
          />
          <StatCard
            title="Active Employees"
            value={dashboardData === null ? "..." : activeEmployees}
            subtext={`${activePct}% of total`}
            subtextColor="text-muted-foreground"
            subtextDot="bg-blue-500"
            icon={<Activity className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-50 dark:bg-blue-500/15"
            chartColor="stroke-blue-500"
            trend="up"
          />
        </div>

        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm flex flex-col">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-3 p-4 border-b border-border/50 items-center">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                placeholder="Search by name, ID, or email..."
                className="pl-9 bg-card text-card-foreground"
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
                navigate({
                  search: value === "all" ? {} : { department: value },
                  replace: true,
                });
              }}
            >
              <SelectTrigger className="w-full lg:w-[220px] bg-card text-card-foreground">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <div className="sticky top-0 z-10 bg-popover p-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                    <Input
                      value={filterDepartmentQuery}
                      onChange={(event) => setFilterDepartmentQuery(event.target.value)}
                      onKeyDown={(event) => event.stopPropagation()}
                      placeholder="Search departments..."
                      className="h-8 pl-9"
                    />
                  </div>
                </div>
                <SelectItem value="all">All Departments</SelectItem>
                {filteredFilterDepartments.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
                {filteredFilterDepartments.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No departments found.
                  </div>
                )}
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-[200px] bg-card text-card-foreground">
                <SelectValue placeholder="All Employment Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employment Types</SelectItem>
                {EMPLOYMENT_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={empStatus}
              onValueChange={(value) => {
                setEmpStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-[160px] bg-card text-card-foreground">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={gender}
              onValueChange={(value) => {
                setGender(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-[150px] bg-card text-card-foreground">
                <SelectValue placeholder="All Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Gender</SelectItem>
                {GENDERS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto mt-3 lg:mt-0 w-full lg:w-auto">
              <Button
                variant={showAdvancedFilters ? "default" : "outline"}
                className="flex-1 lg:flex-none"
                onClick={() => setShowAdvancedFilters((value) => !value)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "hidden px-3 text-muted-foreground md:inline-flex",
                  viewMode === "grid" && "border-primary text-primary bg-primary/10",
                )}
                onClick={() => setViewMode((value) => (value === "table" ? "grid" : "table"))}
                title={viewMode === "table" ? "Switch to grid view" : "Switch to table view"}
              >
                {viewMode === "table" ? (
                  <LayoutGrid className="w-4 h-4" />
                ) : (
                  <List className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="flex flex-col gap-3 border-b border-border/50 bg-muted/25 p-4 text-xs text-muted-foreground sm:flex-row sm:items-center">
              <span>
                Active filters: department <strong>{dept === "all" ? "Any" : dept}</strong>,
                employment type <strong>{status === "all" ? "Any" : status}</strong>, status{" "}
                <strong>{empStatus === "all" ? "Any" : empStatus}</strong>, gender{" "}
                <strong>{gender === "all" ? "Any" : gender}</strong>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 sm:ml-auto"
                onClick={() => {
                  setQ("");
                  setDept("all");
                  setStatus("all");
                  setEmpStatus("all");
                  setGender("all");
                  setPage(1);
                  navigate({ search: {}, replace: true });
                }}
              >
                Clear filters
              </Button>
            </div>
          )}

          {/* Table */}
          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground uppercase tracking-wider">
                    <th className="px-5 py-4 font-semibold">EMPLOYEE NO</th>
                    <th className="px-5 py-4 font-semibold">FULL NAME</th>
                    <th className="px-5 py-4 font-semibold">POSITION</th>
                    <th className="px-5 py-4 font-semibold">DEPARTMENT</th>
                    <th className="px-5 py-4 font-semibold">EMPLOYMENT TYPE</th>
                    <th className="px-5 py-4 font-semibold">STATUS</th>
                    <th className="px-5 py-4 font-semibold">DATE HIRED</th>
                    <th className="px-5 py-4 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-12 text-center text-muted-foreground/70 text-sm"
                      >
                        Loading employees...
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-12 text-center text-muted-foreground/70 text-sm"
                      >
                        No employee records found.
                      </td>
                    </tr>
                  ) : (
                    employees.map((employee, index) => {
                      const initials =
                        `${employee.firstname?.[0] || ""}${employee.lastname?.[0] || ""}`.toUpperCase() ||
                        "??";
                      const avatarColors = [
                        "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100",
                        "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100",
                        "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-100",
                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
                      ];
                      const avatarColor = avatarColors[index % avatarColors.length];

                      return (
                        <tr
                          key={employee.id}
                          className="cursor-pointer transition-colors hover:bg-blue-50/80 dark:hover:bg-white/[0.06]"
                          title="Double-click to open 201 file"
                          onDoubleClick={() =>
                            navigate({ to: "/employees/$id", params: { id: employee.id } })
                          }
                        >
                          <td className="px-5 py-4 text-muted-foreground font-medium whitespace-nowrap">
                            {employee.itemNo || employee.employeeId || "-"}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold",
                                  avatarColor,
                                )}
                              >
                                {employee.photoUrl ? (
                                  <img
                                    src={employee.photoUrl}
                                    alt={`${employee.firstname} ${employee.lastname}`}
                                    className="h-full w-full object-cover rounded-full"
                                  />
                                ) : (
                                  initials
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">
                                  {employee.lastname}, {employee.firstname} {employee.middlename}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground font-medium">
                            {employee.position || "-"}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {employee.department || "-"}
                          </td>
                          <td className="px-5 py-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase font-semibold",
                                EMP_TYPE_COLOR[employee.status] ??
                                  "text-foreground/80 bg-muted/50 border-border",
                              )}
                            >
                              {employee.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase font-semibold",
                                EMP_STATUS_COLOR[employee.empStatus] ??
                                  "text-foreground/80 bg-muted/50 border-border",
                              )}
                            >
                              {employee.empStatus}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {formatDate(employee.dateHired)}
                          </td>
                          <td
                            className="px-5 py-4 text-right"
                            onDoubleClick={(event) => event.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-2 justify-end">
                              <Link
                                to="/employees/$id"
                                params={{ id: employee.id }}
                                className="inline-grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="inline-grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
                                    title="More actions"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                  <DropdownMenuItem asChild>
                                    <Link to="/employees/$id" params={{ id: employee.id }}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={!canEdit}
                                    onClick={() => remove(employee)}
                                    className="text-rose-600 focus:text-rose-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
              {loading ? (
                <div className="col-span-full py-12 text-center text-sm text-muted-foreground/70">
                  Loading employees...
                </div>
              ) : employees.length === 0 ? (
                <div className="col-span-full py-12 text-center text-sm text-muted-foreground/70">
                  No employee records found.
                </div>
              ) : (
                employees.map((employee, index) => {
                  const initials =
                    `${employee.firstname?.[0] || ""}${employee.lastname?.[0] || ""}`.toUpperCase() ||
                    "??";
                  const avatarColors = [
                    "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100",
                    "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100",
                    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-100",
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
                  ];
                  const avatarColor = avatarColors[index % avatarColors.length];

                  return (
                    <div key={employee.id} className="mobile-record-card text-sm">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-bold",
                            avatarColor,
                          )}
                        >
                          {employee.photoUrl ? (
                            <img
                              src={employee.photoUrl}
                              alt={`${employee.firstname} ${employee.lastname}`}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-foreground">
                            {employee.lastname}, {employee.firstname} {employee.middlename}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {employee.itemNo || employee.employeeId || "-"}
                          </div>
                        </div>
                        <Link
                          to="/employees/$id"
                          params={{ id: employee.id }}
                          className="inline-grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted/50"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                        <div className="flex justify-between gap-3">
                          <span>Position</span>
                          <span className="text-right font-medium text-foreground">
                            {employee.position || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span>Department</span>
                          <span className="text-right font-medium text-foreground">
                            {employee.department || "-"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Type</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] uppercase font-semibold",
                              EMP_TYPE_COLOR[employee.status] ??
                                "text-foreground/80 bg-muted/50 border-border",
                            )}
                          >
                            {employee.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Status</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] uppercase font-semibold",
                              EMP_STATUS_COLOR[employee.empStatus] ??
                                "text-foreground/80 bg-muted/50 border-border",
                            )}
                          >
                            {employee.empStatus}
                          </Badge>
                        </div>
                      </div>
                      <div className="mobile-action-row mt-4 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canEdit}
                          onClick={() => remove(employee)}
                          className="text-rose-600 hover:text-rose-600 dark:text-rose-300"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/50 p-4 text-xs text-muted-foreground gap-4">
            <div>
              Showing {employees.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, total)} of {total} employees
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page === 1}
                  className="h-8 w-8 p-0 text-muted-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Simplified pagination display to match screenshot's style */}
                <div className="flex items-center gap-1 mx-1">
                  <div className="h-8 w-8 rounded-md bg-blue-600 text-white grid place-items-center font-medium">
                    {page}
                  </div>
                  {totalPages > 1 && page < totalPages && (
                    <div
                      className="h-8 w-8 rounded-md border border-border text-muted-foreground grid place-items-center font-medium hover:bg-muted/50 cursor-pointer"
                      onClick={() => setPage(page + 1)}
                    >
                      {page + 1}
                    </div>
                  )}
                  {totalPages > page + 1 && (
                    <div className="h-8 w-8 grid place-items-center text-muted-foreground/70">
                      ...
                    </div>
                  )}
                  {totalPages > page + 1 && (
                    <div
                      className="h-8 w-8 rounded-md border border-border text-muted-foreground grid place-items-center font-medium hover:bg-muted/50 cursor-pointer"
                      onClick={() => setPage(totalPages)}
                    >
                      {totalPages}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={page === totalPages}
                  className="h-8 w-8 p-0 text-muted-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="employee-page-size" className="text-xs font-normal">
                  Show
                </Label>
                <Input
                  id="employee-page-size"
                  type="number"
                  min={1}
                  max={100}
                  value={pageSize}
                  onChange={(event) => {
                    const next = Math.min(100, Math.max(1, Number(event.target.value) || 1));
                    setPageSize(next);
                    setPage(1);
                  }}
                  className="h-8 w-20 bg-card text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open && departmentQuery) {
            setDepartmentQuery("");
          }
          if (!open && positionQuery) {
            setPositionQuery("");
          }
        }}
      >
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
            <Field label="Biometric ID">
              <Input
                value={form.biometricId ?? ""}
                onChange={(e) => setForm({ ...form, biometricId: e.target.value })}
                placeholder="Attendance device user ID"
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
                  <div className="sticky top-0 z-10 bg-popover p-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                      <Input
                        value={departmentQuery}
                        onChange={(event) => setDepartmentQuery(event.target.value)}
                        onKeyDown={(event) => event.stopPropagation()}
                        placeholder="Search departments..."
                        className="h-8 pl-9"
                      />
                    </div>
                  </div>
                  {filteredDepartments.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                  {filteredDepartments.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No departments found.
                    </div>
                  )}
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
                  <div className="sticky top-0 z-10 bg-popover p-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                      <Input
                        value={positionQuery}
                        onChange={(event) => setPositionQuery(event.target.value)}
                        onKeyDown={(event) => event.stopPropagation()}
                        placeholder="Search positions..."
                        className="h-8 pl-9"
                      />
                    </div>
                  </div>
                  {filteredPositions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                  {filteredPositions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No positions found.
                    </div>
                  )}
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
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setPositionQuery("");
              }}
            >
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

function StatCard({
  title,
  value,
  subtext,
  subtextColor,
  subtextDot,
  icon,
  iconBg,
  chartColor,
  trend,
}: {
  title: string;
  value: string | number;
  subtext: string;
  subtextColor?: string;
  subtextDot?: string;
  icon: React.ReactNode;
  iconBg: string;
  chartColor: string;
  trend: "up" | "down";
}) {
  return (
    <div className="bg-card text-card-foreground p-4 rounded-xl border border-border shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs font-semibold text-foreground/80">{title}</p>
          <h2 className="text-2xl font-bold text-foreground mt-1">{value}</h2>
        </div>
        <div className={cn("p-2 rounded-lg", iconBg)}>{icon}</div>
      </div>
      <div className="flex items-center text-[10px] mt-2 z-10 relative">
        {subtextDot && <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", subtextDot)}></span>}
        <span className={subtextColor}>{subtext}</span>
      </div>
      <div className="absolute bottom-2 right-2 w-24 h-8 opacity-50 z-0">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
          {trend === "up" ? (
            <path
              d="M0,25 C20,20 40,30 60,10 C80,-5 100,5 100,5"
              fill="none"
              className={chartColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M0,5 C20,5 40,-5 60,15 C80,30 100,20 100,20"
              fill="none"
              className={chartColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
