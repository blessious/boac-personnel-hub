import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { type AgencySettings, useSettings } from "@/lib/settings-context";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

interface DepartmentRow { id: number; name: string }
interface PositionRow { id: number; title: string }
interface SalaryGradeRow { id: number; ordinance: string; grade: number; step: number; amount: number }

function SettingsPage() {
  const { can, user } = useAuth();
  const { agency, updateAgency } = useSettings();
  const [depts, setDepts] = useState<DepartmentRow[]>([]);
  const [pos, setPos] = useState<PositionRow[]>([]);
  const [salaryGrades, setSalaryGrades] = useState<SalaryGradeRow[]>([]);
  const [newDept, setNewDept] = useState("");
  const [newPos, setNewPos] = useState("");
  const [deptQuery, setDeptQuery] = useState("");
  const [posQuery, setPosQuery] = useState("");
  const [newSalaryGrade, setNewSalaryGrade] = useState({ ordinance: "", grade: "", step: "", amount: "" });
  const [loading, setLoading] = useState(true);

  const filteredDepts = depts.filter(d => d.name.toLowerCase().includes(deptQuery.toLowerCase()));
  const filteredPos = pos.filter(p => p.title.toLowerCase().includes(posQuery.toLowerCase()));

  const isAdmin = user?.role === "Admin";

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api<{
        agency: AgencySettings;
        departments: DepartmentRow[];
        positions: PositionRow[];
        salaryGrades: SalaryGradeRow[];
      }>("/api/settings");
      updateAgency(data.agency);
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
    loadSettings();
  }, []);

  const saveAgency = async () => {
    try {
      const result = await api<{ agency: AgencySettings }>("/api/settings/agency", {
        method: "PUT",
        body: JSON.stringify(agency),
      });
      updateAgency(result.agency);
      toast.success("Agency profile updated");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

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
      setSalaryGrades((prev) => [...prev, result.salaryGrade].sort((a, b) => a.grade - b.grade || a.step - b.step));
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
    <AppShell title="Settings" subtitle="Manage reference data, salary tables, and accounts">
      <Tabs defaultValue="agency">
        {loading && <div className="mb-3 text-sm text-muted-foreground">Loading database settings...</div>}
        <div className="overflow-x-auto no-scrollbar">
          <TabsList className="bg-card border border-border w-max min-w-full">
            <TabsTrigger value="agency">Agency Profile</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="salary">Salary Grades</TabsTrigger>
            <TabsTrigger value="users" disabled={!isAdmin}>Users</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="agency" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-1">Agency Branding</h3>
            <p className="text-sm text-muted-foreground mb-6">Customize the system name and logo for your agency.</p>
            
            <div className="space-y-6 max-w-2xl">
              <div className="grid gap-2">
                <Label htmlFor="agency-name">Agency Name</Label>
                <Input 
                  id="agency-name" 
                  value={agency.name} 
                  onChange={(e) => updateAgency({ name: e.target.value })}
                  placeholder="e.g. Agency Name" 
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="agency-tagline">Tagline / Subtitle</Label>
                <Input 
                  id="agency-tagline" 
                  value={agency.tagline} 
                  onChange={(e) => updateAgency({ tagline: e.target.value })}
                  placeholder="e.g. Marinduque LGU" 
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="agency-logo">Logo / Seal</Label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <input
                      id="logo-file"
                      type="file"
                      accept="image/*"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            updateAgency({ logoUrl: reader.result as string });
                            toast.success("Logo uploaded");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  <div className="relative group shrink-0">
                    <div className={cn(
                      "h-24 w-24 rounded-xl grid place-items-center overflow-hidden shadow-sm",
                      agency.logoUrl ? "" : "border border-dashed border-border bg-muted/30"
                    )}>
                      {agency.logoUrl ? (
                        <img src={agency.logoUrl} alt="Logo Preview" className="h-full w-full object-contain" />
                      ) : (
                        <ShieldCheck className="h-10 w-10 text-muted-foreground/30" />
                      )}
                    </div>
                    {agency.logoUrl && (
                      <button 
                        onClick={() => updateAgency({ logoUrl: "" })}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="agency-icon">System Icon (Favicon)</Label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <input
                      id="icon-file"
                      type="file"
                      accept="image/*"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            updateAgency({ iconUrl: reader.result as string });
                            toast.success("Icon uploaded");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  <div className="relative group shrink-0">
                    <div className="h-12 w-12 rounded-lg border border-dashed border-border bg-muted/30 grid place-items-center overflow-hidden shadow-sm">
                      {agency.iconUrl ? (
                        <img src={agency.iconUrl} alt="Icon Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-[9px] text-muted-foreground">1:1</div>
                      )}
                    </div>
                    {agency.iconUrl && (
                      <button 
                        onClick={() => updateAgency({ iconUrl: "" })}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="agency-banner">Cover Photo (Login Page Background)</Label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <input
                      id="banner-file"
                      type="file"
                      accept="image/*"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            updateAgency({ bannerUrl: reader.result as string });
                            toast.success("Cover photo uploaded");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  <div className="relative group shrink-0">
                    <div className={cn(
                      "h-20 w-32 rounded-lg grid place-items-center overflow-hidden shadow-sm",
                      agency.bannerUrl ? "" : "border border-dashed border-border bg-muted/30"
                    )}>
                      {agency.bannerUrl ? (
                        <img src={agency.bannerUrl} alt="Banner Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-[9px] text-muted-foreground">16:9</div>
                      )}
                    </div>
                    {agency.bannerUrl && (
                      <button 
                        onClick={() => updateAgency({ bannerUrl: "" })}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={saveAgency}
                  className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-md hover:shadow-blue-500/20 transition-all duration-200"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 flex gap-2">
                <Input 
                  placeholder="New department name" 
                  value={newDept} 
                  onChange={(e) => setNewDept(e.target.value)} 
                />
                <Button
                  disabled={!can("edit") || !newDept.trim()}
                  onClick={addDepartment}
                  className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                ><Plus className="h-4 w-4 mr-1" /> Add</Button>
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
                <li key={d.id} className="flex items-center justify-between py-2.5 text-sm hover:bg-muted/30 px-2 transition-colors">
                  <span>{d.name}</span>
                  <button disabled={!can("delete")} onClick={() => deleteDepartment(d.id)} className="text-muted-foreground hover:text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
              {filteredDepts.length === 0 && (
                <li className="py-8 text-center text-muted-foreground text-sm">No departments found.</li>
              )}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="positions" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 flex gap-2">
                <Input 
                  placeholder="New position title" 
                  value={newPos} 
                  onChange={(e) => setNewPos(e.target.value)} 
                />
                <Button
                  disabled={!can("edit") || !newPos.trim()}
                  onClick={addPosition}
                  className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                ><Plus className="h-4 w-4 mr-1" /> Add</Button>
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
                <li key={p.id} className="flex items-center justify-between py-2.5 text-sm hover:bg-muted/30 px-2 transition-colors">
                  <span>{p.title}</span>
                  <button disabled={!can("delete")} onClick={() => deletePosition(p.id)} className="text-muted-foreground hover:text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
              {filteredPos.length === 0 && (
                <li className="py-8 text-center text-muted-foreground text-sm">No positions found.</li>
              )}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <Input placeholder="Ordinance" value={newSalaryGrade.ordinance} onChange={(e) => setNewSalaryGrade({ ...newSalaryGrade, ordinance: e.target.value })} />
                <Input placeholder="Grade (e.g. 1)" value={newSalaryGrade.grade} onChange={(e) => setNewSalaryGrade({ ...newSalaryGrade, grade: e.target.value })} />
                <Input placeholder="Step (e.g. 1)" value={newSalaryGrade.step} onChange={(e) => setNewSalaryGrade({ ...newSalaryGrade, step: e.target.value })} />
                <Input placeholder="Amount" type="number" value={newSalaryGrade.amount} onChange={(e) => setNewSalaryGrade({ ...newSalaryGrade, amount: e.target.value })} />
                <Button
                  disabled={!can("edit") || !newSalaryGrade.ordinance.trim() || !newSalaryGrade.grade.trim() || !newSalaryGrade.step.trim() || !newSalaryGrade.amount.trim()}
                  onClick={addSalaryGrade}
                  className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                ><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>
            </div>
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                    <th className="px-4 py-3 font-medium">Ordinance</th>
                    <th className="px-4 py-3 font-medium">Salary Grade</th>
                    <th className="px-4 py-3 font-medium">Step</th>
                    <th className="px-4 py-3 font-medium text-right">Monthly Amount (₱)</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryGrades.map((s, i) => (
                    <tr key={s.id} className={i % 2 ? "bg-muted/40" : ""}>
                      <td className="px-4 py-2.5">{s.ordinance}</td>
                      <td className="px-4 py-2.5">SG-{s.grade}</td>
                      <td className="px-4 py-2.5">Step {s.step}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{s.amount.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button disabled={!can("delete")} onClick={() => deleteSalaryGrade(s.id)} className="text-muted-foreground hover:text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            {!isAdmin ? (
              <div className="text-sm text-muted-foreground py-8 text-center">Admin access required.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-3 font-medium">Name</th>
                    <th className="px-2 py-3 font-medium">Username</th>
                    <th className="px-2 py-3 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-2 py-3 text-muted-foreground" colSpan={3}>Use System Administration for user add, edit, and delete.</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
