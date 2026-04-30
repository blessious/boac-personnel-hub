import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SETTINGS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings-context";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { can, user } = useAuth();
  const { agency, updateAgency } = useSettings();
  const [depts, setDepts] = useState([...SETTINGS.departments]);
  const [pos, setPos] = useState([...SETTINGS.positions]);
  const [salaryGrades, setSalaryGrades] = useState([...SETTINGS.salaryGrades]);
  const [newDept, setNewDept] = useState("");
  const [newPos, setNewPos] = useState("");
  const [newSalaryGrade, setNewSalaryGrade] = useState({ ordinance: "", grade: "", step: "", amount: "" });

  const isAdmin = user?.role === "Admin";

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
                  <div className="flex-1 space-y-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="logo-file" className="text-xs font-normal text-muted-foreground">Upload Image</Label>
                      <Input 
                        id="logo-file" 
                        type="file" 
                        accept="image/*"
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
                    <div className="grid gap-1.5">
                      <Label htmlFor="agency-logo-url" className="text-xs font-normal text-muted-foreground">Or paste Logo URL</Label>
                      <Input 
                        id="agency-logo-url" 
                        value={agency.logoUrl} 
                        onChange={(e) => updateAgency({ logoUrl: e.target.value })}
                        placeholder="https://example.com/logo.png" 
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommended: Transparent PNG or SVG, at least 200x200px.
                    </p>
                  </div>
                  <div className="relative group">
                    <div className={cn(
                      "h-24 w-24 rounded-xl grid place-items-center shrink-0 overflow-hidden shadow-sm",
                      agency.logoUrl ? "" : "border border-dashed border-border bg-muted/30"
                    )}>
                      {agency.logoUrl ? (
                        <img src={agency.logoUrl} alt="Preview" className="h-full w-full object-contain" />
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
                  <div className="flex-1 space-y-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="icon-file" className="text-xs font-normal text-muted-foreground">Upload Icon</Label>
                      <Input 
                        id="icon-file" 
                        type="file" 
                        accept="image/*"
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
                  </div>
                  <div className="relative group">
                    <div className="h-12 w-12 rounded-lg border border-dashed border-border bg-muted/30 grid place-items-center shrink-0 overflow-hidden shadow-sm">
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

              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={() => toast.success("Agency profile updated")}
                  className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex gap-2 mb-4">
              <Input placeholder="New department name" value={newDept} onChange={(e) => setNewDept(e.target.value)} />
              <Button
                disabled={!can("edit") || !newDept.trim()}
                onClick={() => { setDepts((d) => [...d, newDept.trim()]); setNewDept(""); toast.success("Department added"); }}
                className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"
              ><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>
            <ul className="divide-y divide-border">
              {depts.map((d, i) => (
                <li key={d + i} className="flex items-center justify-between py-2.5 text-sm">
                  <span>{d}</span>
                  <button disabled={!can("delete")} onClick={() => { setDepts((x) => x.filter((_, j) => j !== i)); toast("Removed"); }} className="text-muted-foreground hover:text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="positions" className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex gap-2 mb-4">
              <Input placeholder="New position title" value={newPos} onChange={(e) => setNewPos(e.target.value)} />
              <Button
                disabled={!can("edit") || !newPos.trim()}
                onClick={() => { setPos((p) => [...p, newPos.trim()]); setNewPos(""); toast.success("Position added"); }}
                className="bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90"
              ><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>
            <ul className="divide-y divide-border">
              {pos.map((p, i) => (
                <li key={p + i} className="flex items-center justify-between py-2.5 text-sm">
                  <span>{p}</span>
                  <button disabled={!can("delete")} onClick={() => { setPos((x) => x.filter((_, j) => j !== i)); toast("Removed"); }} className="text-muted-foreground hover:text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
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
