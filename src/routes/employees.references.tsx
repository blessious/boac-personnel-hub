import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

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
}

function EmployeeReferencesPage() {
  const { can } = useAuth();
  const [depts, setDepts] = useState<DepartmentRow[]>([]);
  const [pos, setPos] = useState<PositionRow[]>([]);
  const [salaryGrades, setSalaryGrades] = useState<SalaryGradeRow[]>([]);
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
  const [loading, setLoading] = useState(true);

  const filteredDepts = depts.filter((d) => d.name.toLowerCase().includes(deptQuery.toLowerCase()));
  const filteredPos = pos.filter((p) => p.title.toLowerCase().includes(posQuery.toLowerCase()));

  const loadReferences = async () => {
    setLoading(true);
    try {
      const data = await api<{
        departments: DepartmentRow[];
        positions: PositionRow[];
        salaryGrades: SalaryGradeRow[];
      }>("/api/settings");
      setDepts(data.departments);
      setPos(data.positions);
      setSalaryGrades(data.salaryGrades);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferences();
  }, []);

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
        [...prev, result.salaryGrade].sort((a, b) => a.grade - b.grade || a.step - b.step),
      );
      setNewSalaryGrade({ ordinance: "", grade: "", step: "", amount: "" });
      toast.success("Salary grade added");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const deleteSalaryGrade = async (id: number) => {
    try {
      await api<{ ok: boolean }>(`/api/settings/salary-grades/${id}`, { method: "DELETE" });
      setSalaryGrades((prev) => prev.filter((item) => item.id !== id));
      toast.success("Salary grade removed");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <AppShell
      title="Employee References"
      subtitle="Manage departments, positions, and salary grades used by employee records"
    >
      {loading && (
        <div className="mb-3 text-sm text-muted-foreground">Loading employee references...</div>
      )}
      <Tabs defaultValue="departments">
        <div className="overflow-x-auto no-scrollbar">
          <TabsList className="bg-card border border-border w-max min-w-full">
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="salary">Salary Grades</TabsTrigger>
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
                  disabled={!can("edit") || !newDept.trim()}
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
                    disabled={!can("delete")}
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
                  disabled={!can("edit") || !newPos.trim()}
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
                    disabled={!can("delete")}
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
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <Input
                  placeholder="Ordinance"
                  value={newSalaryGrade.ordinance}
                  onChange={(e) =>
                    setNewSalaryGrade({ ...newSalaryGrade, ordinance: e.target.value })
                  }
                />
                <Input
                  placeholder="Grade (e.g. 1)"
                  value={newSalaryGrade.grade}
                  onChange={(e) => setNewSalaryGrade({ ...newSalaryGrade, grade: e.target.value })}
                />
                <Input
                  placeholder="Step (e.g. 1)"
                  value={newSalaryGrade.step}
                  onChange={(e) => setNewSalaryGrade({ ...newSalaryGrade, step: e.target.value })}
                />
                <Input
                  placeholder="Amount"
                  type="number"
                  value={newSalaryGrade.amount}
                  onChange={(e) => setNewSalaryGrade({ ...newSalaryGrade, amount: e.target.value })}
                />
                <Button
                  disabled={
                    !can("edit") ||
                    !newSalaryGrade.ordinance.trim() ||
                    !newSalaryGrade.grade.trim() ||
                    !newSalaryGrade.step.trim() ||
                    !newSalaryGrade.amount.trim()
                  }
                  onClick={addSalaryGrade}
                  className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                    <th className="px-4 py-3 font-medium">Ordinance</th>
                    <th className="px-4 py-3 font-medium">Salary Grade</th>
                    <th className="px-4 py-3 font-medium">Step</th>
                    <th className="px-4 py-3 font-medium text-right">Monthly Amount</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryGrades.map((s, i) => (
                    <tr key={s.id} className={i % 2 ? "bg-muted/40" : ""}>
                      <td className="px-4 py-2.5">{s.ordinance}</td>
                      <td className="px-4 py-2.5">SG-{s.grade}</td>
                      <td className="px-4 py-2.5">Step {s.step}</td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {s.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          disabled={!can("delete")}
                          onClick={() => deleteSalaryGrade(s.id)}
                          className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
