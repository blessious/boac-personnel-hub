import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Save, Plus, Trash2, Pencil, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Field, FormSection } from "@/components/forms/Field";
import { useAuth } from "@/lib/auth";
import {
  EMPLOYEES, DEPARTMENTS, POSITIONS, SALARY_GRADES, SALARY_STEPS, SALARY_TABLE, STORE, uid,
  type ChildRecord, type EducationRecord, type CivilServiceRecord, type WorkRecord,
  type OrgRecord, type TrainingRecord, type SalaryRecord, type ServiceRecord,
  type LeaveRecord, type IPCRRecord,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employees/$id")({
  component: EmployeeFile,
});

const TABS = [
  "Personal", "Family", "Children", "Educational", "Civil Service",
  "Work Experience", "Organization", "Training", "Salary",
  "Service Record", "Leave Balance", "IPCR",
] as const;
type Tab = typeof TABS[number];

function EmployeeFile() {
  const { id } = useParams({ from: "/employees/$id" });
  const { can } = useAuth();
  const employee = EMPLOYEES.find((e) => e.id === id);
  const [active, setActive] = useState<Tab>("Personal");
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);

  if (!employee) {
    return (
      <AppShell title="Employee Not Found">
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No employee with ID {id}</p>
          <Link to="/employees" className="text-primary text-sm mt-4 inline-block">← Back to list</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="201 File" subtitle="Personnel record management">
      {/* Sticky top bar */}
      <div className="sticky top-16 z-10 -mx-6 px-6 py-3 bg-background/95 backdrop-blur border-b border-border flex items-center gap-4">
        <Link to="/employees" className="h-9 w-9 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {employee.firstname[0]}{employee.lastname[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground font-mono">{employee.refId}</div>
          <div className="font-semibold truncate">{employee.lastname}, {employee.firstname} {employee.middlename}</div>
        </div>
        <div className="ml-auto">
          <Button
            disabled={!can("edit")}
            onClick={() => toast.success("Record saved")}
            className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"
          >
            <Save className="h-4 w-4 mr-1.5" /> Save & Finish
          </Button>
        </div>
      </div>

      {/* Tab bar — horizontally scrollable, no wrap */}
      <div className="mt-4 -mx-6 px-6">
        <div className="flex gap-1 overflow-x-auto tab-scroll scrollbar-thin border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                active === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {active === "Personal" && <PersonalTab employee={employee} canEdit={can("edit")} />}
        {active === "Family" && <FamilyTab id={employee.id} canEdit={can("edit")} onChange={refresh} />}
        {active === "Children" && <ChildrenTab id={employee.id} canEdit={can("edit")} onChange={refresh} />}
        {active === "Educational" && <EducationTab id={employee.id} canEdit={can("edit")} onChange={refresh} />}
        {active === "Civil Service" && <CivilServiceTab id={employee.id} canEdit={can("edit")} onChange={refresh} />}
        {active === "Work Experience" && <WorkTab id={employee.id} canEdit={can("edit")} onChange={refresh} />}
        {active === "Organization" && <OrgTab id={employee.id} canEdit={can("edit")} onChange={refresh} />}
        {active === "Training" && <TrainingTab id={employee.id} canEdit={can("edit")} onChange={refresh} />}
        {active === "Salary" && <SalaryTab id={employee.id} canEdit={can("edit")} onChange={refresh} />}
        {active === "Service Record" && <ServiceTab id={employee.id} canEdit={can("edit")} onChange={refresh} />}
        {active === "Leave Balance" && <LeaveTab id={employee.id} canEdit={can("edit")} onChange={refresh} />}
        {active === "IPCR" && <IPCRTab id={employee.id} canEdit={can("edit")} onChange={refresh} />}
      </div>
    </AppShell>
  );
}

/* ---------------- TAB 1: PERSONAL ---------------- */
function PersonalTab({ employee, canEdit }: { employee: typeof EMPLOYEES[number]; canEdit: boolean }) {
  const [photo, setPhoto] = useState<string | undefined>(employee.photoUrl);

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const url = URL.createObjectURL(f); setPhoto(url);
  };

  return (
    <div>
      <FormSection title="Employment">
        <Field label="Department" required>
          <Select defaultValue={employee.department}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Position" required>
          <Select defaultValue={employee.position}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select defaultValue={employee.status}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PERMANENT">PERMANENT</SelectItem>
              <SelectItem value="CASUAL">CASUAL</SelectItem>
              <SelectItem value="CONTRACTUAL">CONTRACTUAL</SelectItem>
              <SelectItem value="COTERMINOUS">COTERMINOUS</SelectItem>
              <SelectItem value="ELECTED">ELECTED</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Level">
          <Select defaultValue={employee.level}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="First Level">First Level</SelectItem>
              <SelectItem value="Second Level">Second Level</SelectItem>
              <SelectItem value="Executive">Executive</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status Class">
          <Select defaultValue={employee.statusClass}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Administrative">Administrative</SelectItem>
              <SelectItem value="Legislative">Legislative</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Date Employed"><Input type="date" defaultValue={employee.dateEmployed} /></Field>
        <Field label="Item No"><Input defaultValue={employee.itemNo} /></Field>
        <Field label="Veterans Code"><Input defaultValue={employee.veteransCode} /></Field>
        <Field label="Bank Account ID"><Input defaultValue={employee.bankAccountId} /></Field>
        <Field label="Card Serial No"><Input defaultValue={employee.cardSerialNo} /></Field>
        <Field label="Employment Status">
          <RadioGroup defaultValue={employee.empStatus} className="flex gap-4 pt-1">
            <div className="flex items-center gap-2"><RadioGroupItem value="Employed" id="ems-1" /><Label htmlFor="ems-1" className="text-sm">Employed</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="Not Employed" id="ems-2" /><Label htmlFor="ems-2" className="text-sm">Not Employed</Label></div>
          </RadioGroup>
        </Field>
        <Field label="Agency"><Input defaultValue={employee.agency} /></Field>
        <Field label="Date Separated"><Input type="date" defaultValue={employee.dateSeparated} /></Field>
      </FormSection>

      <FormSection title="Identity">
        <Field label="Lastname" required><Input defaultValue={employee.lastname} /></Field>
        <Field label="Firstname" required><Input defaultValue={employee.firstname} /></Field>
        <Field label="Middlename"><Input defaultValue={employee.middlename} /></Field>
        <Field label="Name Extension"><Input defaultValue={employee.nameExt} placeholder="Jr., Sr., III" /></Field>
        <Field label="Birthday" required><Input type="date" defaultValue={employee.birthday} /></Field>
        <Field label="Gender">
          <RadioGroup defaultValue={employee.gender} className="flex gap-4 pt-1">
            <div className="flex items-center gap-2"><RadioGroupItem value="Male" id="g-1" /><Label htmlFor="g-1" className="text-sm">Male</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="Female" id="g-2" /><Label htmlFor="g-2" className="text-sm">Female</Label></div>
          </RadioGroup>
        </Field>
        <Field label="Civil Status">
          <Select defaultValue={employee.civilStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Single">Single</SelectItem>
              <SelectItem value="Married">Married</SelectItem>
              <SelectItem value="Widowed">Widowed</SelectItem>
              <SelectItem value="Separated">Separated</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Citizenship">
          <RadioGroup defaultValue={employee.citizenship} className="flex gap-4 pt-1">
            <div className="flex items-center gap-2"><RadioGroupItem value="Filipino" id="c-1" /><Label htmlFor="c-1" className="text-sm">Filipino</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="Foreigner" id="c-2" /><Label htmlFor="c-2" className="text-sm">Foreigner</Label></div>
          </RadioGroup>
        </Field>
        <Field label="Place of Birth" className="md:col-span-2 lg:col-span-3">
          <Textarea defaultValue={employee.placeOfBirth} rows={2} />
        </Field>
        <Field label="Photo" className="md:col-span-2 lg:col-span-3">
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 rounded-lg border border-dashed border-border grid place-items-center bg-muted/30 overflow-hidden">
              {photo
                ? <img src={photo} alt="" className="h-full w-full object-cover" />
                : <span className="text-xs text-muted-foreground">No photo</span>}
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-accent cursor-pointer text-sm">
              <Upload className="h-4 w-4" /> Upload
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
          </div>
        </Field>
      </FormSection>

      <FormSection title="Body Measurements & Government IDs">
        <Field label="Height">
          <div className="flex gap-2">
            <Input defaultValue={employee.height} />
            <Select defaultValue={employee.heightUnit ?? "M"}><SelectTrigger className="w-20"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="M">M</SelectItem><SelectItem value="FT">FT</SelectItem></SelectContent></Select>
          </div>
        </Field>
        <Field label="Weight">
          <div className="flex gap-2">
            <Input defaultValue={employee.weight} />
            <Select defaultValue={employee.weightUnit ?? "KL"}><SelectTrigger className="w-20"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="KL">KL</SelectItem><SelectItem value="LB">LB</SelectItem></SelectContent></Select>
          </div>
        </Field>
        <Field label="Blood Type"><Input defaultValue={employee.bloodType} /></Field>
        <Field label="SSS"><Input defaultValue={employee.sss} /></Field>
        <Field label="GSIS"><Input defaultValue={employee.gsis} /></Field>
        <Field label="PAG-IBIG"><Input defaultValue={employee.pagibig} /></Field>
        <Field label="TIN"><Input defaultValue={employee.tin} /></Field>
        <Field label="PHILHEALTH"><Input defaultValue={employee.philhealth} /></Field>
        <Field label="CTC No"><Input defaultValue={employee.ctcNo} /></Field>
        <Field label="CTC Place Issued"><Input defaultValue={employee.ctcPlaceIssued} /></Field>
        <Field label="CTC Date Issued"><Input type="date" defaultValue={employee.ctcDateIssued} /></Field>
      </FormSection>

      <FormSection title="Contact & Address">
        <Field label="Cellphone No"><Input defaultValue={employee.cellphoneNo} /></Field>
        <Field label="Email Address" className="md:col-span-2"><Input type="email" defaultValue={employee.email} /></Field>
        <Field label="Residential Address" className="md:col-span-2 lg:col-span-3">
          <Textarea defaultValue={employee.residentialAddress} rows={2} />
        </Field>
        <Field label="Residential Zipcode"><Input defaultValue={employee.residentialZipcode} /></Field>
        <Field label="Residential Telephone No" className="md:col-span-2"><Input defaultValue={employee.residentialTelNo} /></Field>
        <Field label="Permanent Address" className="md:col-span-2 lg:col-span-3">
          <Textarea defaultValue={employee.permanentAddress} rows={2} />
        </Field>
        <Field label="Permanent Zipcode"><Input defaultValue={employee.permanentZipcode} /></Field>
        <Field label="Permanent Telephone No" className="md:col-span-2"><Input defaultValue={employee.permanentTelNo} /></Field>
      </FormSection>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline">Cancel</Button>
        <Button disabled={!canEdit} onClick={() => toast.success("Personal info updated")} className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90">Update</Button>
      </div>
    </div>
  );
}

/* ---------------- Reusable simple text input bound to local state ---------------- */
function useRecordForm<T extends Record<string, unknown>>(initial: T) {
  const [state, setState] = useState<T>(initial);
  const set = <K extends keyof T>(k: K, v: T[K]) => setState((s) => ({ ...s, [k]: v }));
  const reset = () => setState(initial);
  return { state, set, reset, setState };
}

/* ---------------- TAB 2: FAMILY ---------------- */
function FamilyTab({ id, canEdit, onChange }: { id: string; canEdit: boolean; onChange: () => void }) {
  const existing = STORE.family[id] ?? {
    spouse: { lastname: "", firstname: "", middlename: "", occupation: "", employer: "", businessTel: "", businessAddress: "" },
    father: { lastname: "", firstname: "", middlename: "" },
    mother: { lastname: "", firstname: "", middlename: "" },
  };
  const [form, setForm] = useState(existing);

  const save = () => {
    STORE.family[id] = form;
    toast.success("Family record saved");
    onChange();
  };

  return (
    <div>
      <FormSection title="Spouse">
        <Field label="Lastname"><Input value={form.spouse.lastname} onChange={(e) => setForm({ ...form, spouse: { ...form.spouse, lastname: e.target.value } })} /></Field>
        <Field label="Firstname"><Input value={form.spouse.firstname} onChange={(e) => setForm({ ...form, spouse: { ...form.spouse, firstname: e.target.value } })} /></Field>
        <Field label="Middlename"><Input value={form.spouse.middlename} onChange={(e) => setForm({ ...form, spouse: { ...form.spouse, middlename: e.target.value } })} /></Field>
        <Field label="Occupation"><Input value={form.spouse.occupation} onChange={(e) => setForm({ ...form, spouse: { ...form.spouse, occupation: e.target.value } })} /></Field>
        <Field label="Employer"><Input value={form.spouse.employer} onChange={(e) => setForm({ ...form, spouse: { ...form.spouse, employer: e.target.value } })} /></Field>
        <Field label="Business Tel No"><Input value={form.spouse.businessTel} onChange={(e) => setForm({ ...form, spouse: { ...form.spouse, businessTel: e.target.value } })} /></Field>
        <Field label="Business Address" className="md:col-span-2 lg:col-span-3"><Textarea rows={2} value={form.spouse.businessAddress} onChange={(e) => setForm({ ...form, spouse: { ...form.spouse, businessAddress: e.target.value } })} /></Field>
      </FormSection>
      <FormSection title="Father">
        <Field label="Lastname"><Input value={form.father.lastname} onChange={(e) => setForm({ ...form, father: { ...form.father, lastname: e.target.value } })} /></Field>
        <Field label="Firstname"><Input value={form.father.firstname} onChange={(e) => setForm({ ...form, father: { ...form.father, firstname: e.target.value } })} /></Field>
        <Field label="Middlename"><Input value={form.father.middlename} onChange={(e) => setForm({ ...form, father: { ...form.father, middlename: e.target.value } })} /></Field>
      </FormSection>
      <FormSection title="Mother (Maiden)">
        <Field label="Lastname"><Input value={form.mother.lastname} onChange={(e) => setForm({ ...form, mother: { ...form.mother, lastname: e.target.value } })} /></Field>
        <Field label="Firstname"><Input value={form.mother.firstname} onChange={(e) => setForm({ ...form, mother: { ...form.mother, firstname: e.target.value } })} /></Field>
        <Field label="Middlename"><Input value={form.mother.middlename} onChange={(e) => setForm({ ...form, mother: { ...form.mother, middlename: e.target.value } })} /></Field>
      </FormSection>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => setForm(existing)}>Cancel</Button>
        <Button disabled={!canEdit} onClick={save} className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90">Save</Button>
      </div>
    </div>
  );
}

/* ---------------- TAB 3: CHILDREN ---------------- */
function ChildrenTab({ id, canEdit, onChange }: { id: string; canEdit: boolean; onChange: () => void }) {
  const list = STORE.children[id] ?? (STORE.children[id] = []);
  const blank: Omit<ChildRecord, "id"> = { lastname: "", firstname: "", middlename: "", gender: "Male", birthday: "" };
  const { state, set, reset } = useRecordForm(blank);

  const add = () => {
    if (!state.firstname || !state.lastname) { toast.error("Lastname and firstname required"); return; }
    list.push({ ...state, id: uid() });
    reset(); onChange(); toast.success("Child added");
  };
  const del = (cid: string) => { STORE.children[id] = list.filter((c) => c.id !== cid); onChange(); toast("Removed"); };

  return (
    <div>
      <FormSection title="Add Child">
        <Field label="Lastname"><Input value={state.lastname} onChange={(e) => set("lastname", e.target.value)} /></Field>
        <Field label="Firstname"><Input value={state.firstname} onChange={(e) => set("firstname", e.target.value)} /></Field>
        <Field label="Middlename"><Input value={state.middlename} onChange={(e) => set("middlename", e.target.value)} /></Field>
        <Field label="Gender">
          <RadioGroup value={state.gender} onValueChange={(v) => set("gender", v as "Male" | "Female")} className="flex gap-4 pt-1">
            <div className="flex items-center gap-2"><RadioGroupItem value="Male" id="ch-m" /><Label htmlFor="ch-m" className="text-sm">Male</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="Female" id="ch-f" /><Label htmlFor="ch-f" className="text-sm">Female</Label></div>
          </RadioGroup>
        </Field>
        <Field label="Birthday"><Input type="date" value={state.birthday} onChange={(e) => set("birthday", e.target.value)} /></Field>
      </FormSection>
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="outline" onClick={reset}>Cancel</Button>
        <Button disabled={!canEdit} onClick={add} className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>
      <RecordTable
        cols={["ID", "Lastname", "Firstname", "Middlename", "Gender", "Birthday"]}
        rows={list.map((c) => [c.id.slice(0, 5), c.lastname, c.firstname, c.middlename, c.gender, c.birthday])}
        onDelete={canEdit ? (i) => del(list[i].id) : undefined}
      />
    </div>
  );
}

/* ---------------- Reusable record table ---------------- */
function RecordTable({
  cols, rows, onDelete, onEdit,
}: {
  cols: string[];
  rows: (string | number)[][];
  onDelete?: (i: number) => void;
  onEdit?: (i: number) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
              {cols.map((c) => <th key={c} className="px-3 py-2.5 font-medium">{c}</th>)}
              {(onDelete || onEdit) && <th className="px-3 py-2.5 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={cols.length + 1} className="px-3 py-8 text-center text-muted-foreground text-sm">No Records Found!</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-muted/40" : ""}>
                {r.map((v, j) => <td key={j} className="px-3 py-2.5">{v}</td>)}
                {(onDelete || onEdit) && (
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      {onEdit && <button onClick={() => onEdit(i)} className="h-7 w-7 grid place-items-center rounded hover:bg-accent text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>}
                      {onDelete && <button onClick={() => onDelete(i)} className="h-7 w-7 grid place-items-center rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- TAB 4: EDUCATIONAL ---------------- */
function EducationTab({ id, canEdit, onChange }: { id: string; canEdit: boolean; onChange: () => void }) {
  const list = STORE.education[id] ?? (STORE.education[id] = []);
  const blank: Omit<EducationRecord, "id"> = { level: "College", school: "", degree: "", yearFrom: "", yearTo: "", yearGraduated: "", scholarship: "" };
  const { state, set, reset } = useRecordForm(blank);
  const add = () => {
    if (!state.school) { toast.error("School name required"); return; }
    list.push({ ...state, id: uid() }); reset(); onChange(); toast.success("Education added");
  };
  const del = (rid: string) => { STORE.education[id] = list.filter((x) => x.id !== rid); onChange(); };

  return (
    <div>
      <FormSection title="Add Education">
        <Field label="Level">
          <Select value={state.level} onValueChange={(v) => set("level", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Elementary", "Secondary", "Vocational", "College", "Graduate"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="School Name" className="md:col-span-2"><Input value={state.school} onChange={(e) => set("school", e.target.value)} /></Field>
        <Field label="Degree / Course"><Input value={state.degree} onChange={(e) => set("degree", e.target.value)} /></Field>
        <Field label="Year From"><Input value={state.yearFrom} onChange={(e) => set("yearFrom", e.target.value)} /></Field>
        <Field label="Year To"><Input value={state.yearTo} onChange={(e) => set("yearTo", e.target.value)} /></Field>
        <Field label="Year Graduated"><Input value={state.yearGraduated} onChange={(e) => set("yearGraduated", e.target.value)} /></Field>
        <Field label="Scholarship" className="md:col-span-2"><Input value={state.scholarship} onChange={(e) => set("scholarship", e.target.value)} /></Field>
      </FormSection>
      <div className="flex justify-end mb-4"><Button disabled={!canEdit} onClick={add} className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"><Plus className="h-4 w-4 mr-1" /> Add</Button></div>
      <RecordTable
        cols={["Level", "School", "Degree", "From", "To", "Graduated", "Scholarship"]}
        rows={list.map((r) => [r.level, r.school, r.degree, r.yearFrom, r.yearTo, r.yearGraduated, r.scholarship])}
        onDelete={canEdit ? (i) => del(list[i].id) : undefined}
      />
    </div>
  );
}

/* ---------------- TAB 5: CIVIL SERVICE ---------------- */
function CivilServiceTab({ id, canEdit, onChange }: { id: string; canEdit: boolean; onChange: () => void }) {
  const list = STORE.civilService[id] ?? (STORE.civilService[id] = []);
  const blank: Omit<CivilServiceRecord, "id"> = { type: "", place: "", date: "", rating: "", license: "", dateRelease: "" };
  const { state, set, reset } = useRecordForm(blank);
  const add = () => { if (!state.type) { toast.error("Type required"); return; } list.push({ ...state, id: uid() }); reset(); onChange(); toast.success("Added"); };
  const del = (rid: string) => { STORE.civilService[id] = list.filter((x) => x.id !== rid); onChange(); };

  return (
    <div>
      <FormSection title="Add Eligibility">
        <Field label="Civil Service Type"><Input value={state.type} onChange={(e) => set("type", e.target.value)} placeholder="Career Service Professional" /></Field>
        <Field label="Place of Exam"><Input value={state.place} onChange={(e) => set("place", e.target.value)} /></Field>
        <Field label="Date of Exam"><Input type="date" value={state.date} onChange={(e) => set("date", e.target.value)} /></Field>
        <Field label="Rating %"><Input value={state.rating} onChange={(e) => set("rating", e.target.value)} /></Field>
        <Field label="License"><Input value={state.license} onChange={(e) => set("license", e.target.value)} /></Field>
        <Field label="Date Release"><Input type="date" value={state.dateRelease} onChange={(e) => set("dateRelease", e.target.value)} /></Field>
      </FormSection>
      <div className="flex justify-end mb-4"><Button disabled={!canEdit} onClick={add} className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"><Plus className="h-4 w-4 mr-1" /> Add</Button></div>
      <RecordTable cols={["Type", "Place", "Date", "Rating", "License", "Released"]} rows={list.map((r) => [r.type, r.place, r.date, r.rating, r.license, r.dateRelease])} onDelete={canEdit ? (i) => del(list[i].id) : undefined} />
    </div>
  );
}

/* ---------------- TAB 6: WORK EXPERIENCE ---------------- */
function WorkTab({ id, canEdit, onChange }: { id: string; canEdit: boolean; onChange: () => void }) {
  const list = STORE.work[id] ?? (STORE.work[id] = []);
  const blank: Omit<WorkRecord, "id"> = { position: "", company: "", status: "Permanent", dateFrom: "", dateTo: "", salary: "", govEmp: "NO" };
  const { state, set, reset } = useRecordForm(blank);
  const add = () => { if (!state.position) { toast.error("Position required"); return; } list.push({ ...state, id: uid() }); reset(); onChange(); toast.success("Added"); };
  const del = (rid: string) => { STORE.work[id] = list.filter((x) => x.id !== rid); onChange(); };

  return (
    <div>
      <FormSection title="Add Work Experience">
        <Field label="Position"><Input value={state.position} onChange={(e) => set("position", e.target.value)} /></Field>
        <Field label="Department / Company" className="md:col-span-2"><Input value={state.company} onChange={(e) => set("company", e.target.value)} /></Field>
        <Field label="Status"><Select value={state.status} onValueChange={(v) => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Permanent", "Casual", "Contractual"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Date From"><Input type="date" value={state.dateFrom} onChange={(e) => set("dateFrom", e.target.value)} /></Field>
        <Field label="Date To"><Input type="date" value={state.dateTo} onChange={(e) => set("dateTo", e.target.value)} /></Field>
        <Field label="Monthly Salary"><Input value={state.salary} onChange={(e) => set("salary", e.target.value)} /></Field>
        <Field label="Government Employee">
          <RadioGroup value={state.govEmp} onValueChange={(v) => set("govEmp", v as "YES" | "NO")} className="flex gap-4 pt-1">
            <div className="flex items-center gap-2"><RadioGroupItem value="YES" id="ge-y" /><Label htmlFor="ge-y" className="text-sm">YES</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="NO" id="ge-n" /><Label htmlFor="ge-n" className="text-sm">NO</Label></div>
          </RadioGroup>
        </Field>
      </FormSection>
      <div className="flex justify-end mb-4"><Button disabled={!canEdit} onClick={add} className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"><Plus className="h-4 w-4 mr-1" /> Add</Button></div>
      <RecordTable cols={["Position", "Company", "Status", "From", "To", "Salary", "Gov't"]} rows={list.map((r) => [r.position, r.company, r.status, r.dateFrom, r.dateTo, r.salary, r.govEmp])} onDelete={canEdit ? (i) => del(list[i].id) : undefined} />
    </div>
  );
}

/* ---------------- TAB 7: ORGANIZATION ---------------- */
function OrgTab({ id, canEdit, onChange }: { id: string; canEdit: boolean; onChange: () => void }) {
  const list = STORE.org[id] ?? (STORE.org[id] = []);
  const blank: Omit<OrgRecord, "id"> = { name: "", position: "", address: "", yearFrom: "", yearTo: "", hours: "" };
  const { state, set, reset } = useRecordForm(blank);
  const add = () => { if (!state.name) { toast.error("Name required"); return; } list.push({ ...state, id: uid() }); reset(); onChange(); toast.success("Added"); };
  const del = (rid: string) => { STORE.org[id] = list.filter((x) => x.id !== rid); onChange(); };

  return (
    <div>
      <FormSection title="Add Organization">
        <Field label="Organization Name" className="md:col-span-2"><Input value={state.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Position"><Input value={state.position} onChange={(e) => set("position", e.target.value)} /></Field>
        <Field label="Address" className="md:col-span-2 lg:col-span-3"><Input value={state.address} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label="Year From"><Input value={state.yearFrom} onChange={(e) => set("yearFrom", e.target.value)} /></Field>
        <Field label="Year To"><Input value={state.yearTo} onChange={(e) => set("yearTo", e.target.value)} /></Field>
        <Field label="No. of Hours"><Input value={state.hours} onChange={(e) => set("hours", e.target.value)} /></Field>
      </FormSection>
      <div className="flex justify-end mb-4"><Button disabled={!canEdit} onClick={add} className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"><Plus className="h-4 w-4 mr-1" /> Add</Button></div>
      <RecordTable cols={["Name", "Position", "Address", "From", "To", "Hours"]} rows={list.map((r) => [r.name, r.position, r.address, r.yearFrom, r.yearTo, r.hours])} onDelete={canEdit ? (i) => del(list[i].id) : undefined} />
    </div>
  );
}

/* ---------------- TAB 8: TRAINING ---------------- */
function TrainingTab({ id, canEdit, onChange }: { id: string; canEdit: boolean; onChange: () => void }) {
  const list = STORE.training[id] ?? (STORE.training[id] = []);
  const blank: Omit<TrainingRecord, "id"> = { name: "", conductedBy: "", yearFrom: "", yearTo: "", hours: "", file: "" };
  const { state, set, reset } = useRecordForm(blank);
  const add = () => { if (!state.name) { toast.error("Training name required"); return; } list.push({ ...state, id: uid() }); reset(); onChange(); toast.success("Saved"); };
  const del = (rid: string) => { STORE.training[id] = list.filter((x) => x.id !== rid); onChange(); };

  return (
    <div>
      <FormSection title="Add Training / Seminar">
        <Field label="Training / Seminar Name" className="md:col-span-2 lg:col-span-3"><Input value={state.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Conducted By"><Input value={state.conductedBy} onChange={(e) => set("conductedBy", e.target.value)} /></Field>
        <Field label="Year From"><Input value={state.yearFrom} onChange={(e) => set("yearFrom", e.target.value)} /></Field>
        <Field label="Year To"><Input value={state.yearTo} onChange={(e) => set("yearTo", e.target.value)} /></Field>
        <Field label="No. of Hours"><Input value={state.hours} onChange={(e) => set("hours", e.target.value)} /></Field>
        <Field label="File Upload" className="md:col-span-2">
          <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border hover:bg-accent cursor-pointer text-sm text-muted-foreground">
            <Upload className="h-4 w-4" /> {state.file || "Choose certificate file"}
            <input type="file" className="hidden" onChange={(e) => set("file", e.target.files?.[0]?.name ?? "")} />
          </label>
        </Field>
      </FormSection>
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="outline" onClick={reset}>Cancel</Button>
        <Button disabled={!canEdit} onClick={add} className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90">Save</Button>
      </div>
      <RecordTable cols={["Training", "Conducted By", "From", "To", "Hours", "File"]} rows={list.map((r) => [r.name, r.conductedBy, r.yearFrom, r.yearTo, r.hours, r.file ?? ""])} onDelete={canEdit ? (i) => del(list[i].id) : undefined} />
    </div>
  );
}

/* ---------------- TAB 9: SALARY ---------------- */
function SalaryTab({ id, canEdit, onChange }: { id: string; canEdit: boolean; onChange: () => void }) {
  const list = STORE.salary[id] ?? (STORE.salary[id] = []);
  const blank: Omit<SalaryRecord, "id"> = {
    date: "", description: "", ordinance: "Annex 1", grade: 11, step: 1, tax: "ME",
    amount: 0, gross: 0, type: "Step Increment", pera: 2000, rata: 0, cata: 0,
  };
  const { state, set, setState } = useRecordForm(blank);

  const recompute = () => {
    const amount = SALARY_TABLE[state.grade]?.[state.step - 1] ?? 0;
    const gross = amount + state.pera + state.rata + state.cata;
    setState((s) => ({ ...s, amount, gross }));
    toast("Amounts recomputed");
  };

  const add = () => {
    if (!state.date) { toast.error("Date increment required"); return; }
    const amount = state.amount || (SALARY_TABLE[state.grade]?.[state.step - 1] ?? 0);
    const gross = state.gross || amount + state.pera + state.rata + state.cata;
    list.push({ ...state, amount, gross, id: uid() });
    onChange(); toast.success("Salary record added");
  };
  const del = (rid: string) => { STORE.salary[id] = list.filter((x) => x.id !== rid); onChange(); };

  return (
    <div>
      <FormSection title="Add Salary Record">
        <Field label="Date Increment"><Input type="date" value={state.date} onChange={(e) => set("date", e.target.value)} /></Field>
        <Field label="Description" className="md:col-span-2"><Input value={state.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <Field label="Ordinance">
          <Select value={state.ordinance} onValueChange={(v) => set("ordinance", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["Annex 1", "Annex 2", "Annex 3", "Annex 4"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Salary Grade">
          <Select value={String(state.grade)} onValueChange={(v) => set("grade", Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-[280px]">{SALARY_GRADES.map((g) => <SelectItem key={g} value={String(g)}>SG-{g}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Salary Step">
          <Select value={String(state.step)} onValueChange={(v) => set("step", Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SALARY_STEPS.map((s) => <SelectItem key={s} value={String(s)}>Step {s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Tax Exemption">
          <Select value={state.tax} onValueChange={(v) => set("tax", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["Z", "ME", "ME+1", "ME+2", "ME+3", "ME+4"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Salary Amount"><Input value={state.amount.toLocaleString()} readOnly className="bg-muted" /></Field>
        <Field label="Gross Amount"><Input value={state.gross.toLocaleString()} readOnly className="bg-muted" /></Field>
        <Field label="Income Type">
          <RadioGroup value={state.type} onValueChange={(v) => set("type", v as SalaryRecord["type"])} className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center gap-2"><RadioGroupItem value="Step Increment" id="it-1" /><Label htmlFor="it-1" className="text-sm">Step Increment</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="Not Step Increment" id="it-2" /><Label htmlFor="it-2" className="text-sm">Not Step Increment</Label></div>
          </RadioGroup>
        </Field>
        <Field label="PERA"><Input type="number" value={state.pera} onChange={(e) => set("pera", Number(e.target.value))} /></Field>
        <Field label="RATA"><Input type="number" value={state.rata} onChange={(e) => set("rata", Number(e.target.value))} /></Field>
        <Field label="CATA"><Input type="number" value={state.cata} onChange={(e) => set("cata", Number(e.target.value))} /></Field>
      </FormSection>
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="outline" onClick={recompute}><RefreshCw className="h-4 w-4 mr-1.5" /> Refresh / Recompute</Button>
        <Button disabled={!canEdit} onClick={add} className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>
      <RecordTable
        cols={["Date", "Description", "Type", "Tax", "SG", "Step", "Amount", "Annual", "Gross", "PERA", "RATA", "CATA"]}
        rows={list.map((r) => [r.date, r.description, r.type, r.tax, `SG-${r.grade}`, `Step ${r.step}`, r.amount.toLocaleString(), (r.amount * 12).toLocaleString(), r.gross.toLocaleString(), r.pera, r.rata, r.cata])}
        onDelete={canEdit ? (i) => del(list[i].id) : undefined}
      />
    </div>
  );
}

/* ---------------- TAB 10: SERVICE RECORD ---------------- */
function ServiceTab({ id, canEdit, onChange }: { id: string; canEdit: boolean; onChange: () => void }) {
  const list = STORE.service[id] ?? (STORE.service[id] = []);
  const blank: Omit<ServiceRecord, "id"> = { from: "", to: "", status: "Permanent", salary: "", designation: "", department: "", assignment: "", branch: "", leave: "", sepDate: "", sepCause: "" };
  const { state, set, reset } = useRecordForm(blank);
  const add = () => { if (!state.from) { toast.error("Service from required"); return; } list.push({ ...state, id: uid() }); reset(); onChange(); toast.success("Added"); };
  const del = (rid: string) => { STORE.service[id] = list.filter((x) => x.id !== rid); onChange(); };

  return (
    <div>
      <FormSection title="Add Service Record">
        <Field label="Service From"><Input type="date" value={state.from} onChange={(e) => set("from", e.target.value)} /></Field>
        <Field label="Service To"><Input type="date" value={state.to} onChange={(e) => set("to", e.target.value)} /></Field>
        <Field label="Status"><Select value={state.status} onValueChange={(v) => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Permanent", "Casual", "Contractual"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Salary"><Input value={state.salary} onChange={(e) => set("salary", e.target.value)} /></Field>
        <Field label="Designation"><Select value={state.designation} onValueChange={(v) => set("designation", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Department"><Select value={state.department} onValueChange={(v) => set("department", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Assignment"><Input value={state.assignment} onChange={(e) => set("assignment", e.target.value)} /></Field>
        <Field label="Branch"><Input value={state.branch} onChange={(e) => set("branch", e.target.value)} /></Field>
        <Field label="Leave With/Without Pay"><Input value={state.leave} onChange={(e) => set("leave", e.target.value)} /></Field>
        <Field label="Separation Date"><Input type="date" value={state.sepDate} onChange={(e) => set("sepDate", e.target.value)} /></Field>
        <Field label="Separation Cause" className="md:col-span-2"><Input value={state.sepCause} onChange={(e) => set("sepCause", e.target.value)} /></Field>
      </FormSection>
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="outline" onClick={reset}>Cancel</Button>
        <Button disabled={!canEdit} onClick={add} className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90">Save</Button>
      </div>
      <RecordTable cols={["From", "To", "Position", "Status", "Salary", "Department"]} rows={list.map((r) => [r.from, r.to, r.designation, r.status, r.salary, r.department])} onDelete={canEdit ? (i) => del(list[i].id) : undefined} />
    </div>
  );
}

/* ---------------- TAB 11: LEAVE BALANCE ---------------- */
function LeaveTab({ id, canEdit, onChange }: { id: string; canEdit: boolean; onChange: () => void }) {
  const list = STORE.leave[id] ?? (STORE.leave[id] = []);
  const blank: Omit<LeaveRecord, "id" | "employeeId"> = {
    type: "Vacation Leave", period: "", particulars: "",
    vlEarned: 0, vlAbsWP: 0, vlBalance: 0, vlAbsWOP: 0,
    slEarned: 0, slAbsWP: 0, slBalance: 0, slAbsWOP: 0,
    dateAction: "",
  };
  const { state, set, reset } = useRecordForm(blank);
  const add = () => { list.push({ ...state, id: uid(), employeeId: id }); reset(); onChange(); toast.success("Added"); };
  const del = (rid: string) => { STORE.leave[id] = list.filter((x) => x.id !== rid); onChange(); };

  return (
    <div>
      <FormSection title="Add Leave Entry">
        <Field label="Type of Leave">
          <Select value={state.type} onValueChange={(v) => set("type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["Vacation Leave", "Sick Leave", "Maternity Leave", "Paternity Leave", "Special Privilege Leave"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Date Approved"><Input type="date" value={state.dateAction} onChange={(e) => set("dateAction", e.target.value)} /></Field>
        <Field label="Period"><Input value={state.period} onChange={(e) => set("period", e.target.value)} placeholder="2025-01-01 to 2025-12-31" /></Field>
        <Field label="Particulars" className="md:col-span-3"><Input value={state.particulars} onChange={(e) => set("particulars", e.target.value)} /></Field>
        <Field label="VL Earned"><Input type="number" value={state.vlEarned} onChange={(e) => set("vlEarned", Number(e.target.value))} /></Field>
        <Field label="VL Abs WP"><Input type="number" value={state.vlAbsWP} onChange={(e) => set("vlAbsWP", Number(e.target.value))} /></Field>
        <Field label="VL Balance"><Input type="number" value={state.vlBalance} onChange={(e) => set("vlBalance", Number(e.target.value))} /></Field>
        <Field label="VL Abs WOP"><Input type="number" value={state.vlAbsWOP} onChange={(e) => set("vlAbsWOP", Number(e.target.value))} /></Field>
        <Field label="SL Earned"><Input type="number" value={state.slEarned} onChange={(e) => set("slEarned", Number(e.target.value))} /></Field>
        <Field label="SL Abs WP"><Input type="number" value={state.slAbsWP} onChange={(e) => set("slAbsWP", Number(e.target.value))} /></Field>
        <Field label="SL Balance"><Input type="number" value={state.slBalance} onChange={(e) => set("slBalance", Number(e.target.value))} /></Field>
        <Field label="SL Abs WOP"><Input type="number" value={state.slAbsWOP} onChange={(e) => set("slAbsWOP", Number(e.target.value))} /></Field>
      </FormSection>
      <div className="flex justify-end mb-4"><Button disabled={!canEdit} onClick={add} className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"><Plus className="h-4 w-4 mr-1" /> Add</Button></div>
      <RecordTable
        cols={["Type", "Period", "Particulars", "VL Earn", "VL WP", "VL Bal", "VL WOP", "SL Earn", "SL WP", "SL Bal", "SL WOP", "Date"]}
        rows={list.map((r) => [r.type, r.period, r.particulars, r.vlEarned, r.vlAbsWP, r.vlBalance, r.vlAbsWOP, r.slEarned, r.slAbsWP, r.slBalance, r.slAbsWOP, r.dateAction])}
        onDelete={canEdit ? (i) => del(list[i].id) : undefined}
      />
    </div>
  );
}

/* ---------------- TAB 12: IPCR ---------------- */
function IPCRTab({ id, canEdit, onChange }: { id: string; canEdit: boolean; onChange: () => void }) {
  const list = STORE.ipcr[id] ?? (STORE.ipcr[id] = []);
  const blank: Omit<IPCRRecord, "id"> = { month: "", from: "", to: "", remarks: "", grades: "", file: "" };
  const { state, set, reset } = useRecordForm(blank);
  const add = () => { if (!state.month) { toast.error("Month required"); return; } list.push({ ...state, id: uid() }); reset(); onChange(); toast.success("Added"); };
  const del = (rid: string) => { STORE.ipcr[id] = list.filter((x) => x.id !== rid); onChange(); };
  const months = useMemo(() => ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], []);

  return (
    <div>
      <FormSection title="Add IPCR Record">
        <Field label="Month">
          <Select value={state.month} onValueChange={(v) => set("month", v)}>
            <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
            <SelectContent>{months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Date From"><Input type="date" value={state.from} onChange={(e) => set("from", e.target.value)} /></Field>
        <Field label="Date To"><Input type="date" value={state.to} onChange={(e) => set("to", e.target.value)} /></Field>
        <Field label="Grades"><Input value={state.grades} onChange={(e) => set("grades", e.target.value)} placeholder="Outstanding / Very Satisfactory" /></Field>
        <Field label="Remarks" className="md:col-span-2"><Textarea rows={2} value={state.remarks} onChange={(e) => set("remarks", e.target.value)} /></Field>
        <Field label="File Upload" className="md:col-span-2 lg:col-span-3">
          <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border hover:bg-accent cursor-pointer text-sm text-muted-foreground">
            <Upload className="h-4 w-4" /> {state.file || "Choose IPCR document"}
            <input type="file" className="hidden" onChange={(e) => set("file", e.target.files?.[0]?.name ?? "")} />
          </label>
        </Field>
      </FormSection>
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="outline" onClick={reset}>Cancel</Button>
        <Button disabled={!canEdit} onClick={add} className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>
      <RecordTable cols={["Month", "From", "To", "Grades", "Remarks", "File"]} rows={list.map((r) => [r.month, r.from, r.to, r.grades, r.remarks, r.file ?? ""])} onDelete={canEdit ? (i) => del(list[i].id) : undefined} />
    </div>
  );
}
