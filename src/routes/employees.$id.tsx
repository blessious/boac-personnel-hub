import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil, Plus, Save, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  updateEmployee,
  updateSectionRow,
  type EmployeeRecord,
  type SectionRow,
  type SettingsOptions,
} from "@/lib/employees-api";
import {
  createLeaveAdjustment,
  getEmployeeLeave,
  type EmployeeLeaveResponse,
} from "@/lib/leave-api";
import { cn } from "@/lib/utils";

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

type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "date" | "number" | "textarea" | "select" | "file";
  options?: string[];
};

const MAX_201_FILE_BYTES = 8 * 1024 * 1024;

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
    { key: "position", label: "Position" },
    { key: "company", label: "Company / Office" },
    { key: "status", label: "Status" },
    { key: "dateFrom", label: "Date From", type: "date" },
    { key: "dateTo", label: "Date To", type: "date" },
    { key: "salary", label: "Salary" },
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
    { key: "tax", label: "Tax Exemption" },
    { key: "amount", label: "Salary Amount", type: "number" },
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

function EmployeeFile() {
  const { id } = useParams({ from: "/employees/$id" });
  const { can, user } = useAuth();
  const canManageEmployees = can("edit");
  const [active, setActive] = useState<Tab>("PERSONAL");
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [sections, setSections] = useState<Record<string, SectionRow[]>>({});
  const [options, setOptions] = useState<SettingsOptions>({
    departments: [],
    positions: [],
    salaryGrades: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    getEmployee(id)
      .then((result) => {
        setEmployee(result.employee);
        setSections(result.sections);
      })
      .catch((err) => setError(err.message || "Unable to load employee"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);
  useRealtimeRefresh(load, ["employees", "settings"]);
  useEffect(() => {
    getSettingsOptions()
      .then(setOptions)
      .catch(() => setOptions({ departments: [], positions: [], salaryGrades: [] }));
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
          <Link to="/employees" className="mt-4 inline-block text-sm text-primary">
            Back to list
          </Link>
        </div>
      </AppShell>
    );
  }

  const canEditOwnProfile = user?.role === "Employee" && user.employeeId === employee.id;
  const canEditProfile = canManageEmployees || canEditOwnProfile;

  return (
    <AppShell title="201 File" subtitle="Personnel record management">
      <div className="sticky top-16 z-10 -mx-3 flex items-center gap-3 border-b border-border bg-background/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4 xl:-mx-5 xl:px-5">
        <Link
          to="/employees"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {employee.firstname[0] || "?"}
            {employee.lastname[0] || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="hidden font-mono text-xs text-muted-foreground sm:block">
            {employee.employeeId}
          </div>
          <div className="truncate text-sm font-semibold sm:text-base">
            {employee.lastname}, {employee.firstname} {employee.middlename}
          </div>
        </div>
      </div>

      <div className="mt-4 border-b border-border">
        <div className="flex flex-wrap gap-x-1 sm:gap-x-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={cn(
                "relative px-3 py-2.5 text-xs font-medium transition-colors sm:text-sm",
                "after:absolute after:bottom-0 after:left-1 after:right-1 after:h-[2px] after:rounded-full",
                active === tab
                  ? "text-primary after:bg-primary"
                  : "text-muted-foreground after:bg-transparent hover:text-foreground",
              )}
            >
              {tab === "IPCR"
                ? "IPCR"
                : tab
                    .split(" ")
                    .map((word) => word[0] + word.slice(1).toLowerCase())
                    .join(" ")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {active === "PERSONAL" ? (
          <PersonalTab
            employee={employee}
            options={options}
            canEdit={canEditProfile}
            onSaved={(updated) => setEmployee(updated)}
          />
        ) : active === "LEAVE BALANCE" ? (
          <LeaveBalanceTab employeeId={employee.id} canEdit={canManageEmployees} />
        ) : (
          <SectionTab
            employeeId={employee.id}
            section={SECTION_BY_TAB[active] || ""}
            title={active}
            rows={sections[SECTION_BY_TAB[active] || ""] || []}
            canEdit={canEditProfile}
            onChange={load}
          />
        )}
      </div>
    </AppShell>
  );
}

function PersonalTab({
  employee,
  options,
  canEdit,
  onSaved,
}: {
  employee: EmployeeRecord;
  options: SettingsOptions;
  canEdit: boolean;
  onSaved: (employee: EmployeeRecord) => void;
}) {
  const [form, setForm] = useState<EmployeeRecord>(employee);
  const [departmentQuery, setDepartmentQuery] = useState("");
  const [positionQuery, setPositionQuery] = useState("");
  const departments = options.departments.map((department) => department.name);
  const positions = options.positions.map((position) => position.title);
  const filteredDepartments = useMemo(() => {
    const query = departmentQuery.trim().toLowerCase();
    if (!query) return departments;
    return departments.filter((department) => department.toLowerCase().includes(query));
  }, [departmentQuery, departments]);
  const filteredPositions = useMemo(() => {
    const query = positionQuery.trim().toLowerCase();
    if (!query) return positions;
    return positions.filter((position) => position.toLowerCase().includes(query));
  }, [positionQuery, positions]);

  const set = (key: keyof EmployeeRecord, value: EmployeeRecord[keyof EmployeeRecord]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    try {
      const result = await updateEmployee(employee.id, form);
      onSaved(result.employee);
      setForm(result.employee);
      toast.success("Personal information saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save employee");
    }
  };

  return (
    <div>
      <FormSection title="Employment">
        <Field label="Employee ID">
          <Input value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)} />
        </Field>
        <Field label="Department" required>
          <Select value={form.department} onValueChange={(value) => set("department", value)}>
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
                <div className="px-3 py-2 text-sm text-muted-foreground">No departments found.</div>
              )}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Position" required>
          <Select value={form.position} onValueChange={(value) => set("position", value)}>
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
                <div className="px-3 py-2 text-sm text-muted-foreground">No positions found.</div>
              )}
            </SelectContent>
          </Select>
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
          <Input value={form.itemNo} onChange={(e) => set("itemNo", e.target.value)} />
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
            value={form.dtrSignatory}
            onChange={(e) => set("dtrSignatory", e.target.value)}
            placeholder={`${form.firstname} ${form.lastname}`.trim()}
          />
        </Field>
        <Field label="Agency">
          <Input value={form.agency} onChange={(e) => set("agency", e.target.value)} />
        </Field>
        <Field label="Date Separated">
          <Input
            type="date"
            value={form.dateSeparated}
            onChange={(e) => set("dateSeparated", e.target.value)}
          />
        </Field>
      </FormSection>

      <section className="mb-3 rounded-xl border border-border bg-card/50 p-3">
        <h4 className="mb-2.5 text-sm font-semibold text-foreground">Identity</h4>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_164px] xl:items-start">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
              <Input
                value={form.citizenship}
                onChange={(e) => set("citizenship", e.target.value)}
              />
            </Field>
            <Field label="Place of Birth" className="md:col-span-2 xl:col-span-3">
              <Textarea
                value={form.placeOfBirth}
                onChange={(e) => set("placeOfBirth", e.target.value)}
                rows={2}
              />
            </Field>
          </div>
          <Field label="Photo" className="justify-self-start xl:justify-self-end xl:pt-1">
            <div className="flex flex-col items-start gap-2">
              <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/30">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="Employee" className="h-full w-full object-cover" />
                ) : (
                  <span className="px-2 text-center text-xs text-muted-foreground">No photo</span>
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
                <Upload className="h-4 w-4" /> Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => set("photoUrl", String(reader.result || ""));
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
          </Field>
        </div>
      </section>

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

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => setForm(employee)}>
          Cancel
        </Button>
        <Button
          disabled={!canEdit}
          onClick={save}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Save className="mr-1.5 h-4 w-4" /> Save Personal Info
        </Button>
      </div>
    </div>
  );
}

function SectionTab({
  employeeId,
  section,
  title,
  rows,
  canEdit,
  onChange,
}: {
  employeeId: string;
  section: string;
  title: string;
  rows: SectionRow[];
  canEdit: boolean;
  onChange: () => void;
}) {
  const fields = useMemo(() => SECTION_FIELDS[section] || [], [section]);
  const blank = useMemo(() => Object.fromEntries(fields.map((field) => [field.key, ""])), [fields]);
  const [form, setForm] = useState<Record<string, string | number | boolean | null>>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setForm(blank);
    setEditingId(null);
    setShowForm(false);
  }, [blank]);

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
  const add = () => {
    setForm(blank);
    setEditingId(null);
    setShowForm(true);
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
      <div className="mb-4 flex justify-end gap-2">
        <Button
          disabled={!canEdit}
          onClick={add}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add
        </Button>
      </div>
      <RecordTable fields={fields} rows={rows} canEdit={canEdit} onEdit={edit} onDelete={remove} />
      <Dialog open={showForm} onOpenChange={(open) => (open ? setShowForm(true) : clear())}>
        <DialogContent className="grid max-h-[90vh] w-[calc(100vw-2rem)] grid-rows-[auto_1fr_auto] gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-border px-5 py-4 pr-12">
            <DialogTitle>{editingId ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {fields.map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  className={field.type === "textarea" ? "md:col-span-2" : undefined}
                >
                  <SectionInput
                    field={field}
                    value={String(form[field.key] ?? "")}
                    onChange={(value) => set(field.key, value)}
                    onFileChange={(file) => setFile(field.key, file)}
                  />
                </Field>
              ))}
            </div>
          </div>
          <DialogFooter className="flex-row flex-wrap justify-end gap-2 border-t border-border px-5 py-4 sm:space-x-0">
            <Button variant="outline" onClick={clear}>
              Cancel
            </Button>
            <Button
              disabled={!canEdit}
              onClick={save}
              className="bg-blue-600 text-white hover:bg-blue-700"
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

function LeaveBalanceTab({ employeeId, canEdit }: { employeeId: string; canEdit: boolean }) {
  const [data, setData] = useState<EmployeeLeaveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ leaveTypeId: "", amount: "", reason: "" });

  const load = () => {
    setLoading(true);
    getEmployeeLeave(employeeId)
      .then(setData)
      .catch((error) => toast.error((error as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [employeeId]);
  useRealtimeRefresh(load, ["leave", "employees"]);

  const submitAdjustment = async () => {
    try {
      const result = await createLeaveAdjustment(employeeId, {
        leaveTypeId: Number(form.leaveTypeId),
        amount: Number(form.amount),
        reason: form.reason,
      });
      setData(result);
      setForm({ leaveTypeId: "", amount: "", reason: "" });
      toast.success("Leave credit adjusted");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

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

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.balances.map((balance) => (
          <div
            key={balance.leaveTypeId}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {balance.code}
            </div>
            <div className="mt-1 min-h-10 text-sm font-semibold text-foreground">
              {balance.name}
            </div>
            <div className="mt-3 text-2xl font-semibold text-primary">
              {formatLeaveNumber(balance.balance)}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <span>Earned {formatLeaveNumber(balance.earned)}</span>
              <span>Used {formatLeaveNumber(balance.used)}</span>
              <span>Adj {formatLeaveNumber(balance.adjusted)}</span>
            </div>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Leave Credit Ledger</h3>
          <p className="text-xs text-muted-foreground">
            Every credit addition, deduction, adjustment, and reversal is recorded here.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">Type</th>
                <th className="px-3 py-2.5 font-medium">Entry</th>
                <th className="px-3 py-2.5 font-medium">Amount</th>
                <th className="px-3 py-2.5 font-medium">Balance Change</th>
                <th className="px-3 py-2.5 font-medium">Balance After</th>
                <th className="px-3 py-2.5 font-medium">Description</th>
                <th className="px-3 py-2.5 font-medium">By</th>
              </tr>
            </thead>
            <tbody>
              {data.ledger.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                    No ledger entries recorded yet.
                  </td>
                </tr>
              ) : (
                data.ledger.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2.5">{entry.name}</td>
                    <td className="px-3 py-2.5">{formatLedgerType(entry.entryType)}</td>
                    <td className="px-3 py-2.5 font-medium">{formatLeaveNumber(entry.amount)}</td>
                    <td className="px-3 py-2.5 font-medium">
                      {formatLeaveNumber(entry.balanceDelta)}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-primary">
                      {formatLeaveNumber(entry.balanceAfter)}
                    </td>
                    <td className="max-w-[260px] truncate px-3 py-2.5 text-muted-foreground">
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
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Leave Credit Adjustment</h3>
            <p className="text-xs text-muted-foreground">
              Use positive values to add credits and negative values to deduct corrections.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[220px_160px_minmax(0,1fr)_auto] md:items-end">
          <Field label="Leave Type">
            <Select
              value={form.leaveTypeId}
              onValueChange={(value) => setForm({ ...form, leaveTypeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {data.balances.map((balance) => (
                  <SelectItem key={balance.leaveTypeId} value={String(balance.leaveTypeId)}>
                    {balance.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Amount">
            <Input
              type="number"
              step="0.001"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </Field>
          <Field label="Reason">
            <Input
              value={form.reason}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
            />
          </Field>
          <Button
            disabled={!canEdit}
            onClick={submitAdjustment}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Save className="mr-1.5 h-4 w-4" /> Apply
          </Button>
        </div>
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
                        {application.dateFrom} to {application.dateTo}
                      </td>
                      <td className="px-3 py-2.5">
                        {formatLeaveNumber(application.daysRequested)}
                      </td>
                      <td className="px-3 py-2.5">{application.status}</td>
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
                        {new Date(adjustment.createdAt).toLocaleDateString()}
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

function formatLeaveNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
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
