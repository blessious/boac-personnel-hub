import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  Layers3,
  Landmark,
  Loader2,
  Menu,
  Network,
  PanelsTopLeft,
  Pencil,
  Plus,
  Power,
  Save,
  Search,
  Table2,
  Trash2,
  UserCheck,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { ReferenceLibraryPanel } from "@/components/reference/ReferenceLibraryPanel";
import {
  REFERENCE_LIBRARY_CONFIG,
  type ReferenceCategory,
  type ReferenceRow,
} from "@/lib/reference-libraries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { api, isAbortError } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/realtime";
import { cn, formatDisplayDate } from "@/lib/utils";

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

interface ActivationSummary {
  ordinance: string;
  effectivityDate: string;
  checked: number;
  updated: number;
  skipped: number;
  employeeSalaryRecordsCreated: number;
  movementsSynchronized: number;
}

interface ConfirmAction {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  activationRemarks?: boolean;
  onConfirm: () => Promise<void> | void;
}

const EXPECTED_SALARY_GRADES = 33;
const EXPECTED_SALARY_STEPS = 8;
const EXPECTED_SALARY_ROWS = EXPECTED_SALARY_GRADES * EXPECTED_SALARY_STEPS;

type ReferenceSectionMeta = {
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const REFERENCE_SECTION_META: Record<string, ReferenceSectionMeta> = {
  departments: {
    description: "Department names available in employee records and related filters.",
    icon: Building2,
  },
  positions: {
    description: "Official position titles used in Plantilla, employee profiles, and movements.",
    icon: BriefcaseBusiness,
  },
  salary: {
    description: "Salary ordinances, grades, steps, effectivity, and activation status.",
    icon: Table2,
  },
  sectors: {
    description: "Top-level organizational sectors used to group offices.",
    icon: Landmark,
  },
  offices: {
    description: "Official offices available throughout employee and Plantilla workflows.",
    icon: Building2,
  },
  divisions: {
    description: "Divisions maintained under their corresponding offices.",
    icon: Network,
  },
  sections: {
    description: "Sections and units maintained under their corresponding divisions.",
    icon: PanelsTopLeft,
  },
  eligibilities: {
    description: "Civil service and professional eligibility reference values.",
    icon: BadgeCheck,
  },
  "employment-statuses": {
    description: "Employment status values used across employee records.",
    icon: UserCheck,
  },
  "job-levels": {
    description: "Job and career-level classifications for employee records.",
    icon: Layers3,
  },
  "plantilla-types": {
    description: "Plantilla item classifications used in staffing records.",
    icon: FileCheck2,
  },
  "budget-codes": {
    description: "Budget and funding codes available to staffing workflows.",
    icon: WalletCards,
  },
};

function formatMoney(amount: number) {
  return `PHP ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function sanitizeMoneyInput(value: string) {
  const normalized = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const [whole = "", ...decimalParts] = normalized.split(".");
  const decimal = decimalParts.join("").slice(0, 2);

  return decimalParts.length > 0 ? `${whole}.${decimal}` : whole;
}

function formatMoneyInput(value: string) {
  if (!value) return "";
  const [whole = "", decimal] = value.split(".");
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decimal === undefined ? formattedWhole : `${formattedWhole}.${decimal}`;
}

function EmployeeReferencesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("settings.manage");
  const [depts, setDepts] = useState<DepartmentRow[]>([]);
  const [pos, setPos] = useState<PositionRow[]>([]);
  const [salaryGrades, setSalaryGrades] = useState<SalaryGradeRow[]>([]);
  const [salaryGradeTables, setSalaryGradeTables] = useState<SalaryGradeTableRow[]>([]);
  const [referenceLibraries, setReferenceLibraries] = useState<
    Record<ReferenceCategory, ReferenceRow[]>
  >(
    () =>
      Object.fromEntries(
        REFERENCE_LIBRARY_CONFIG.map((config) => [config.category, []]),
      ) as unknown as Record<ReferenceCategory, ReferenceRow[]>,
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
  const [deletingTable, setDeletingTable] = useState(false);
  const [editingSalaryGrade, setEditingSalaryGrade] = useState({
    id: 0,
    ordinance: "",
    grade: "",
    step: "",
    amount: "",
  });
  const [savingSalaryGradeId, setSavingSalaryGradeId] = useState(0);
  const [activationSummary, setActivationSummary] = useState<ActivationSummary | null>(null);
  const [showSalaryBuilder, setShowSalaryBuilder] = useState(false);
  const [activeReferenceTab, setActiveReferenceTab] = useState("departments");
  const [mobileReferenceNavOpen, setMobileReferenceNavOpen] = useState(false);
  const [addReferenceRequest, setAddReferenceRequest] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmingAction, setConfirmingAction] = useState(false);

  const filteredDepts = depts.filter((d) => d.name.toLowerCase().includes(deptQuery.toLowerCase()));
  const filteredPos = pos.filter((p) => p.title.toLowerCase().includes(posQuery.toLowerCase()));
  const activeSalaryTable = useMemo(
    () => salaryGradeTables.find((table) => table.isActive)?.ordinance || "",
    [salaryGradeTables],
  );
  const activeLibraryCount = useMemo(
    () =>
      Object.values(referenceLibraries).reduce(
        (total, rows) => total + rows.filter((row) => row.isActive).length,
        0,
      ),
    [referenceLibraries],
  );
  const selectedSalaryRows = useMemo(
    () =>
      salaryGrades
        .filter((row) => row.ordinance === selectedOrdinance)
        .sort((a, b) => a.grade - b.grade || a.step - b.step),
    [salaryGrades, selectedOrdinance],
  );
  const selectedSalaryTable = useMemo(
    () => salaryGradeTables.find((table) => table.ordinance === selectedOrdinance),
    [salaryGradeTables, selectedOrdinance],
  );
  const salaryTableReadiness = useMemo(() => {
    const tableKeys = new Map<string, Set<string>>();
    salaryGrades.forEach((row) => {
      if (!tableKeys.has(row.ordinance)) tableKeys.set(row.ordinance, new Set());
      tableKeys.get(row.ordinance)?.add(`${row.grade}-${row.step}`);
    });
    return new Map(
      salaryGradeTables.map((table) => {
        const keys = tableKeys.get(table.ordinance) || new Set();
        let missingCount = 0;
        for (let grade = 1; grade <= EXPECTED_SALARY_GRADES; grade += 1) {
          for (let step = 1; step <= EXPECTED_SALARY_STEPS; step += 1) {
            if (!keys.has(`${grade}-${step}`)) missingCount += 1;
          }
        }
        return [
          table.ordinance,
          {
            missingCount,
            complete: table.rowCount === EXPECTED_SALARY_ROWS && missingCount === 0,
          },
        ];
      }),
    );
  }, [salaryGradeTables, salaryGrades]);
  const selectedSalaryReadiness = useMemo(() => {
    const keys = new Set(selectedSalaryRows.map((row) => `${row.grade}-${row.step}`));
    const missingRows: Array<{ grade: number; step: number }> = [];
    for (let grade = 1; grade <= EXPECTED_SALARY_GRADES; grade += 1) {
      for (let step = 1; step <= EXPECTED_SALARY_STEPS; step += 1) {
        if (!keys.has(`${grade}-${step}`)) missingRows.push({ grade, step });
      }
    }
    return {
      expectedRows: EXPECTED_SALARY_ROWS,
      missingRows,
      complete: selectedSalaryRows.length === EXPECTED_SALARY_ROWS && missingRows.length === 0,
    };
  }, [selectedSalaryRows]);
  const salaryRowsByGrade = useMemo(() => {
    const byGrade = new Map<number, Map<number, SalaryGradeRow>>();
    selectedSalaryRows.forEach((row) => {
      if (!byGrade.has(row.grade)) byGrade.set(row.grade, new Map());
      byGrade.get(row.grade)?.set(row.step, row);
    });
    const maxGrade = Math.max(
      EXPECTED_SALARY_GRADES,
      ...selectedSalaryRows.map((row) => row.grade),
    );
    return Array.from({ length: maxGrade }, (_, index) => {
      const grade = index + 1;
      return {
        grade,
        steps: Array.from({ length: EXPECTED_SALARY_STEPS }, (_unused, stepIndex) => ({
          step: stepIndex + 1,
          row: byGrade.get(grade)?.get(stepIndex + 1) || null,
        })),
      };
    });
  }, [selectedSalaryRows]);
  const referenceTabOptions = useMemo(
    () => [
      {
        value: "departments",
        label: "Departments",
        count: depts.length,
        ...REFERENCE_SECTION_META.departments,
      },
      {
        value: "positions",
        label: "Positions",
        count: pos.length,
        ...REFERENCE_SECTION_META.positions,
      },
      {
        value: "salary",
        label: "Salary Grades",
        count: salaryGradeTables.length,
        ...REFERENCE_SECTION_META.salary,
      },
      ...REFERENCE_LIBRARY_CONFIG.map((config) => ({
        value: config.category,
        label: config.plural,
        count: referenceLibraries[config.category]?.length || 0,
        ...REFERENCE_SECTION_META[config.category],
      })),
    ],
    [depts.length, pos.length, referenceLibraries, salaryGradeTables.length],
  );
  const activeReference =
    referenceTabOptions.find((tab) => tab.value === activeReferenceTab) || referenceTabOptions[0];
  const activeReferenceLabel = activeReference?.label || "Employee References";
  const ActiveReferenceIcon = activeReference?.icon || Building2;

  const loadReferences = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [data, references] = await Promise.all([
        api<{
          departments: DepartmentRow[];
          positions: PositionRow[];
          salaryGrades: SalaryGradeRow[];
          salaryGradeTables?: SalaryGradeTableRow[];
        }>("/api/settings", { signal }),
        api<{ libraries: Record<ReferenceCategory, ReferenceRow[]> }>("/api/settings/references", {
          signal,
        }),
      ]);
      if (signal?.aborted) return;
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
      if (!isAbortError(error)) toast.error((error as Error).message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadReferences(controller.signal);
    return () => controller.abort();
  }, []);
  useRealtimeRefresh(loadReferences, ["settings"]);
  useEffect(() => {
    setRenameOrdinance(selectedOrdinance);
  }, [selectedOrdinance]);

  const addDepartment = async () => {
    if (!newDept.trim()) return false;
    try {
      const result = await api<{ department: DepartmentRow }>("/api/settings/departments", {
        method: "POST",
        body: JSON.stringify({ name: newDept.trim() }),
      });
      setDepts((prev) => [...prev, result.department]);
      setNewDept("");
      toast.success("Department added");
      return true;
    } catch (error) {
      toast.error((error as Error).message);
      return false;
    }
  };

  const updateDepartment = async (id: number, name: string) => {
    try {
      const result = await api<{ department: DepartmentRow }>(`/api/settings/departments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      setDepts((prev) =>
        prev.map((department) => (department.id === id ? result.department : department)),
      );
      toast.success("Department updated");
      return true;
    } catch (error) {
      toast.error((error as Error).message);
      return false;
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

  const requestDeleteDepartment = (department: DepartmentRow) => {
    setConfirmAction({
      title: "Delete department?",
      description: `This will remove "${department.name}" from the department reference list. If it has already been used in records, keep it and update the official reference instead.`,
      confirmLabel: "Delete Department",
      destructive: true,
      onConfirm: () => deleteDepartment(department.id),
    });
  };

  const addPosition = async () => {
    if (!newPos.trim()) return false;
    try {
      const result = await api<{ position: PositionRow }>("/api/settings/positions", {
        method: "POST",
        body: JSON.stringify({ title: newPos.trim() }),
      });
      setPos((prev) => [...prev, result.position]);
      setNewPos("");
      toast.success("Position added");
      return true;
    } catch (error) {
      toast.error((error as Error).message);
      return false;
    }
  };

  const updatePosition = async (id: number, title: string) => {
    try {
      const result = await api<{ position: PositionRow }>(`/api/settings/positions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      setPos((prev) => prev.map((position) => (position.id === id ? result.position : position)));
      toast.success("Position updated");
      return true;
    } catch (error) {
      toast.error((error as Error).message);
      return false;
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

  const requestDeletePosition = (position: PositionRow) => {
    setConfirmAction({
      title: "Delete position?",
      description: `This will remove "${position.title}" from the position reference list. If it has already been used in records, keep it and update the official reference instead.`,
      confirmLabel: "Delete Position",
      destructive: true,
      onConfirm: () => deletePosition(position.id),
    });
  };

  const addSalaryGrade = async () => {
    const grade = Number(newSalaryGrade.grade);
    const step = Number(newSalaryGrade.step);
    const amount = Number(newSalaryGrade.amount);
    if (
      !newSalaryGrade.ordinance.trim() ||
      !Number.isInteger(grade) ||
      grade < 1 ||
      grade > EXPECTED_SALARY_GRADES ||
      !Number.isInteger(step) ||
      step < 1 ||
      step > EXPECTED_SALARY_STEPS ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      toast.error("Enter an ordinance, SG 1-33, Step 1-8, and an amount greater than zero");
      return;
    }
    try {
      const result = await api<{ salaryGrade: SalaryGradeRow }>("/api/settings/salary-grades", {
        method: "POST",
        body: JSON.stringify({
          ordinance: newSalaryGrade.ordinance.trim(),
          grade,
          step,
          amount,
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
      if (!Number.isInteger(grade) || grade < 1 || grade > EXPECTED_SALARY_GRADES) {
        throw new Error(`Line ${index + 1}: salary grade must be between 1 and 33`);
      }
      if (!Number.isInteger(step) || step < 1 || step > EXPECTED_SALARY_STEPS) {
        throw new Error(`Line ${index + 1}: step must be between 1 and 8`);
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

  const requestDeleteSalaryGrade = (row: SalaryGradeRow) => {
    setConfirmAction({
      title: "Delete salary grade row?",
      description: `This will delete SG-${row.grade} Step ${row.step} from ${row.ordinance}. Active salary-table rows remain protected by the backend.`,
      confirmLabel: "Delete Row",
      destructive: true,
      onConfirm: () => deleteSalaryGrade(row.id),
    });
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
    setConfirmAction({
      title: "Correct salary table name?",
      description: `Rename ${oldOrdinance} to ${newOrdinance}. This only corrects the ordinance label and does not change salary amounts.`,
      confirmLabel: "Correct Name",
      onConfirm: () => renameSalaryTableConfirmed(oldOrdinance, newOrdinance),
    });
  };

  const renameSalaryTableConfirmed = async (oldOrdinance: string, newOrdinance: string) => {
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

  const deleteSalaryTable = async (ordinance: string) => {
    if (!ordinance) return;
    setConfirmAction({
      title: "Delete salary table?",
      description: `Delete ${ordinance}. This is only allowed for draft tables that are not active and not referenced by plantilla, movements, or 201 salary records.`,
      confirmLabel: "Delete Table",
      destructive: true,
      onConfirm: () => deleteSalaryTableConfirmed(ordinance),
    });
  };

  const deleteSalaryTableConfirmed = async (ordinance: string) => {
    setDeletingTable(true);
    try {
      await api<{ ok: boolean; rowCount: number }>("/api/settings/salary-grades/table", {
        method: "DELETE",
        body: JSON.stringify({ ordinance }),
      });
      if (selectedOrdinance === ordinance) {
        setSelectedOrdinance("");
        setEditingSalaryGrade({ id: 0, ordinance: "", grade: "", step: "", amount: "" });
      }
      await loadReferences();
      toast.success("Salary table deleted");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setDeletingTable(false);
    }
  };

  const activateSalaryTable = async (ordinance: string) => {
    if (!activationDate) {
      toast.error("Effectivity date is required");
      return;
    }
    const selectedTableRows = salaryGrades.filter((row) => row.ordinance === ordinance);
    const rowKeys = new Set(selectedTableRows.map((row) => `${row.grade}-${row.step}`));
    let missingCount = 0;
    for (let grade = 1; grade <= EXPECTED_SALARY_GRADES; grade += 1) {
      for (let step = 1; step <= EXPECTED_SALARY_STEPS; step += 1) {
        if (!rowKeys.has(`${grade}-${step}`)) missingCount += 1;
      }
    }
    setConfirmAction({
      title: "Activate salary table?",
      description:
        missingCount > 0
          ? `Activate ${ordinance} effective ${formatDisplayDate(activationDate)}. This table has ${missingCount} open standard grade/step rows; activation will be blocked if any active Plantilla item, including a vacancy, needs one of those rows.`
          : `Activate ${ordinance} effective ${formatDisplayDate(activationDate)}. This will remap all active Plantilla items, synchronize unposted movements, and add monthly 201 Salary records for active occupants.`,
      confirmLabel: "Activate Table",
      activationRemarks: true,
      onConfirm: () => activateSalaryTableConfirmed(ordinance),
    });
  };

  const activateSalaryTableConfirmed = async (ordinance: string) => {
    setActivatingOrdinance(ordinance);
    try {
      const result = await api<{
        summary: {
          checked: number;
          updated: number;
          skipped: number;
          employeeSalaryRecordsCreated: number;
          movementsSynchronized: number;
        };
      }>("/api/settings/salary-grades/activate", {
        method: "POST",
        body: JSON.stringify({
          ordinance,
          effectivityDate: activationDate,
          remarks: activationRemarks.trim(),
        }),
      });
      await loadReferences();
      setActivationSummary({
        ordinance,
        effectivityDate: activationDate,
        checked: result.summary.checked,
        updated: result.summary.updated,
        skipped: result.summary.skipped,
        employeeSalaryRecordsCreated: result.summary.employeeSalaryRecordsCreated,
        movementsSynchronized: result.summary.movementsSynchronized,
      });
      toast.success(
        `Activated ${ordinance}: ${result.summary.updated} updated, ${result.summary.skipped} skipped`,
      );
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setActivatingOrdinance("");
    }
  };

  const runConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirmingAction(true);
    try {
      await confirmAction.onConfirm();
      setConfirmAction(null);
    } finally {
      setConfirmingAction(false);
    }
  };

  return (
    <AppShell
      title="Employee References"
      subtitle="Manage the table-driven organization, employment, position, and compensation libraries"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Link
            to="/employees"
            search={{ department: undefined, onboard: undefined, targetPlantillaItemId: undefined }}
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Employees
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate font-medium text-foreground">Employee References</span>
        </nav>
        {canManage && (
          <Button
            onClick={() => {
              if (activeReferenceTab === "salary") setShowSalaryBuilder(true);
              else setAddReferenceRequest((current) => current + 1);
            }}
          >
            <Plus className="h-4 w-4" />
            {activeReferenceTab === "salary" ? "Add Salary Rows" : "Add Reference"}
          </Button>
        )}
      </div>

      <section className="mb-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <ClipboardCheck className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-lg font-semibold sm:text-xl">Employee Reference Library</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Organization, employment, position, and compensation values used across HRIS.
              </p>
            </div>
          </div>
          <Badge
            variant={canManage ? "default" : "secondary"}
            className="self-start sm:self-center"
          >
            {canManage ? "Editing enabled" : "View only"}
          </Badge>
        </div>
        <div className="grid border-t border-border sm:grid-cols-2 xl:grid-cols-4">
          <ReferenceMetric
            icon={Building2}
            label="Departments"
            value={depts.length}
            detail={`${filteredDepts.length} visible`}
          />
          <ReferenceMetric
            icon={BriefcaseBusiness}
            label="Positions"
            value={pos.length}
            detail={`${filteredPos.length} visible`}
          />
          <ReferenceMetric
            icon={Table2}
            label="Salary Tables"
            value={salaryGradeTables.length}
            detail={activeSalaryTable ? `Active: ${activeSalaryTable}` : "No active table"}
          />
          <ReferenceMetric
            icon={CheckCircle2}
            label="Active Library Values"
            value={activeLibraryCount}
            detail={`${REFERENCE_LIBRARY_CONFIG.length} managed libraries`}
          />
        </div>
      </section>

      {loading && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Refreshing {activeReferenceLabel.toLowerCase()}...
        </div>
      )}

      <Tabs value={activeReferenceTab} onValueChange={setActiveReferenceTab}>
        <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-20">
            <button
              type="button"
              aria-expanded={mobileReferenceNavOpen}
              aria-controls="employee-reference-mobile-sections"
              onClick={() => setMobileReferenceNavOpen((current) => !current)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm lg:hidden"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <ActiveReferenceIcon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-muted-foreground">
                  Reference section
                </span>
                <span className="block truncate text-sm font-semibold">{activeReferenceLabel}</span>
              </span>
              <Menu className="h-4 w-4 text-muted-foreground" />
            </button>
            <div
              id="employee-reference-mobile-sections"
              className={cn(
                "mt-2 rounded-xl border border-border bg-card p-3 shadow-sm lg:mt-0 lg:block",
                mobileReferenceNavOpen ? "block" : "hidden",
              )}
            >
              <div className="mb-3 px-2">
                <h2 className="text-sm font-semibold">Reference Sections</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Select a library to review or maintain.
                </p>
              </div>
              <ReferenceSectionStepper
                options={referenceTabOptions}
                active={activeReferenceTab}
                onChange={(value) => {
                  setActiveReferenceTab(value);
                  setMobileReferenceNavOpen(false);
                }}
              />
            </div>
          </aside>

          <section className="min-w-0 rounded-xl border border-border bg-card shadow-sm">
            <header className="flex items-start gap-3 border-b border-border px-4 py-4 sm:px-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <ActiveReferenceIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold">{activeReferenceLabel}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {activeReference?.description}
                </p>
              </div>
            </header>

            <div className="p-3 sm:p-4">
              <TabsContent value="departments" className="mt-0">
                <SimpleReferenceSection
                  title="Departments"
                  description="Department names available in employee records and related filters."
                  itemLabel="department"
                  addPlaceholder="New department name"
                  searchPlaceholder="Search departments..."
                  value={newDept}
                  query={deptQuery}
                  items={filteredDepts.map((department) => ({
                    id: department.id,
                    label: department.name,
                    onEdit: (name) => updateDepartment(department.id, name),
                    onDelete: () => requestDeleteDepartment(department),
                  }))}
                  totalCount={depts.length}
                  canManage={canManage}
                  onValueChange={setNewDept}
                  onQueryChange={setDeptQuery}
                  onAdd={addDepartment}
                  addRequestKey={activeReferenceTab === "departments" ? addReferenceRequest : 0}
                  showAddAction={false}
                />
              </TabsContent>

              <TabsContent value="positions" className="mt-0">
                <SimpleReferenceSection
                  title="Positions"
                  description="Official position titles used in plantilla, employee profiles, and movements."
                  itemLabel="position"
                  addPlaceholder="New position title"
                  searchPlaceholder="Search positions..."
                  value={newPos}
                  query={posQuery}
                  items={filteredPos.map((position) => ({
                    id: position.id,
                    label: position.title,
                    onEdit: (title) => updatePosition(position.id, title),
                    onDelete: () => requestDeletePosition(position),
                  }))}
                  totalCount={pos.length}
                  canManage={canManage}
                  onValueChange={setNewPos}
                  onQueryChange={setPosQuery}
                  onAdd={addPosition}
                  addRequestKey={activeReferenceTab === "positions" ? addReferenceRequest : 0}
                  showAddAction={false}
                />
              </TabsContent>

              <TabsContent value="salary" className="mt-0">
                <div className="space-y-4">
                  <section className="rounded-lg border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                      <div>
                        <h2 className="text-base font-semibold">Salary Tables</h2>
                        <p className="text-xs text-muted-foreground">
                          One ordinance or schedule at a time.
                        </p>
                      </div>
                    </div>

                    <div className="grid max-h-[360px] gap-2 overflow-auto p-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {salaryGradeTables.map((table) => {
                        const selected = selectedOrdinance === table.ordinance;
                        const readiness = salaryTableReadiness.get(table.ordinance);
                        return (
                          <button
                            key={table.ordinance}
                            type="button"
                            onClick={() => selectSalaryTable(table.ordinance)}
                            className={cn(
                              "min-h-20 w-full rounded-md border px-3 py-2.5 text-left transition-colors",
                              selected
                                ? "border-[#2563eb] bg-[#eff6ff] text-blue-950 ring-1 ring-[#2563eb]/25 dark:border-blue-400/70 dark:bg-blue-500/15 dark:text-blue-50"
                                : "border-border bg-background hover:bg-muted/40",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold">
                                  {table.ordinance}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {table.rowCount}/{EXPECTED_SALARY_ROWS} rows
                                  {readiness?.missingCount
                                    ? `, ${readiness.missingCount} open`
                                    : ""}
                                </div>
                              </div>
                              {table.isActive ? (
                                <Badge className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/20">
                                  Active
                                </Badge>
                              ) : readiness?.complete ? (
                                <Badge variant="outline" className="shrink-0 text-[#2563eb]">
                                  Ready
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="shrink-0 text-amber-700">
                                  Draft
                                </Badge>
                              )}
                            </div>
                          </button>
                        );
                      })}
                      {salaryGradeTables.length === 0 && (
                        <div className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">
                          No salary tables yet. Use Add Rows to create the first table.
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="rounded-lg border border-border bg-card shadow-sm">
                    <div className="border-b border-border p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-lg font-semibold">
                              {selectedOrdinance || "Select a salary table"}
                            </h2>
                            {selectedSalaryTable?.isActive ? (
                              <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/20">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Active
                              </Badge>
                            ) : selectedSalaryReadiness.complete ? (
                              <Badge
                                variant="outline"
                                className="gap-1 border-[#bfdbfe] text-[#2563eb]"
                              >
                                <FileCheck2 className="h-3.5 w-3.5" />
                                Ready
                              </Badge>
                            ) : selectedOrdinance ? (
                              <Badge
                                variant="outline"
                                className="gap-1 border-amber-200 text-amber-700"
                              >
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Draft
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedOrdinance
                              ? "Review the schedule. Activate only after the ordinance and effectivity date are final."
                              : "Choose a table from the list to review or activate."}
                          </p>
                        </div>

                        {selectedOrdinance && (
                          <div className="grid gap-2 sm:grid-cols-[160px_auto]">
                            <Input
                              type="date"
                              value={activationDate}
                              onChange={(event) => setActivationDate(event.target.value)}
                              disabled={!canManage}
                              className="h-9"
                            />
                            <Button
                              size="sm"
                              disabled={
                                !canManage ||
                                activeSalaryTable === selectedOrdinance ||
                                activatingOrdinance === selectedOrdinance ||
                                selectedSalaryRows.length === 0
                              }
                              onClick={() => activateSalaryTable(selectedOrdinance)}
                              className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                            >
                              {activatingOrdinance === selectedOrdinance ? (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              ) : (
                                <Power className="mr-1 h-4 w-4" />
                              )}
                              Activate
                            </Button>
                          </div>
                        )}
                      </div>

                      {selectedOrdinance && (
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                          <Badge variant="outline">{selectedSalaryRows.length} rows</Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              selectedSalaryReadiness.missingRows.length
                                ? "border-amber-200 text-amber-700"
                                : "border-emerald-200 text-emerald-700",
                            )}
                          >
                            {selectedSalaryReadiness.missingRows.length
                              ? `${selectedSalaryReadiness.missingRows.length} open rows`
                              : "Complete"}
                          </Badge>
                          {selectedSalaryTable?.minGrade && selectedSalaryTable?.maxGrade && (
                            <Badge variant="outline">
                              SG-{selectedSalaryTable.minGrade} to SG-{selectedSalaryTable.maxGrade}
                            </Badge>
                          )}
                          <div className="ml-auto flex w-full flex-col gap-2 sm:w-auto sm:min-w-[420px] sm:flex-row">
                            <Input
                              value={renameOrdinance}
                              onChange={(event) => setRenameOrdinance(event.target.value)}
                              disabled={!canManage || renamingTable}
                              className="h-8"
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
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="mr-1 h-4 w-4" />
                              )}
                              Rename
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                !canManage ||
                                deletingTable ||
                                Boolean(selectedSalaryTable?.isActive)
                              }
                              onClick={() => deleteSalaryTable(selectedOrdinance)}
                              className="border-destructive/30 text-destructive hover:bg-destructive/10"
                            >
                              {deletingTable ? (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-1 h-4 w-4" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedOrdinance && selectedSalaryReadiness.missingRows.length > 0 && (
                        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
                          Open rows:{" "}
                          {selectedSalaryReadiness.missingRows
                            .slice(0, 8)
                            .map((row) => `SG-${row.grade} Step ${row.step}`)
                            .join(", ")}
                          {selectedSalaryReadiness.missingRows.length > 8 ? "..." : ""}
                        </div>
                      )}

                      {activationSummary && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200">
                          <ClipboardCheck className="h-4 w-4" />
                          Activated {activationSummary.ordinance} effective{" "}
                          {formatDisplayDate(activationSummary.effectivityDate)}:{" "}
                          {activationSummary.updated} Plantilla items updated,{" "}
                          {activationSummary.employeeSalaryRecordsCreated} employee salary records
                          created, {activationSummary.movementsSynchronized} pending movements
                          synchronized, {activationSummary.skipped} skipped.
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="max-h-[70vh] overflow-auto rounded-lg border border-border">
                        <table className="w-full min-w-[1280px] text-sm">
                          <thead className="sticky top-0 z-10 bg-card">
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                              <th className="w-24 px-4 py-3 font-medium">Grade</th>
                              {Array.from({ length: EXPECTED_SALARY_STEPS }, (_unused, index) => (
                                <th key={index + 1} className="px-4 py-3 text-right font-medium">
                                  Step {index + 1}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrdinance ? (
                              salaryRowsByGrade.map((gradeRow) => (
                                <tr key={gradeRow.grade} className="border-b border-border/70">
                                  <td className="sticky left-0 bg-card px-4 py-2.5 font-semibold">
                                    SG-{gradeRow.grade}
                                  </td>
                                  {gradeRow.steps.map(({ step, row }) => (
                                    <td
                                      key={step}
                                      className={cn(
                                        "group min-w-36 px-3 py-2.5 align-top",
                                        row
                                          ? "bg-background"
                                          : "bg-amber-50/60 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200",
                                      )}
                                    >
                                      {row ? (
                                        editingSalaryGrade.id === row.id ? (
                                          <div className="space-y-2">
                                            <div className="grid grid-cols-3 gap-1">
                                              <Input
                                                value={editingSalaryGrade.grade}
                                                onChange={(event) =>
                                                  setEditingSalaryGrade({
                                                    ...editingSalaryGrade,
                                                    grade: event.target.value,
                                                  })
                                                }
                                                className="h-8 text-xs"
                                              />
                                              <Input
                                                value={editingSalaryGrade.step}
                                                onChange={(event) =>
                                                  setEditingSalaryGrade({
                                                    ...editingSalaryGrade,
                                                    step: event.target.value,
                                                  })
                                                }
                                                className="h-8 text-xs"
                                              />
                                              <Input
                                                type="number"
                                                value={editingSalaryGrade.amount}
                                                onChange={(event) =>
                                                  setEditingSalaryGrade({
                                                    ...editingSalaryGrade,
                                                    amount: event.target.value,
                                                  })
                                                }
                                                className="h-8 text-right text-xs"
                                              />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                              <button
                                                disabled={savingSalaryGradeId === row.id}
                                                onClick={updateSalaryGrade}
                                                className="text-muted-foreground hover:text-[#2563eb] disabled:opacity-30"
                                                title="Save correction"
                                              >
                                                {savingSalaryGradeId === row.id ? (
                                                  <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                  <Save className="h-4 w-4" />
                                                )}
                                              </button>
                                              <button
                                                disabled={savingSalaryGradeId === row.id}
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
                                          </div>
                                        ) : (
                                          <div className="text-right">
                                            <div className="font-mono text-sm">
                                              {formatMoney(row.amount)}
                                            </div>
                                            <div className="mt-1 flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                                              <button
                                                disabled={!canManage || row.isActive}
                                                onClick={() => startSalaryGradeEdit(row)}
                                                className="text-muted-foreground hover:text-[#2563eb] disabled:opacity-30"
                                                title={
                                                  row.isActive
                                                    ? "Rows from the active salary table cannot be edited"
                                                    : "Correct row"
                                                }
                                              >
                                                <Pencil className="h-3.5 w-3.5" />
                                              </button>
                                              <button
                                                disabled={!canManage || row.isActive}
                                                onClick={() => requestDeleteSalaryGrade(row)}
                                                className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                                                title={
                                                  row.isActive
                                                    ? "Rows from the active salary table cannot be deleted"
                                                    : "Delete row"
                                                }
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        )
                                      ) : (
                                        <div className="text-right text-sm text-muted-foreground">
                                          -
                                        </div>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={EXPECTED_SALARY_STEPS + 1}
                                  className="px-4 py-12 text-center text-muted-foreground"
                                >
                                  Select a salary table to review it.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                </div>
              </TabsContent>

              {REFERENCE_LIBRARY_CONFIG.map((config) => (
                <TabsContent key={config.category} value={config.category} className="mt-0">
                  <ReferenceLibraryPanel
                    config={config}
                    rows={referenceLibraries[config.category] || []}
                    parentRows={
                      config.parentCategory ? referenceLibraries[config.parentCategory] || [] : []
                    }
                    canManage={canManage}
                    onChanged={loadReferences}
                    addRequestKey={activeReferenceTab === config.category ? addReferenceRequest : 0}
                    showAddAction={false}
                  />
                </TabsContent>
              ))}
            </div>
          </section>
        </div>
      </Tabs>
      <Dialog open={showSalaryBuilder} onOpenChange={setShowSalaryBuilder}>
        <DialogContent className="grid max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] grid-rows-[auto_1fr_auto] gap-0 overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-2xl">
          <DialogHeader className="border-b border-border px-5 py-4 pr-12">
            <DialogTitle>Add Salary Rows</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto px-5 py-4">
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Table name
              <Input
                placeholder="Example: EO 64 Third Tranche 2026"
                value={newSalaryGrade.ordinance}
                onChange={(event) =>
                  setNewSalaryGrade({ ...newSalaryGrade, ordinance: event.target.value })
                }
                disabled={!canManage}
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                Salary grade
                <Input
                  placeholder="SG"
                  value={newSalaryGrade.grade}
                  onChange={(event) =>
                    setNewSalaryGrade({ ...newSalaryGrade, grade: event.target.value })
                  }
                  disabled={!canManage}
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                Step
                <Input
                  placeholder="Step"
                  value={newSalaryGrade.step}
                  onChange={(event) =>
                    setNewSalaryGrade({ ...newSalaryGrade, step: event.target.value })
                  }
                  disabled={!canManage}
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                Amount
                <Input
                  placeholder="Amount"
                  inputMode="decimal"
                  value={formatMoneyInput(newSalaryGrade.amount)}
                  onChange={(event) =>
                    setNewSalaryGrade({
                      ...newSalaryGrade,
                      amount: sanitizeMoneyInput(event.target.value),
                    })
                  }
                  disabled={!canManage}
                />
              </label>
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
              <Plus className="mr-1 h-4 w-4" /> Add Single Row
            </Button>
            <div className="space-y-2">
              <Textarea
                rows={8}
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
                variant="outline"
                className="w-full"
              >
                {bulkSaving ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1 h-4 w-4" />
                )}
                Add Bulk Rows
              </Button>
            </div>
          </div>
          <DialogFooter className="border-t border-border px-5 py-4">
            <Button variant="outline" onClick={() => setShowSalaryBuilder(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          {confirmAction?.activationRemarks && (
            <div className="grid gap-2">
              <label
                htmlFor="salary-activation-remarks"
                className="text-sm font-medium text-foreground"
              >
                Remarks
              </label>
              <Textarea
                id="salary-activation-remarks"
                value={activationRemarks}
                onChange={(event) => setActivationRemarks(event.target.value)}
                placeholder="Enter remarks for the 201 salary record"
                disabled={confirmingAction}
                rows={3}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmingAction}
              onClick={(event) => {
                event.preventDefault();
                runConfirmAction();
              }}
              className={
                confirmAction?.destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {confirmingAction && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmAction?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

interface ReferenceMetricProps {
  icon: typeof Building2;
  label: string;
  value: number;
  detail: string;
}

function ReferenceSectionStepper({
  options,
  active,
  onChange,
}: {
  options: Array<{
    value: string;
    label: string;
    count: number;
    description: string;
    icon: ComponentType<{ className?: string }>;
  }>;
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <nav aria-label="Employee reference sections" className="space-y-0.5">
      {options.map((option, index) => {
        const Icon = option.icon;
        const isActive = option.value === active;
        return (
          <div key={option.value} className="relative">
            {index < options.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute left-[21px] top-10 h-[calc(100%-24px)] w-px bg-border"
              />
            )}
            <button
              type="button"
              aria-current={isActive ? "step" : undefined}
              onClick={() => onChange(option.value)}
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
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                  isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {option.count}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}

function ReferenceMetric({ icon: Icon, label, value, detail }: ReferenceMetricProps) {
  return (
    <div className="border-b border-border p-4 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2n)]:border-r xl:last:border-r-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="rounded-md border border-border bg-background p-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

interface SimpleReferenceItem {
  id: number;
  label: string;
  onEdit?: (label: string) => Promise<boolean> | boolean;
  onDelete: () => void;
}

interface SimpleReferenceSectionProps {
  title: string;
  description: string;
  itemLabel: string;
  addPlaceholder: string;
  searchPlaceholder: string;
  value: string;
  query: string;
  items: SimpleReferenceItem[];
  totalCount: number;
  canManage: boolean;
  onValueChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onAdd: () => Promise<boolean> | boolean;
  addRequestKey?: number;
  showAddAction?: boolean;
}

function SimpleReferenceSection({
  title,
  description,
  itemLabel,
  addPlaceholder,
  searchPlaceholder,
  value,
  query,
  items,
  totalCount,
  canManage,
  onValueChange,
  onQueryChange,
  onAdd,
  addRequestKey = 0,
  showAddAction = true,
}: SimpleReferenceSectionProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<SimpleReferenceItem | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (addRequestKey > 0 && canManage) setAddOpen(true);
  }, [addRequestKey, canManage]);

  const submitAdd = async () => {
    if (!value.trim()) return;
    setAdding(true);
    try {
      const saved = await onAdd();
      if (saved) setAddOpen(false);
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (item: SimpleReferenceItem) => {
    setEditingItem(item);
    setEditValue(item.label);
  };

  const submitEdit = async () => {
    if (!editingItem?.onEdit || !editValue.trim()) return;
    setSavingEdit(true);
    try {
      const saved = await editingItem.onEdit(editValue.trim());
      if (saved) setEditingItem(null);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-semibold text-foreground">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {items.length} of {totalCount}
              </Badge>
              {showAddAction && (
                <Button
                  size="sm"
                  disabled={!canManage}
                  onClick={() => setAddOpen(true)}
                  className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                >
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              )}
            </div>
          </div>
          <div className="relative mt-4 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="bg-muted/30 pl-9"
            />
          </div>
        </div>

        <ul className="max-h-[560px] divide-y divide-border overflow-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/30"
            >
              <span className="min-w-0 truncate font-medium text-foreground">{item.label}</span>
              <div className="flex items-center gap-1">
                {item.onEdit && (
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={!canManage}
                    onClick={() => startEdit(item)}
                    className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    title={`Edit ${itemLabel}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={!canManage}
                  onClick={item.onDelete}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title={`Delete ${itemLabel}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <li className="px-5 py-12 text-center text-sm text-muted-foreground">
              {query.trim()
                ? `No ${itemLabel}s match your search.`
                : `No ${itemLabel}s have been added yet.`}
            </li>
          )}
        </ul>
      </div>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add {itemLabel}</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder={addPlaceholder}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitAdd();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={adding}>
              Cancel
            </Button>
            <Button
              disabled={!canManage || adding || !value.trim()}
              onClick={submitAdd}
              className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
            >
              {adding ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-1 h-4 w-4" />
              )}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(editingItem)}
        onOpenChange={(open) => {
          if (!open && !savingEdit) setEditingItem(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {itemLabel}</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder={addPlaceholder}
            value={editValue}
            onChange={(event) => setEditValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitEdit();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button
              disabled={
                !canManage ||
                savingEdit ||
                !editValue.trim() ||
                editValue.trim() === editingItem?.label
              }
              onClick={submitEdit}
              className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
            >
              {savingEdit ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
