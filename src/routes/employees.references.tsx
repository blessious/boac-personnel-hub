import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Pencil, Plus, Power, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { ReferenceLibraryPanel } from "@/components/reference/ReferenceLibraryPanel";
import {
  REFERENCE_LIBRARY_CONFIG,
  type ReferenceCategory,
  type ReferenceRow,
} from "@/lib/reference-libraries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { canWriteHrRecords, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/realtime";

export const Route = createFileRoute("/employees/references")({
  component: EmployeeReferencesPage,
});

interface DepartmentRow {
  id: number;
  name: string;
}

interface PositionRow {
  id: number;
  title: string;
}

interface SalaryGradeRow {
  id: number;
  ordinance: string;
  grade: number;
  step: number;
  amount: number;
  isActive?: boolean;
}

interface SalaryGradeTableRow {
  ordinance: string;
  rowCount: number;
  minGrade: number | null;
  maxGrade: number | null;
  isActive: boolean;
}

interface ParsedSalaryRow {
  grade: number;
  step: number;
  amount: number;
}

function EmployeeReferencesPage() {
  const { user } = useAuth();
  const canManage = canWriteHrRecords(user?.role);
  const [depts, setDepts] = useState<DepartmentRow[]>([]);
  const [pos, setPos] = useState<PositionRow[]>([]);
  const [salaryGrades, setSalaryGrades] = useState<SalaryGradeRow[]>([]);
  const [salaryGradeTables, setSalaryGradeTables] = useState<SalaryGradeTableRow[]>([]);
  const [referenceLibraries, setReferenceLibraries] = useState<
    Record<ReferenceCategory, ReferenceRow[]>
  >(
    () =>
      Object.fromEntries(REFERENCE_LIBRARY_CONFIG.map((config) => [config.category, []])) as Record<
        ReferenceCategory,
        ReferenceRow[]
      >,
  );
  const [newDept, setNewDept] = useState("");
  const [newPos, setNewPos] = useState("");
  const [deptQuery, setDeptQuery] = useState("");
  const [posQuery, setPosQuery] = useState("");
  const [newSalaryGrade, setNewSalaryGrade] = useState({
    ordinance: "",
    grade: "",
    step: "",
    amount: "",
  });
  const [bulkSalaryRows, setBulkSalaryRows] = useState("");
  const [activationDate, setActivationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [activationRemarks, setActivationRemarks] = useState("");
  const [activatingOrdinance, setActivatingOrdinance] = useState("");
  const [selectedOrdinance, setSelectedOrdinance] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [renameOrdinance, setRenameOrdinance] = useState("");
  const [renamingTable, setRenamingTable] = useState(false);
  const [editingSalaryGrade, setEditingSalaryGrade] = useState({
    id: 0,
    ordinance: "",
    grade: "",
    step: "",
    amount: "",
  });
  const [savingSalaryGradeId, setSavingSalaryGradeId] = useState(0);
  const [activeReferenceTab, setActiveReferenceTab] = useState("departments");
  const [loading, setLoading] = useState(true);

  const filteredDepts = depts.filter((d) => d.name.toLowerCase().includes(deptQuery.toLowerCase()));
  const filteredPos = pos.filter((p) => p.title.toLowerCase().includes(posQuery.toLowerCase()));
  const activeSalaryTable = useMemo(
    () => salaryGradeTables.find((table) => table.isActive)?.ordinance || "",
    [salaryGradeTables],
  );
  const selectedSalaryRows = useMemo(
    () =>
      salaryGrades
        .filter((row) => row.ordinance === selectedOrdinance)
        .sort((a, b) => a.grade - b.grade || a.step - b.step),
    [salaryGrades, selectedOrdinance],
  );
  const referenceTabOptions = useMemo(
    () => [
      { value: "departments", label: "Departments" },
      { value: "positions", label: "Positions" },
      { value: "salary", label: "Salary Grades" },
      ...REFERENCE_LIBRARY_CONFIG.map((config) => ({
        value: config.category,
        label: config.plural,
      })),
    ],
    [],
  );

  const loadReferences = async () => {
    setLoading(true);
    try {
      const [data, references] = await Promise.all([
        api<{
          departments: DepartmentRow[];
          positions: PositionRow[];
          salaryGrades: SalaryGradeRow[];
          salaryGradeTables?: SalaryGradeTableRow[];
        }>("/api/settings"),
        api<{ libraries: Record<ReferenceCategory, ReferenceRow[]> }>("/api/settings/references"),
      ]);
      setDepts(data.departments);
      setPos(data.positions);
      setSalaryGrades(data.salaryGrades);
      const groupedTables =
        data.salaryGradeTables ||
        Object.values(
          data.salaryGrades.reduce<Record<string, SalaryGradeTableRow>>((tables, row) => {
            const current = tables[row.ordinance] || {
              ordinance: row.ordinance,
              rowCount: 0,
              minGrade: row.grade,
              maxGrade: row.grade,
              isActive: Boolean(row.isActive),
            };
            current.rowCount += 1;
            current.minGrade = Math.min(current.minGrade || row.grade, row.grade);
            current.maxGrade = Math.max(current.maxGrade || row.grade, row.grade);
            current.isActive = current.isActive || Boolean(row.isActive);
            tables[row.ordinance] = current;
            return tables;
          }, {}),
        );
      setSalaryGradeTables(groupedTables);
      setSelectedOrdinance((current) => {
        if (current && groupedTables.some((table) => table.ordinance === current)) return current;
        return (
          groupedTables.find((table) => table.isActive)?.ordinance ||
          groupedTables[0]?.ordinance ||
          ""
        );
      });
      setNewSalaryGrade((current) => ({
        ...current,
        ordinance:
          current.ordinance ||
          groupedTables.find((table) => table.isActive)?.ordinance ||
          groupedTables[0]?.ordinance ||
          "",
      }));
      setReferenceLibraries(references.libraries);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferences();
  }, []);
  useRealtimeRefresh(loadReferences, ["settings"]);
  useEffect(() => {
    setRenameOrdinance(selectedOrdinance);
  }, [selectedOrdinance]);

  const addDepartment = async () => {
    try {
      const result = await api<{ department: DepartmentRow }>("/api/settings/departments", {
        method: "POST",
        body: JSON.stringify({ name: newDept.trim() }),
      });
      setDepts((prev) => [...prev, result.department]);
      setNewDept("");
      toast.success("Department added");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const deleteDepartment = async (id: number) => {
    try {
      await api<{ ok: boolean }>(`/api/settings/departments/${id}`, { method: "DELETE" });
      setDepts((prev) => prev.filter((item) => item.id !== id));
      toast.success("Department removed");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const addPosition = async () => {
    try {
      const result = await api<{ position: PositionRow }>("/api/settings/positions", {
        method: "POST",
        body: JSON.stringify({ title: newPos.trim() }),
      });
      setPos((prev) => [...prev, result.position]);
      setNewPos("");
      toast.success("Position added");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const deletePosition = async (id: number) => {
    try {
      await api<{ ok: boolean }>(`/api/settings/positions/${id}`, { method: "DELETE" });
      setPos((prev) => prev.filter((item) => item.id !== id));
      toast.success("Position removed");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const addSalaryGrade = async () => {
    try {
      const result = await api<{ salaryGrade: SalaryGradeRow }>("/api/settings/salary-grades", {
        method: "POST",
        body: JSON.stringify({
          ordinance: newSalaryGrade.ordinance.trim(),
          grade: Number(newSalaryGrade.grade),
          step: Number(newSalaryGrade.step),
          amount: Number(newSalaryGrade.amount),
        }),
      });
      setSalaryGrades((prev) =>
        [...prev, result.salaryGrade].sort(
          (a, b) => a.ordinance.localeCompare(b.ordinance) || a.grade - b.grade || a.step - b.step,
        ),
      );
      setNewSalaryGrade({
        ordinance: newSalaryGrade.ordinance.trim(),
        grade: "",
        step: "",
        amount: "",
      });
      setSelectedOrdinance(newSalaryGrade.ordinance.trim());
      loadReferences();
      toast.success("Salary grade added");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const selectSalaryTable = (ordinance: string) => {
    setSelectedOrdinance(ordinance);
    setRenameOrdinance(ordinance);
    setEditingSalaryGrade({ id: 0, ordinance: "", grade: "", step: "", amount: "" });
    setNewSalaryGrade((current) => ({ ...current, ordinance }));
  };

  const parseBulkSalaryRows = (ordinance: string): ParsedSalaryRow[] => {
    const rows: ParsedSalaryRow[] = [];
    const seen = new Set<string>();
    const existing = new Set(
      salaryGrades
        .filter((row) => row.ordinance === ordinance)
        .map((row) => `${row.grade}-${row.step}`),
    );
    for (const [index, rawLine] of bulkSalaryRows.split(/\r?\n/).entries()) {
      const line = rawLine.trim();
      if (!line) continue;
      let parts = line.includes("\t")
        ? line.split("\t").map((part) => part.trim())
        : line.split(",").map((part) => part.trim());
      if (parts.length < 3) parts = line.split(/\s+/).map((part) => part.trim());
      const grade = Number(parts[0]);
      const step = Number(parts[1]);
      const amount = Number(parts.slice(2).join("").replace(/,/g, ""));
      if (!Number.isInteger(grade) || grade < 1) {
        throw new Error(`Line ${index + 1}: salary grade must be a whole number`);
      }
      if (!Number.isInteger(step) || step < 1) {
        throw new Error(`Line ${index + 1}: step must be a whole number`);
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(`Line ${index + 1}: amount must be greater than zero`);
      }
      const key = `${grade}-${step}`;
      if (seen.has(key)) throw new Error(`Line ${index + 1}: duplicate SG-${grade} Step ${step}`);
      if (existing.has(key))
        throw new Error(`SG-${grade} Step ${step} already exists in this table`);
      seen.add(key);
      rows.push({ grade, step, amount });
    }
    if (rows.length === 0) throw new Error("Enter at least one salary grade row");
    return rows;
  };

  const addBulkSalaryRows = async () => {
    const ordinance = newSalaryGrade.ordinance.trim();
    if (!ordinance) {
      toast.error("Ordinance is required");
      return;
    }
    let rows: ParsedSalaryRow[] = [];
    try {
      rows = parseBulkSalaryRows(ordinance);
    } catch (error) {
      toast.error((error as Error).message);
      return;
    }
    setBulkSaving(true);
    try {
      const created = await Promise.all(
        rows.map((row) =>
          api<{ salaryGrade: SalaryGradeRow }>("/api/settings/salary-grades", {
            method: "POST",
            body: JSON.stringify({ ordinance, ...row }),
          }),
        ),
      );
      setSalaryGrades((prev) =>
        [...prev, ...created.map((result) => result.salaryGrade)].sort(
          (a, b) => a.ordinance.localeCompare(b.ordinance) || a.grade - b.grade || a.step - b.step,
        ),
      );
      setBulkSalaryRows("");
      setSelectedOrdinance(ordinance);
      await loadReferences();
      toast.success(`${created.length} salary grade rows added`);
    } catch (error) {
      toast.error((error as Error).message);
      await loadReferences();
    } finally {
      setBulkSaving(false);
    }
  };

  const deleteSalaryGrade = async (id: number) => {
    try {
      await api<{ ok: boolean }>(`/api/settings/salary-grades/${id}`, { method: "DELETE" });
      setSalaryGrades((prev) => prev.filter((item) => item.id !== id));
      loadReferences();
      toast.success("Salary grade removed");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const startSalaryGradeEdit = (row: SalaryGradeRow) => {
    setEditingSalaryGrade({
      id: row.id,
      ordinance: row.ordinance,
      grade: String(row.grade),
      step: String(row.step),
      amount: String(row.amount),
    });
  };

  const updateSalaryGrade = async () => {
    if (!editingSalaryGrade.id) return;
    setSavingSalaryGradeId(editingSalaryGrade.id);
    try {
      const result = await api<{ salaryGrade: SalaryGradeRow }>(
        `/api/settings/salary-grades/${editingSalaryGrade.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            ordinance: editingSalaryGrade.ordinance.trim(),
            grade: Number(editingSalaryGrade.grade),
            step: Number(editingSalaryGrade.step),
            amount: Number(editingSalaryGrade.amount),
          }),
        },
      );
      setSalaryGrades((prev) =>
        prev
          .map((row) => (row.id === result.salaryGrade.id ? result.salaryGrade : row))
          .sort(
            (a, b) =>
              a.ordinance.localeCompare(b.ordinance) || a.grade - b.grade || a.step - b.step,
          ),
      );
      setSelectedOrdinance(result.salaryGrade.ordinance);
      setNewSalaryGrade((current) => ({ ...current, ordinance: result.salaryGrade.ordinance }));
      setEditingSalaryGrade({ id: 0, ordinance: "", grade: "", step: "", amount: "" });
      await loadReferences();
      toast.success("Salary grade corrected");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSavingSalaryGradeId(0);
    }
  };

  const renameSalaryTable = async () => {
    const oldOrdinance = selectedOrdinance.trim();
    const newOrdinance = renameOrdinance.trim();
    if (!oldOrdinance || !newOrdinance) {
      toast.error("Select a table and enter the corrected ordinance");
      return;
    }
    if (oldOrdinance === newOrdinance) {
      toast.error("The ordinance name is unchanged");
      return;
    }
    const confirmed = window.confirm(
      `Rename salary table ${oldOrdinance} to ${newOrdinance}? This only corrects the ordinance label, not the salary amounts.`,
    );
    if (!confirmed) return;
    setRenamingTable(true);
    try {
      await api<{ table: SalaryGradeTableRow }>("/api/settings/salary-grades/rename-table", {
        method: "POST",
        body: JSON.stringify({ oldOrdinance, newOrdinance }),
      });
      setSelectedOrdinance(newOrdinance);
      setNewSalaryGrade((current) => ({ ...current, ordinance: newOrdinance }));
      await loadReferences();
      toast.success("Salary table renamed");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setRenamingTable(false);
    }
  };

  const activateSalaryTable = async (ordinance: string) => {
    if (!activationDate) {
      toast.error("Effectivity date is required");
      return;
    }
    const confirmed = window.confirm(
      `Activate ${ordinance}? This will update active plantilla salaries and add 201 Salary records for affected active employees.`,
    );
    if (!confirmed) return;
    setActivatingOrdinance(ordinance);
    try {
      const result = await api<{
        summary: { checked: number; updated: number; skipped: number };
      }>("/api/settings/salary-grades/activate", {
        method: "POST",
        body: JSON.stringify({
          ordinance,
          effectivityDate: activationDate,
          remarks: activationRemarks.trim(),
        }),
      });
      await loadReferences();
      toast.success(
        `Activated ${ordinance}: ${result.summary.updated} updated, ${result.summary.skipped} skipped`,
      );
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setActivatingOrdinance("");
    }
  };

  return (
    <AppShell
      title="Employee References"
      subtitle="Manage the table-driven organization, employment, position, and compensation libraries"
    >
      {loading && (
        <div className="mb-3 text-sm text-muted-foreground">Loading employee references...</div>
      )}
      <Tabs value={activeReferenceTab} onValueChange={setActiveReferenceTab}>
        <div className="mb-4 md:hidden">
          <Select value={activeReferenceTab} onValueChange={setActiveReferenceTab}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Select reference" />
            </SelectTrigger>
            <SelectContent>
              {referenceTabOptions.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden md:block">
          <TabsList className="flex h-auto min-h-9 w-full flex-wrap justify-start gap-1 border border-border bg-card p-1">
            {referenceTabOptions.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="min-h-8 flex-none px-3 text-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="departments" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 mb-6 sm:flex-row">
              <div className="flex flex-1 gap-2">
                <Input
                  placeholder="New department name"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                />
                <Button
                  disabled={!canManage || !newDept.trim()}
                  onClick={addDepartment}
                  className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search departments..."
                  value={deptQuery}
                  onChange={(e) => setDeptQuery(e.target.value)}
                  className="bg-muted/50"
                />
              </div>
            </div>
            <ul className="divide-y divide-border border-t border-border">
              {filteredDepts.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between py-2.5 text-sm hover:bg-muted/30 px-2 transition-colors"
                >
                  <span>{d.name}</span>
                  <button
                    disabled={!canManage}
                    onClick={() => deleteDepartment(d.id)}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {filteredDepts.length === 0 && (
                <li className="py-8 text-center text-muted-foreground text-sm">
                  No departments found.
                </li>
              )}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="positions" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 mb-6 sm:flex-row">
              <div className="flex flex-1 gap-2">
                <Input
                  placeholder="New position title"
                  value={newPos}
                  onChange={(e) => setNewPos(e.target.value)}
                />
                <Button
                  disabled={!canManage || !newPos.trim()}
                  onClick={addPosition}
                  className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search positions..."
                  value={posQuery}
                  onChange={(e) => setPosQuery(e.target.value)}
                  className="bg-muted/50"
                />
              </div>
            </div>
            <ul className="divide-y divide-border border-t border-border">
              {filteredPos.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between py-2.5 text-sm hover:bg-muted/30 px-2 transition-colors"
                >
                  <span>{p.title}</span>
                  <button
                    disabled={!canManage}
                    onClick={() => deletePosition(p.id)}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {filteredPos.length === 0 && (
                <li className="py-8 text-center text-muted-foreground text-sm">
                  No positions found.
                </li>
              )}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Salary Grade Tables</h2>
                  <p className="text-sm text-muted-foreground">
                    Each ordinance is one salary table. Select a table to review its rows, then
                    activate it when HR is ready to update plantilla and 201 Salary records.
                  </p>
                  {activeSalaryTable && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active: {activeSalaryTable}
                    </div>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-[160px_minmax(260px,1fr)]">
                  <Input
                    type="date"
                    value={activationDate}
                    onChange={(event) => setActivationDate(event.target.value)}
                    disabled={!canManage}
                  />
                  <Input
                    placeholder="Activation remarks"
                    value={activationRemarks}
                    onChange={(event) => setActivationRemarks(event.target.value)}
                    disabled={!canManage}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {salaryGradeTables.map((table) => {
                  const selected = selectedOrdinance === table.ordinance;
                  return (
                    <div
                      key={table.ordinance}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectSalaryTable(table.ordinance)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          selectSalaryTable(table.ordinance);
                        }
                      }}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        selected
                          ? "border-[#2563eb] bg-blue-50/70"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{table.ordinance}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {table.rowCount} rows
                            {table.minGrade && table.maxGrade
                              ? `, SG-${table.minGrade} to SG-${table.maxGrade}`
                              : ""}
                          </div>
                        </div>
                        {table.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button
                          size="sm"
                          disabled={
                            !canManage || table.isActive || activatingOrdinance === table.ordinance
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            activateSalaryTable(table.ordinance);
                          }}
                          className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                        >
                          {activatingOrdinance === table.ordinance ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Power className="h-4 w-4 mr-1" />
                          )}
                          Activate
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {salaryGradeTables.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                    No salary tables yet. Type an ordinance below and add rows to create one.
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-0 xl:grid-cols-[minmax(360px,440px)_1fr]">
              <div className="border-b border-border p-5 xl:border-b-0 xl:border-r">
                <h3 className="text-sm font-semibold">Add Rows To Salary Table</h3>
                <div className="mt-3 space-y-3">
                  <Input
                    placeholder="Ordinance / salary table name"
                    value={newSalaryGrade.ordinance}
                    onChange={(e) =>
                      setNewSalaryGrade({ ...newSalaryGrade, ordinance: e.target.value })
                    }
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Grade"
                      value={newSalaryGrade.grade}
                      onChange={(e) =>
                        setNewSalaryGrade({ ...newSalaryGrade, grade: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Step"
                      value={newSalaryGrade.step}
                      onChange={(e) =>
                        setNewSalaryGrade({ ...newSalaryGrade, step: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Amount"
                      type="number"
                      value={newSalaryGrade.amount}
                      onChange={(e) =>
                        setNewSalaryGrade({ ...newSalaryGrade, amount: e.target.value })
                      }
                    />
                  </div>
                  <Button
                    disabled={
                      !canManage ||
                      !newSalaryGrade.ordinance.trim() ||
                      !newSalaryGrade.grade.trim() ||
                      !newSalaryGrade.step.trim() ||
                      !newSalaryGrade.amount.trim()
                    }
                    onClick={addSalaryGrade}
                    className="w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Single Row
                  </Button>

                  <div className="border-t border-border pt-3">
                    <Textarea
                      rows={7}
                      placeholder={
                        "Bulk rows: grade, step, amount\n1, 1, 14061\n1, 2, 14250\n11, 1, 28400"
                      }
                      value={bulkSalaryRows}
                      onChange={(event) => setBulkSalaryRows(event.target.value)}
                      disabled={!canManage || bulkSaving}
                    />
                    <Button
                      disabled={
                        !canManage ||
                        bulkSaving ||
                        !newSalaryGrade.ordinance.trim() ||
                        !bulkSalaryRows.trim()
                      }
                      onClick={addBulkSalaryRows}
                      className="mt-2 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                    >
                      {bulkSaving ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-1" />
                      )}
                      Add Bulk Rows
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">
                      {selectedOrdinance ? selectedOrdinance : "Selected Salary Table"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedOrdinance
                        ? `${selectedSalaryRows.length} salary grade rows`
                        : "Select a table above, or create a new one from the form."}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {selectedOrdinance && (
                      <div className="flex gap-2">
                        <Input
                          value={renameOrdinance}
                          onChange={(event) => setRenameOrdinance(event.target.value)}
                          disabled={!canManage || renamingTable}
                          className="h-9 sm:w-56"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            !canManage ||
                            renamingTable ||
                            !renameOrdinance.trim() ||
                            renameOrdinance.trim() === selectedOrdinance
                          }
                          onClick={renameSalaryTable}
                        >
                          {renamingTable ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-1" />
                          )}
                          Correct Name
                        </Button>
                      </div>
                    )}
                    {selectedOrdinance && (
                      <Button
                        size="sm"
                        disabled={
                          !canManage ||
                          activeSalaryTable === selectedOrdinance ||
                          activatingOrdinance === selectedOrdinance
                        }
                        onClick={() => activateSalaryTable(selectedOrdinance)}
                        className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                      >
                        {activatingOrdinance === selectedOrdinance ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Power className="h-4 w-4 mr-1" />
                        )}
                        Activate Table
                      </Button>
                    )}
                  </div>
                </div>

                <div className="max-h-[520px] overflow-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Salary Grade</th>
                        <th className="px-4 py-3 font-medium">Step</th>
                        <th className="px-4 py-3 font-medium text-right">Monthly Amount</th>
                        <th className="px-4 py-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSalaryRows.map((s, i) => (
                        <tr key={s.id} className={i % 2 ? "bg-muted/40" : ""}>
                          <td className="px-4 py-2.5">
                            {editingSalaryGrade.id === s.id ? (
                              <Input
                                value={editingSalaryGrade.grade}
                                onChange={(event) =>
                                  setEditingSalaryGrade({
                                    ...editingSalaryGrade,
                                    grade: event.target.value,
                                  })
                                }
                                className="h-9 w-24"
                              />
                            ) : (
                              `SG-${s.grade}`
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {editingSalaryGrade.id === s.id ? (
                              <Input
                                value={editingSalaryGrade.step}
                                onChange={(event) =>
                                  setEditingSalaryGrade({
                                    ...editingSalaryGrade,
                                    step: event.target.value,
                                  })
                                }
                                className="h-9 w-24"
                              />
                            ) : (
                              `Step ${s.step}`
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">
                            {editingSalaryGrade.id === s.id ? (
                              <Input
                                type="number"
                                value={editingSalaryGrade.amount}
                                onChange={(event) =>
                                  setEditingSalaryGrade({
                                    ...editingSalaryGrade,
                                    amount: event.target.value,
                                  })
                                }
                                className="ml-auto h-9 w-36 text-right font-mono"
                              />
                            ) : (
                              s.amount.toLocaleString()
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {editingSalaryGrade.id === s.id ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  disabled={savingSalaryGradeId === s.id}
                                  onClick={updateSalaryGrade}
                                  className="text-muted-foreground hover:text-[#2563eb] disabled:opacity-30"
                                  title="Save correction"
                                >
                                  {savingSalaryGradeId === s.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  disabled={savingSalaryGradeId === s.id}
                                  onClick={() =>
                                    setEditingSalaryGrade({
                                      id: 0,
                                      ordinance: "",
                                      grade: "",
                                      step: "",
                                      amount: "",
                                    })
                                  }
                                  className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-3">
                                <button
                                  disabled={!canManage || s.isActive}
                                  onClick={() => startSalaryGradeEdit(s)}
                                  className="text-muted-foreground hover:text-[#2563eb] disabled:opacity-30"
                                  title={
                                    s.isActive
                                      ? "Rows from the active salary table cannot be edited"
                                      : "Correct row"
                                  }
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  disabled={!canManage || s.isActive}
                                  onClick={() => deleteSalaryGrade(s.id)}
                                  className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                                  title={
                                    s.isActive
                                      ? "Rows from the active salary table cannot be deleted"
                                      : "Delete row"
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {selectedSalaryRows.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                            No rows in this salary table yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {REFERENCE_LIBRARY_CONFIG.map((config) => (
          <TabsContent key={config.category} value={config.category} className="mt-4">
            <ReferenceLibraryPanel
              config={config}
              rows={referenceLibraries[config.category] || []}
              parentRows={
                config.parentCategory ? referenceLibraries[config.parentCategory] || [] : []
              }
              canManage={canManage}
              onChanged={loadReferences}
            />
          </TabsContent>
        ))}
      </Tabs>
    </AppShell>
  );
}
