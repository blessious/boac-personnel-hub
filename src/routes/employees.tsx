import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useEffect, useId, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronsUpDown,
  Copy,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  dataTableBodyClass,
  dataTableCellClass,
  dataTableClass,
  dataTableEmptyCellClass,
  dataTableHeadClass,
  dataTableHeaderCellClass,
  dataTableHeadRowClass,
  dataTableRowClass,
} from "@/lib/data-table-styles";
import { useAuth } from "@/lib/auth";
import {
  createEmployee,
  getDashboard,
  deleteEmployee,
  restoreEmployee,
  EMPLOYMENT_STATUSES,
  GENDERS,
  getSettingsOptions,
  listEmployees,
  type EmployeeAccountCredentials,
  type EmployeeRecord,
  type SettingsOptions,
  type DashboardResponse,
} from "@/lib/employees-api";
import {
  cn,
  copyTextToClipboard,
  formatDisplayDate,
  formatDtrSignatoryName,
  formatEmployeeName,
} from "@/lib/utils";
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

type AddEngagementForm = Omit<
  Pick<
    EngagementPayload,
    "engagementType" | "organizationId" | "designation" | "dateFrom" | "dateTo"
  >,
  "engagementType"
> & {
  engagementType: EngagementPayload["engagementType"] | "";
};
const NON_PLANTILLA_ENGAGEMENT_TYPES: EngagementPayload["engagementType"][] = [
  "JO",
  "COS",
  "Contractual",
  "Casual",
];
const optionCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
type OnboardingMode = "plantilla" | "engagement" | "";
type AddEmployeeStep = "identity" | "assignment";
type AddFormErrorKey =
  | "mode"
  | "firstname"
  | "lastname"
  | "email"
  | "plantillaItem"
  | "appointmentDate"
  | "salaryStep"
  | "engagementType"
  | "organization"
  | "designation"
  | "engagementStart"
  | "engagementEnd";
type AddFormErrors = Partial<Record<AddFormErrorKey, string>>;

const today = () => {
  const value = new Date();
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const employmentStatusForPlantillaType = (plantillaType?: string) => {
  if (plantillaType === "Elective") return "Elective";
  if (plantillaType === "Co-term") return "Co-term";
  if (plantillaType === "Coterminous") return "Coterminous";
  if (plantillaType === "Casual") return "Casual";
  return "Permanent";
};
const emptyAppointment = () => ({
  targetPlantillaItemId: "",
  targetSalaryGradeId: "",
  effectiveDate: today(),
});
const emptyEngagement = (): AddEngagementForm => ({
  engagementType: "",
  organizationId: "",
  designation: "",
  dateFrom: today(),
  dateTo: "",
});

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}

function EmployeesPage() {
  const location = useLocation();
  const navigate = useNavigate({ from: "/employees" });
  const search = useSearch({ from: "/employees" });
  const queryClient = useQueryClient();
  const { can, hasPermission } = useAuth();
  const isMobile = useIsMobile();
  const canEdit = can("edit");
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 250);
  const [dept, setDept] = useState(search.department?.trim() || "all");
  const [status, setStatus] = useState("all");
  const [empStatus, setEmpStatus] = useState("all");
  const [gender, setGender] = useState("all");
  const [archiveScope, setArchiveScope] = useState<"active" | "archived">("active");
  const [filterDepartmentQuery, setFilterDepartmentQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddReviewDialog, setShowAddReviewDialog] = useState(false);
  const [addEmployeeStep, setAddEmployeeStep] = useState<AddEmployeeStep>("identity");
  const [form, setForm] = useState<Partial<EmployeeRecord>>(EMPTY_FORM);
  const [onboardingMode, setOnboardingMode] = useState<OnboardingMode>("");
  const [plantillaOrigin, setPlantillaOrigin] = useState(false);
  const [appointment, setAppointment] = useState(emptyAppointment);
  const [engagement, setEngagement] = useState<AddEngagementForm>(emptyEngagement);
  const [sameDtrSignatoryAsName, setSameDtrSignatoryAsName] = useState(false);
  const [addFormErrors, setAddFormErrors] = useState<AddFormErrors>({});
  const [isAddDialogDirty, setIsAddDialogDirty] = useState(false);
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const [credentialsHandled, setCredentialsHandled] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<{
    employeeName: string;
    credentials: EmployeeAccountCredentials;
  } | null>(null);

  const employeeListQuery = useQuery({
    queryKey: [
      "employees",
      "list",
      { q: debouncedQ, dept, status, empStatus, gender, archiveScope, page, pageSize },
    ],
    queryFn: ({ signal }) =>
      listEmployees(
        {
          q: debouncedQ,
          department: dept,
          status,
          empStatus,
          gender,
          archive: archiveScope,
          page,
          pageSize,
        },
        { signal },
      ),
    placeholderData: keepPreviousData,
  });
  const settingsQuery = useQuery({
    queryKey: ["settings", "employee-options"],
    queryFn: ({ signal }) => getSettingsOptions({ signal }),
    staleTime: 5 * 60_000,
  });
  const plantillaOptionsQuery = useQuery({
    queryKey: ["employees", "onboarding-options", "plantilla"],
    queryFn: ({ signal }) => listPlantilla("", "Active", "vacant", { signal }),
    staleTime: 5 * 60_000,
  });
  const organizationOptionsQuery = useQuery({
    queryKey: ["employees", "onboarding-options", "organizations"],
    queryFn: ({ signal }) =>
      api<{ libraries: Record<ReferenceCategory, ReferenceRow[]> }>("/api/settings/references", {
        signal,
      }),
    staleTime: 5 * 60_000,
  });
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: ({ signal }) => getDashboard({ signal }),
  });

  const employees = employeeListQuery.data?.employees ?? [];
  const total = employeeListQuery.data?.total ?? 0;
  const loading = employeeListQuery.isLoading || employeeListQuery.isFetching;
  const error = employeeListQuery.error instanceof Error ? employeeListQuery.error.message : "";
  const options: SettingsOptions = settingsQuery.data ?? {
    departments: [],
    positions: [],
    salaryGrades: [],
  };
  const vacancies = useMemo(
    () =>
      (plantillaOptionsQuery.data?.items ?? [])
        .filter((item) => !item.occupant && !item.pendingMovement)
        .sort(
          (left, right) =>
            left.positionTitle.localeCompare(right.positionTitle, undefined, {
              sensitivity: "base",
            }) || left.itemNumber.localeCompare(right.itemNumber, undefined, { numeric: true }),
        ),
    [plantillaOptionsQuery.data?.items],
  );
  const organizationUnits = useMemo(() => {
    const libraries = organizationOptionsQuery.data?.libraries;
    if (!libraries) return [];
    return [
      ...libraries.sectors,
      ...libraries.offices,
      ...libraries.divisions,
      ...libraries.sections,
    ]
      .filter((row) => row.isActive)
      .sort(
        (left, right) =>
          optionCollator.compare(left.name, right.name) ||
          optionCollator.compare(left.category, right.category),
      );
  }, [organizationOptionsQuery.data?.libraries]);
  const dashboardData: DashboardResponse | null = dashboardQuery.data ?? null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const selectedDepartment = search.department?.trim() || "all";
  const employeeDtrSignatoryName = formatDtrSignatoryName(form);
  const canCreatePlantillaAppointment =
    canEdit && hasPermission("movements.write") && hasPermission("plantilla.read");
  const canCreateEngagement = canEdit && hasPermission("engagements.manage");

  useEffect(() => {
    setDept(selectedDepartment);
    setPage(1);
  }, [selectedDepartment]);

  useEffect(() => {
    if (search.onboard !== "plantilla") return;
    setForm({ ...EMPTY_FORM, status: "Permanent" });
    setEngagement(emptyEngagement());
    setAppointment({
      ...emptyAppointment(),
      targetPlantillaItemId: search.targetPlantillaItemId || "",
    });
    setOnboardingMode("plantilla");
    setAddEmployeeStep("identity");
    setPlantillaOrigin(true);
    setSameDtrSignatoryAsName(true);
    setAddFormErrors({});
    setIsAddDialogDirty(false);
    setShowAddDialog(true);
    navigate({ search: {}, replace: true });
  }, [navigate, search.onboard, search.targetPlantillaItemId]);

  useEffect(() => {
    if (!sameDtrSignatoryAsName) return;
    setForm((current) => ({
      ...current,
      dtrSignatory: formatDtrSignatoryName(current),
    }));
  }, [form.firstname, form.middlename, form.lastname, sameDtrSignatoryAsName]);

  useEffect(() => {
    setViewMode(isMobile ? "grid" : "table");
  }, [isMobile]);

  const departments = useMemo(
    () =>
      options.departments
        .map((department) => department.name)
        .sort((left, right) => optionCollator.compare(left, right)),
    [options.departments],
  );
  const filteredFilterDepartments = useMemo(() => {
    const query = filterDepartmentQuery.trim().toLowerCase();
    if (!query) return departments;
    return departments.filter((department) => department.toLowerCase().includes(query));
  }, [filterDepartmentQuery, departments]);
  const selectedVacancy = vacancies.find((item) => item.id === appointment.targetPlantillaItemId);
  const employeeSalaryOptions = useMemo(
    () =>
      selectedVacancy?.salaryGrade
        ? options.salaryGrades
            .filter(
              (row) =>
                row.isActive &&
                row.ordinance === selectedVacancy.salaryGrade?.ordinance &&
                row.grade === selectedVacancy.salaryGrade?.grade,
            )
            .sort((left, right) => left.step - right.step || left.amount - right.amount)
        : [],
    [options.salaryGrades, selectedVacancy],
  );
  const hasPlantillaAssignment =
    onboardingMode === "plantilla" && Boolean(appointment.targetPlantillaItemId);
  const derivedPlantillaStatus = employmentStatusForPlantillaType(
    selectedVacancy?.plantillaTypeName,
  );
  const appointmentDateIsWithinItemEffectivity = (item: PlantillaItem, date: string) =>
    Boolean(
      date &&
      (!item.effectiveFrom || date >= item.effectiveFrom) &&
      (!item.effectiveTo || date <= item.effectiveTo),
    );
  const unavailableVacancyIds = useMemo(
    () =>
      new Set(
        vacancies
          .filter(
            (item) =>
              appointment.effectiveDate &&
              !appointmentDateIsWithinItemEffectivity(item, appointment.effectiveDate),
          )
          .map((item) => item.id),
      ),
    [appointment.effectiveDate, vacancies],
  );

  useEffect(() => {
    if (onboardingMode !== "plantilla" || !appointment.targetPlantillaItemId) return;
    setForm((current) =>
      current.status === derivedPlantillaStatus
        ? current
        : { ...current, status: derivedPlantillaStatus },
    );
  }, [appointment.targetPlantillaItemId, derivedPlantillaStatus, onboardingMode]);

  useEffect(() => {
    if (onboardingMode !== "plantilla" || !selectedVacancy) return;
    setAppointment((current) => {
      if (employeeSalaryOptions.some((row) => String(row.id) === current.targetSalaryGradeId))
        return current;
      const stepOne = employeeSalaryOptions.find((row) => row.step === 1);
      return {
        ...current,
        targetSalaryGradeId: stepOne ? String(stepOne.id) : "",
      };
    });
  }, [employeeSalaryOptions, onboardingMode, selectedVacancy]);

  if (location.pathname !== "/employees") return <Outlet />;

  const resetAddDialog = () => {
    setShowAddReviewDialog(false);
    setForm(EMPTY_FORM);
    setAddEmployeeStep("identity");
    setOnboardingMode("");
    setPlantillaOrigin(false);
    setAppointment(emptyAppointment());
    setEngagement(emptyEngagement());
    setSameDtrSignatoryAsName(true);
    setAddFormErrors({});
    setIsAddDialogDirty(false);
  };

  const openDirectAddDialog = () => {
    resetAddDialog();
    setShowAddDialog(true);
  };

  const requestCloseAddDialog = () => {
    if (isCreatingEmployee) return;
    if (
      isAddDialogDirty &&
      !window.confirm("Discard the unfinished employee onboarding information?")
    )
      return;
    setShowAddDialog(false);
    resetAddDialog();
  };

  const selectOnboardingMode = (mode: Exclude<OnboardingMode, "">) => {
    if (plantillaOrigin || onboardingMode === mode) return;
    setOnboardingMode(mode);
    setAddFormErrors({});
    setIsAddDialogDirty(true);
    if (mode === "plantilla") {
      setEngagement(emptyEngagement());
      return;
    }
    setAppointment(emptyAppointment());
    setForm((current) => ({ ...current, status: "JO" }));
  };

  const validateAddForm = () => {
    const errors: AddFormErrors = {};
    if (!onboardingMode)
      errors.mode = "Choose a Plantilla appointment or non-Plantilla engagement.";
    if (!form.lastname?.trim()) errors.lastname = "Last name is required.";
    if (!form.firstname?.trim()) errors.firstname = "First name is required.";
    const email = form.email?.trim() || "";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Enter a valid email address.";

    if (onboardingMode === "plantilla") {
      if (!appointment.targetPlantillaItemId)
        errors.plantillaItem = "Select a vacant Plantilla item.";
      else if (!selectedVacancy)
        errors.plantillaItem = "The selected Plantilla item is no longer available.";
      if (!appointment.effectiveDate)
        errors.appointmentDate = "Appointment start date is required.";
      else if (
        selectedVacancy &&
        !appointmentDateIsWithinItemEffectivity(selectedVacancy, appointment.effectiveDate)
      )
        errors.appointmentDate =
          "The appointment date must fall within the Plantilla item's effectivity.";
      if (!appointment.targetSalaryGradeId)
        errors.salaryStep = "Select the employee's starting salary step.";
    }

    if (onboardingMode === "engagement") {
      if (!engagement.engagementType) errors.engagementType = "Select an engagement type.";
      if (!engagement.organizationId) errors.organization = "Select an official organization.";
      if (!engagement.designation.trim()) errors.designation = "Select a position or designation.";
      if (!engagement.dateFrom) errors.engagementStart = "Start date is required.";
      if (!engagement.dateTo) errors.engagementEnd = "End date is required.";
      else if (engagement.dateFrom && engagement.dateTo < engagement.dateFrom)
        errors.engagementEnd = "End date cannot be before the start date.";
    }
    return errors;
  };

  const validateIdentityStep = () => {
    const errors: AddFormErrors = {};
    if (!form.lastname?.trim()) errors.lastname = "Last name is required.";
    if (!form.firstname?.trim()) errors.firstname = "First name is required.";
    const email = form.email?.trim() || "";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Enter a valid email address.";
    return errors;
  };

  const focusFirstAddError = (errors: AddFormErrors) => {
    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return;
    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-add-field="${firstKey}"]`)
        ?.focus({ preventScroll: false });
    });
  };

  const continueToAssignment = () => {
    setAddFormErrors({});
    setAddEmployeeStep("assignment");
  };

  const openAddReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreatingEmployee) return;
    if (addEmployeeStep === "identity") {
      continueToAssignment();
      return;
    }
    const errors = validateAddForm();
    setAddFormErrors(errors);
    if (Object.keys(errors).length) {
      const identityErrors = validateIdentityStep();
      if (Object.keys(identityErrors).length) setAddEmployeeStep("identity");
      else setAddEmployeeStep("assignment");
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => focusFirstAddError(errors)),
      );
      return;
    }
    setShowAddDialog(false);
    setShowAddReviewDialog(true);
  };

  const returnToAddForm = () => {
    if (isCreatingEmployee) return;
    setShowAddReviewDialog(false);
    setShowAddDialog(true);
  };

  const submit = async () => {
    if (isCreatingEmployee) return;
    const errors = validateAddForm();
    setAddFormErrors(errors);
    if (Object.keys(errors).length) {
      setShowAddReviewDialog(false);
      setShowAddDialog(true);
      focusFirstAddError(errors);
      return;
    }
    setIsCreatingEmployee(true);
    try {
      const common = {
        ...form,
        department: "",
        position: "",
        itemNo: "",
      };
      const nonPlantillaEngagement = {
        ...engagement,
        engagementType: engagement.engagementType || "JO",
        contractNumber: "",
      };
      const result =
        onboardingMode === "plantilla"
          ? await createEmployee({
              ...common,
              status: derivedPlantillaStatus,
              empStatus: "Inactive",
              lifecycleState: "Pre-Employment",
              createAccount: true,
              appointment: {
                targetPlantillaItemId: appointment.targetPlantillaItemId,
                targetSalaryGradeId: appointment.targetSalaryGradeId,
                effectiveDate: appointment.effectiveDate,
                supportingDocuments: [],
              },
            })
          : await createEmployee({
              ...common,
              status: nonPlantillaEngagement.engagementType,
              empStatus: "Inactive",
              lifecycleState: "Personal Record",
              createAccount: true,
              engagement: nonPlantillaEngagement,
            });
      toast.success(
        result.appointmentDraftId
          ? "Personal record and appointment draft created"
          : result.engagementId
            ? "Employee and non-Plantilla engagement created"
            : "Personal record created",
      );
      if (result.account) {
        setCredentialsHandled(false);
        setCreatedAccount({
          employeeName: formatEmployeeName(result.employee),
          credentials: result.account,
        });
      }
      setShowAddReviewDialog(false);
      setShowAddDialog(false);
      resetAddDialog();
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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
        `Archive ${formatEmployeeName(employee)}? The database record will be kept and can be restored.`,
      )
    )
      return;
    try {
      await deleteEmployee(employee.id);
      toast.success("Employee archived");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to archive employee");
    }
  };

  const restore = async (employee: EmployeeRecord) => {
    try {
      await restoreEmployee(employee.id);
      toast.success("Employee restored");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to restore employee");
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
      await copyTextToClipboard(accountText);
      setCredentialsHandled(true);
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
    setCredentialsHandled(true);
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
              onClick={openDirectAddDialog}
              className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Employee
            </Button>
          </div>
        </div>

        <div className="grid gap-2 md:hidden">
          <Button
            disabled={!canEdit}
            onClick={openDirectAddDialog}
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

            <Select
              value={archiveScope}
              onValueChange={(value) => {
                setArchiveScope(value as "active" | "archived");
                setPage(1);
              }}
            >
              <SelectTrigger className="hidden w-full bg-card text-card-foreground lg:flex lg:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active list</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
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
                <strong>{gender === "all" ? "Any" : gender}</strong>, archive{" "}
                <strong>{archiveScope === "archived" ? "Archived" : "Active list"}</strong>
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
                  setArchiveScope("active");
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
              <table className={dataTableClass}>
                <thead className={dataTableHeadClass}>
                  <tr className={dataTableHeadRowClass}>
                    <th className={dataTableHeaderCellClass}>Full name</th>
                    <th className={dataTableHeaderCellClass}>Position</th>
                    <th className={dataTableHeaderCellClass}>Department</th>
                    <th className={dataTableHeaderCellClass}>Employment type</th>
                    <th className={cn(dataTableHeaderCellClass, "text-right")}>Actions</th>
                  </tr>
                </thead>
                <tbody className={dataTableBodyClass}>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className={dataTableEmptyCellClass}>
                        Loading employees...
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={dataTableEmptyCellClass}>
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
                          className={cn(dataTableRowClass, "cursor-pointer")}
                          title="Double-click to open 201 file"
                          onDoubleClick={() =>
                            navigate({ to: "/employees/$id", params: { id: employee.id } })
                          }
                        >
                          <td className={dataTableCellClass}>
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-bold",
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
                          <td
                            className={cn(dataTableCellClass, "font-medium text-muted-foreground")}
                          >
                            {employee.position || "-"}
                          </td>
                          <td className={cn(dataTableCellClass, "text-muted-foreground")}>
                            {employee.department || "-"}
                          </td>
                          <td className={dataTableCellClass}>
                            <EmploymentTypeBadge status={employee.status} />
                          </td>
                          <td
                            className={cn(dataTableCellClass, "text-right")}
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
                                    onClick={() =>
                                      employee.isHidden ? restore(employee) : remove(employee)
                                    }
                                    className={cn(
                                      employee.isHidden
                                        ? "text-emerald-600 focus:text-emerald-600"
                                        : "text-rose-600 focus:text-rose-600",
                                    )}
                                  >
                                    {employee.isHidden ? (
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    {employee.isHidden ? "Restore" : "Archive"}
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
                            "grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-bold",
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
                          onClick={() => (employee.isHidden ? restore(employee) : remove(employee))}
                          className={cn(
                            employee.isHidden
                              ? "text-emerald-600 hover:text-emerald-600 dark:text-emerald-300"
                              : "text-rose-600 hover:text-rose-600 dark:text-rose-300",
                          )}
                          title={employee.isHidden ? "Restore" : "Archive"}
                        >
                          {employee.isHidden ? (
                            <RotateCcw className="h-4 w-4" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
          if (!open) requestCloseAddDialog();
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-4xl">
          <form className="contents" onSubmit={openAddReview} noValidate>
            <DialogHeader className="border-b px-4 py-3 pr-12 sm:px-6">
              <DialogTitle>
                {plantillaOrigin ? "Onboard Employee to Plantilla Item" : "Add Employee"}
              </DialogTitle>
              <DialogDescription>
                {addEmployeeStep === "identity"
                  ? "Start with the employee's identity and contact information."
                  : plantillaOrigin
                    ? "Complete the appointment details for the selected vacancy."
                    : "Choose one employment path and complete its assignment details."}
              </DialogDescription>
            </DialogHeader>
            <div className="px-4 py-4 sm:px-6">
              {addEmployeeStep === "identity" && (
                <section className="animate-in fade-in slide-in-from-left-2 duration-300">
                  <StepHeading
                    number={1}
                    title="Employee identity and contact"
                    description="Enter the information used to create the personal record."
                    showNextStep
                  />
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field htmlFor="add-employee-id" label="Employee ID">
                      <Input
                        id="add-employee-id"
                        value={form.employeeId ?? ""}
                        onChange={(event) => {
                          setForm({ ...form, employeeId: event.target.value });
                          setIsAddDialogDirty(true);
                        }}
                        placeholder="Auto-generated if blank"
                      />
                    </Field>
                    <Field htmlFor="add-biometric-id" label="Biometric ID">
                      <Input
                        id="add-biometric-id"
                        value={form.biometricId ?? ""}
                        onChange={(event) => {
                          setForm({ ...form, biometricId: event.target.value });
                          setIsAddDialogDirty(true);
                        }}
                        placeholder="Attendance device user ID"
                      />
                    </Field>
                    <Field
                      htmlFor="add-lastname"
                      label="Last Name"
                      required
                      error={addFormErrors.lastname}
                    >
                      <Input
                        id="add-lastname"
                        data-add-field="lastname"
                        aria-invalid={Boolean(addFormErrors.lastname)}
                        value={form.lastname ?? ""}
                        onChange={(event) => {
                          setForm({ ...form, lastname: event.target.value });
                          setIsAddDialogDirty(true);
                          setAddFormErrors((current) => ({ ...current, lastname: undefined }));
                        }}
                      />
                    </Field>
                    <Field
                      htmlFor="add-firstname"
                      label="First Name"
                      required
                      error={addFormErrors.firstname}
                    >
                      <Input
                        id="add-firstname"
                        data-add-field="firstname"
                        aria-invalid={Boolean(addFormErrors.firstname)}
                        value={form.firstname ?? ""}
                        onChange={(event) => {
                          setForm({ ...form, firstname: event.target.value });
                          setIsAddDialogDirty(true);
                          setAddFormErrors((current) => ({ ...current, firstname: undefined }));
                        }}
                      />
                    </Field>
                    <Field htmlFor="add-middlename" label="Middle Name">
                      <Input
                        id="add-middlename"
                        value={form.middlename ?? ""}
                        onChange={(event) => {
                          setForm({ ...form, middlename: event.target.value });
                          setIsAddDialogDirty(true);
                        }}
                      />
                    </Field>
                    <Field htmlFor="add-email" label="Email" error={addFormErrors.email}>
                      <Input
                        id="add-email"
                        data-add-field="email"
                        type="email"
                        aria-invalid={Boolean(addFormErrors.email)}
                        value={form.email ?? ""}
                        onChange={(event) => {
                          setForm({ ...form, email: event.target.value });
                          setIsAddDialogDirty(true);
                          setAddFormErrors((current) => ({ ...current, email: undefined }));
                        }}
                      />
                    </Field>
                    <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2 lg:col-span-3">
                      <Field htmlFor="add-dtr-noter" label="DTR Noter">
                        <Select
                          value={form.isDtrNoter ? "yes" : "no"}
                          onValueChange={(value) => {
                            setForm({ ...form, isDtrNoter: value === "yes" });
                            setIsAddDialogDirty(true);
                          }}
                        >
                          <SelectTrigger id="add-dtr-noter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <div className="space-y-2">
                        <Field htmlFor="add-dtr-signatory" label="DTR Signatory">
                          <Input
                            id="add-dtr-signatory"
                            value={form.dtrSignatory ?? ""}
                            onChange={(e) => {
                              setSameDtrSignatoryAsName(false);
                              setForm({ ...form, dtrSignatory: e.target.value.toUpperCase() });
                              setIsAddDialogDirty(true);
                            }}
                            placeholder={
                              employeeDtrSignatoryName || "NAME SHOWN ON THE DTR SIGNATURE LINE"
                            }
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
                                dtrSignatory: enabled
                                  ? employeeDtrSignatoryName
                                  : form.dtrSignatory,
                              });
                              setIsAddDialogDirty(true);
                            }}
                          />
                          Same as employee name
                        </label>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {addEmployeeStep === "assignment" && (
                <section
                  key={onboardingMode || "unselected"}
                  className="animate-in fade-in slide-in-from-right-2 duration-300"
                >
                  <StepHeading
                    number={2}
                    title={
                      onboardingMode === "plantilla" ? "Plantilla appointment" : "Employment path"
                    }
                    description={
                      plantillaOrigin
                        ? "The selected vacancy will be reserved through an appointment draft."
                        : "Choose exactly one onboarding path before entering assignment details."
                    }
                  />
                  {!plantillaOrigin && (
                    <div
                      className="mt-3 grid gap-3 sm:grid-cols-2"
                      data-add-field="mode"
                      tabIndex={-1}
                    >
                      <button
                        type="button"
                        disabled={!canCreatePlantillaAppointment}
                        onClick={() => selectOnboardingMode("plantilla")}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                          onboardingMode === "plantilla"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                            : "hover:border-blue-300",
                        )}
                      >
                        <div className="font-semibold">Plantilla appointment</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Create a personal record, inactive account, and appointment draft.
                        </div>
                      </button>
                      <button
                        type="button"
                        disabled={!canCreateEngagement}
                        onClick={() => selectOnboardingMode("engagement")}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                          onboardingMode === "engagement"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                            : "hover:border-blue-300",
                        )}
                      >
                        <div className="font-semibold">Non-Plantilla engagement</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Create a personal record, account, and dated engagement.
                        </div>
                      </button>
                    </div>
                  )}
                  {addFormErrors.mode && (
                    <p className="mt-2 text-sm text-destructive">{addFormErrors.mode}</p>
                  )}
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {onboardingMode === "plantilla" && plantillaOptionsQuery.isError && (
                      <div className="md:col-span-2">
                        <OptionLoadError
                          message={
                            plantillaOptionsQuery.error instanceof Error
                              ? plantillaOptionsQuery.error.message
                              : "Unable to load Plantilla vacancies."
                          }
                          retry={() => plantillaOptionsQuery.refetch()}
                        />
                      </div>
                    )}
                    {onboardingMode === "plantilla" && (
                      <SearchableSelectField
                        label={
                          appointment.targetPlantillaItemId
                            ? "Change vacancy"
                            : "Vacant Plantilla item"
                        }
                        required
                        fieldKey="plantillaItem"
                        error={addFormErrors.plantillaItem}
                        disabled={plantillaOptionsQuery.isLoading || plantillaOptionsQuery.isError}
                        placeholder={
                          plantillaOptionsQuery.isLoading
                            ? "Loading vacancies..."
                            : "Select an authorized vacancy"
                        }
                        value={appointment.targetPlantillaItemId}
                        set={(value) => {
                          setAppointment({
                            ...appointment,
                            targetPlantillaItemId: value,
                            targetSalaryGradeId: "",
                          });
                          setEngagement(emptyEngagement());
                          setIsAddDialogDirty(true);
                          setAddFormErrors((current) => ({ ...current, plantillaItem: undefined }));
                        }}
                        disabledValues={unavailableVacancyIds}
                        rows={vacancies.map((item) => [
                          item.id,
                          item.positionTitle,
                          `Item ${item.itemNumber}`,
                          [
                            item.plantillaTypeName,
                            item.officeName,
                            item.divisionName,
                            item.sectionName,
                          ]
                            .filter(Boolean)
                            .join(" / "),
                          item.effectiveFrom || item.effectiveTo
                            ? `Effective ${item.effectiveFrom || "open"} to ${item.effectiveTo || "open"}`
                            : "",
                        ])}
                      />
                    )}
                    {hasPlantillaAssignment && (
                      <>
                        <Field
                          htmlFor="add-appointment-date"
                          label="Appointment start date"
                          required
                          error={addFormErrors.appointmentDate}
                        >
                          <Input
                            id="add-appointment-date"
                            data-add-field="appointmentDate"
                            type="date"
                            aria-invalid={Boolean(addFormErrors.appointmentDate)}
                            value={appointment.effectiveDate}
                            onChange={(event) => {
                              setAppointment({ ...appointment, effectiveDate: event.target.value });
                              setIsAddDialogDirty(true);
                              setAddFormErrors((current) => ({
                                ...current,
                                appointmentDate: undefined,
                              }));
                            }}
                          />
                        </Field>
                        <SearchableSelectField
                          label="Salary Step"
                          required
                          fieldKey="salaryStep"
                          error={addFormErrors.salaryStep}
                          placeholder="Select starting step"
                          value={appointment.targetSalaryGradeId}
                          set={(value) => {
                            setAppointment({ ...appointment, targetSalaryGradeId: value });
                            setIsAddDialogDirty(true);
                            setAddFormErrors((current) => ({
                              ...current,
                              salaryStep: undefined,
                            }));
                          }}
                          rows={employeeSalaryOptions.map((row) => [
                            String(row.id),
                            `Step ${row.step} — PHP ${row.amount.toLocaleString()} monthly`,
                          ])}
                        />
                        <Field label="Employment status">
                          <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm font-medium">
                            {derivedPlantillaStatus}
                          </div>
                        </Field>
                      </>
                    )}
                    {onboardingMode === "engagement" && (
                      <>
                        {organizationOptionsQuery.isError && (
                          <OptionLoadError
                            message={
                              organizationOptionsQuery.error instanceof Error
                                ? organizationOptionsQuery.error.message
                                : "Unable to load organization references."
                            }
                            retry={() => organizationOptionsQuery.refetch()}
                          />
                        )}
                        {settingsQuery.isError && (
                          <OptionLoadError
                            message={
                              settingsQuery.error instanceof Error
                                ? settingsQuery.error.message
                                : "Unable to load positions."
                            }
                            retry={() => settingsQuery.refetch()}
                          />
                        )}
                        <Field
                          htmlFor="add-engagement-type"
                          label="Engagement type"
                          required
                          error={addFormErrors.engagementType}
                        >
                          <Select
                            value={engagement.engagementType}
                            onValueChange={(value) => {
                              const engagementType = value as AddEngagementForm["engagementType"];
                              setEngagement({ ...engagement, engagementType });
                              setForm({ ...form, status: engagementType });
                              setIsAddDialogDirty(true);
                              setAddFormErrors((current) => ({
                                ...current,
                                engagementType: undefined,
                              }));
                            }}
                          >
                            <SelectTrigger
                              id="add-engagement-type"
                              data-add-field="engagementType"
                              aria-invalid={Boolean(addFormErrors.engagementType)}
                            >
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {[...NON_PLANTILLA_ENGAGEMENT_TYPES]
                                .sort((left, right) => optionCollator.compare(left, right))
                                .map((item) => (
                                  <SelectItem key={item} value={item}>
                                    {item}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <SearchableSelectField
                          label="Official organization"
                          required
                          fieldKey="organization"
                          error={addFormErrors.organization}
                          disabled={
                            organizationOptionsQuery.isLoading || organizationOptionsQuery.isError
                          }
                          placeholder={
                            organizationOptionsQuery.isLoading
                              ? "Loading organizations..."
                              : "Select sector, office, division, or section"
                          }
                          value={engagement.organizationId}
                          set={(value) => {
                            setEngagement({ ...engagement, organizationId: value });
                            setIsAddDialogDirty(true);
                            setAddFormErrors((current) => ({
                              ...current,
                              organization: undefined,
                            }));
                          }}
                          rows={organizationUnits.map((row) => [
                            String(row.id),
                            `${row.name} (${row.category})`,
                            row.code,
                            row.parentName,
                          ])}
                        />
                        <SearchableSelectField
                          label="Position / designation"
                          required
                          fieldKey="designation"
                          error={addFormErrors.designation}
                          disabled={settingsQuery.isLoading || settingsQuery.isError}
                          placeholder={
                            settingsQuery.isLoading ? "Loading positions..." : "Select a position"
                          }
                          value={engagement.designation}
                          set={(value) => {
                            setEngagement({ ...engagement, designation: value });
                            setIsAddDialogDirty(true);
                            setAddFormErrors((current) => ({ ...current, designation: undefined }));
                          }}
                          rows={[...options.positions]
                            .sort((left, right) => optionCollator.compare(left.title, right.title))
                            .map((position) => [position.title, position.title])}
                        />
                        <Field
                          label="Date Range"
                          required
                          error={addFormErrors.engagementStart || addFormErrors.engagementEnd}
                        >
                          <DateRangePicker
                            from={engagement.dateFrom}
                            to={engagement.dateTo}
                            onApply={(dateFrom, dateTo) => {
                              setEngagement({ ...engagement, dateFrom, dateTo });
                              setIsAddDialogDirty(true);
                              setAddFormErrors((current) => ({
                                ...current,
                                engagementStart: undefined,
                                engagementEnd: undefined,
                              }));
                            }}
                          />
                        </Field>
                      </>
                    )}
                  </div>
                </section>
              )}
            </div>
            <DialogFooter className="border-t bg-background px-4 py-3 sm:px-6">
              {addEmployeeStep === "identity" ? (
                <>
                  <Button type="button" variant="outline" onClick={requestCloseAddDialog}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      continueToAssignment();
                    }}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Continue to Employment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddEmployeeStep("identity")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isCreatingEmployee ||
                      (onboardingMode === "plantilla" && !canCreatePlantillaAppointment) ||
                      (onboardingMode === "engagement" && !canCreateEngagement)
                    }
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Review Employee Details
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showAddReviewDialog}
        onOpenChange={(open) => {
          if (!open) returnToAddForm();
        }}
      >
        <DialogContent className="grid max-h-[calc(100dvh-1.5rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b px-5 py-4 pr-12">
            <DialogTitle>Review Employee Details</DialogTitle>
            <DialogDescription>
              Confirm the information below before creating the employee records.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 space-y-3 overflow-y-auto px-5 py-4">
            <ReviewSection title="Employee information">
              <ReviewDetail
                label="Full name"
                value={
                  [form.firstname, form.middlename, form.lastname]
                    .map((value) => value?.trim())
                    .filter(Boolean)
                    .join(" ") || "—"
                }
                wide
              />
              <ReviewDetail
                label="Employee ID"
                value={form.employeeId?.trim() || "Auto-generated"}
              />
              <ReviewDetail
                label="Biometric ID"
                value={form.biometricId?.trim() || "Not provided"}
              />
              <ReviewDetail label="Email" value={form.email?.trim() || "Not provided"} />
              <ReviewDetail label="DTR Noter" value={form.isDtrNoter ? "Yes" : "No"} />
              <ReviewDetail
                label="DTR Signatory"
                value={form.dtrSignatory?.trim() || "Not provided"}
                wide
              />
            </ReviewSection>

            <ReviewSection
              title={
                onboardingMode === "plantilla"
                  ? "Plantilla appointment"
                  : "Non-Plantilla engagement"
              }
            >
              {onboardingMode === "plantilla" ? (
                <>
                  <ReviewDetail
                    label="Plantilla item"
                    value={
                      selectedVacancy
                        ? `${selectedVacancy.positionTitle} — Item ${selectedVacancy.itemNumber}`
                        : "—"
                    }
                    wide
                  />
                  <ReviewDetail
                    label="Organization"
                    value={
                      selectedVacancy
                        ? [
                            selectedVacancy.officeName,
                            selectedVacancy.divisionName,
                            selectedVacancy.sectionName,
                          ]
                            .filter(Boolean)
                            .join(" / ") || "Not specified"
                        : "—"
                    }
                    wide
                  />
                  <ReviewDetail
                    label="Classification"
                    value={selectedVacancy?.plantillaTypeName || "Not specified"}
                  />
                  <ReviewDetail label="Employment status" value={derivedPlantillaStatus} />
                  <ReviewDetail label="Appointment date" value={appointment.effectiveDate || "—"} />
                  <ReviewDetail
                    label="Salary step"
                    value={(() => {
                      const salary = employeeSalaryOptions.find(
                        (row) => String(row.id) === appointment.targetSalaryGradeId,
                      );
                      return salary
                        ? `Step ${salary.step} — PHP ${salary.amount.toLocaleString()} monthly`
                        : "—";
                    })()}
                  />
                  <ReviewDetail
                    label="Employee account"
                    value="Inactive until the appointment is posted and effective"
                    wide
                  />
                </>
              ) : (
                <>
                  <ReviewDetail label="Engagement type" value={engagement.engagementType || "—"} />
                  <ReviewDetail label="Position" value={engagement.designation || "—"} />
                  <ReviewDetail
                    label="Organization"
                    value={
                      organizationUnits.find((row) => String(row.id) === engagement.organizationId)
                        ?.name || "—"
                    }
                    wide
                  />
                  <ReviewDetail label="Start date" value={engagement.dateFrom || "—"} />
                  <ReviewDetail label="End date" value={engagement.dateTo || "—"} />
                  <ReviewDetail
                    label="Employee account"
                    value="Activation follows the engagement dates"
                    wide
                  />
                </>
              )}
            </ReviewSection>
          </div>
          <DialogFooter className="border-t bg-background px-5 py-3">
            <Button
              type="button"
              variant="outline"
              disabled={isCreatingEmployee}
              onClick={returnToAddForm}
            >
              Back to Edit
            </Button>
            <Button
              type="button"
              disabled={isCreatingEmployee}
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={submit}
            >
              {isCreatingEmployee ? "Creating..." : "Confirm & Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(createdAccount)}
        onOpenChange={(open) => {
          if (open) return;
          if (!credentialsHandled) {
            toast.error("Copy, print, or acknowledge the temporary credentials before closing");
            return;
          }
          setCreatedAccount(null);
        }}
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
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={credentialsHandled}
                  onCheckedChange={(checked) => setCredentialsHandled(checked === true)}
                />
                I have copied, printed, or securely recorded these temporary credentials.
              </label>
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
            <Button
              disabled={!credentialsHandled}
              onClick={() => {
                setCreatedAccount(null);
                setCredentialsHandled(false);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Field({
  label,
  htmlFor,
  required = false,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <>
            <span aria-hidden="true"> *</span>
            <span className="sr-only"> required</span>
          </>
        )}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SearchableSelectField({
  label,
  value,
  set,
  rows,
  placeholder = "Select...",
  fieldKey,
  required = false,
  error,
  disabled = false,
  disabledValues = new Set<string>(),
}: {
  label: string;
  value: string;
  set: (value: string) => void;
  rows: readonly (readonly string[])[];
  placeholder?: string;
  fieldKey?: AddFormErrorKey;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  disabledValues?: ReadonlySet<string>;
}) {
  const [open, setOpen] = useState(false);
  const triggerId = useId();
  const selectedRow = rows.find(([id]) => id === value);

  return (
    <Field label={label} htmlFor={triggerId} required={required} error={error}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={Boolean(error)}
            disabled={disabled}
            data-add-field={fieldKey}
            className="h-9 w-full justify-between px-3 font-normal"
          >
            <span className={cn("truncate", !selectedRow && "text-muted-foreground")}>
              {selectedRow?.[1] || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[--radix-popover-trigger-width] max-h-[min(22rem,calc(100dvh-8rem))] overflow-hidden p-0"
          onWheelCapture={(event) => event.stopPropagation()}
          onTouchMoveCapture={(event) => event.stopPropagation()}
        >
          <Command
            className="max-h-[min(22rem,calc(100dvh-8rem))]"
            filter={(candidateValue, search) => {
              const row = rows.find(([id]) => id === candidateValue);
              if (!row) return 0;
              return row.join(" ").toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            <CommandInput placeholder={`Search ${label.replace(/\s+\*$/, "").toLowerCase()}...`} />
            <CommandList className="max-h-[min(18rem,calc(100dvh-12rem))] overscroll-contain scrollbar-thin">
              <CommandEmpty>No matches found.</CommandEmpty>
              <CommandGroup>
                {rows.map(([id, name, ...details]) => (
                  <CommandItem
                    key={id}
                    value={id}
                    disabled={disabledValues.has(id)}
                    onSelect={() => {
                      set(id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("h-4 w-4", value === id ? "opacity-100" : "opacity-0")} />
                    <span className="min-w-0">
                      <span className="block truncate">{name}</span>
                      {details.filter(Boolean).length > 0 && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {details.filter(Boolean).join(" · ")}
                          {disabledValues.has(id) ? " · Unavailable for selected date" : ""}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </Field>
  );
}

function StepHeading({
  number,
  title,
  description,
  showNextStep = false,
}: {
  number: number;
  title: string;
  description: string;
  showNextStep?: boolean;
}) {
  return (
    <div
      className={cn("relative flex gap-3", showNextStep && "items-start justify-between")}
      aria-label={showNextStep ? "Step 1 of 2" : undefined}
    >
      {showNextStep && (
        <div className="absolute left-3.5 right-3.5 top-3.5 h-px bg-border" aria-hidden="true" />
      )}
      <div className="relative z-10 flex gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
          {number}
        </div>
        <div className={cn(showNextStep && "bg-background pr-3")}>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {showNextStep && (
        <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          2
        </div>
      )}
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <h3 className="border-b bg-muted/30 px-4 py-2.5 text-sm font-semibold">{title}</h3>
      <dl className="grid sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function ReviewDetail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={cn("border-b px-4 py-2.5 last:border-b-0", wide && "sm:col-span-2")}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function OptionLoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
      <p className="text-destructive">{message}</p>
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={retry}>
        Retry
      </Button>
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
