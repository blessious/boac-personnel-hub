import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Users, Shield, Database, Settings2, Plus, Trash2, Edit,
  Lock, Activity, AlertCircle, ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SETTINGS, DEPARTMENTS, POSITIONS, SALARY_GRADES, SALARY_STEPS, SALARY_TABLE } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type AdminTab = "users" | "audit" | "backup" | "system";

const ADMIN_TABS: { key: AdminTab; label: string; icon: typeof Users }[] = [
  { key: "users", label: "User Management", icon: Users },
  { key: "audit", label: "Audit Log", icon: Activity },
  { key: "backup", label: "Data Backup", icon: Database },
  { key: "system", label: "System Config", icon: Settings2 },
];

const ROLE_COLORS: Record<string, string> = {
  Admin: "bg-rose-100 text-rose-700 border-rose-200",
  "HR Officer": "bg-blue-100 text-blue-700 border-blue-200",
  Viewer: "bg-muted text-muted-foreground border-border",
};

const AUDIT_LOG = [
  { id: "al1", user: "admin", action: "Modified employee record", target: "Rosa Reyes (e002)", time: "2026-06-08 10:42", type: "edit" },
  { id: "al2", user: "hrmo", action: "Approved leave request", target: "LR005 — Roberto Pangilinan", time: "2026-06-08 09:15", type: "approve" },
  { id: "al3", user: "admin", action: "Added new user account", target: "viewer (Pedro Cruz)", time: "2026-06-07 16:30", type: "create" },
  { id: "al4", user: "hrmo", action: "Generated Employee Master List", target: "Report export", time: "2026-06-07 14:00", type: "report" },
  { id: "al5", user: "admin", action: "Updated agency settings", target: "STRH HRIS Configuration", time: "2026-06-06 11:20", type: "settings" },
  { id: "al6", user: "hrmo", action: "Disapproved leave request", target: "LR007 — Grace Aquino", time: "2026-06-05 15:50", type: "disapprove" },
];

const ACTION_COLOR: Record<string, string> = {
  edit: "text-amber-600 bg-amber-50",
  approve: "text-emerald-600 bg-emerald-50",
  create: "text-blue-600 bg-blue-50",
  report: "text-purple-600 bg-purple-50",
  settings: "text-gray-600 bg-gray-50",
  disapprove: "text-rose-600 bg-rose-50",
};

function AdminPage() {
  const { can, user } = useAuth();
  const { agency, updateAgency } = useSettings();
  const [depts, setDepts] = useState([...DEPARTMENTS]);
  const [pos, setPos] = useState([...POSITIONS]);
  const [salaryGrades, setSalaryGrades] = useState(() =>
    SALARY_GRADES.flatMap((g) =>
      SALARY_STEPS.map((s) => ({ ordinance: "Annex 1", grade: g, step: s, amount: SALARY_TABLE[g][s - 1] }))
    )
  );
  const [newDept, setNewDept] = useState("");
  const [newPos, setNewPos] = useState("");
  const [deptQuery, setDeptQuery] = useState("");
  const [posQuery, setPosQuery] = useState("");
  const [newSalaryGrade, setNewSalaryGrade] = useState({ ordinance: "", grade: "", step: "", amount: "" });
  const filteredDepts = depts.filter((d) => d.toLowerCase().includes(deptQuery.toLowerCase()));
  const filteredPos = pos.filter((p) => p.toLowerCase().includes(posQuery.toLowerCase()));
  const isAdmin = user?.role === "Admin";
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [showAddUser, setShowAddUser] = useState(false);
  const [users] = useState(SETTINGS.users);

  return (
    <AppShell title="System Administration" subtitle="Manage users, audit logs, and system configuration">
      {/* Warning banner */}
      <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 mb-4">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 font-medium">
          System Administration is restricted to authorized administrators only. All actions are logged.
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-1 bg-muted/40 rounded-xl p-1 w-fit mb-5">
        {ADMIN_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* User Management */}
      {activeTab === "users" && (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="p-4 flex items-center justify-between border-b border-border">
            <div>
              <h4 className="font-semibold text-foreground">System Users</h4>
              <p className="text-xs text-muted-foreground">{users.length} registered accounts</p>
            </div>
            <Button onClick={() => setShowAddUser(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className={cn("border-b border-border/50 last:border-0", i % 2 === 1 && "bg-muted/10")}>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground text-xs">@{u.username}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn("text-[11px]", ROLE_COLORS[u.role] ?? "")}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => toast.info(`Editing ${u.name}…`)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent text-muted-foreground transition-colors"><Edit className="h-3.5 w-3.5" /></button>
                      <button onClick={() => toast.info(`Reset password for ${u.name}`)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent text-muted-foreground transition-colors"><Lock className="h-3.5 w-3.5" /></button>
                      <button onClick={() => toast.error(`Deleted ${u.name}`)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Log */}
      {activeTab === "audit" && (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="p-4 border-b border-border">
            <h4 className="font-semibold text-foreground">Audit Trail</h4>
            <p className="text-xs text-muted-foreground">Recent system activity log</p>
          </div>
          <div className="divide-y divide-border">
            {AUDIT_LOG.map((log) => (
              <div key={log.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className={cn("h-8 w-8 rounded-full grid place-items-center shrink-0", ACTION_COLOR[log.type])}>
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{log.action}</div>
                  <div className="text-xs text-muted-foreground">{log.target}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono text-muted-foreground">@{log.user}</div>
                  <div className="text-[10px] text-muted-foreground">{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Backup */}
      {activeTab === "backup" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Create Backup", desc: "Export a full snapshot of all HRIS data.", action: "Create Backup Now", icon: Database, color: "bg-blue-600 hover:bg-blue-700" },
            { label: "Restore Data", desc: "Restore from a previous backup file.", action: "Upload & Restore", icon: Shield, color: "bg-amber-600 hover:bg-amber-700" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <Icon className="h-8 w-8 text-primary mb-3" />
                <h4 className="font-semibold text-foreground mb-1">{item.label}</h4>
                <p className="text-sm text-muted-foreground mb-4">{item.desc}</p>
                <Button className={cn("w-full text-white gap-2", item.color)} onClick={() => toast.info(`${item.label} initiated…`)}>
                  {item.action}
                </Button>
              </div>
            );
          })}
          <div className="md:col-span-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h4 className="font-semibold text-foreground mb-3">Backup History</h4>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="pb-2 font-semibold">Backup Name</th>
                <th className="pb-2 font-semibold">Date Created</th>
                <th className="pb-2 font-semibold">Size</th>
                <th className="pb-2 font-semibold text-right">Action</th>
              </tr></thead>
              <tbody>
                {[
                  { name: "STRH_HRIS_backup_20260607", date: "2026-06-07 23:00", size: "12.4 MB" },
                  { name: "STRH_HRIS_backup_20260606", date: "2026-06-06 23:00", size: "12.1 MB" },
                  { name: "STRH_HRIS_backup_20260605", date: "2026-06-05 23:00", size: "11.9 MB" },
                ].map((b) => (
                  <tr key={b.name} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 font-mono text-xs">{b.name}</td>
                    <td className="py-2.5 text-muted-foreground text-xs">{b.date}</td>
                    <td className="py-2.5 text-muted-foreground text-xs">{b.size}</td>
                    <td className="py-2.5 text-right"><Button variant="outline" size="sm" onClick={() => toast.info("Downloading…")}>Download</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Config */}
      {activeTab === "system" && (
        <div className="space-y-4">
          <Tabs defaultValue="agency">
            <div className="overflow-x-auto">
              <TabsList className="bg-card border border-border w-max min-w-full">
                <TabsTrigger value="agency">Agency Profile</TabsTrigger>
                <TabsTrigger value="departments">Departments</TabsTrigger>
                <TabsTrigger value="positions">Positions</TabsTrigger>
                <TabsTrigger value="salary">Salary Grades</TabsTrigger>
              </TabsList>
            </div>

            {/* Agency Profile */}
            <TabsContent value="agency" className="mt-4">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-medium mb-1">Agency Branding</h3>
                <p className="text-sm text-muted-foreground mb-6">Customize the system name and logo for your agency.</p>
                <div className="space-y-6 max-w-2xl">
                  <div className="grid gap-2">
                    <Label>Agency Name</Label>
                    <Input value={agency.name} onChange={(e) => updateAgency({ name: e.target.value })} placeholder="Agency Name" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tagline / Subtitle</Label>
                    <Input value={agency.tagline} onChange={(e) => updateAgency({ tagline: e.target.value })} placeholder="Tagline" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Logo / Seal</Label>
                    <div className="flex gap-4 items-center">
                      <input type="file" accept="image/*" className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm cursor-pointer"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => updateAgency({ logoUrl: r.result as string }); r.readAsDataURL(f); } }} />
                      <div className="h-16 w-16 rounded-xl border border-dashed border-border bg-muted/30 grid place-items-center overflow-hidden shrink-0">
                        {agency.logoUrl ? <img src={agency.logoUrl} alt="Logo" className="h-full w-full object-contain" /> : <ShieldCheck className="h-8 w-8 text-muted-foreground/30" />}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>System Icon (Favicon / Tab Icon)</Label>
                    <div className="flex gap-4 items-center">
                      <input type="file" accept="image/x-icon,image/png,image/jpeg" className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm cursor-pointer"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => updateAgency({ iconUrl: r.result as string }); r.readAsDataURL(f); } }} />
                      <div className="h-16 w-16 rounded-xl border border-dashed border-border bg-muted/30 grid place-items-center overflow-hidden shrink-0">
                        {agency.iconUrl ? <img src={agency.iconUrl} alt="Favicon" className="h-full w-full object-contain" /> : <ShieldCheck className="h-8 w-8 text-muted-foreground/30" />}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Cover Photo (Login Background)</Label>
                    <input type="file" accept="image/*" className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm cursor-pointer"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => updateAgency({ bannerUrl: r.result as string }); r.readAsDataURL(f); } }} />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button onClick={() => toast.success("Agency profile updated")} className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Departments */}
            <TabsContent value="departments" className="mt-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="flex-1 flex gap-2">
                    <Input placeholder="New department name" value={newDept} onChange={(e) => setNewDept(e.target.value)} />
                    <Button disabled={!can("edit") || !newDept.trim()} onClick={() => { setDepts((d) => [...d, newDept.trim()]); setNewDept(""); toast.success("Department added"); }} className="bg-blue-600 text-white hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  <Input placeholder="Search departments..." value={deptQuery} onChange={(e) => setDeptQuery(e.target.value)} className="w-full sm:w-64 bg-muted/50" />
                </div>
                <ul className="divide-y divide-border border-t border-border">
                  {filteredDepts.map((d, i) => (
                    <li key={d + i} className="flex items-center justify-between py-2.5 text-sm hover:bg-muted/30 px-2 transition-colors">
                      <span>{d}</span>
                      <button disabled={!can("delete")} onClick={() => { setDepts((x) => x.filter((v) => v !== d)); toast("Removed"); }} className="text-muted-foreground hover:text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                    </li>
                  ))}
                  {filteredDepts.length === 0 && <li className="py-8 text-center text-muted-foreground text-sm">No departments found.</li>}
                </ul>
              </div>
            </TabsContent>

            {/* Positions */}
            <TabsContent value="positions" className="mt-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="flex-1 flex gap-2">
                    <Input placeholder="New position title" value={newPos} onChange={(e) => setNewPos(e.target.value)} />
                    <Button disabled={!can("edit") || !newPos.trim()} onClick={() => { setPos((p) => [...p, newPos.trim()]); setNewPos(""); toast.success("Position added"); }} className="bg-blue-600 text-white hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  <Input placeholder="Search positions..." value={posQuery} onChange={(e) => setPosQuery(e.target.value)} className="w-full sm:w-64 bg-muted/50" />
                </div>
                <ul className="divide-y divide-border border-t border-border">
                  {filteredPos.map((p, i) => (
                    <li key={p + i} className="flex items-center justify-between py-2.5 text-sm hover:bg-muted/30 px-2 transition-colors">
                      <span>{p}</span>
                      <button disabled={!can("delete")} onClick={() => { setPos((x) => x.filter((v) => v !== p)); toast("Removed"); }} className="text-muted-foreground hover:text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                    </li>
                  ))}
                  {filteredPos.length === 0 && <li className="py-8 text-center text-muted-foreground text-sm">No positions found.</li>}
                </ul>
              </div>
            </TabsContent>

            {/* Salary Grades */}
            <TabsContent value="salary" className="mt-4">
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    <Input placeholder="Ordinance" value={newSalaryGrade.ordinance} onChange={(e) => setNewSalaryGrade({ ...newSalaryGrade, ordinance: e.target.value })} />
                    <Input placeholder="Grade (e.g. 1)" value={newSalaryGrade.grade} onChange={(e) => setNewSalaryGrade({ ...newSalaryGrade, grade: e.target.value })} />
                    <Input placeholder="Step (e.g. 1)" value={newSalaryGrade.step} onChange={(e) => setNewSalaryGrade({ ...newSalaryGrade, step: e.target.value })} />
                    <Input placeholder="Amount" type="number" value={newSalaryGrade.amount} onChange={(e) => setNewSalaryGrade({ ...newSalaryGrade, amount: e.target.value })} />
                    <Button disabled={!can("edit") || !newSalaryGrade.ordinance.trim() || !newSalaryGrade.grade.trim()} onClick={() => { setSalaryGrades((prev) => [...prev, { ordinance: newSalaryGrade.ordinance, grade: parseInt(newSalaryGrade.grade) || 0, step: parseInt(newSalaryGrade.step) || 0, amount: parseFloat(newSalaryGrade.amount) || 0 }]); setNewSalaryGrade({ ordinance: "", grade: "", step: "", amount: "" }); toast.success("Salary grade added"); }} className="bg-blue-600 text-white hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
                <div className="max-h-[500px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card border-b border-border">
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Ordinance</th>
                        <th className="px-4 py-3 font-medium">SG</th>
                        <th className="px-4 py-3 font-medium">Step</th>
                        <th className="px-4 py-3 font-medium text-right">Monthly (₱)</th>
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
                            <button disabled={!can("delete")} onClick={() => { setSalaryGrades((x) => x.filter((_, j) => j !== i)); toast("Removed"); }} className="text-muted-foreground hover:text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add System User</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Full Name</Label><Input placeholder="Full name" /></div>
            <div className="space-y-1"><Label>Username</Label><Input placeholder="username" /></div>
            <div className="space-y-1"><Label>Password</Label><Input type="password" placeholder="Initial password" /></div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select defaultValue="Viewer">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="HR Officer">HR Officer</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setShowAddUser(false); toast.success("User created!"); }}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
