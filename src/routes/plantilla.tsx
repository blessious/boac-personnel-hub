import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Archive,
  BriefcaseBusiness,
  ChevronRight,
  History,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { OrganizationHierarchyFields } from "@/components/organization/OrganizationHierarchyFields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { cn, formatDisplayDate, formatDisplayDateTime } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TablePagination } from "@/components/ui/table-pagination";
import { Textarea } from "@/components/ui/textarea";
import {
  dataTableBodyClass,
  dataTableCellClass,
  dataTableClass,
  dataTableEmptyCellClass,
  dataTableHeadClass,
  dataTableHeaderCellClass,
  dataTableHeadRowClass,
  dataTableRowClass,
  dataTableShellClass,
} from "@/lib/data-table-styles";
import { api, isAbortError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRealtimeRefresh } from "@/lib/realtime";
import {
  createEmployee,
  listEmployees,
  type EmployeeAccountCredentials,
  type EmployeeRecord,
  type SettingsOptions,
} from "@/lib/employees-api";
import {
  emptyMovement,
  MOVEMENT_TYPES,
  saveMovement,
  type MovementForm,
} from "@/lib/movements-api";
import {
  emptyPlantilla,
  deletePlantilla,
  listPlantilla,
  savePlantilla,
  type PlantillaItem,
  type PlantillaPayload,
} from "@/lib/plantilla-api";
import {
  DEFAULT_ORGANIZATION_HIERARCHY,
  organizationPath,
  type OrganizationHierarchy,
  type OrganizationReferenceCategory,
  type ReferenceCategory,
  type ReferenceRow,
} from "@/lib/reference-libraries";
import {
  organizationSelectionFromReferenceId,
  organizationAncestry,
  selectedAssignableOrganization,
  type OrganizationSelection,
} from "@/lib/organization-selection";
import {
  listEngagements,
  renewEngagement,
  terminateEngagement,
  type NonPlantillaEngagement,
} from "@/lib/assignments-api";

export const Route = createFileRoute("/plantilla")({ component: PlantillaPage });
const fieldClass = "h-9 w-full rounded-md border bg-background px-3 text-sm";
const formatSalaryInput = (value: string) => {
  if (!value) return "";
  const [whole = "", decimal] = value.split(".");
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decimal === undefined ? formattedWhole : `${formattedWhole}.${decimal}`;
};
const pendingMovementLabel = (movement: NonNullable<PlantillaItem["pendingMovement"]>) => {
  const prefix =
    movement.status === "Draft"
      ? "Movement draft"
      : movement.status === "Submitted" || movement.status === "Reviewed"
        ? "Awaiting approval"
        : movement.status === "Approved"
          ? "Awaiting posting"
          : `Scheduled for ${formatDisplayDate(movement.effectiveDate)}`;
  return `${prefix}: ${movement.controlNumber} - ${movement.status}`;
};
const categories: ReferenceCategory[] = [
  "sectors",
  "offices",
  "divisions",
  "sections",
  "plantilla-types",
  "budget-codes",
];
const optionCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const CREATE_PLANTILLA_CLASSIFICATION_CODES = new Set(["PLANTILLA", "ELECTIVE", "COTER"]);
const ITEM_ACTIONS = new Set(["Original Appointment", "Promotion", "Transfer"]);
const PROFILE_ACTIONS = new Set(["Detail", "Designation"]);
const TEMPORARY_ACTIONS = new Set(["Detail", "Designation", "Reassignment", "Job Rotation"]);
const SEPARATIONS = new Set(["Resignation", "Retirement", "Termination", "Death"]);
const displayPlantillaClassification = (name: string) =>
  name.trim().toLowerCase() === "plantilla" ? "Permanent" : name;
const formatEmployeeName = (employee: {
  lastname?: string;
  firstname?: string;
  middlename?: string;
  nameExt?: string;
}) =>
  [employee.lastname, employee.firstname, employee.middlename, employee.nameExt]
    .filter(Boolean)
    .join(", ");
const today = () => new Date().toISOString().slice(0, 10);
function PlantillaPage() {
  const { hasPermission } = useAuth(),
    canManage = hasPermission("plantilla.write"),
    canManageEngagements = hasPermission("engagements.manage");
  const [items, setItems] = useState<PlantillaItem[]>([]),
    [summary, setSummary] = useState({
      authorized: 0,
      active: 0,
      inactive: 0,
      occupied: 0,
      vacant: 0,
    });
  const [settings, setSettings] = useState<SettingsOptions>({
    departments: [],
    positions: [],
    salaryGrades: [],
  });
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [refs, setRefs] = useState<Record<ReferenceCategory, ReferenceRow[]>>(
    {} as Record<ReferenceCategory, ReferenceRow[]>,
  );
  const [hierarchy, setHierarchy] = useState<OrganizationHierarchy>(DEFAULT_ORGANIZATION_HIERARCHY);
  const [q, setQ] = useState(""),
    [status, setStatus] = useState("all"),
    [occupancy, setOccupancy] = useState("all"),
    [officeId, setOfficeId] = useState("all"),
    [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [listError, setListError] = useState("");
  const [configError, setConfigError] = useState("");
  const [edit, setEdit] = useState<PlantillaItem | null | undefined>(undefined),
    [form, setForm] = useState<PlantillaPayload>(emptyPlantilla);
  const [history, setHistory] = useState<
      Array<{ id: number; action: string; changedBy: string; createdAt: string }>
    >([]),
    [historyItem, setHistoryItem] = useState<PlantillaItem | null>(null);
  const [engagements, setEngagements] = useState<NonPlantillaEngagement[]>([]);
  const [engagementStatus, setEngagementStatus] = useState("Active");
  const [engagementError, setEngagementError] = useState("");
  const [renewalEngagement, setRenewalEngagement] = useState<NonPlantillaEngagement | null>(null);
  const [renewalForm, setRenewalForm] = useState({
    dateFrom: "",
    dateTo: "",
    remarks: "",
  });
  const [movementEdit, setMovementEdit] = useState<null | undefined>(undefined);
  const [movementForm, setMovementForm] = useState<MovementForm>(emptyMovement);
  const [movementOrganizationSelection, setMovementOrganizationSelection] =
    useState<OrganizationSelection>({});
  const [newEmployeeItem, setNewEmployeeItem] = useState<PlantillaItem | null>(null);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    employeeId: "",
    biometricId: "",
    lastname: "",
    firstname: "",
    middlename: "",
    email: "",
    dtrSignatory: "",
    targetSalaryGradeId: "",
    effectiveDate: today(),
  });
  const [createdAccount, setCreatedAccount] = useState<{
    employeeName: string;
    credentials: EmployeeAccountCredentials;
  } | null>(null);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const x = await listPlantilla(q, status, occupancy, { signal }, officeId);
        if (signal?.aborted) return;
        setItems(x.items);
        setSummary(x.summary);
        setListError("");
      } catch (e) {
        if (!isAbortError(e)) {
          const message = (e as Error).message;
          setListError(message);
          toast.error(message);
        }
      }
    },
    [q, status, occupancy, officeId],
  );
  const loadEngagements = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const result = await listEngagements("", engagementStatus, { signal });
        if (signal?.aborted) return;
        setEngagements(result.engagements);
        setEngagementError("");
      } catch (e) {
        if (!isAbortError(e)) {
          const message = (e as Error).message;
          setEngagementError(message);
          toast.error(message);
        }
      }
    },
    [engagementStatus],
  );
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api<SettingsOptions>("/api/settings", { signal: controller.signal }),
      api<{
        libraries: Record<ReferenceCategory, ReferenceRow[]>;
        hierarchy: OrganizationHierarchy;
      }>("/api/settings/references", { signal: controller.signal }),
      loadAllEmployees(controller.signal),
    ])
      .then(([s, r, e]) => {
        setSettings(s);
        setRefs(r.libraries);
        setHierarchy(r.hierarchy || DEFAULT_ORGANIZATION_HIERARCHY);
        setEmployees(e);
        setConfigError("");
      })
      .catch((e) => {
        if (!isAbortError(e)) {
          setConfigError(e.message);
          toast.error(e.message);
        }
      });

    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => load(controller.signal), 200);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [load]);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );
  useEffect(() => {
    setPage(1);
  }, [q, status, occupancy, officeId, pageSize]);
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => loadEngagements(controller.signal), 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [loadEngagements]);
  useRealtimeRefresh(() => {
    void Promise.all([load(), loadEngagements()]);
  }, ["plantilla", "movements", "employees", "engagements"]);
  const active = (c: ReferenceCategory) => refs[c]?.filter((x) => x.isActive) || [];
  const enabledOrganizationLevels = hierarchy.levels.filter((level) => level.enabled);
  const plantillaOrganizationValue: Record<OrganizationReferenceCategory, string> = {
    sectors: form.sectorId,
    offices: form.officeId,
    divisions: form.divisionId,
    sections: form.sectionId,
  };
  const plantillaOrganizationSelection = enabledOrganizationLevels.reduce<OrganizationSelection>(
    (selection, level) => {
      selection[level.category] = plantillaOrganizationValue[level.category];
      return selection;
    },
    {},
  );
  const plantillaAssignedOrganization = selectedAssignableOrganization(
    plantillaOrganizationSelection,
    refs,
    hierarchy,
    { allowInactive: Boolean(edit) },
  );
  const organizationFilterRows = enabledOrganizationLevels
    .flatMap((level) => (refs[level.category] || []).filter((row) => row.isActive))
    .map((row) => ({
      id: row.id,
      label:
        organizationPath(row, refs, hierarchy)
          .map((part) => part.name)
          .join(" / ") || row.name,
    }))
    .sort((left, right) => optionCollator.compare(left.label, right.label));
  const organizationNameField: Record<OrganizationReferenceCategory, keyof PlantillaItem> = {
    sectors: "sectorName",
    offices: "officeName",
    divisions: "divisionName",
    sections: "sectionName",
  };
  const plantillaOrganizationPath = (item: PlantillaItem) =>
    enabledOrganizationLevels
      .map((level) => String(item[organizationNameField[level.category]] || ""))
      .filter(Boolean)
      .join(" / ");
  const openEdit = (item?: PlantillaItem) => {
    const selectedGrade = item?.salaryGradeId
      ? settings.salaryGrades.find((grade) => grade.id === item.salaryGradeId)
      : null;
    setEdit(item || null);
    setForm(
      item
        ? {
            itemNumber: item.itemNumber,
            positionId: String(item.positionId),
            salaryGradeId: item.salaryGradeId ? String(item.salaryGradeId) : "",
            sectorId: item.sectorId ? String(item.sectorId) : "",
            officeId: item.officeId ? String(item.officeId) : "",
            divisionId: item.divisionId ? String(item.divisionId) : "",
            sectionId: item.sectionId ? String(item.sectionId) : "",
            plantillaTypeId: item.plantillaTypeId ? String(item.plantillaTypeId) : "",
            budgetCodeId: item.budgetCodeId ? String(item.budgetCodeId) : "",
            authorizedSalary: selectedGrade
              ? String(selectedGrade.amount * 12)
              : item.authorizedSalary == null
                ? ""
                : String(item.authorizedSalary),
            itemStatus: item.itemStatus,
            effectiveFrom: item.effectiveFrom || "",
            effectiveTo: item.effectiveTo || "",
            notes: item.notes,
          }
        : emptyPlantilla,
    );
  };
  const save = async () => {
    setBusy(true);
    try {
      await savePlantilla(form, edit?.id);
      toast.success(edit ? "Plantilla item updated" : "Plantilla item created");
      setEdit(undefined);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (item: PlantillaItem) => {
    if (
      !window.confirm(
        `Delete plantilla item ${item.itemNumber}? This is only allowed for mistaken entries with no occupancy or movement history. Used items should be marked Inactive or Abolished.`,
      )
    )
      return;
    setBusy(true);
    try {
      await deletePlantilla(item.id);
      toast.success("Plantilla item deleted");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const showHistory = async (item: PlantillaItem) => {
    try {
      const x = await api<{ history: typeof history }>(`/api/plantilla/${item.id}/history`);
      setHistory(x.history);
      setHistoryItem(item);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const prepareMovement = (item: PlantillaItem) => {
    if (item.occupant) {
      openMovementForm({
        employeeId: item.occupant.employeeId,
        actionType: "Transfer",
      });
      return;
    }
    openNewEmployeeForm(item);
  };
  const prepareExistingPerson = (item: PlantillaItem) =>
    openMovementForm({
      actionType: "Original Appointment",
      targetPlantillaItemId: item.id,
    });
  const openMovementForm = (prefill: Partial<MovementForm>) => {
    const targetOrganizationId = prefill.targetOrganizationId || "";
    const targetItem = items.find((item) => item.id === prefill.targetPlantillaItemId);
    const [stepOne] = salaryStepsForItem(targetItem || null);
    setMovementEdit(null);
    setMovementOrganizationSelection(
      organizationSelectionFromReferenceId(targetOrganizationId, refs, hierarchy),
    );
    setMovementForm({
      ...emptyMovement,
      effectiveDate: today(),
      ...prefill,
      targetSalaryGradeId: prefill.targetSalaryGradeId || (stepOne ? String(stepOne.id) : ""),
    });
  };
  const savePreparedMovement = async () => {
    setBusy(true);
    try {
      await saveMovement(movementForm);
      toast.success("Movement prepared");
      setMovementEdit(undefined);
      await load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const salaryStepsForItem = (item: PlantillaItem | null) =>
    item?.salaryGrade
      ? settings.salaryGrades
          .filter(
            (row) =>
              row.isActive &&
              row.ordinance === item.salaryGrade?.ordinance &&
              row.grade === item.salaryGrade?.grade,
          )
          .sort((left, right) => left.step - right.step || left.amount - right.amount)
      : [];
  const openNewEmployeeForm = (item: PlantillaItem) => {
    const [stepOne] = salaryStepsForItem(item);
    setNewEmployeeItem(item);
    setNewEmployeeForm({
      employeeId: "",
      biometricId: "",
      lastname: "",
      firstname: "",
      middlename: "",
      email: "",
      dtrSignatory: "",
      targetSalaryGradeId: stepOne ? String(stepOne.id) : "",
      effectiveDate: today(),
    });
  };
  const createPlantillaEmployee = async () => {
    if (!newEmployeeItem) return;
    if (!newEmployeeForm.lastname.trim() || !newEmployeeForm.firstname.trim()) {
      toast.error("Enter the employee name");
      return;
    }
    if (!newEmployeeForm.effectiveDate || !newEmployeeForm.targetSalaryGradeId) {
      toast.error("Select the appointment date and salary step");
      return;
    }
    setBusy(true);
    try {
      const result = await createEmployee({
        employeeId: newEmployeeForm.employeeId,
        biometricId: newEmployeeForm.biometricId,
        lastname: newEmployeeForm.lastname,
        firstname: newEmployeeForm.firstname,
        middlename: newEmployeeForm.middlename,
        email: newEmployeeForm.email,
        dtrSignatory: newEmployeeForm.dtrSignatory || formatEmployeeName(newEmployeeForm),
        department: "",
        position: "",
        itemNo: "",
        status: displayPlantillaClassification(newEmployeeItem.plantillaTypeName || "Plantilla"),
        empStatus: "Inactive",
        lifecycleState: "Pre-Employment",
        createAccount: true,
        appointment: {
          targetPlantillaItemId: newEmployeeItem.id,
          targetSalaryGradeId: newEmployeeForm.targetSalaryGradeId,
          effectiveDate: newEmployeeForm.effectiveDate,
          supportingDocuments: [],
        },
      });
      toast.success("Personal record and appointment draft created");
      if (result.account) {
        setCreatedAccount({
          employeeName: formatEmployeeName(result.employee),
          credentials: result.account,
        });
      }
      setNewEmployeeItem(null);
      await load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const openRenewalDialog = (engagement: NonPlantillaEngagement) => {
    setRenewalEngagement(engagement);
    setRenewalForm({
      dateFrom: engagement.dateTo || "",
      dateTo: engagement.dateTo || "",
      remarks: engagement.remarks || "Renewed engagement",
    });
  };
  const renewSelectedEngagement = async () => {
    if (!renewalEngagement || !renewalForm.dateFrom || !renewalForm.dateTo) {
      toast.error("Select the renewal date range");
      return;
    }
    setBusy(true);
    try {
      await renewEngagement(renewalEngagement.id, renewalForm);
      toast.success("Engagement renewed");
      setRenewalEngagement(null);
      await Promise.all([loadEngagements(), load()]);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const terminateSelectedEngagement = async (engagement: NonPlantillaEngagement) => {
    const dateTo = window.prompt(
      "Termination date (YYYY-MM-DD)",
      new Date().toISOString().slice(0, 10),
    );
    if (!dateTo) return;
    const remarks = window.prompt("Termination remarks", "Terminated by HR action");
    if (!remarks) return;
    setBusy(true);
    try {
      await terminateEngagement(engagement.id, dateTo, remarks);
      toast.success("Engagement terminated");
      await Promise.all([loadEngagements(), load()]);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <AppShell title="Plantilla & PSIPOP" subtitle="Authorized positions, occupancy, and vacancies">
      <div className="grid grid-cols-6 gap-2 md:gap-3 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1">
          <StatCard
            title="Authorized"
            value={summary.authorized || 0}
            subtext="Total positions"
            subtextColor="text-muted-foreground"
            icon={<BriefcaseBusiness className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-50 dark:bg-blue-500/15"
            chartColor="stroke-blue-500"
            trend="up"
          />
        </div>
        <div className="col-span-2 lg:col-span-1">
          <StatCard
            title="Active"
            value={summary.active || 0}
            subtext="Currently active"
            subtextColor="text-muted-foreground"
            icon={<Activity className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-50 dark:bg-emerald-500/15"
            chartColor="stroke-emerald-500"
            trend="up"
          />
        </div>
        <div className="col-span-2 lg:col-span-1">
          <StatCard
            title="Inactive"
            value={summary.inactive || 0}
            subtext="Inactive positions"
            subtextColor="text-muted-foreground"
            icon={<Archive className="h-5 w-5 text-amber-600" />}
            iconBg="bg-amber-50 dark:bg-amber-500/15"
            chartColor="stroke-amber-500"
            trend="down"
          />
        </div>
        <div className="col-span-3 lg:col-span-1">
          <StatCard
            title="Occupied"
            value={summary.occupied || 0}
            subtext="Filled positions"
            subtextColor="text-muted-foreground"
            icon={<UserCheck className="h-5 w-5 text-purple-600" />}
            iconBg="bg-purple-50 dark:bg-purple-500/15"
            chartColor="stroke-purple-500"
            trend="up"
          />
        </div>
        <div className="col-span-3 lg:col-span-1">
          <StatCard
            title="Vacant"
            value={summary.vacant || 0}
            subtext="Available for hire"
            subtextColor="text-muted-foreground"
            icon={<UserPlus className="h-5 w-5 text-fuchsia-600" />}
            iconBg="bg-fuchsia-50 dark:bg-fuchsia-500/15"
            chartColor="stroke-fuchsia-500"
            trend="down"
          />
        </div>
      </div>
      <WorkflowStrip />
      {configError && (
        <ErrorPanel
          title="Unable to load Plantilla references"
          message={configError}
          onRetry={() => window.location.reload()}
        />
      )}
      <div className="mt-5 grid gap-2 md:flex md:flex-wrap">
        <div className="relative min-w-0 flex-1 md:min-w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search item, position, or employee"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className={fieldClass + " md:max-w-40"}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Abolished</option>
        </select>
        <select
          className={fieldClass + " md:max-w-40"}
          value={occupancy}
          onChange={(e) => setOccupancy(e.target.value)}
        >
          <option value="all">All occupancy</option>
          <option value="occupied">Occupied</option>
          <option value="vacant">Vacant</option>
        </select>
        <select
          aria-label="Filter by organizational unit"
          className={fieldClass + " md:max-w-56"}
          value={officeId}
          onChange={(e) => setOfficeId(e.target.value)}
        >
          <option value="all">All organizational units</option>
          {organizationFilterRows.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.label}
            </option>
          ))}
        </select>
        {canManage && (
          <Button onClick={() => openEdit()} className="bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            New item
          </Button>
        )}
      </div>
      {listError && (
        <ErrorPanel
          title="Unable to load Plantilla items"
          message={listError}
          onRetry={() => load()}
        />
      )}
      <div className="mobile-record-list mt-4 md:hidden">
        {paginatedItems.map((i) => (
          <article
            className="rounded-lg border border-border bg-background p-3 shadow-sm"
            key={i.id}
          >
            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_4.75rem_1.25rem] items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-100 dark:ring-blue-500/30">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">{i.itemNumber}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {i.positionTitle}
                  {i.salaryGrade
                    ? ` - SG ${i.salaryGrade.grade}, Step ${i.salaryGrade.step}`
                    : " - No salary grade"}
                </div>
                <div className="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground">
                  {plantillaOrganizationPath(i) || "-"}
                </div>
              </div>
              <span
                className={cn(
                  "text-center text-xs font-semibold",
                  i.itemStatus === "Active"
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-amber-700 dark:text-amber-300",
                )}
              >
                {i.itemStatus}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border/70 pt-3">
              <div className="border-l border-border/70 pl-3">
                <span className="text-xs text-muted-foreground">Classification</span>
                <span className="block truncate text-sm font-semibold text-foreground">
                  {i.plantillaTypeName || "-"}
                </span>
                {/* <span className="block truncate text-xs text-muted-foreground">
                  {i.budgetCodeName || "No fund code"}
                </span> */}
              </div>
              <div className="border-l border-border/70 pl-3">
                <span className="text-xs text-muted-foreground">
                  {i.occupant ? "Occupancy" : i.pendingMovement ? "Pending movement" : "Occupancy"}
                </span>
                <span
                  className={cn(
                    "block truncate text-sm font-semibold",
                    i.occupant
                      ? "text-foreground"
                      : i.pendingMovement
                        ? "text-blue-700"
                        : "text-amber-700",
                  )}
                >
                  {i.occupant
                    ? i.occupant.employeeName
                    : i.pendingMovement
                      ? i.pendingMovement.employeeName
                      : "Vacant"}
                </span>
                {i.pendingMovement && !i.occupant && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {pendingMovementLabel(i.pendingMovement)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <PlantillaActionsMenu
                item={i}
                canManage={canManage}
                busy={busy}
                onPrepareMovement={prepareMovement}
                onPrepareExistingPerson={prepareExistingPerson}
                onHistory={showHistory}
                onEdit={openEdit}
                onDelete={remove}
              />
            </div>
          </article>
        ))}
        {!items.length && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No plantilla items found.
          </div>
        )}
      </div>
      <div className={cn("mobile-desktop-table mt-4", dataTableShellClass)}>
        <table className={dataTableClass}>
          <thead className={dataTableHeadClass}>
            <tr className={dataTableHeadRowClass}>
              {[
                "Item no.",
                "Position / SG",
                "Organization",
                "Classification",
                "Occupancy",
                "Status",
                "Actions",
              ].map((x) => (
                <th className={dataTableHeaderCellClass} key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={dataTableBodyClass}>
            {paginatedItems.map((i) => (
              <tr className={dataTableRowClass} key={i.id}>
                <td className={cn(dataTableCellClass, "font-medium")}>{i.itemNumber}</td>
                <td className={dataTableCellClass}>
                  {i.positionTitle}
                  <div className="text-sm leading-5 text-muted-foreground">
                    {i.salaryGrade
                      ? `SG ${i.salaryGrade.grade}, Step ${i.salaryGrade.step}`
                      : "No salary grade"}
                  </div>
                </td>
                <td className={dataTableCellClass}>{plantillaOrganizationPath(i) || "-"}</td>
                <td className={dataTableCellClass}>
                  {i.plantillaTypeName || "-"}
                  {/* <div className="text-sm leading-5 text-muted-foreground">
                    {i.budgetCodeName || "No fund code"}
                  </div> */}
                </td>
                <td className={dataTableCellClass}>
                  {i.occupant ? (
                    <span className="font-medium">{i.occupant.employeeName}</span>
                  ) : i.pendingMovement ? (
                    <div>
                      <span className="font-medium text-blue-700">
                        {i.pendingMovement.employeeName}
                      </span>
                      <div className="text-sm leading-5 text-muted-foreground">
                        {pendingMovementLabel(i.pendingMovement)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-amber-700">Vacant</span>
                  )}
                </td>
                <td className={dataTableCellClass}>{i.itemStatus}</td>
                <td className={cn(dataTableCellClass, "text-right")}>
                  <PlantillaActionsMenu
                    item={i}
                    canManage={canManage}
                    busy={busy}
                    onPrepareMovement={prepareMovement}
                    onPrepareExistingPerson={prepareExistingPerson}
                    onHistory={showHistory}
                    onEdit={openEdit}
                    onDelete={remove}
                  />
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td className={dataTableEmptyCellClass} colSpan={7}>
                  No plantilla items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={page}
        totalPages={totalPages}
        total={items.length}
        pageSize={pageSize}
        itemLabel="Plantilla items"
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        maxPageSize={100}
        className="mt-3 rounded-lg border bg-card"
      />
      <section className="mt-6 rounded-lg border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">Non-Plantilla Engagements</h3>
            <p className="text-xs text-muted-foreground">
              JO, COS, casual, and contractual engagement records.
            </p>
          </div>
          <select
            className={fieldClass + " sm:max-w-44"}
            value={engagementStatus}
            onChange={(event) => setEngagementStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option>Active</option>
            <option>Scheduled</option>
            <option>Expired</option>
            <option>Renewed</option>
            <option>Terminated</option>
          </select>
        </div>
        {engagementError && (
          <div className="px-4">
            <ErrorPanel
              title="Unable to load engagements"
              message={engagementError}
              onRetry={() => loadEngagements()}
            />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className={dataTableClass}>
            <thead className={dataTableHeadClass}>
              <tr className={dataTableHeadRowClass}>
                {[
                  "Employee",
                  "Type / Position",
                  "Organizational unit",
                  "Period",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th className={dataTableHeaderCellClass} key={heading}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={dataTableBodyClass}>
              {engagements.map((engagement) => (
                <tr className={dataTableRowClass} key={engagement.id}>
                  <td className={dataTableCellClass}>
                    <div className="font-medium">{engagement.employeeName}</div>
                    <div className="text-xs text-muted-foreground">{engagement.employeeNo}</div>
                  </td>
                  <td className={dataTableCellClass}>
                    <div className="font-medium">{engagement.engagementType}</div>
                    <div className="text-xs text-muted-foreground">{engagement.designation}</div>
                  </td>
                  <td className={dataTableCellClass}>{engagement.organization || "-"}</td>
                  <td className={cn(dataTableCellClass, "whitespace-nowrap")}>
                    {formatDisplayDate(engagement.dateFrom)}
                    <div className="text-xs text-muted-foreground">
                      to {formatDisplayDate(engagement.dateTo)}
                    </div>
                  </td>
                  <td className={dataTableCellClass}>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        engagement.status === "Active"
                          ? "text-emerald-700 dark:text-emerald-300"
                          : engagement.status === "Scheduled"
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-muted-foreground",
                      )}
                    >
                      {engagement.status}
                    </span>
                  </td>
                  <td className={dataTableCellClass}>
                    <div className="flex flex-wrap gap-1">
                      {canManageEngagements &&
                        ["Active", "Expired"].includes(engagement.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => openRenewalDialog(engagement)}
                          >
                            Renew
                          </Button>
                        )}
                      {canManageEngagements &&
                        ["Active", "Scheduled"].includes(engagement.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => terminateSelectedEngagement(engagement)}
                            className="text-destructive hover:text-destructive"
                          >
                            Terminate
                          </Button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
              {!engagements.length && (
                <tr>
                  <td className={dataTableEmptyCellClass} colSpan={6}>
                    No non-Plantilla engagements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Dialog
        open={Boolean(renewalEngagement)}
        onOpenChange={(open) => !open && !busy && setRenewalEngagement(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Renew Engagement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Date Range</Label>
              <DateRangePicker
                from={renewalForm.dateFrom}
                to={renewalForm.dateTo}
                disabled={busy}
                onApply={(dateFrom, dateTo) =>
                  setRenewalForm((current) => ({ ...current, dateFrom, dateTo }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Remarks</Label>
              <Input
                value={renewalForm.remarks}
                disabled={busy}
                onChange={(event) =>
                  setRenewalForm((current) => ({ ...current, remarks: event.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setRenewalEngagement(null)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={renewSelectedEngagement}>
              {busy ? "Renewing..." : "Renew engagement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={edit !== undefined} onOpenChange={(o) => !o && setEdit(undefined)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{edit ? "Edit" : "Create"} plantilla item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <F l="Item number">
              <Input
                value={form.itemNumber}
                onChange={(e) => setForm({ ...form, itemNumber: e.target.value })}
              />
            </F>
            <Sel
              l="Position"
              v={form.positionId}
              set={(v) => setForm({ ...form, positionId: v })}
              rows={[...settings.positions]
                .sort((left, right) => optionCollator.compare(left.title, right.title))
                .map((x) => [String(x.id), x.title])}
            />
            <Sel
              l="Salary grade"
              v={form.salaryGradeId}
              set={(v) => {
                const grade = settings.salaryGrades.find((row) => String(row.id) === v);
                setForm({
                  ...form,
                  salaryGradeId: v,
                  authorizedSalary: grade ? String(grade.amount * 12) : "",
                });
              }}
              rows={settings.salaryGrades
                .filter((x) => x.step === 1 && (x.isActive || String(x.id) === form.salaryGradeId))
                .map((x) => [
                  String(x.id),
                  `SG ${x.grade} — Step 1 · PHP ${x.amount.toLocaleString()} monthly`,
                ])}
            />
            <F l="Annual authorized salary">
              <Input
                inputMode="decimal"
                value={formatSalaryInput(form.authorizedSalary)}
                readOnly
                className="bg-muted/40"
                title="Calculated from the selected monthly salary grade amount multiplied by 12"
              />
            </F>
            <OrganizationHierarchyFields
              libraries={refs}
              hierarchy={hierarchy}
              value={plantillaOrganizationSelection}
              onValueChange={(selection) => {
                const assignedOrganization = selectedAssignableOrganization(
                  selection,
                  refs,
                  hierarchy,
                  { allowInactive: Boolean(edit) },
                );
                const ancestry = organizationAncestry(assignedOrganization || undefined, refs);
                const ancestryId = (category: OrganizationReferenceCategory) =>
                  ancestry.find((row) => row.category === category)?.id;
                setForm({
                  ...form,
                  sectorId:
                    selection.sectors ??
                    (assignedOrganization ? String(ancestryId("sectors") || "") : form.sectorId),
                  officeId:
                    selection.offices ??
                    (assignedOrganization ? String(ancestryId("offices") || "") : form.officeId),
                  divisionId:
                    selection.divisions ??
                    (assignedOrganization
                      ? String(ancestryId("divisions") || "")
                      : form.divisionId),
                  sectionId:
                    selection.sections ??
                    (assignedOrganization ? String(ancestryId("sections") || "") : form.sectionId),
                });
              }}
              fieldKey="plantilla-organization"
            />
            <Sel
              l="Plantilla classification"
              v={form.plantillaTypeId}
              set={(v) => setForm({ ...form, plantillaTypeId: v })}
              rows={active("plantilla-types")
                .filter(
                  (x) =>
                    Boolean(edit) ||
                    CREATE_PLANTILLA_CLASSIFICATION_CODES.has(x.code.toUpperCase()),
                )
                .sort((left, right) => optionCollator.compare(left.name, right.name))
                .map((x) => [String(x.id), displayPlantillaClassification(x.name)])}
            />
            {/* Hidden from the Edit Plantilla Item form; preserve the stored value on save.
            {edit && (
              <Sel
                l="Budget / fund code"
                v={form.budgetCodeId}
                set={(v) => setForm({ ...form, budgetCodeId: v })}
                rows={active("budget-codes")
                  .sort((left, right) => optionCollator.compare(left.name, right.name))
                  .map((x) => [String(x.id), x.name])}
              />
            )}
            */}
            <Sel
              l="Status"
              v={form.itemStatus}
              set={(v) => setForm({ ...form, itemStatus: v })}
              rows={[
                ["Active", "Active"],
                ["Inactive", "Inactive"],
                ["Abolished", "Abolished"],
              ]}
            />
            {/* Hidden from the Edit Plantilla Item form; preserve stored dates and notes on save.
            {edit && (
              <>
                <F l="Date Range">
                  <DateRangePicker
                    from={form.effectiveFrom}
                    to={form.effectiveTo}
                    allowEmpty
                    allowOpenEnded
                    labelFormatter={(from, to) =>
                      from || to ? [from, to || "Present"].filter(Boolean).join(" - ") : "All dates"
                    }
                    onApply={(effectiveFrom, effectiveTo) =>
                      setForm({ ...form, effectiveFrom, effectiveTo })
                    }
                  />
                </F>
                <F l="Notes">
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </F>
              </>
            )}
            */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(undefined)}>
              Cancel
            </Button>
            <Button
              disabled={busy || !form.positionId || !plantillaAssignedOrganization}
              onClick={save}
            >
              Save item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <MovementDialog
        open={movementEdit !== undefined}
        form={movementForm}
        setForm={setMovementForm}
        employees={employees}
        items={items}
        settings={settings}
        organizationLibraries={refs}
        organizationHierarchy={hierarchy}
        organizationSelection={movementOrganizationSelection}
        setOrganizationSelection={setMovementOrganizationSelection}
        busy={busy}
        close={() => setMovementEdit(undefined)}
        save={savePreparedMovement}
      />
      <NewPlantillaEmployeeDialog
        item={newEmployeeItem}
        form={newEmployeeForm}
        setForm={setNewEmployeeForm}
        salarySteps={salaryStepsForItem(newEmployeeItem)}
        busy={busy}
        close={() => setNewEmployeeItem(null)}
        save={createPlantillaEmployee}
      />
      <Dialog
        open={Boolean(createdAccount)}
        onOpenChange={(open) => !open && setCreatedAccount(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Temporary account - {createdAccount?.employeeName}</DialogTitle>
          </DialogHeader>
          {createdAccount && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="font-medium">Username</div>
                <div className="mt-1 select-all font-mono">
                  {createdAccount.credentials.username}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="font-medium">Temporary password</div>
                <div className="mt-1 select-all font-mono">
                  {createdAccount.credentials.temporaryPassword}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (!createdAccount) return;
                void navigator.clipboard?.writeText(
                  `Username: ${createdAccount.credentials.username}\nTemporary password: ${createdAccount.credentials.temporaryPassword}`,
                );
                toast.success("Credentials copied");
              }}
            >
              Copy
            </Button>
            <Button onClick={() => setCreatedAccount(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!historyItem} onOpenChange={(o) => !o && setHistoryItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item audit history - {historyItem?.itemNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {history.map((h) => (
              <div className="rounded border p-3" key={h.id}>
                <div className="font-medium">{h.action}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDisplayDateTime(h.createdAt)} - {h.changedBy || "System"}
                </div>
              </div>
            ))}
            {!history.length && <p className="text-sm text-muted-foreground">No history yet.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function MovementDialog({
  open,
  form,
  setForm,
  employees,
  items,
  settings,
  organizationLibraries,
  organizationHierarchy,
  organizationSelection,
  setOrganizationSelection,
  busy,
  close,
  save,
}: {
  open: boolean;
  form: MovementForm;
  setForm: (x: MovementForm) => void;
  employees: EmployeeRecord[];
  items: PlantillaItem[];
  settings: SettingsOptions;
  organizationLibraries: Record<ReferenceCategory, ReferenceRow[]>;
  organizationHierarchy: OrganizationHierarchy;
  organizationSelection: OrganizationSelection;
  setOrganizationSelection: (selection: OrganizationSelection) => void;
  busy: boolean;
  close: () => void;
  save: () => void;
}) {
  const selectedItem = items.find((item) => item.id === form.targetPlantillaItemId);
  const needsItem = ITEM_ACTIONS.has(form.actionType);
  const needsPosition =
    PROFILE_ACTIONS.has(form.actionType) || form.actionType === "Reclassification";
  const needsOrganization = TEMPORARY_ACTIONS.has(form.actionType);
  const needsGrade =
    ITEM_ACTIONS.has(form.actionType) ||
    ["Step Increment", "Reclassification"].includes(form.actionType);
  const separation = SEPARATIONS.has(form.actionType);
  const selectedEmployee = employees.find((employee) => employee.id === form.employeeId);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prepare personnel movement</DialogTitle>
        </DialogHeader>
        {(selectedEmployee || selectedItem) && (
          <div className="notice-info rounded-lg border px-3 py-2 text-sm">
            <div className="font-semibold">
              {form.actionType === "Original Appointment"
                ? "Filling vacancy"
                : "Preparing movement"}
            </div>
            <div className="mt-1 grid gap-1 sm:grid-cols-2">
              {selectedEmployee && (
                <div className="min-w-0">
                  <span className="font-medium">Employee: </span>
                  <span className="break-words">{formatEmployeeName(selectedEmployee)}</span>
                </div>
              )}
              {selectedItem && (
                <div className="min-w-0">
                  <span className="font-medium">Target item: </span>
                  <span className="break-words">
                    {selectedItem.itemNumber} - {selectedItem.positionTitle}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <F l="Control number">
            <Input
              placeholder="Auto-generated when blank"
              value={form.controlNumber}
              onChange={(event) => setForm({ ...form, controlNumber: event.target.value })}
            />
          </F>
          <Sel
            l="Employee"
            v={form.employeeId}
            set={(value) => setForm({ ...form, employeeId: value })}
            rows={employees.map((employee) => [
              employee.id,
              formatEmployeeName(employee),
              [employee.employeeId, employee.department, employee.position]
                .filter(Boolean)
                .join(" "),
            ])}
          />
          <Sel
            l="Personnel action"
            v={form.actionType}
            set={(value) => {
              setOrganizationSelection({});
              setForm({
                ...form,
                actionType: value,
                targetPlantillaItemId: "",
                targetPositionId: "",
                targetSalaryGradeId: "",
                targetDepartment: "",
                targetOrganizationId: "",
              });
            }}
            rows={MOVEMENT_TYPES.map((type) => [type, type])}
          />
          {TEMPORARY_ACTIONS.has(form.actionType) || form.actionType === "Renewal" ? (
            <F l="Date Range">
              <DateRangePicker
                from={form.effectiveDate}
                to={form.endDate}
                allowOpenEnded={form.actionType === "Reassignment"}
                onApply={(effectiveDate, endDate) => setForm({ ...form, effectiveDate, endDate })}
              />
            </F>
          ) : (
            <F l="Effective date">
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(event) => setForm({ ...form, effectiveDate: event.target.value })}
              />
            </F>
          )}
          <F l="Authority / appointment number">
            <Input
              value={form.authorityNumber}
              onChange={(event) => setForm({ ...form, authorityNumber: event.target.value })}
            />
          </F>
          <F l="Authority date">
            <Input
              type="date"
              value={form.authorityDate}
              onChange={(event) => setForm({ ...form, authorityDate: event.target.value })}
            />
          </F>
          {needsItem && (
            <Sel
              l="Target vacant plantilla item"
              v={form.targetPlantillaItemId}
              set={(value) => {
                const item = items.find((candidate) => candidate.id === value);
                const stepOne = item?.salaryGrade
                  ? settings.salaryGrades.find(
                      (row) =>
                        row.isActive &&
                        row.ordinance === item.salaryGrade?.ordinance &&
                        row.grade === item.salaryGrade?.grade &&
                        row.step === 1,
                    )
                  : null;
                setForm({
                  ...form,
                  targetPlantillaItemId: value,
                  targetSalaryGradeId: stepOne ? String(stepOne.id) : "",
                });
              }}
              rows={items
                .filter((item) => !item.occupant)
                .map((item) => [item.id, `${item.itemNumber} - ${item.positionTitle}`])}
            />
          )}
          {needsPosition && (
            <Sel
              l="Target position"
              v={form.targetPositionId}
              set={(value) => setForm({ ...form, targetPositionId: value })}
              rows={[...settings.positions]
                .sort((left, right) => optionCollator.compare(left.title, right.title))
                .map((position) => [String(position.id), position.title])}
            />
          )}
          {needsGrade && (
            <Sel
              l={
                ITEM_ACTIONS.has(form.actionType)
                  ? "Employee salary step"
                  : "Target salary grade / step"
              }
              v={form.targetSalaryGradeId}
              set={(value) => setForm({ ...form, targetSalaryGradeId: value })}
              rows={settings.salaryGrades
                .filter(
                  (grade) =>
                    (grade.isActive || String(grade.id) === form.targetSalaryGradeId) &&
                    (!ITEM_ACTIONS.has(form.actionType) ||
                      (selectedItem?.salaryGrade &&
                        grade.ordinance === selectedItem.salaryGrade.ordinance &&
                        grade.grade === selectedItem.salaryGrade.grade)),
                )
                .map((grade) => [
                  String(grade.id),
                  `SG ${grade.grade}, Step ${grade.step} - PHP ${grade.amount.toLocaleString()} monthly`,
                ])}
            />
          )}
          {needsOrganization && (
            <OrganizationHierarchyFields
              libraries={organizationLibraries}
              hierarchy={organizationHierarchy}
              value={organizationSelection}
              onValueChange={(selection) => {
                const organization = selectedAssignableOrganization(
                  selection,
                  organizationLibraries,
                  organizationHierarchy,
                );
                setOrganizationSelection(selection);
                setForm({
                  ...form,
                  targetOrganizationId: organization ? String(organization.id) : "",
                  targetDepartment: organization?.name || "",
                });
              }}
              disabled={busy}
              fieldKey="movement-organization"
            />
          )}
          <div className="sm:col-span-2">
            <F l="Document references (one per line: Name | reference/location)">
              <Textarea
                rows={3}
                value={form.documentsText}
                onChange={(event) => setForm({ ...form, documentsText: event.target.value })}
              />
            </F>
          </div>
          <div className="sm:col-span-2">
            <F l={separation ? "Separation remarks" : "Remarks"}>
              <Textarea
                rows={3}
                value={form.remarks}
                onChange={(event) => setForm({ ...form, remarks: event.target.value })}
              />
            </F>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={
              busy ||
              !form.employeeId ||
              !form.effectiveDate ||
              (needsItem && !form.targetPlantillaItemId) ||
              (needsGrade && !form.targetSalaryGradeId) ||
              (needsOrganization && !form.targetOrganizationId)
            }
            onClick={save}
          >
            Save draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewPlantillaEmployeeDialog({
  item,
  form,
  setForm,
  salarySteps,
  busy,
  close,
  save,
}: {
  item: PlantillaItem | null;
  form: {
    employeeId: string;
    biometricId: string;
    lastname: string;
    firstname: string;
    middlename: string;
    email: string;
    dtrSignatory: string;
    targetSalaryGradeId: string;
    effectiveDate: string;
  };
  setForm: (form: {
    employeeId: string;
    biometricId: string;
    lastname: string;
    firstname: string;
    middlename: string;
    email: string;
    dtrSignatory: string;
    targetSalaryGradeId: string;
    effectiveDate: string;
  }) => void;
  salarySteps: SettingsOptions["salaryGrades"];
  busy: boolean;
  close: () => void;
  save: () => void;
}) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New employee - {item?.itemNumber}</DialogTitle>
        </DialogHeader>
        {item && (
          <div className="notice-info rounded-lg border px-3 py-2 text-sm">
            <div className="font-semibold">{item.positionTitle}</div>
            <div className="mt-1 text-muted-foreground">
              {item.salaryGrade
                ? `SG ${item.salaryGrade.grade}, authorized Step ${item.salaryGrade.step}`
                : "No salary grade"}
            </div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <F l="Employee ID">
            <Input
              value={form.employeeId}
              placeholder="Auto-generated if blank"
              onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
            />
          </F>
          <F l="Biometric ID">
            <Input
              value={form.biometricId}
              placeholder="Attendance device user ID"
              onChange={(event) => setForm({ ...form, biometricId: event.target.value })}
            />
          </F>
          <F l="Last name">
            <Input
              value={form.lastname}
              onChange={(event) => setForm({ ...form, lastname: event.target.value })}
            />
          </F>
          <F l="First name">
            <Input
              value={form.firstname}
              onChange={(event) => setForm({ ...form, firstname: event.target.value })}
            />
          </F>
          <F l="Middle name">
            <Input
              value={form.middlename}
              onChange={(event) => setForm({ ...form, middlename: event.target.value })}
            />
          </F>
          <F l="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </F>
          <F l="DTR Signatory">
            <Input
              value={form.dtrSignatory}
              placeholder="Defaults to employee name"
              onChange={(event) =>
                setForm({ ...form, dtrSignatory: event.target.value.toUpperCase() })
              }
            />
          </F>
          <F l="Appointment start date">
            <Input
              type="date"
              value={form.effectiveDate}
              onChange={(event) => setForm({ ...form, effectiveDate: event.target.value })}
            />
          </F>
          <Sel
            l="Salary Step"
            v={form.targetSalaryGradeId}
            set={(value) => setForm({ ...form, targetSalaryGradeId: value })}
            rows={salarySteps.map((step) => [
              String(step.id),
              `Step ${step.step} - PHP ${step.amount.toLocaleString()} monthly`,
            ])}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={close}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={save}>
            Create appointment draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlantillaActionsMenu({
  item,
  canManage,
  busy,
  onPrepareMovement,
  onPrepareExistingPerson,
  onHistory,
  onEdit,
  onDelete,
}: {
  item: PlantillaItem;
  canManage: boolean;
  busy: boolean;
  onPrepareMovement: (item: PlantillaItem) => void;
  onPrepareExistingPerson: (item: PlantillaItem) => void;
  onHistory: (item: PlantillaItem) => void;
  onEdit: (item: PlantillaItem) => void;
  onDelete: (item: PlantillaItem) => void;
}) {
  const canPrepareMovement = canManage && item.itemStatus === "Active" && !item.pendingMovement;

  return (
    <div className="inline-flex items-center justify-end gap-2">
      {canPrepareMovement && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground hover:ring-1 hover:ring-border dark:hover:bg-white/10"
          onClick={() => onPrepareMovement(item)}
          title={item.occupant ? "Move employee" : "New employee"}
          aria-label={item.occupant ? "Move employee" : "New employee"}
        >
          {item.occupant ? (
            <ArrowRightLeft className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          <span className="sr-only">{item.occupant ? "Move employee" : "New employee"}</span>
        </Button>
      )}
      {canPrepareMovement && !item.occupant && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground hover:ring-1 hover:ring-border dark:hover:bg-white/10"
          onClick={() => onPrepareExistingPerson(item)}
          title="Existing employee"
          aria-label="Existing employee"
        >
          <UserCheck className="h-4 w-4" />
          <span className="sr-only">Existing employee</span>
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground hover:ring-1 hover:ring-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:hover:bg-white/10"
            title="More actions"
            aria-label={`More actions for item ${item.itemNumber}`}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => onHistory(item)}>
            <History className="mr-2 h-4 w-4" />
            History
          </DropdownMenuItem>
          {canManage && (
            <>
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <BriefcaseBusiness className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={busy}
                onClick={() => onDelete(item)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function WorkflowStrip() {
  const steps = ["Plantilla", "Movement Draft", "Review", "Approve", "Post"];
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
      {steps.map((step, index) => (
        <div className="flex items-center gap-2" key={step}>
          <span className={index === 0 ? "text-foreground" : ""}>{step}</span>
          {index < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
        </div>
      ))}
    </div>
  );
}

function ErrorPanel({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <div className="font-semibold">{title}</div>
          <div>{message}</div>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{l}</Label>
      {children}
    </div>
  );
}
function Sel({
  l,
  v,
  set,
  rows,
}: {
  l: string;
  v: string;
  set: (v: string) => void;
  rows: string[][];
}) {
  const sortedRows = [...rows].sort((left, right) => optionCollator.compare(left[1], right[1]));

  return (
    <F l={l}>
      <Combobox
        value={v}
        onValueChange={set}
        options={sortedRows.map(([id, name, ...details]) => ({
          value: id,
          label: name,
          description: details.filter(Boolean).join(" · "),
          keywords: details,
        }))}
        searchPlaceholder={`Search ${l.toLowerCase()}...`}
        clearable
      />
    </F>
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
    <div className="relative min-h-[7.25rem] overflow-hidden rounded-lg border border-border bg-card p-2.5 text-card-foreground shadow-sm md:min-h-0 md:p-4">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground/80">{title}</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground md:text-2xl">{value}</h2>
        </div>
        <div className={cn("rounded-md p-1.5 md:p-2", iconBg)}>{icon}</div>
      </div>
      <div className="relative z-10 mt-2 flex items-center text-[10px]">
        {subtextDot && <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", subtextDot)} />}
        <span className={subtextColor}>{subtext}</span>
      </div>
      <div className="absolute bottom-2 right-2 z-0 h-7 w-16 opacity-50 md:h-8 md:w-24">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-full w-full">
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

async function loadAllEmployees(signal?: AbortSignal) {
  const first = await listEmployees({ pageSize: 100 }, { signal });
  const pages = Math.ceil(first.total / first.pageSize);
  if (pages <= 1) return first.employees;
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      listEmployees({ page: index + 2, pageSize: first.pageSize }, { signal }),
    ),
  );
  return [...first.employees, ...rest.flatMap((page) => page.employees)];
}
