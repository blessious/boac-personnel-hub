import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SETTINGS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { can, user } = useAuth();
  const [depts, setDepts] = useState([...SETTINGS.departments]);
  const [pos, setPos] = useState([...SETTINGS.positions]);
  const [newDept, setNewDept] = useState("");
  const [newPos, setNewPos] = useState("");

  const isAdmin = user?.role === "Admin";

  return (
    <AppShell title="Settings" subtitle="Manage reference data, salary tables, and accounts">
      <Tabs defaultValue="departments">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="salary">Salary Grades</TabsTrigger>
          <TabsTrigger value="users" disabled={!isAdmin}>Users</TabsTrigger>
        </TabsList>

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
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                    <th className="px-4 py-3 font-medium">Ordinance</th>
                    <th className="px-4 py-3 font-medium">Salary Grade</th>
                    <th className="px-4 py-3 font-medium">Step</th>
                    <th className="px-4 py-3 font-medium text-right">Monthly Amount (₱)</th>
                  </tr>
                </thead>
                <tbody>
                  {SETTINGS.salaryGrades.slice(0, 80).map((s, i) => (
                    <tr key={i} className={i % 2 ? "bg-muted/40" : ""}>
                      <td className="px-4 py-2.5">{s.ordinance}</td>
                      <td className="px-4 py-2.5">SG-{s.grade}</td>
                      <td className="px-4 py-2.5">Step {s.step}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{s.amount.toLocaleString()}</td>
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
