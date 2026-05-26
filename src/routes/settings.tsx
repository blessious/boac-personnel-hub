import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SETTINGS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings-context";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { can, user } = useAuth();
  const { agency, updateAgency } = useSettings();
  
  const [agencyData, setAgencyData] = useState(agency);
  
  useEffect(() => {
    setAgencyData(agency);
  }, [agency]);

  const [depts, setDepts] = useState([...SETTINGS.departments]);
  const [pos, setPos] = useState([...SETTINGS.positions]);
  const [salaryGrades, setSalaryGrades] = useState([...SETTINGS.salaryGrades]);
  const [newDept, setNewDept] = useState("");
  const [deptQuery, setDeptQuery] = useState("");
  const [newPos, setNewPos] = useState("");
  const [posQuery, setPosQuery] = useState("");
  const [newSalaryGrade, setNewSalaryGrade] = useState({ ordinance: "", grade: "", step: "", amount: "" });

  const filteredDepts = depts.filter((d) => d.toLowerCase().includes(deptQuery.toLowerCase()));
  const filteredPos = pos.filter((p) => p.toLowerCase().includes(posQuery.toLowerCase()));

  const isAdmin = user?.role === "Admin";

  const handleSaveAgency = () => {
    updateAgency(agencyData);
    toast.success("Agency profile updated");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof agencyData) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/webp", 0.8);

        try {
          setAgencyData((prev) => ({ ...prev, [field]: compressedDataUrl }));
        } catch (error) {
          toast.error("Image is still too large to save. Please choose a smaller file.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <AppShell title="Settings" subtitle="Manage reference data, salary tables, and accounts">
      <Tabs defaultValue="agency">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="agency">Agency Profile</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="salary">Salary Grades</TabsTrigger>
          <TabsTrigger value="users" disabled={!isAdmin}>Users</TabsTrigger>
        </TabsList>

        <TabsContent value="agency" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm max-w-2xl text-left">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Agency Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agency-name">Agency Name</Label>
                <Input id="agency-name" value={agencyData.name} onChange={(e) => setAgencyData({ ...agencyData, name: e.target.value })} disabled={!can("edit")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agency-tagline">Subtitle / Tagline</Label>
                <Input id="agency-tagline" value={agencyData.tagline} onChange={(e) => setAgencyData({ ...agencyData, tagline: e.target.value })} disabled={!can("edit")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agency-logo">Logo</Label>
                <Input type="file" id="agency-logo" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} disabled={!can("edit")} />
                {agencyData.logoUrl && (
                  <div className="mt-2 p-2 bg-muted rounded border border-border">
                    <img src={agencyData.logoUrl} alt="Logo preview" className="h-12 w-auto" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="agency-icon">Favicon / Icon</Label>
                <Input type="file" id="agency-icon" accept="image/*" onChange={(e) => handleImageUpload(e, 'iconUrl')} disabled={!can("edit")} />
                {agencyData.iconUrl && (
                  <div className="mt-2 p-2 bg-muted rounded border border-border">
                    <img src={agencyData.iconUrl} alt="Icon preview" className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="agency-banner">Login Cover</Label>
                <Input type="file" id="agency-banner" accept="image/*" onChange={(e) => handleImageUpload(e, 'bannerUrl')} disabled={!can("edit")} />
                {agencyData.bannerUrl && (
                  <div className="mt-2 p-2 bg-muted rounded border border-border">
                    <img src={agencyData.bannerUrl} alt="Banner preview" className="h-40 w-full object-contain rounded bg-muted/50" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button disabled={!can("edit")} onClick={handleSaveAgency} className="bg-primary text-primary-foreground">
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 flex gap-2">
                <Input placeholder="New department name" value={newDept} onChange={(e) => setNewDept(e.target.value)} />
                <Button
                  disabled={!can("edit") || !newDept.trim()}
                  onClick={() => { setDepts((d) => [...d, newDept.trim()]); setNewDept(""); toast.success("Department added"); }}
                  className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"
                ><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>
              <div className="w-full sm:w-64">
                <Input placeholder="Search departments..." value={deptQuery} onChange={(e) => setDeptQuery(e.target.value)} className="bg-muted/50" />
              </div>
            </div>
            <ul className="divide-y divide-border border-t border-border">
              {filteredDepts.map((d, i) => (
                <li key={d + i} className="flex items-center justify-between py-2.5 text-sm hover:bg-muted/30 px-2 transition-colors">
                  <span>{d}</span>
                  <button disabled={!can("delete")} onClick={() => { setDepts((x) => x.filter((val) => val !== d)); toast("Removed"); }} className="text-muted-foreground hover:text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
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
                <Input placeholder="New position title" value={newPos} onChange={(e) => setNewPos(e.target.value)} />
                <Button
                  disabled={!can("edit") || !newPos.trim()}
                  onClick={() => { setPos((p) => [...p, newPos.trim()]); setNewPos(""); toast.success("Position added"); }}
                  className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"
                ><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>
              <div className="w-full sm:w-64">
                <Input placeholder="Search positions..." value={posQuery} onChange={(e) => setPosQuery(e.target.value)} className="bg-muted/50" />
              </div>
            </div>
            <ul className="divide-y divide-border border-t border-border">
              {filteredPos.map((p, i) => (
                <li key={p + i} className="flex items-center justify-between py-2.5 text-sm hover:bg-muted/30 px-2 transition-colors">
                  <span>{p}</span>
                  <button disabled={!can("delete")} onClick={() => { setPos((x) => x.filter((val) => val !== p)); toast("Removed"); }} className="text-muted-foreground hover:text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
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
                  onClick={() => {
                    setSalaryGrades((prev) => [...prev, {
                      ordinance: newSalaryGrade.ordinance.trim(),
                      grade: parseInt(newSalaryGrade.grade) || 0,
                      step: parseInt(newSalaryGrade.step) || 0,
                      amount: parseFloat(newSalaryGrade.amount) || 0,
                    }]);
                    setNewSalaryGrade({ ordinance: "", grade: "", step: "", amount: "" });
                    toast.success("Salary grade added");
                  }}
                  className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"
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
                    <tr key={i} className={i % 2 ? "bg-muted/40" : ""}>
                      <td className="px-4 py-2.5">{s.ordinance}</td>
                      <td className="px-4 py-2.5">SG-{s.grade}</td>
                      <td className="px-4 py-2.5">Step {s.step}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{s.amount.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button disabled={!can("delete")} onClick={() => { setSalaryGrades((x) => x.filter((_, j) => j !== i)); toast("Salary grade removed"); }} className="text-muted-foreground hover:text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
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
                  {SETTINGS.users.map((u) => (
                    <tr key={u.id} className="border-t border-border">
                      <td className="px-2 py-3">{u.name}</td>
                      <td className="px-2 py-3 text-muted-foreground">{u.username}</td>
                      <td className="px-2 py-3"><Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{u.role}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
