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
  Copy,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Printer,
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
import { EmploymentTypeBadge } from "@/components/ui/status-badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { useAuth } from "@/lib/auth";
import {
  createEmployee,
  getDashboard,
  deleteEmployee,
  EMPLOYMENT_STATUSES,
  GENDERS,
  getSettingsOptions,
  listEmployees,
  type EmployeeAccountCredentials,
  type EmployeeRecord,
  type SettingsOptions,
  type DashboardResponse,
} from "@/lib/employees-api";
import { cn, formatDisplayDate, formatEmployeeName } from "@/lib/utils";
import { useRealtimeRefresh } from "@/lib/realtime";
import { useIsMobile } from "@/hooks/use-mobile";
import { api } from "@/lib/api";
import { listPlantilla, type PlantillaItem } from "@/lib/plantilla-api";
import type { ReferenceCategory, ReferenceRow } from "@/lib/reference-libraries";
import type { EngagementPayload } from "@/lib/assignments-api";

export const Route = createFileRoute("/employees")({
  validateSearch: (search: Record<string, unknown>) => ({
    department: typeof search.department === "string" ? search.department : undefined,
    onboard: search.onboard === "plantilla" ? "plantilla" : undefined,
    targetPlantillaItemId:
      typeof search.targetPlantillaItemId === "string" ? search.targetPlantillaItemId : undefined,
  }),
  component: EmployeesPage,
});

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

type OnboardingMode = "personal" | "plantilla" | "engagement";
type AddEngagementForm = Pick<
  EngagementPayload,
  "engagementType" | "organizationId" | "designation" | "dateFrom" | "dateTo"
>;
const today = () => new Date().toISOString().slice(0, 10);
const onboardingModeForStatus = (status?: string): OnboardingMode => {
  if (status === "Unassigned") return "personal";
  if (status === "Permanent" || status === "Regular") return "plantilla";
  return "engagement";
};
const EMPTY_APPOINTMENT = {
  controlNumber: "",
  targetPlantillaItemId: "",
  effectiveDate: today(),
  authorityNumber: "",
  authorityDate: "",
  remarks: "",
};
const EMPTY_ENGAGEMENT: AddEngagementForm = {
  engagementType: "JO",
  organizationId: "",
  designation: "",
  dateFrom: today(),
  dateTo: "",
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
  const [appointment, setAppointment] = useState(EMPTY_APPOINTMENT);
  const [engagement, setEngagement] = useState<AddEngagementForm>(EMPTY_ENGAGEMENT);
  const [sameDtrSignatoryAsName, setSameDtrSignatoryAsName] = useState(false);
  const [vacancies, setVacancies] = useState<PlantillaItem[]>([]);
  const [organizationUnits, setOrganizationUnits] = useState<ReferenceRow[]>([]);
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<{
    employeeName: string;
    credentials: EmployeeAccountCredentials;
  } | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const selectedDepartment = search.department?.trim() || "all";
  const onboardingMode = onboardingModeForStatus(form.status);
  const employeeDisplayName = formatEmployeeName(form, "");

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
    if (search.onboard !== "plantilla") return;
    setForm((current) => ({ ...current, status: "Permanent" }));
    setAppointment((current) => ({
      ...current,
      targetPlantillaItemId: search.targetPlantillaItemId || "",
    }));
    setShowAddDialog(true);
    navigate({ search: {}, replace: true });
  }, [navigate, search.onboard, search.targetPlantillaItemId]);

  useEffect(() => {
    if (!sameDtrSignatoryAsName) return;
    setForm((current) => ({ ...current, dtrSignatory: formatEmployeeName(current, "") }));
  }, [form.firstname, form.middlename, form.lastname, sameDtrSignatoryAsName]);

  useEffect(() => {
    getSettingsOptions()
      .then(setOptions)
      .catch(() => setOptions({ departments: [], positions: [], salaryGrades: [] }));
  }, []);

  useEffect(() => {
    Promise.all([
      listPlantilla("", "Active", "vacant"),
      api<{ libraries: Record<ReferenceCategory, ReferenceRow[]> }>("/api/settings/references"),
    ])
      .then(([plantilla, references]) => {
        setVacancies(plantilla.items.filter((item) => !item.occupant && !item.pendingMovement));
        setOrganizationUnits(
          [
            ...references.libraries.sectors,
            ...references.libraries.offices,
            ...references.libraries.divisions,
            ...references.libraries.sections,
          ].filter((row) => row.isActive),
        );
      })
      .catch(() => {
        setVacancies([]);
        setOrganizationUnits([]);
      });
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
  const filteredFilterDepartments = useMemo(() => {
    const query = filterDepartmentQuery.trim().toLowerCase();
    if (!query) return departments;
    return departments.filter((department) => department.toLowerCase().includes(query));
  }, [filterDepartmentQuery, departments]);
  const selectedVacancy = vacancies.find((item) => item.id === appointment.targetPlantillaItemId);

  if (location.pathname !== "/employees") return <Outlet />;

  const submit = async () => {
    if (isCreatingEmployee) return;
    setIsCreatingEmployee(true);
    try {
      const common = {
        ...form,
        department: "",
        position: "",
        itemNo: "",
      };
      const effectiveEngagement = {
        ...engagement,
        engagementType:
          form.status === "Casual" ? "Casual" : (engagement.engagementType as "JO" | "COS"),
      };
      const result =
        onboardingMode === "plantilla"
          ? await createEmployee({
              ...common,
              status: "Permanent",
              empStatus: "Inactive",
              lifecycleState: "Pre-Employment",
              createAccount: true,
              accountActive: false,
              appointment: {
                controlNumber: appointment.controlNumber,
                targetPlantillaItemId: appointment.targetPlantillaItemId,
                effectiveDate: appointment.effectiveDate,
                authorityNumber: appointment.authorityNumber,
                authorityDate: appointment.authorityDate,
                remarks: appointment.remarks,
                supportingDocuments: [],
              },
            })
          : onboardingMode === "engagement"
            ? await createEmployee({
                ...common,
                status: effectiveEngagement.engagementType === "Casual" ? "Casual" : "JO/COS",
                empStatus: "Inactive",
                lifecycleState: "Personal Record",
                createAccount: true,
                accountActive: effectiveEngagement.dateFrom <= today(),
                engagement: effectiveEngagement,
              })
            : await createEmployee({
                ...common,
                status: "Unassigned",
                empStatus: "Inactive",
                lifecycleState: "Personal Record",
                createAccount: false,
              });
      toast.success(
        result.appointmentDraftId
          ? "Personal record and appointment draft created"
          : result.engagementId
            ? "Employee and non-Plantilla engagement created"
            : "Personal record created",
      );
      if (result.account) {
        setCreatedAccount({
          employeeName: formatEmployeeName(result.employee),
          credentials: result.account,
        });
      }
      setShowAddDialog(false);
      setForm(EMPTY_FORM);
      setAppointment({ ...EMPTY_APPOINTMENT, effectiveDate: today() });
      setEngagement({ ...EMPTY_ENGAGEMENT, dateFrom: today() });
      setSameDtrSignatoryAsName(false);
      setPage(1);
      load();
      return result.employee;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to add employee");
    } finally {
      setIsCreatingEmployee(false);
    }
  };

  const remove = async (employee: EmployeeRecord) => {
    if (
      !window.confirm(
        `Delete ${formatEmployeeName(employee)} from Employee Management? The database record will be kept.`,
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

  const accountText = createdAccount
    ? [
        `Employee: ${createdAccount.employeeName}`,
        `Username: ${createdAccount.credentials.username}`,
        `Temporary password: ${createdAccount.credentials.temporaryPassword}`,
        "The employee must change this password on first login.",
      ].join("\n")
    : "";

  const copyCreatedAccount = async () => {
    if (!accountText) return;
    try {
      await navigator.clipboard.writeText(accountText);
      toast.success("Temporary credentials copied");
    } catch {
      toast.error("Unable to copy credentials");
    }
  };

  const printCreatedAccount = () => {
    if (!createdAccount) return;
    const printWindow = window.open("", "_blank", "width=520,height=640");
    if (!printWindow) {
      toast.error("Allow pop-ups to print temporary credentials");
      return;
    }
    const { document } = printWindow;
    document.title = "Temporary Employee Account";
    const style = document.createElement("style");
    style.textContent =
      "body{font-family:Arial,sans-serif;padding:32px;color:#111827}h1{font-size:20px;margin:0 0 18px}dl{display:grid;grid-template-columns:150px 1fr;gap:10px 14px}dt{font-weight:700}dd{margin:0;font-family:Consolas,monospace}.note{margin-top:22px;font-size:13px;color:#374151}";
    document.head.appendChild(style);
    const title = document.createElement("h1");
    title.textContent = "Temporary Employee Account";
    const details = document.createElement("dl");
    for (const [label, value] of [
      ["Employee", createdAccount.employeeName],
      ["Username", createdAccount.credentials.username],
      ["Temporary password", createdAccount.credentials.temporaryPassword],
    ]) {
      const term = document.createElement("dt");
      term.textContent = label;
      const description = document.createElement("dd");
      description.textContent = value;
      details.append(term, description);
    }
    const note = document.createElement("p");
    note.className = "note";
    note.textContent = "The employee must change this password on first login.";
    document.body.append(title, details, note);
    printWindow.focus();
    printWindow.print();
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

  const formatDate = (dateStr: string) => formatDisplayDate(dateStr);

  return (
    <AppShell
      title="Employee Management"
      subtitle="Manage employee records, employment status, and workforce information."
    >
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col space-y-6 pb-8">
        {/* Header */}
        <div className="hidden flex-col sm:flex-row sm:items-center sm:justify-between md:flex">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Employee Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage employee records, employment status, and workforce information.
            </p>
          </div>
          <div className="mobile-action-row mt-4 flex flex-wrap gap-2 sm:mt-0">
            <Button
              disabled={!canEdit}
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Employee
            </Button>
          </div>
        </div>

        <div className="grid gap-2 md:hidden">
          <Button
            disabled={!canEdit}
            onClick={() => setShowAddDialog(true)}
            className="h-11 rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Employee
          </Button>
        </div>

        {/* Top Stat Cards */}
        <div className="hidden grid-cols-1 gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
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
          <div className="grid grid-cols-3 items-center gap-2 border-b border-border/50 p-4 lg:flex lg:flex-row lg:gap-3">
            <div className="relative order-2 col-span-3 w-full lg:order-none lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                placeholder="Search employees..."
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
              <SelectTrigger className="order-1 w-full bg-card text-card-foreground lg:w-[220px]">
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
              <SelectTrigger className="order-1 w-full bg-card text-card-foreground lg:w-[200px]">
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
              <SelectTrigger className="hidden w-full bg-card text-card-foreground lg:flex lg:w-[160px]">
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
              <SelectTrigger className="hidden w-full bg-card text-card-foreground lg:flex lg:w-[150px]">
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

            <div className="order-1 col-span-1 flex w-full items-center gap-2 lg:order-none lg:ml-auto lg:mt-0 lg:w-auto">
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
                    <th className="px-5 py-4 font-semibold">FULL NAME</th>
                    <th className="px-5 py-4 font-semibold">POSITION</th>
                    <th className="px-5 py-4 font-semibold">DEPARTMENT</th>
                    <th className="px-5 py-4 font-semibold">EMPLOYMENT TYPE</th>
                    <th className="px-5 py-4 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-muted-foreground/70 text-sm"
                      >
                        Loading employees...
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
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
                                    alt={formatEmployeeName(employee)}
                                    className="h-full w-full object-cover rounded-full"
                                  />
                                ) : (
                                  initials
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">
                                  {formatEmployeeName(employee)}
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
                            <EmploymentTypeBadge status={employee.status} />
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
                              alt={formatEmployeeName(employee)}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-foreground">
                            {formatEmployeeName(employee)}
                          </div>
                        </div>
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
                          <EmploymentTypeBadge status={employee.status} />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button variant="outline" size="icon" asChild title="View">
                          <Link to="/employees/$id" params={{ id: employee.id }}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="icon" asChild title="Edit">
                          <Link to="/employees/$id" params={{ id: employee.id }}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={!canEdit}
                          onClick={() => remove(employee)}
                          className="text-rose-600 hover:text-rose-600 dark:text-rose-300"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          <TablePagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            itemLabel="employees"
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
            maxPageSize={100}
          />
        </div>
      </div>

      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
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
            <Field label="Employment Status *">
              <Select
                value={form.status ?? "Permanent"}
                onValueChange={(value) => {
                  const nextStatus = value as EmployeeRecord["status"];
                  setForm({ ...form, status: nextStatus });
                  if (nextStatus === "Casual") {
                    setEngagement((current) => ({ ...current, engagementType: "Casual" }));
                  } else if (nextStatus === "JO/COS" && engagement.engagementType === "Casual") {
                    setEngagement((current) => ({ ...current, engagementType: "JO" }));
                  }
                }}
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
            <Field label="Email">
              <Input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
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
            <div className="space-y-2">
              <Field label="DTR Signatory">
                <Input
                  value={form.dtrSignatory ?? ""}
                  onChange={(e) => {
                    setSameDtrSignatoryAsName(false);
                    setForm({ ...form, dtrSignatory: e.target.value });
                  }}
                  placeholder={employeeDisplayName}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={sameDtrSignatoryAsName}
                  onCheckedChange={(checked) => {
                    const enabled = checked === true;
                    setSameDtrSignatoryAsName(enabled);
                    setForm({
                      ...form,
                      dtrSignatory: enabled ? employeeDisplayName : form.dtrSignatory,
                    });
                  }}
                />
                Same as employee name
              </label>
            </div>
            {onboardingMode === "plantilla" && (
              <>
                <Field label="Vacant Plantilla item *">
                  <Select
                    value={appointment.targetPlantillaItemId}
                    onValueChange={(value) =>
                      setAppointment({ ...appointment, targetPlantillaItemId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an authorized vacancy" />
                    </SelectTrigger>
                    <SelectContent>
                      {vacancies.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.itemNumber} — {item.positionTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Appointment effective date *">
                  <Input
                    type="date"
                    value={appointment.effectiveDate}
                    onChange={(event) =>
                      setAppointment({ ...appointment, effectiveDate: event.target.value })
                    }
                  />
                </Field>
                <Field label="Movement control no.">
                  <Input
                    placeholder="Leave blank to auto-generate"
                    value={appointment.controlNumber}
                    onChange={(event) =>
                      setAppointment({
                        ...appointment,
                        controlNumber: event.target.value.toUpperCase(),
                      })
                    }
                  />
                </Field>
                <Field label="Appointment / authority no.">
                  <Input
                    placeholder="Appointment, notice, or authority reference"
                    value={appointment.authorityNumber}
                    onChange={(event) =>
                      setAppointment({ ...appointment, authorityNumber: event.target.value })
                    }
                  />
                </Field>
                <Field label="Authority date">
                  <Input
                    type="date"
                    value={appointment.authorityDate}
                    onChange={(event) =>
                      setAppointment({ ...appointment, authorityDate: event.target.value })
                    }
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Movement remarks">
                    <Textarea
                      value={appointment.remarks}
                      onChange={(event) =>
                        setAppointment({ ...appointment, remarks: event.target.value })
                      }
                      placeholder="Optional notes for the appointment draft"
                    />
                  </Field>
                </div>
                {selectedVacancy && (
                  <div className="md:col-span-2 grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-2">
                    <div>
                      <span className="font-medium">Position:</span> {selectedVacancy.positionTitle}
                    </div>
                    <div>
                      <span className="font-medium">Item:</span> {selectedVacancy.itemNumber}
                    </div>
                    <div>
                      <span className="font-medium">Organization:</span>{" "}
                      {[
                        selectedVacancy.sectorName,
                        selectedVacancy.officeName,
                        selectedVacancy.divisionName,
                        selectedVacancy.sectionName,
                      ]
                        .filter(Boolean)
                        .join(" / ") || "Not specified"}
                    </div>
                    <div>
                      <span className="font-medium">Salary:</span>{" "}
                      {selectedVacancy.salaryGrade
                        ? `SG ${selectedVacancy.salaryGrade.grade}, Step ${selectedVacancy.salaryGrade.step} — PHP ${(selectedVacancy.authorizedSalary ?? selectedVacancy.salaryGrade.amount).toLocaleString()}`
                        : "Not specified"}
                    </div>
                  </div>
                )}
              </>
            )}
            {onboardingMode === "engagement" && (
              <>
                {form.status === "JO/COS" && (
                  <Field label="Engagement type *">
                    <Select
                      value={engagement.engagementType === "COS" ? "COS" : "JO"}
                      onValueChange={(value) =>
                        setEngagement({
                          ...engagement,
                          engagementType: value as "JO" | "COS",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JO">JO</SelectItem>
                        <SelectItem value="COS">COS</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
                <Field label="Official organization *">
                  <Select
                    value={engagement.organizationId}
                    onValueChange={(value) =>
                      setEngagement({ ...engagement, organizationId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sector, office, division, or section" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationUnits.map((row) => (
                        <SelectItem key={row.id} value={String(row.id)}>
                          {row.name} ({row.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Position / designation *">
                  <Select
                    value={engagement.designation}
                    onValueChange={(value) => setEngagement({ ...engagement, designation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.positions.map((position) => (
                        <SelectItem key={position.id} value={position.title}>
                          {position.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Start date *">
                  <Input
                    type="date"
                    value={engagement.dateFrom}
                    onChange={(event) =>
                      setEngagement({ ...engagement, dateFrom: event.target.value })
                    }
                  />
                </Field>
                <Field label="End date *">
                  <Input
                    type="date"
                    value={engagement.dateTo}
                    onChange={(event) =>
                      setEngagement({ ...engagement, dateTo: event.target.value })
                    }
                  />
                </Field>
              </>
            )}
            {onboardingMode === "personal" && (
              <div className="md:col-span-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                This creates a PDS/201 record only. No office, position, Plantilla occupancy,
                employment status, or login account will be assigned.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={
                !canEdit ||
                isCreatingEmployee ||
                !form.firstname?.trim() ||
                !form.lastname?.trim() ||
                (onboardingMode === "plantilla" &&
                  (!appointment.targetPlantillaItemId || !appointment.effectiveDate)) ||
                (onboardingMode === "engagement" &&
                  (!engagement.organizationId ||
                    !engagement.designation.trim() ||
                    !engagement.dateFrom ||
                    !engagement.dateTo))
              }
              onClick={submit}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isCreatingEmployee ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(createdAccount)}
        onOpenChange={(open) => !open && setCreatedAccount(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Temporary Employee Account</DialogTitle>
          </DialogHeader>
          {createdAccount && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Give these credentials to the employee
                </div>
                <div className="mt-3 grid grid-cols-[120px_1fr] gap-2 text-sm">
                  <div className="font-medium">Employee</div>
                  <div>{createdAccount.employeeName}</div>
                  <div className="font-medium">Username</div>
                  <div className="font-mono">{createdAccount.credentials.username}</div>
                  <div className="font-medium">Temp password</div>
                  <div className="font-mono">{createdAccount.credentials.temporaryPassword}</div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-amber-800">
                  The password is shown only now. The employee must change it after first login.
                  {createdAccount.credentials.active === false &&
                    " The account will remain inactive until the approved appointment becomes effective."}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyCreatedAccount}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" onClick={printCreatedAccount}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
            <Button onClick={() => setCreatedAccount(null)}>Done</Button>
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
