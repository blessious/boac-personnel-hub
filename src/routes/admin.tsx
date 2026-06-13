import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  Database,
  Download,
  Edit,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Role, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { EmployeeRecord } from "@/lib/employees-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type AdminTab = "users" | "audit" | "backup";

interface AdminUser {
  id: number;
  username: string;
  name: string;
  role: Role;
  employeeId: string;
  employeeNo: string;
  employeeName: string;
  isActive: boolean;
  mustChangePassword: boolean;
}

interface AuditLog {
  id: number;
  action: string;
  details: unknown;
  ipAddress?: string;
  createdAt: string;
  user: { username: string; name: string; role: Role } | null;
}

interface BackupFile {
  fileName: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
}

const ADMIN_TABS: { key: AdminTab; label: string; icon: typeof Users }[] = [
  { key: "users", label: "User Management", icon: Users },
  { key: "audit", label: "Audit Log", icon: Activity },
  { key: "backup", label: "Data Backup", icon: Database },
];

const ROLE_COLORS: Record<Role, string> = {
  Admin: "bg-rose-100 text-rose-700 border-rose-200",
  HR: "bg-blue-100 text-blue-700 border-blue-200",
  Employee: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Viewer: "bg-muted text-muted-foreground border-border",
};

function AdminPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [employeeCandidates, setEmployeeCandidates] = useState<EmployeeRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [form, setForm] = useState<{
    name: string;
    username: string;
    role: Role;
    employeeId: string;
    isActive: boolean;
  }>({
    name: "",
    username: "",
    role: "Viewer",
    employeeId: "",
    isActive: true,
  });

  const loadUsers = async () => {
    if (!isAdmin) return;
    try {
      const result = await api<{ users: AdminUser[] }>("/api/admin/users");
      setUsers(result.users);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [isAdmin]);

  const loadEmployeeCandidates = async () => {
    if (!isAdmin) return;
    try {
      const result = await api<{ employees: EmployeeRecord[] }>(
        "/api/admin/employee-account-candidates",
      );
      setEmployeeCandidates(result.employees);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const loadAuditLogs = async () => {
    if (!isAdmin) return;
    setLoadingAudit(true);
    try {
      const result = await api<{ logs: AuditLog[] }>("/api/admin/audit-logs");
      setAuditLogs(result.logs);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoadingAudit(false);
    }
  };

  const loadBackups = async () => {
    if (!isAdmin) return;
    setLoadingBackups(true);
    try {
      const result = await api<{ backups: BackupFile[] }>("/api/admin/backups");
      setBackups(result.backups);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit") loadAuditLogs();
    if (activeTab === "backup") loadBackups();
  }, [activeTab, isAdmin]);

  const openAddUser = () => {
    setTemporaryPassword("");
    setForm({ name: "", username: "", role: "Employee", employeeId: "", isActive: true });
    loadEmployeeCandidates();
    setShowAddUser(true);
  };

  const createUser = async () => {
    try {
      const result = await api<{ user: AdminUser; temporaryPassword: string }>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setUsers((prev) => [...prev, result.user].sort((a, b) => a.name.localeCompare(b.name)));
      setTemporaryPassword(result.temporaryPassword);
      toast.success("User created");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const openEditUser = (item: AdminUser) => {
    setSelectedUser(item);
    setTemporaryPassword("");
    setForm({
      name: item.name,
      username: item.username,
      role: item.role,
      employeeId: item.employeeId || "",
      isActive: item.isActive,
    });
    loadEmployeeCandidates().then(() => {
      if (item.employeeId) {
        setEmployeeCandidates((current) => {
          if (current.some((employee) => employee.id === item.employeeId)) return current;
          return [
            {
              id: item.employeeId,
              employeeId: item.employeeNo,
              firstname: item.employeeName.split(", ")[1] || item.employeeName,
              middlename: "",
              lastname: item.employeeName.split(", ")[0] || "",
              nameExt: "",
              department: "",
              position: "",
              status: "Permanent",
              level: "",
              statusClass: "",
              dateHired: "",
              dateEmployed: "",
              itemNo: "",
              empStatus: "Active",
              birthday: "",
              gender: "",
              civilStatus: "",
              citizenship: "",
              placeOfBirth: "",
              height: "",
              heightUnit: "",
              weight: "",
              weightUnit: "",
              bloodType: "",
              sss: "",
              gsis: "",
              pagibig: "",
              tin: "",
              philhealth: "",
              ctcNo: "",
              ctcPlaceIssued: "",
              ctcDateIssued: "",
              cellphoneNo: "",
              email: "",
              residentialAddress: "",
              residentialZipcode: "",
              residentialTelNo: "",
              permanentAddress: "",
              permanentZipcode: "",
              permanentTelNo: "",
              agency: "",
              dateSeparated: "",
              veteransCode: "",
              bankAccountId: "",
              cardSerialNo: "",
              photoUrl: "",
            },
            ...current,
          ];
        });
      }
    });
    setShowEditUser(true);
  };

  const updateUser = async () => {
    if (!selectedUser) return;
    try {
      const result = await api<{ user: AdminUser }>(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setUsers((prev) => prev.map((item) => (item.id === result.user.id ? result.user : item)));
      setShowEditUser(false);
      toast.success("User updated");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const deleteUser = async (item: AdminUser) => {
    if (!window.confirm(`Delete user ${item.username}?`)) return;
    try {
      await api<{ ok: boolean }>(`/api/admin/users/${item.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== item.id));
      toast.success("User deleted");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const resetPassword = async (item: AdminUser) => {
    try {
      const result = await api<{ temporaryPassword: string }>(
        `/api/admin/users/${item.id}/reset-password`,
        { method: "POST" },
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === item.id ? { ...u, mustChangePassword: true } : u)),
      );
      setTemporaryPassword(result.temporaryPassword);
      toast.success(`Temporary password: ${result.temporaryPassword}`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const createBackup = async () => {
    setCreatingBackup(true);
    try {
      const result = await api<{ backup: BackupFile }>("/api/admin/backups", { method: "POST" });
      setBackups((prev) => [result.backup, ...prev]);
      toast.success("Backup created");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setCreatingBackup(false);
    }
  };

  const formatDateTime = (value: string) => new Date(value).toLocaleString();

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const activeUsers = users.filter((item) => item.isActive).length;
  const employeeUsers = users.filter((item) => item.role === "Employee").length;

  return (
    <AppShell
      title="System Administration"
      subtitle="Manage users, audit logs, and system configuration"
    >
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <AdminSummaryCard label="Active Users" value={activeUsers} icon={Users} />
        <AdminSummaryCard label="Employee Accounts" value={employeeUsers} icon={Lock} />
        <AdminSummaryCard label="Backups" value={backups.length} icon={Database} />
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 mb-4">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 font-medium">
          System Administration is restricted to authorized administrators only. All actions are
          logged.
        </p>
      </div>

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
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "users" && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-border">
            <div>
              <h4 className="font-semibold text-foreground">System Users</h4>
              <p className="text-xs text-muted-foreground">{users.length} registered accounts</p>
            </div>
            <Button
              onClick={openAddUser}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Username</th>
                  <th className="px-4 py-3 font-semibold">Employee Record</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item, index) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-b border-border/50 last:border-0",
                      index % 2 === 1 && "bg-muted/10",
                    )}
                  >
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground text-xs">
                      @{item.username}
                    </td>
                    <td className="px-4 py-3">
                      {item.employeeId ? (
                        <div>
                          <div className="font-medium">{item.employeeName}</div>
                          <div className="text-xs text-muted-foreground">{item.employeeNo}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No linked employee</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn("text-[11px]", ROLE_COLORS[item.role])}
                      >
                        {item.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          variant="outline"
                          className={
                            item.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-muted text-muted-foreground border-border"
                          }
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {item.mustChangePassword && (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200"
                          >
                            Temp Password
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => openEditUser(item)}
                          className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent text-muted-foreground transition-colors"
                          aria-label="Edit user"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => resetPassword(item)}
                          className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent text-muted-foreground transition-colors"
                          aria-label="Reset password"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteUser(item)}
                          className="h-7 w-7 grid place-items-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Delete user"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-border">
            <div>
              <h4 className="font-semibold text-foreground">Audit Log</h4>
              <p className="text-xs text-muted-foreground">
                Latest {auditLogs.length} recorded system actions
              </p>
            </div>
            <Button
              variant="outline"
              onClick={loadAuditLogs}
              disabled={loadingAudit}
              className="gap-1.5"
            >
              <RefreshCw className={cn("h-4 w-4", loadingAudit && "animate-spin")} /> Refresh
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="px-4 py-3 font-semibold">Date/Time</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                  <th className="px-4 py-3 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, index) => (
                  <tr
                    key={log.id}
                    className={cn(
                      "border-b border-border/50 last:border-0",
                      index % 2 === 1 && "bg-muted/10",
                    )}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{log.user?.name || "System"}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.user ? `@${log.user.username}` : "No account"}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3 max-w-md truncate text-muted-foreground">
                      {log.details ? JSON.stringify(log.details) : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{log.ipAddress || "-"}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                      {loadingAudit ? "Loading audit logs..." : "No audit logs found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "backup" && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-border">
            <div>
              <h4 className="font-semibold text-foreground">Data Backup</h4>
              <p className="text-xs text-muted-foreground">
                Create and download MySQL JSON snapshots
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadBackups}
                disabled={loadingBackups}
                className="gap-1.5"
              >
                <RefreshCw className={cn("h-4 w-4", loadingBackups && "animate-spin")} /> Refresh
              </Button>
              <Button
                onClick={createBackup}
                disabled={creatingBackup}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <Database className="h-4 w-4" /> {creatingBackup ? "Creating..." : "Create Backup"}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="px-4 py-3 font-semibold">Backup File</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Size</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup, index) => (
                  <tr
                    key={backup.fileName}
                    className={cn(
                      "border-b border-border/50 last:border-0",
                      index % 2 === 1 && "bg-muted/10",
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{backup.fileName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(backup.createdAt || backup.modifiedAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatBytes(backup.size)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="outline" size="sm" className="gap-1.5">
                        <a
                          href={`/api/admin/backups/${encodeURIComponent(backup.fileName)}/download`}
                          download
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                      </Button>
                    </td>
                  </tr>
                ))}
                {backups.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={4}>
                      {loadingBackups
                        ? "Loading backups..."
                        : "No backups found. Create one to start."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <UserDialog
        open={showAddUser}
        mode="add"
        form={form}
        employeeCandidates={employeeCandidates}
        temporaryPassword={temporaryPassword}
        onOpenChange={setShowAddUser}
        onChange={setForm}
        onSubmit={createUser}
      />
      <UserDialog
        open={showEditUser}
        mode="edit"
        form={form}
        employeeCandidates={employeeCandidates}
        temporaryPassword={temporaryPassword}
        onOpenChange={setShowEditUser}
        onChange={setForm}
        onSubmit={updateUser}
      />
    </AppShell>
  );
}

function UserDialog({
  open,
  mode,
  form,
  employeeCandidates,
  temporaryPassword,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  mode: "add" | "edit";
  form: { name: string; username: string; role: Role; employeeId: string; isActive: boolean };
  employeeCandidates: EmployeeRecord[];
  temporaryPassword: string;
  onOpenChange: (open: boolean) => void;
  onChange: (form: {
    name: string;
    username: string;
    role: Role;
    employeeId: string;
    isActive: boolean;
  }) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add System User" : "Edit System User"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 min-w-0">
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-1">
            <Label>Linked Employee</Label>
            <Select
              value={form.employeeId || "none"}
              onValueChange={(employeeId) => {
                const nextEmployeeId = employeeId === "none" ? "" : employeeId;
                const employee = employeeCandidates.find((item) => item.id === nextEmployeeId);
                onChange({
                  ...form,
                  employeeId: nextEmployeeId,
                  name: employee ? `${employee.firstname} ${employee.lastname}` : form.name,
                  username: mode === "add" && employee ? suggestUsername(employee) : form.username,
                  role: form.role || "Employee",
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" className="w-full truncate text-left" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No linked employee</SelectItem>
                {employeeCandidates.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.lastname}, {employee.firstname} · {employee.employeeId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Username</Label>
            <Input
              value={form.username}
              onChange={(e) => onChange({ ...form, username: e.target.value })}
              placeholder="username"
              disabled={mode === "edit"}
            />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(role) => onChange({ ...form, role: role as Role })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === "edit" && (
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={form.isActive ? "active" : "inactive"}
                onValueChange={(value) => onChange({ ...form, isActive: value === "active" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {temporaryPassword && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="text-xs font-semibold text-amber-800">Temporary Password</div>
              <div className="mt-1 font-mono text-sm text-amber-900">{temporaryPassword}</div>
              <p className="mt-1 text-xs text-amber-800">
                Give this to the user. They must change it on first access.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onSubmit}>
            {mode === "add" ? "Create User" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function suggestUsername(employee: EmployeeRecord) {
  const base = employee.employeeId || `${employee.firstname}.${employee.lastname}`;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function AdminSummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
