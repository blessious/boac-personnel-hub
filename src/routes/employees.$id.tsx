import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ComponentType, type RefObject } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Download,
  GraduationCap,
  HeartHandshake,
  IdCard,
  Landmark,
  Menu,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { WorkflowStatusBadge } from "@/components/ui/status-badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormSection } from "@/components/forms/Field";
import { RepeatableTextRows } from "@/components/forms/RepeatableTextRows";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRealtimeRefresh } from "@/lib/realtime";
import {
  CIVIL_STATUSES,
  createSectionRow,
  deleteSectionRow,
  EMPLOYEE_LEVELS,
  EMPLOYMENT_STATUSES,
  GENDERS,
  getEmployee,
  getSettingsOptions,
  generateEmployeeWesDocx,
  updateEmployee,
  updateSectionRow,
  type EmployeeRecord,
  type CurrentAssignment,
  type SectionRow,
  type SettingsOptions,
} from "@/lib/employees-api";
import {
  assignableOrganizationRows,
  DEFAULT_ORGANIZATION_HIERARCHY,
  organizationPath,
  type OrganizationHierarchy,
  type ReferenceCategory,
  type ReferenceRow,
} from "@/lib/reference-libraries";
import { getEmployeeLeave, type EmployeeLeaveResponse, type LeaveBalance } from "@/lib/leave-api";
import { cn, formatDisplayDate, formatDtrSignatoryName, formatEmployeeName } from "@/lib/utils";

export const Route = createFileRoute("/employees/$id")({
  component: EmployeeFile,
});

type Tab =
  | "PERSONAL"
  | "FAMILY"
  | "CHILDREN"
  | "EDUCATIONAL"
  | "CIVIL SERVICE"
  | "WORK EXPERIENCE"
  | "ORGANIZATION"
  | "TRAINING"
  | "SALARY"
  | "SERVICE RECORD"
  | "LEAVE BALANCE"
  | "IPCR";

const TABS: Tab[] = [
  "PERSONAL",
  "FAMILY",
  "CHILDREN",
  "EDUCATIONAL",
  "CIVIL SERVICE",
  "WORK EXPERIENCE",
  "ORGANIZATION",
  "TRAINING",
  "SALARY",
  "SERVICE RECORD",
  "LEAVE BALANCE",
  "IPCR",
];

type TabDetails = {
  label: string;
  number: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const TAB_DETAILS: Record<Tab, TabDetails> = {
  PERSONAL: {
    label: "Personal Information",
    number: "I",
    description: "Personal, employment, contact, and government identification details.",
    icon: UserRound,
  },
  FAMILY: {
    label: "Family",
    number: "II",
    description: "Spouse, parents, and immediate family information.",
    icon: HeartHandshake,
  },
  CHILDREN: {
    label: "Children",
    number: "III",
    description: "Children and dependent information.",
    icon: UsersRound,
  },
  EDUCATIONAL: {
    label: "Educational",
    number: "IV",
    description: "Educational background, degrees, and academic honors.",
    icon: GraduationCap,
  },
  "CIVIL SERVICE": {
    label: "Civil Service",
    number: "V",
    description: "Eligibility, examination, and professional license records.",
    icon: ShieldCheck,
  },
  "WORK EXPERIENCE": {
    label: "Work Experience",
    number: "VI",
    description: "Government and private-sector employment history.",
    icon: BriefcaseBusiness,
  },
  ORGANIZATION: {
    label: "Organization",
    number: "VII",
    description: "Memberships, affiliations, and organization participation.",
    icon: Building2,
  },
  TRAINING: {
    label: "Training",
    number: "VIII",
    description: "Learning, development, seminar, and training records.",
    icon: ClipboardCheck,
  },
  SALARY: {
    label: "Salary",
    number: "IX",
    description: "Salary grade, step, and compensation history.",
    icon: CircleDollarSign,
  },
  "SERVICE RECORD": {
    label: "Service Record",
    number: "X",
    description: "Government service history and separation information.",
    icon: Landmark,
  },
  "LEAVE BALANCE": {
    label: "Leave Balance",
    number: "XI",
    description: "Current leave credits, ledger activity, and adjustments.",
    icon: WalletCards,
  },
  IPCR: {
    label: "IPCR",
    number: "XII",
    description: "Individual performance ratings and supporting attachments.",
    icon: IdCard,
  },
};

const SECTION_BY_TAB: Partial<Record<Tab, string>> = {
  FAMILY: "family",
  CHILDREN: "children",
  EDUCATIONAL: "education",
  "CIVIL SERVICE": "civilService",
  "WORK EXPERIENCE": "work",
  ORGANIZATION: "organization",
  TRAINING: "training",
  SALARY: "salary",
  "SERVICE RECORD": "service",
  IPCR: "ipcr",
};

const SELF_SERVICE_EDITABLE_SECTIONS = new Set([
  "family",
  "children",
  "education",
  "civilService",
  "work",
  "organization",
  "training",
  "ipcr",
]);
const SYSTEM_MANAGED_SECTIONS = new Set(["salary", "service"]);

type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "date" | "number" | "textarea" | "select" | "file";
  options?: string[];
};

const MAX_201_FILE_BYTES = 8 * 1024 * 1024;
const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;

const SECTION_FIELDS: Record<string, FieldConfig[]> = {
  family: [
    { key: "spouseLastname", label: "Spouse Lastname" },
    { key: "spouseFirstname", label: "Spouse Firstname" },
    { key: "spouseMiddlename", label: "Spouse Middlename" },
    { key: "spouseOccupation", label: "Spouse Occupation" },
    { key: "spouseEmployer", label: "Spouse Employer" },
    { key: "spouseBusinessTel", label: "Business Tel No" },
    { key: "spouseBusinessAddress", label: "Business Address", type: "textarea" },
    { key: "fatherLastname", label: "Father Lastname" },
    { key: "fatherFirstname", label: "Father Firstname" },
    { key: "fatherMiddlename", label: "Father Middlename" },
    { key: "motherLastname", label: "Mother Maiden Lastname" },
    { key: "motherFirstname", label: "Mother Firstname" },
    { key: "motherMiddlename", label: "Mother Middlename" },
  ],
  children: [
    { key: "lastname", label: "Lastname" },
    { key: "firstname", label: "Firstname" },
    { key: "middlename", label: "Middlename" },
    { key: "gender", label: "Gender", type: "select", options: [...GENDERS] },
    { key: "birthday", label: "Birthday", type: "date" },
  ],
  education: [
    {
      key: "level",
      label: "Level",
      type: "select",
      options: ["Elementary", "Secondary", "Vocational", "College", "Graduate Studies"],
    },
    { key: "school", label: "School" },
    { key: "degree", label: "Degree / Course" },
    { key: "yearFrom", label: "Year From" },
    { key: "yearTo", label: "Year To" },
    { key: "yearGraduated", label: "Year Graduated" },
    { key: "scholarship", label: "Scholarship / Honors" },
  ],
  civilService: [
    { key: "type", label: "Career Service / Eligibility" },
    { key: "place", label: "Place" },
    { key: "date", label: "Date", type: "date" },
    { key: "rating", label: "Rating" },
    { key: "license", label: "License" },
    { key: "dateRelease", label: "Date Released", type: "date" },
    { key: "licenseValidity", label: "License Validity", type: "date" },
  ],
  work: [
    { key: "dateFrom", label: "Duration From", type: "date" },
    { key: "dateTo", label: "Duration To", type: "date" },
    { key: "position", label: "Position" },
    { key: "officeUnit", label: "Name of Office / Unit" },
    { key: "immediateSupervisor", label: "Immediate Supervisor" },
    {
      key: "agencyOrganizationLocation",
      label: "Agency / Organization and Location",
      type: "textarea",
    },
    {
      key: "accomplishments",
      label: "List of Accomplishments and Contributions",
      type: "textarea",
    },
    { key: "actualDuties", label: "Summary of Actual Duties", type: "textarea" },
    { key: "company", label: "Company / Office" },
    { key: "status", label: "Status" },
    { key: "salary", label: "Salary" },
    { key: "salaryGradeStep", label: "Salary / Job / Pay Grade & Step" },
    { key: "govEmp", label: "Government Service", type: "select", options: ["YES", "NO"] },
  ],
  organization: [
    { key: "name", label: "Organization Name" },
    { key: "position", label: "Position" },
    { key: "address", label: "Address" },
    { key: "yearFrom", label: "Year From" },
    { key: "yearTo", label: "Year To" },
    { key: "hours", label: "No. of Hours", type: "number" },
  ],
  training: [
    { key: "name", label: "Training / Seminar Name" },
    { key: "conductedBy", label: "Conducted By" },
    { key: "yearFrom", label: "Year From" },
    { key: "yearTo", label: "Year To" },
    { key: "hours", label: "No. of Hours", type: "number" },
    { key: "file", label: "Certificate / Attachment", type: "file" },
  ],
  salary: [
    { key: "date", label: "Date Increment", type: "date" },
    { key: "description", label: "Description" },
    { key: "ordinance", label: "Ordinance" },
    { key: "grade", label: "Salary Grade", type: "number" },
    { key: "step", label: "Step", type: "number" },
    { key: "amount", label: "Salary Amount", type: "number" },
    { key: "previousAmount", label: "Previous Amount", type: "number" },
    { key: "tax", label: "Tax Exemption" },
    { key: "gross", label: "Gross Amount", type: "number" },
    {
      key: "type",
      label: "Income Type",
      type: "select",
      options: ["Step Increment", "Not Step Increment"],
    },
    { key: "pera", label: "PERA", type: "number" },
    { key: "rata", label: "RATA", type: "number" },
    { key: "cata", label: "CATA", type: "number" },
  ],
  service: [
    { key: "from", label: "Service From", type: "date" },
    { key: "to", label: "Service To", type: "date" },
    { key: "status", label: "Status" },
    { key: "salary", label: "Salary" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
    { key: "assignment", label: "Assignment" },
    { key: "branch", label: "Branch" },
    { key: "leave", label: "Leave With/Without Pay" },
    { key: "sepDate", label: "Separation Date", type: "date" },
    { key: "sepCause", label: "Separation Cause" },
  ],
  ipcr: [
    { key: "month", label: "Month" },
    { key: "from", label: "Date From", type: "date" },
    { key: "to", label: "Date To", type: "date" },
    { key: "grades", label: "Grades" },
    { key: "remarks", label: "Remarks", type: "textarea" },
    { key: "file", label: "IPCR Attachment", type: "file" },
  ],
};

const SECTION_DATE_RANGES: Record<
  string,
  { from: string; to: string; label: string; allowOpenEnded?: boolean }
> = {
  work: { from: "dateFrom", to: "dateTo", label: "Date Range", allowOpenEnded: true },
  service: { from: "from", to: "to", label: "Date Range", allowOpenEnded: true },
  ipcr: { from: "from", to: "to", label: "Date Range" },
};

function EmployeeFile() {
  const { id } = useParams({ from: "/employees/$id" });
  const { can, hasPermission, user } = useAuth();
  const canManageEmployees = can("edit");
  const [active, setActive] = useState<Tab>("PERSONAL");
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<CurrentAssignment>({
    substantive: null,
    temporary: null,
  });
  const [sections, setSections] = useState<Record<string, SectionRow[]>>({});
  const [options, setOptions] = useState<SettingsOptions>({
    departments: [],
    positions: [],
    salaryGrades: [],
  });
  const [organizationOptions, setOrganizationOptions] = useState<
    Array<{ id: number; name: string; label: string }>
  >([]);
  const [organizationFieldLabel, setOrganizationFieldLabel] = useState("Organizational unit");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sectionActionRequest, setSectionActionRequest] = useState<{
    tab: Tab | null;
    nonce: number;
  }>({ tab: null, nonce: 0 });
  const [workDownloadRequest, setWorkDownloadRequest] = useState(0);
  const [photoSaving, setPhotoSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    setError("");
    getEmployee(id)
      .then((result) => {
        setEmployee(result.employee);
        setSections(result.sections);
        setCurrentAssignment(result.currentAssignment);
      })
      .catch((err) => setError(err.message || "Unable to load employee"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);
  useRealtimeRefresh(load, ["employees", "settings"]);
  useEffect(() => {
    Promise.all([
      getSettingsOptions(),
      api<{
        libraries: Record<ReferenceCategory, ReferenceRow[]>;
        hierarchy: OrganizationHierarchy;
      }>("/api/settings/references"),
    ])
      .then(([settings, references]) => {
        setOptions(settings);
        const hierarchy = references.hierarchy || DEFAULT_ORGANIZATION_HIERARCHY;
        setOrganizationOptions(
          assignableOrganizationRows(references.libraries, hierarchy)
            .map((row) => ({
              id: row.id,
              name: row.name,
              label:
                organizationPath(row, references.libraries, hierarchy)
                  .map((part) => part.name)
                  .join(" / ") || row.name,
            }))
            .sort((left, right) => left.label.localeCompare(right.label)),
        );
        const labels = hierarchy.levels
          .filter((level) => level.enabled && level.assignable)
          .map((level) => level.label);
        setOrganizationFieldLabel(labels.length === 1 ? labels[0] : "Organizational unit");
      })
      .catch(() => {
        setOptions({ departments: [], positions: [], salaryGrades: [] });
        setOrganizationOptions([]);
      });
  }, []);

  if (loading) {
    return (
      <AppShell title="201 File" subtitle="Personnel record management">
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          Loading employee record...
        </div>
      </AppShell>
    );
  }

  if (error || !employee) {
    return (
      <AppShell title="Employee Not Found">
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">{error || `No employee with ID ${id}`}</p>
          <Link
            to="/employees"
            search={{ department: undefined, onboard: undefined, targetPlantillaItemId: undefined }}
            className="mt-4 inline-block text-sm text-primary"
          >
            Back to list
          </Link>
        </div>
      </AppShell>
    );
  }

  const canEditOwnProfile =
    hasPermission("self_service.access") && user?.employeeId === employee.id;
  const canEditProfile = canManageEmployees || canEditOwnProfile;
  const activeSection = SECTION_BY_TAB[active] || "";
  const canEditSection =
    !SYSTEM_MANAGED_SECTIONS.has(activeSection) &&
    (canManageEmployees ||
      (canEditOwnProfile && SELF_SERVICE_EDITABLE_SECTIONS.has(activeSection)));
  const activeDetails = TAB_DETAILS[active];
  const ActiveSectionIcon = activeDetails.icon;

  const saveHeaderPhoto = async (file: File | null) => {
    if (!file || !canEditProfile) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
      toast.error("Photo must be PNG, JPEG, WebP, or GIF");
      return;
    }
    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      toast.error("Photo must be 2 MB or smaller");
      return;
    }

    setPhotoSaving(true);
    try {
      const photoUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Unable to read the selected photo"));
        reader.readAsDataURL(file);
      });
      const result = await updateEmployee(employee.id, { photoUrl });
      setEmployee(result.employee);
      toast.success("Employee photo updated");
    } catch (photoError) {
      toast.error(photoError instanceof Error ? photoError.message : "Unable to update photo");
    } finally {
      setPhotoSaving(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const deleteHeaderPhoto = async () => {
    if (!canEditProfile || !employee.photoUrl || photoSaving) return;
    if (!window.confirm("Delete this employee photo?")) return;

    setPhotoSaving(true);
    try {
      const result = await updateEmployee(employee.id, { photoUrl: "" });
      setEmployee(result.employee);
      toast.success("Employee photo deleted");
    } catch (photoError) {
      toast.error(photoError instanceof Error ? photoError.message : "Unable to delete photo");
    } finally {
      setPhotoSaving(false);
    }
  };

  const requestSectionAdd = () =>
    setSectionActionRequest((current) => ({
      tab: active,
      nonce: current.nonce + 1,
    }));

  return (
    <AppShell
      title="201 File – Personal Data Record"
      subtitle={`${employee.employeeId} · ${formatEmployeeName(employee)}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Link
              to="/employees"
              search={{
                department: undefined,
                onboard: undefined,
                targetPlantillaItemId: undefined,
              }}
              className="inline-flex items-center gap-1.5 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              201 Files
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">My 201 Files</span>
            <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 sm:block" aria-hidden="true" />
            <span className="hidden max-w-[360px] truncate font-medium text-foreground sm:block">
              {formatEmployeeName(employee)}
            </span>
          </nav>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {active === "WORK EXPERIENCE" && (
              <Button
                variant="outline"
                onClick={() => setWorkDownloadRequest((current) => current + 1)}
              >
                <Download className="h-4 w-4" />
                Generate WES
              </Button>
            )}
            {active === "PERSONAL" && canEditProfile ? (
              <Button type="submit" form="employee-personal-form">
                <Pencil className="h-4 w-4" />
                Update
              </Button>
            ) : SECTION_BY_TAB[active] && canEditSection ? (
              <Button onClick={requestSectionAdd}>
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
            ) : null}
          </div>
        </div>

        <EmployeeSummaryCard
          assignment={currentAssignment}
          employee={employee}
          canEditPhoto={canEditProfile}
          photoSaving={photoSaving}
          photoInputRef={photoInputRef}
          onPhotoSelected={saveHeaderPhoto}
          onDeletePhoto={deleteHeaderPhoto}
        />
      </div>

      {employee.isHidden && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This employee is archived and excluded from active workforce lists, dashboard totals, and
          downstream selections.
        </div>
      )}

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20">
          <button
            type="button"
            aria-expanded={mobileNavOpen}
            aria-controls="employee-file-mobile-sections"
            onClick={() => setMobileNavOpen((current) => !current)}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm lg:hidden"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <ActiveSectionIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-muted-foreground">Form section</span>
              <span className="block truncate text-sm font-semibold">{activeDetails.label}</span>
            </span>
            <Menu className="h-4 w-4 text-muted-foreground" />
          </button>
          <div
            id="employee-file-mobile-sections"
            className={cn(
              "mt-2 rounded-xl border border-border bg-card p-3 shadow-sm lg:mt-0 lg:block",
              mobileNavOpen ? "block" : "hidden",
            )}
          >
            <div className="mb-3 px-2">
              <h2 className="text-sm font-semibold">Form Sections</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Select a section of the employee record.
              </p>
            </div>
            <EmployeeFileStepper
              active={active}
              onChange={(next) => {
                setActive(next);
                setMobileNavOpen(false);
              }}
            />
          </div>
        </aside>

        <section className="min-w-0 rounded-xl border border-border bg-card shadow-sm">
          <header className="flex items-start gap-3 border-b border-border px-4 py-4 sm:px-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <ActiveSectionIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold">
                {activeDetails.number}. {activeDetails.label}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{activeDetails.description}</p>
            </div>
          </header>

          <div className="p-3 sm:p-4">
            {active === "PERSONAL" ? (
              <PersonalTab
                employee={employee}
                options={options}
                organizationOptions={organizationOptions}
                organizationFieldLabel={organizationFieldLabel}
                canEdit={canEditProfile}
                selfService={Boolean(canEditOwnProfile && !canManageEmployees)}
                currentAssignment={currentAssignment}
                onSaved={(updated) => setEmployee(updated)}
              />
            ) : active === "LEAVE BALANCE" ? (
              <LeaveBalanceTab employeeId={employee.id} />
            ) : (
              <SectionTab
                employeeId={employee.id}
                section={SECTION_BY_TAB[active] || ""}
                title={activeDetails.label}
                rows={sections[SECTION_BY_TAB[active] || ""] || []}
                canEdit={canEditSection}
                onChange={load}
                addRequestKey={sectionActionRequest.tab === active ? sectionActionRequest.nonce : 0}
                downloadRequestKey={active === "WORK EXPERIENCE" ? workDownloadRequest : 0}
              />
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function EmployeeFileStepper({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav aria-label="201 File sections" className="space-y-0.5">
      {TABS.map((tab, index) => {
        const details = TAB_DETAILS[tab];
        const Icon = details.icon;
        const isActive = tab === active;
        return (
          <div key={tab} className="relative">
            {index < TABS.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute left-[21px] top-10 h-[calc(100%-24px)] w-px bg-border"
              />
            )}
            <button
              type="button"
              aria-current={isActive ? "step" : undefined}
              onClick={() => onChange(tab)}
              className={cn(
                "relative z-[1] flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                isActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full border bg-card transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="truncate">{details.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}

function EmployeeSummaryCard({
  assignment,
  employee,
  canEditPhoto,
  photoSaving,
  photoInputRef,
  onPhotoSelected,
  onDeletePhoto,
}: {
  assignment: CurrentAssignment;
  employee: EmployeeRecord;
  canEditPhoto: boolean;
  photoSaving: boolean;
  photoInputRef: RefObject<HTMLInputElement | null>;
  onPhotoSelected: (file: File | null) => void;
  onDeletePhoto: () => void;
}) {
  const substantive = assignment.substantive;
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="group relative shrink-0">
            <Avatar className="h-20 w-20 border border-border ring-4 ring-muted/60">
              {employee.photoUrl && (
                <AvatarImage
                  src={employee.photoUrl}
                  alt={formatEmployeeName(employee)}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {employee.firstname[0] || "?"}
                {employee.lastname[0] || "?"}
              </AvatarFallback>
              {canEditPhoto && (
                <span className="absolute inset-x-0 bottom-0 z-10 flex bg-slate-950/80 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <button
                    type="button"
                    disabled={photoSaving}
                    onClick={() => photoInputRef.current?.click()}
                    aria-label="Upload employee photo"
                    title="Upload photo"
                    className="grid h-7 flex-1 place-items-center hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white disabled:opacity-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={photoSaving || !employee.photoUrl}
                    onClick={onDeletePhoto}
                    aria-label="Delete employee photo"
                    title="Delete photo"
                    className="grid h-7 flex-1 place-items-center border-l border-white/25 hover:bg-red-600/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
            </Avatar>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              disabled={!canEditPhoto || photoSaving}
              onChange={(event) => onPhotoSelected(event.currentTarget.files?.[0] || null)}
            />
          </div>
          <div className="min-w-0 sm:flex sm:items-center sm:gap-5">
            <div className="shrink-0 border-border sm:border-r sm:pr-5">
              <p className="text-xs font-medium text-muted-foreground">Employee ID</p>
              <p className="mt-1 font-mono text-base font-semibold">{employee.employeeId || "-"}</p>
            </div>
            <div className="mt-2 min-w-0 sm:mt-0">
              <h1 className="truncate text-lg font-semibold sm:text-xl">
                {formatEmployeeName(employee)}
              </h1>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {substantive?.position || employee.position || "No active assignment"}
              </p>
            </div>
          </div>
        </div>
        <Badge
          variant={substantive ? "default" : "secondary"}
          className="self-start sm:self-center"
        >
          {substantive?.kind || employee.lifecycleState || "Personal record"}
        </Badge>
      </div>

      <div className="grid border-t border-border sm:grid-cols-2 xl:grid-cols-3">
        <SummaryGroup icon={Building2}>
          <AssignmentValue
            label="Organization"
            value={
              substantive?.organizationPath?.join(" / ") ||
              substantive?.organization ||
              employee.department ||
              "-"
            }
          />
          <AssignmentValue
            label="Appointment type"
            value={substantive?.appointmentType || employee.status || "-"}
          />
        </SummaryGroup>
        <SummaryGroup icon={CalendarDays}>
          <AssignmentValue
            label="Effectivity date"
            value={
              substantive
                ? `${formatDisplayDate(substantive.dateFrom)}${substantive.dateTo ? ` to ${formatDisplayDate(substantive.dateTo)}` : ""}`
                : formatDisplayDate(employee.dateEmployed || employee.dateHired, "-")
            }
          />
          <AssignmentValue label="Authority" value={substantive?.authorityNumber || "-"} />
        </SummaryGroup>
        <SummaryGroup icon={CircleDollarSign} className="sm:col-span-2 xl:col-span-1">
          <AssignmentValue
            label="Salary / rate"
            value={
              substantive?.salaryGrade
                ? `SG ${substantive.salaryGrade.grade}, Step ${substantive.salaryGrade.step} · Monthly PHP ${substantive.salaryGrade.amount.toLocaleString()}`
                : substantive?.rate != null
                  ? `PHP ${substantive.rate.toLocaleString()}`
                  : "-"
            }
          />
          <AssignmentValue label="Funding" value={substantive?.fundingSource || "-"} />
        </SummaryGroup>
      </div>

      {!substantive && (
        <div className="border-t border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground sm:px-5">
          This person has no active Plantilla occupancy or non-Plantilla engagement. Legacy office,
          position, and item values are shown only as record context.
        </div>
      )}
      {assignment.temporary && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:px-5">
          <strong>{assignment.temporary.type}:</strong>{" "}
          {assignment.temporary.position || "Temporary assignment"}
          {assignment.temporary.organization
            ? ` · ${assignment.temporary.organization}`
            : ""} · {formatDisplayDate(assignment.temporary.dateFrom)} to{" "}
          {formatDisplayDate(assignment.temporary.dateTo)}
        </div>
      )}
    </section>
  );
}

function SummaryGroup({
  icon: Icon,
  className,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 border-b border-border p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0",
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="grid min-w-0 flex-1 gap-3">{children}</div>
    </div>
  );
}

function AssignmentValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 break-words text-sm font-medium">{value}</div>
    </div>
  );
}

function PersonalTab({
  employee,
  options,
  organizationOptions,
  organizationFieldLabel,
  canEdit,
  selfService,
  currentAssignment,
  onSaved,
}: {
  employee: EmployeeRecord;
  options: SettingsOptions;
  organizationOptions: Array<{ id: number; name: string; label: string }>;
  organizationFieldLabel: string;
  canEdit: boolean;
  selfService: boolean;
  currentAssignment: CurrentAssignment;
  onSaved: (employee: EmployeeRecord) => void;
}) {
  const [form, setForm] = useState<EmployeeRecord>(employee);
  const currentOrganizationValue = form.currentOrganizationId
    ? String(form.currentOrganizationId)
    : form.department
      ? `legacy:${form.department}`
      : "";
  const organizationSelectOptions = [
    ...organizationOptions.map((organization) => ({
      value: String(organization.id),
      label: organization.label,
    })),
    ...(form.department &&
    !organizationOptions.some(
      (organization) =>
        organization.id === form.currentOrganizationId || organization.name === form.department,
    )
      ? [{ value: `legacy:${form.department}`, label: form.department }]
      : []),
  ];
  const positions = options.positions
    .map((position) => position.title)
    .sort((left, right) =>
      left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }),
    );
  const hasPlantillaOccupancy = currentAssignment.substantive?.kind === "Plantilla";

  const set = (key: keyof EmployeeRecord, value: EmployeeRecord[keyof EmployeeRecord]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    try {
      const result = await updateEmployee(employee.id, { ...form, photoUrl: undefined });
      onSaved(result.employee);
      setForm(result.employee);
      toast.success("Personal information saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save employee");
    }
  };

  return (
    <form
      id="employee-personal-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (canEdit) void save();
      }}
    >
      {!selfService && (
        <FormSection title="Employment">
          <Field label="Employee ID">
            <Input value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)} />
          </Field>
          <Field label="Biometric ID">
            <Input
              value={form.biometricId}
              onChange={(e) => set("biometricId", e.target.value)}
              placeholder="Device user ID / attendance ID"
            />
          </Field>
          <Field label={organizationFieldLabel} required={!hasPlantillaOccupancy}>
            <Combobox
              value={currentOrganizationValue}
              onValueChange={(value) => {
                const organization = organizationOptions.find(
                  (option) => String(option.id) === value,
                );
                setForm((current) => ({
                  ...current,
                  currentOrganizationId: organization?.id || null,
                  department: organization?.name || value.replace(/^legacy:/, ""),
                }));
              }}
              placeholder={`Select ${organizationFieldLabel.toLowerCase()}`}
              searchPlaceholder={`Search ${organizationFieldLabel.toLowerCase()}...`}
              emptyText={`No ${organizationFieldLabel.toLowerCase()} records found.`}
              options={organizationSelectOptions}
              triggerProps={{ disabled: hasPlantillaOccupancy }}
            />
          </Field>
          <Field label="Position" required={!hasPlantillaOccupancy}>
            <Combobox
              value={form.position}
              onValueChange={(value) => set("position", value)}
              placeholder="Select position"
              searchPlaceholder="Search positions..."
              emptyText="No positions found."
              options={positions.map((position) => ({
                value: position,
                label: position,
              }))}
              triggerProps={{ disabled: hasPlantillaOccupancy }}
            />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(value) => set("status", value)}>
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
          <Field label="Level">
            <Select
              value={form.level || "none"}
              onValueChange={(value) => set("level", value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {EMPLOYEE_LEVELS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status Class">
            <Input value={form.statusClass} onChange={(e) => set("statusClass", e.target.value)} />
          </Field>
          <Field label="Date Hired">
            <Input
              type="date"
              value={form.dateHired}
              onChange={(e) => set("dateHired", e.target.value)}
            />
          </Field>
          <Field label="Date Employed">
            <Input
              type="date"
              value={form.dateEmployed}
              onChange={(e) => set("dateEmployed", e.target.value)}
            />
          </Field>
          <Field label="Item No">
            <Input
              disabled={hasPlantillaOccupancy}
              value={form.itemNo}
              onChange={(e) => set("itemNo", e.target.value)}
            />
          </Field>
          <Field label="Employment Status">
            <RadioGroup
              value={form.empStatus}
              onValueChange={(value) => set("empStatus", value)}
              className="flex gap-4 pt-1"
            >
              <RadioItem id="emp-active" value="Active" label="Active" />
              <RadioItem id="emp-inactive" value="Inactive" label="Inactive" />
            </RadioGroup>
          </Field>
          <Field label="DTR Noter">
            <RadioGroup
              value={form.isDtrNoter ? "yes" : "no"}
              onValueChange={(value) => set("isDtrNoter", value === "yes")}
              className="flex gap-4 pt-1"
            >
              <RadioItem id="dtr-noter-yes" value="yes" label="Yes" />
              <RadioItem id="dtr-noter-no" value="no" label="No" />
            </RadioGroup>
          </Field>
          <Field label="DTR Signatory">
            <Input
              value={form.dtrSignatory.toUpperCase()}
              onChange={(e) => set("dtrSignatory", e.target.value.toUpperCase())}
              placeholder={formatDtrSignatoryName(form)}
            />
          </Field>
        </FormSection>
      )}

      <FormSection title="Identity">
        <Field label="Lastname" required>
          <Input value={form.lastname} onChange={(e) => set("lastname", e.target.value)} />
        </Field>
        <Field label="Firstname" required>
          <Input value={form.firstname} onChange={(e) => set("firstname", e.target.value)} />
        </Field>
        <Field label="Middlename">
          <Input value={form.middlename} onChange={(e) => set("middlename", e.target.value)} />
        </Field>
        <Field label="Name Extension">
          <Input value={form.nameExt} onChange={(e) => set("nameExt", e.target.value)} />
        </Field>
        <Field label="Birthday">
          <Input
            type="date"
            value={form.birthday}
            onChange={(e) => set("birthday", e.target.value)}
          />
        </Field>
        <Field label="Gender">
          <RadioGroup
            value={form.gender}
            onValueChange={(value) => set("gender", value)}
            className="flex gap-3 pt-1"
          >
            {GENDERS.map((item) => (
              <RadioItem key={item} id={`gender-${item}`} value={item} label={item} />
            ))}
          </RadioGroup>
        </Field>
        <Field label="Civil Status">
          <Select
            value={form.civilStatus || "none"}
            onValueChange={(value) => set("civilStatus", value === "none" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              {CIVIL_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Citizenship">
          <Input value={form.citizenship} onChange={(e) => set("citizenship", e.target.value)} />
        </Field>
        <Field label="Place of Birth" className="md:col-span-2 xl:col-span-4">
          <Textarea
            value={form.placeOfBirth}
            onChange={(e) => set("placeOfBirth", e.target.value)}
            rows={2}
          />
        </Field>
      </FormSection>

      <FormSection title="Body Measurements & Government IDs">
        <Field label="Height">
          <Input value={form.height} onChange={(e) => set("height", e.target.value)} />
        </Field>
        <Field label="Weight">
          <Input value={form.weight} onChange={(e) => set("weight", e.target.value)} />
        </Field>
        <Field label="Blood Type">
          <Input value={form.bloodType} onChange={(e) => set("bloodType", e.target.value)} />
        </Field>
        <Field label="SSS">
          <Input value={form.sss} onChange={(e) => set("sss", e.target.value)} />
        </Field>
        <Field label="GSIS">
          <Input value={form.gsis} onChange={(e) => set("gsis", e.target.value)} />
        </Field>
        <Field label="PAG-IBIG">
          <Input value={form.pagibig} onChange={(e) => set("pagibig", e.target.value)} />
        </Field>
        <Field label="TIN">
          <Input value={form.tin} onChange={(e) => set("tin", e.target.value)} />
        </Field>
        <Field label="PHILHEALTH">
          <Input value={form.philhealth} onChange={(e) => set("philhealth", e.target.value)} />
        </Field>
        <Field label="CTC No">
          <Input value={form.ctcNo} onChange={(e) => set("ctcNo", e.target.value)} />
        </Field>
        <Field label="CTC Place Issued">
          <Input
            value={form.ctcPlaceIssued}
            onChange={(e) => set("ctcPlaceIssued", e.target.value)}
          />
        </Field>
        <Field label="CTC Date Issued">
          <Input
            type="date"
            value={form.ctcDateIssued}
            onChange={(e) => set("ctcDateIssued", e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Contact & Address">
        <Field label="Cellphone No">
          <Input value={form.cellphoneNo} onChange={(e) => set("cellphoneNo", e.target.value)} />
        </Field>
        <Field label="Email Address" className="md:col-span-2">
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Residential Address" className="md:col-span-2 lg:col-span-3">
          <Textarea
            value={form.residentialAddress}
            onChange={(e) => set("residentialAddress", e.target.value)}
            rows={2}
          />
        </Field>
        <Field label="Residential Zipcode">
          <Input
            value={form.residentialZipcode}
            onChange={(e) => set("residentialZipcode", e.target.value)}
          />
        </Field>
        <Field label="Residential Telephone No" className="md:col-span-2">
          <Input
            value={form.residentialTelNo}
            onChange={(e) => set("residentialTelNo", e.target.value)}
          />
        </Field>
        <Field label="Permanent Address" className="md:col-span-2 lg:col-span-3">
          <Textarea
            value={form.permanentAddress}
            onChange={(e) => set("permanentAddress", e.target.value)}
            rows={2}
          />
        </Field>
        <Field label="Permanent Zipcode">
          <Input
            value={form.permanentZipcode}
            onChange={(e) => set("permanentZipcode", e.target.value)}
          />
        </Field>
        <Field label="Permanent Telephone No" className="md:col-span-2">
          <Input
            value={form.permanentTelNo}
            onChange={(e) => set("permanentTelNo", e.target.value)}
          />
        </Field>
      </FormSection>
    </form>
  );
}

function SectionTab({
  employeeId,
  section,
  title,
  rows,
  canEdit,
  onChange,
  addRequestKey,
  downloadRequestKey,
}: {
  employeeId: string;
  section: string;
  title: string;
  rows: SectionRow[];
  canEdit: boolean;
  onChange: () => void;
  addRequestKey: number;
  downloadRequestKey: number;
}) {
  const fields = useMemo(() => SECTION_FIELDS[section] || [], [section]);
  const dateRange = SECTION_DATE_RANGES[section];
  const blank = useMemo(() => Object.fromEntries(fields.map((field) => [field.key, ""])), [fields]);
  const [form, setForm] = useState<Record<string, string | number | boolean | null>>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const generatingWesRef = useRef(false);

  useEffect(() => {
    setForm(blank);
    setEditingId(null);
    setShowForm(false);
  }, [blank]);
  useEffect(() => {
    if (addRequestKey <= 0 || !canEdit) return;
    setForm(blank);
    setEditingId(null);
    setShowForm(true);
  }, [addRequestKey, blank, canEdit]);
  useEffect(() => {
    if (downloadRequestKey <= 0 || section !== "work" || generatingWesRef.current) return;
    generatingWesRef.current = true;
    generateEmployeeWesDocx(employeeId)
      .then((result) => {
        toast.success("Work Experience Sheet generated");
        window.location.href = result.downloadUrl;
      })
      .catch((err) =>
        toast.error(
          err instanceof Error ? err.message : "Unable to generate Work Experience Sheet",
        ),
      )
      .finally(() => {
        generatingWesRef.current = false;
      });
  }, [downloadRequestKey, employeeId, section]);

  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const setFile = (key: string, file: File | null) => {
    if (!file) {
      setForm((current) => ({
        ...current,
        [key]: "",
        [`${key}Data`]: "",
        [`${key}Type`]: "",
        [`${key}Size`]: "",
      }));
      return;
    }
    if (file.size > MAX_201_FILE_BYTES) {
      toast.error("File must be 8 MB or smaller");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((current) => ({
        ...current,
        [key]: file.name,
        [`${key}Data`]: String(reader.result || ""),
        [`${key}Type`]: file.type || "application/octet-stream",
        [`${key}Size`]: String(file.size),
      }));
    };
    reader.readAsDataURL(file);
  };
  const clear = () => {
    setForm(blank);
    setEditingId(null);
    setShowForm(false);
  };
  const save = async () => {
    try {
      if (editingId) {
        await updateSectionRow(employeeId, section, editingId, form);
        toast.success("Record updated");
      } else {
        await createSectionRow(employeeId, section, form);
        toast.success("Record added");
      }
      clear();
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save record");
    }
  };
  const edit = (row: SectionRow) => {
    setForm({ ...blank, ...row.payload });
    setEditingId(row.id);
    setShowForm(true);
  };
  const remove = async (row: SectionRow) => {
    if (!window.confirm("Delete this 201 record?")) return;
    try {
      await deleteSectionRow(employeeId, section, row.id);
      toast.success("Record deleted");
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete record");
    }
  };
  return (
    <div>
      {section === "work" ? (
        <WorkExperienceRecords rows={rows} canEdit={canEdit} onEdit={edit} onDelete={remove} />
      ) : (
        <RecordTable
          fields={fields}
          rows={rows}
          canEdit={canEdit}
          onEdit={edit}
          onDelete={remove}
        />
      )}
      <Dialog open={showForm} onOpenChange={(open) => (open ? setShowForm(true) : clear())}>
        <DialogContent className="grid max-h-[90vh] w-[calc(100vw-2rem)] grid-rows-[auto_1fr_auto] gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-border px-5 py-4 pr-12">
            <DialogTitle>{editingId ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {fields.map((field) => {
                if (dateRange && field.key === dateRange.to) return null;
                if (dateRange && field.key === dateRange.from) {
                  return (
                    <Field key={field.key} label={dateRange.label} className="md:col-span-2">
                      <DateRangePicker
                        from={String(form[dateRange.from] ?? "")}
                        to={String(form[dateRange.to] ?? "")}
                        allowOpenEnded={dateRange.allowOpenEnded}
                        onApply={(from, to) =>
                          setForm((current) => ({
                            ...current,
                            [dateRange.from]: from,
                            [dateRange.to]: to,
                          }))
                        }
                      />
                    </Field>
                  );
                }
                return (
                  <Field
                    key={field.key}
                    label={field.label}
                    className={field.type === "textarea" ? "md:col-span-2" : undefined}
                  >
                    {section === "work" && field.key === "accomplishments" ? (
                      <RepeatableTextRows
                        value={String(form.accomplishments ?? "")}
                        onChange={(value) => set("accomplishments", value)}
                      />
                    ) : (
                      <SectionInput
                        field={field}
                        value={String(form[field.key] ?? "")}
                        onChange={(value) => set(field.key, value)}
                        onFileChange={(file) => setFile(field.key, file)}
                      />
                    )}
                  </Field>
                );
              })}
            </div>
          </div>
          <DialogFooter className="flex-row flex-wrap justify-end gap-2 border-t border-border px-5 py-4 sm:space-x-0">
            <Button variant="outline" onClick={clear}>
              Cancel
            </Button>
            <Button
              disabled={!canEdit}
              onClick={save}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {editingId ? (
                <Pencil className="mr-1.5 h-4 w-4" />
              ) : (
                <Plus className="mr-1.5 h-4 w-4" />
              )}
              {editingId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionInput({
  field,
  value,
  onChange,
  onFileChange,
}: {
  field: FieldConfig;
  value: string;
  onChange: (value: string) => void;
  onFileChange?: (file: File | null) => void;
}) {
  if (field.type === "textarea")
    return <Textarea value={value} onChange={(event) => onChange(event.target.value)} rows={2} />;
  if (field.type === "file") {
    return (
      <div className="space-y-2">
        <Input type="file" onChange={(event) => onFileChange?.(event.target.files?.[0] || null)} />
        {value && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span className="truncate">{value}</span>
            <button type="button" className="text-destructive" onClick={() => onFileChange?.(null)}>
              Remove
            </button>
          </div>
        )}
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <Select
        value={value || "none"}
        onValueChange={(next) => onChange(next === "none" ? "" : next)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Not specified</SelectItem>
          {(field.options || []).map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  return (
    <Input
      type={field.type || "text"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function workDateTime(row: SectionRow) {
  const dateTo = String(row.payload.dateTo || "")
    .trim()
    .toLowerCase();
  if (!dateTo || dateTo === "present" || dateTo === "current") return Number.MAX_SAFE_INTEGER;

  const endTime = new Date(dateTo).getTime();
  if (Number.isFinite(endTime)) return endTime;

  const dateFrom = String(row.payload.dateFrom || "");
  const startTime = dateFrom ? new Date(dateFrom).getTime() : 0;
  return Number.isFinite(startTime) ? startTime : 0;
}

function formatRecordDate(value: unknown, present = false) {
  const raw = String(value ?? "").trim();
  if (!raw) return present ? "Present" : "";
  if (["present", "current"].includes(raw.toLowerCase())) return "Present";

  return formatDisplayDate(raw, raw);
}

function formatDuration(payload: SectionRow["payload"]) {
  const from = formatRecordDate(payload.dateFrom);
  const to = formatRecordDate(payload.dateTo, true);
  if (from && to) return `${from} - ${to}`;
  return from || to || "";
}

function plainValue(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || "-";
}

function WesDetail({ label, value, wide }: { label: string; value: unknown; wide?: boolean }) {
  return (
    <div className={cn("min-w-0 border-b border-border/60 pb-3", wide && "lg:col-span-2")}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-foreground">
        {plainValue(value)}
      </p>
    </div>
  );
}

function WorkExperienceRecords({
  rows,
  canEdit,
  onEdit,
  onDelete,
}: {
  rows: SectionRow[];
  canEdit: boolean;
  onEdit: (row: SectionRow) => void;
  onDelete: (row: SectionRow) => void;
}) {
  const sortedRows = [...rows].sort((a, b) => workDateTime(b) - workDateTime(a));
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(() => new Set());

  const setRowExpanded = (rowId: string | number, open: boolean) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (open) next.add(rowId);
      else next.delete(rowId);
      return next;
    });
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        No work experience records found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedRows.map((row) => {
        const isExpanded = expandedRows.has(row.id);
        return (
          <Collapsible
            key={row.id}
            asChild
            open={isExpanded}
            onOpenChange={(open) => setRowExpanded(row.id, open)}
          >
            <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div
                className={cn(
                  "flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between",
                  isExpanded && "border-b border-border pb-4",
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {plainValue(formatDuration(row.payload))}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plainValue(row.payload.position)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {plainValue(row.payload.officeUnit || row.payload.agencyOrganizationLocation)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" aria-label="Toggle work experience details">
                      Details
                      <ChevronDown
                        className={cn(
                          "ml-1.5 h-4 w-4 transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  {canEdit && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => onEdit(row)}>
                        <Pencil className="mr-1.5 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(row)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <CollapsibleContent>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <WesDetail label="Duration" value={formatDuration(row.payload)} />
                  <WesDetail label="Position" value={row.payload.position} />
                  <WesDetail label="Name of Office / Unit" value={row.payload.officeUnit} />
                  <WesDetail label="Immediate Supervisor" value={row.payload.immediateSupervisor} />
                  <WesDetail
                    label="Name of Agency / Organization and Location"
                    value={row.payload.agencyOrganizationLocation || row.payload.company}
                    wide
                  />
                  <WesDetail
                    label="List of Accomplishments and Contributions (if any)"
                    value={row.payload.accomplishments}
                    wide
                  />
                  <WesDetail
                    label="Summary of Actual Duties"
                    value={row.payload.actualDuties}
                    wide
                  />
                </div>
              </CollapsibleContent>
            </article>
          </Collapsible>
        );
      })}
    </div>
  );
}

function RecordTable({
  fields,
  rows,
  canEdit,
  onEdit,
  onDelete,
}: {
  fields: FieldConfig[];
  rows: SectionRow[];
  canEdit: boolean;
  onEdit: (row: SectionRow) => void;
  onDelete: (row: SectionRow) => void;
}) {
  const visibleFields = fields.slice(0, 6);
  return (
    <div className="my-2 overflow-hidden rounded-xl border border-border bg-card">
      <div className="mobile-record-list">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No records found.
          </div>
        ) : (
          rows.map((row) => (
            <article key={row.id} className="mobile-record-card">
              <div className="mobile-record-card__grid">
                {visibleFields.map((field) => (
                  <div key={field.key} className="mobile-record-card__field">
                    <span className="mobile-record-card__label">{field.label}</span>
                    <span className="mobile-record-card__value">
                      {renderSectionValue(field, row.payload) || "-"}
                    </span>
                  </div>
                ))}
              </div>
              {canEdit && (
                <div className="mobile-record-card__actions">
                  <Button variant="outline" size="sm" onClick={() => onEdit(row)}>
                    <Pencil className="mr-1.5 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(row)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      <div className="mobile-desktop-table overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              {visibleFields.map((field) => (
                <th key={field.key} className="px-3 py-2.5 font-medium">
                  {field.label}
                </th>
              ))}
              {canEdit && <th className="px-3 py-2.5 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleFields.length + 1}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border/50 last:border-0 hover:bg-muted/30",
                    index % 2 === 1 && "bg-muted/10",
                  )}
                >
                  {visibleFields.map((field) => (
                    <td key={field.key} className="whitespace-nowrap px-3 py-2.5">
                      {renderSectionValue(field, row.payload)}
                    </td>
                  ))}
                  {canEdit && (
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => onEdit(row)}
                          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(row)}
                          className="grid h-7 w-7 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderSectionValue(
  field: FieldConfig,
  payload: Record<string, string | number | boolean | null>,
) {
  const value = String(payload[field.key] ?? "");
  if (field.type === "date") return formatDisplayDate(value, "");
  if (field.type !== "file") return value;
  const data = String(payload[`${field.key}Data`] ?? "");
  if (!value) return "";
  if (!data) return value;
  return (
    <a
      href={data}
      download={value}
      className="inline-flex max-w-[220px] items-center gap-1 truncate text-primary hover:underline"
    >
      <Upload className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{value}</span>
    </a>
  );
}

function LeaveBalanceTab({ employeeId }: { employeeId: string }) {
  const [data, setData] = useState<EmployeeLeaveResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getEmployeeLeave(employeeId)
      .then(setData)
      .catch((error) => toast.error((error as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [employeeId]);
  useRealtimeRefresh(load, ["leave", "employees"]);
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground shadow-sm">
        Loading leave balances...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground shadow-sm">
        Unable to load leave balances.
      </div>
    );
  }

  const totalBalance = sumLeaveField(data.balances, "balance");
  const totalEarned = sumLeaveField(data.balances, "earned");
  const totalUsed = sumLeaveField(data.balances, "used");
  const totalAdjusted = sumLeaveField(data.balances, "adjusted");
  const latestLedgerEntries = data.ledger.slice(0, 8);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-4">
          <h3 className="text-sm font-semibold text-foreground">Leave Balance Overview</h3>
          <p className="text-xs text-muted-foreground">
            Available credits are shown first. Earned, used, and manual adjustments are kept in the
            same row for easy checking.
          </p>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
          <LeaveSummaryTile label="Available credits" value={totalBalance} tone="primary" />
          <LeaveSummaryTile label="Total earned" value={totalEarned} />
          <LeaveSummaryTile label="Total used" value={totalUsed} />
          <LeaveSummaryTile label="Adjustments" value={totalAdjusted} signed />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Leave Type</th>
                <th className="px-4 py-3 text-right font-medium">Available</th>
                <th className="px-4 py-3 text-right font-medium">Earned</th>
                <th className="px-4 py-3 text-right font-medium">Used</th>
                <th className="px-4 py-3 text-right font-medium">Adjustments</th>
              </tr>
            </thead>
            <tbody>
              {data.balances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No active leave types found.
                  </td>
                </tr>
              ) : (
                data.balances.map((balance) => (
                  <tr
                    key={balance.leaveTypeId}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <div className="font-medium leading-5 text-foreground">{balance.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Updated {formatDisplayDate(balance.updatedAt)}
                        </div>
                      </div>
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right text-lg font-semibold",
                        getBalanceTone(balance.balance),
                      )}
                    >
                      {formatLeaveNumber(balance.balance)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatLeaveNumber(balance.earned)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatLeaveNumber(balance.used)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatSignedLeaveNumber(balance.adjusted)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Leave Credit Activity</h3>
          <p className="text-xs text-muted-foreground">
            Latest credit additions, deductions, adjustments, and reversals.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">Leave</th>
                <th className="px-3 py-2.5 font-medium">Entry</th>
                <th className="px-3 py-2.5 text-right font-medium">Change</th>
                <th className="px-3 py-2.5 text-right font-medium">Balance</th>
                <th className="px-3 py-2.5 font-medium">Notes</th>
                <th className="px-3 py-2.5 font-medium">By</th>
              </tr>
            </thead>
            <tbody>
              {latestLedgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                    No ledger entries recorded yet.
                  </td>
                </tr>
              ) : (
                latestLedgerEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {formatDisplayDate(entry.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{entry.code}</div>
                      <div className="max-w-[160px] truncate text-xs text-muted-foreground">
                        {entry.name}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">{formatLedgerType(entry.entryType)}</td>
                    <td
                      className={cn(
                        "px-3 py-2.5 text-right font-semibold",
                        getBalanceTone(entry.balanceDelta),
                      )}
                    >
                      {formatSignedLeaveNumber(entry.balanceDelta)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-primary">
                      {formatLeaveNumber(entry.balanceAfter)}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 text-muted-foreground">
                      {entry.description || "-"}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {entry.createdByName || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data.ledger.length > latestLedgerEntries.length ? (
          <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
            Showing latest {latestLedgerEntries.length} of {data.ledger.length} ledger entries.
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Leave Applications</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Type</th>
                  <th className="px-3 py-2.5 font-medium">Dates</th>
                  <th className="px-3 py-2.5 font-medium">Days</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.applications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                      No leave applications recorded.
                    </td>
                  </tr>
                ) : (
                  data.applications.map((application) => (
                    <tr key={application.id} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-2.5">{application.leaveName}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {formatDisplayDate(application.dateFrom)} to{" "}
                        {formatDisplayDate(application.dateTo)}
                      </td>
                      <td className="px-3 py-2.5">
                        {formatLeaveNumber(application.daysRequested)}
                      </td>
                      <td className="px-3 py-2.5">
                        <WorkflowStatusBadge status={application.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Adjustment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Type</th>
                  <th className="px-3 py-2.5 font-medium">Amount</th>
                  <th className="px-3 py-2.5 font-medium">Reason</th>
                  <th className="px-3 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                      No adjustments recorded.
                    </td>
                  </tr>
                ) : (
                  data.adjustments.map((adjustment) => (
                    <tr key={adjustment.id} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-2.5">{adjustment.name}</td>
                      <td className="px-3 py-2.5 font-medium">
                        {formatLeaveNumber(adjustment.amount)}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2.5 text-muted-foreground">
                        {adjustment.reason || "-"}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {formatDisplayDate(adjustment.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function LeaveSummaryTile({
  label,
  value,
  tone = "default",
  signed = false,
}: {
  label: string;
  value: number;
  tone?: "default" | "primary";
  signed?: boolean;
}) {
  return (
    <div className="bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-2 text-2xl font-semibold",
          tone === "primary" ? "text-primary" : getBalanceTone(value),
        )}
      >
        {signed ? formatSignedLeaveNumber(value) : formatLeaveNumber(value)}
      </div>
    </div>
  );
}

function sumLeaveField(
  balances: LeaveBalance[],
  field: keyof Pick<LeaveBalance, "balance" | "earned" | "used" | "adjusted">,
) {
  return balances.reduce((total, balance) => total + Number(balance[field] || 0), 0);
}

function formatLeaveNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function formatSignedLeaveNumber(value: number) {
  if (value > 0) return `+${formatLeaveNumber(value)}`;
  return formatLeaveNumber(value);
}

function getBalanceTone(value: number) {
  if (value < 0) return "text-red-600";
  if (value > 0) return "text-emerald-700";
  return "text-muted-foreground";
}

function formatLedgerType(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
}

function RadioItem({ id, value, label }: { id: string; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <RadioGroupItem value={value} id={id} />
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
    </div>
  );
}
