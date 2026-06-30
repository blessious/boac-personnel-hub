import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bug,
  Copy,
  Database,
  Download,
  Edit,
  Lock,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useRealtimeRefresh } from "@/lib/realtime";
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
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_OPTIONS, type Role, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { EmployeeRecord } from "@/lib/employees-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type AdminTab = "users" | "audit" | "errors" | "backup";

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
  failedLoginAttempts: number;
  lockedAt: string | null;
}

interface AuditLog {
  id: number;
  action: string;
  details: unknown;
  ipAddress?: string;
  createdAt: string;
  user: { username: string; name: string; role: Role } | null;
}

interface ErrorLog {
  id: number;
  method: string;
  path: string;
  message: string;
  stack: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user: { username: string; name: string; role: Role } | null;
}

interface BackupFile {
  fileName: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
}

interface BulkEmployeeAccount {
  userId: number;
  employeeId: string;
  employeeNo: string;
  employeeName: string;
  username: string;
  temporaryPassword: string;
}

const ADMIN_TABS: { key: AdminTab; label: string; icon: typeof Users }[] = [
  { key: "users", label: "User Management", icon: Users },
  { key: "audit", label: "Audit Log", icon: Activity },
  { key: "errors", label: "Error Log", icon: Bug },
  { key: "backup", label: "Data Backup", icon: Database },
];

const ROLE_COLORS: Record<Role, string> = {
  "Super Admin": "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  Admin: "bg-rose-100 text-rose-700 border-rose-200",
  HR: "bg-blue-100 text-blue-700 border-blue-200",
  Approver: "bg-violet-100 text-violet-700 border-violet-200",
  Employee: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Viewer: "bg-muted text-muted-foreground border-border",
};

function AdminPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin";
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [employeeCandidates, setEmployeeCandidates] = useState<EmployeeRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [loadingErrors, setLoadingErrors] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [tempPasswordMap, setTempPasswordMap] = useState<Record<number, string>>({});
  const [bulkGeneratingAccounts, setBulkGeneratingAccounts] = useState(false);
  const [bulkResettingPasswords, setBulkResettingPasswords] = useState(false);
  const [bulkEmployeeAccounts, setBulkEmployeeAccounts] = useState<BulkEmployeeAccount[]>([]);
  const [userSearch, setUserSearch] = useState("");
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

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const result = await api<{ users: AdminUser[] }>("/api/admin/users");
      setUsers(result.users);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  const loadAuditLogs = useCallback(async () => {
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
  }, [isAdmin]);

  const loadErrorLogs = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingErrors(true);
    try {
      const result = await api<{ logs: ErrorLog[] }>("/api/admin/error-logs");
      setErrorLogs(result.logs);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoadingErrors(false);
    }
  }, [isAdmin]);

  const loadBackups = useCallback(async () => {
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
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === "audit") loadAuditLogs();
    if (activeTab === "errors") loadErrorLogs();
    if (activeTab === "backup") loadBackups();
  }, [activeTab, loadAuditLogs, loadBackups, loadErrorLogs]);
  useRealtimeRefresh(() => {
    loadUsers();
    if (activeTab === "audit") loadAuditLogs();
    if (activeTab === "errors") loadErrorLogs();
    if (activeTab === "backup") loadBackups();
  }, ["admin", "employees"]);

  const openAddUser = () => {
    setTemporaryPassword("");
    setForm({ name: "", username: "", role: "Employee", employeeId: "", isActive: true });
    loadEmployeeCandidates();
    setShowAddUser(true);
  };

  const handleAddUserOpenChange = (open: boolean) => {
    setShowAddUser(open);
  };

  const createUser = async () => {
    try {
      const result = await api<{ user: AdminUser; temporaryPassword: string }>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setUsers((prev) => [...prev, result.user].sort((a, b) => a.name.localeCompare(b.name)));
      setTemporaryPassword(result.temporaryPassword);
      // Persist in map so it survives modal close/reopen
      setTempPasswordMap((prev) => ({ ...prev, [result.user.id]: result.temporaryPassword }));
      toast.success("User created");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const openEditUser = (item: AdminUser) => {
    setSelectedUser(item);
    // Restore temp password for this user if one was generated, don't wipe it
    setTemporaryPassword(tempPasswordMap[item.id] ?? "");
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
      // Clear stored temp password once acknowledged via Save Changes
      setTempPasswordMap((prev) => {
        const next = { ...prev };
        delete next[selectedUser.id];
        return next;
      });
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
      // Persist in map so it shows when edit dialog is opened
      setTempPasswordMap((prev) => ({ ...prev, [item.id]: result.temporaryPassword }));
      setBulkEmployeeAccounts([
        {
          userId: item.id,
          employeeId: item.employeeId || "",
          employeeNo: item.employeeNo || "",
          employeeName: item.employeeName || item.name,
          username: item.username,
          temporaryPassword: result.temporaryPassword,
        },
      ]);
      toast.success("Temporary password reset");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const bulkAccountText = bulkEmployeeAccounts
    .map((account) =>
      [
        `Employee: ${account.employeeName}`,
        `Employee ID: ${account.employeeNo}`,
        `Username: ${account.username}`,
        `Temporary password: ${account.temporaryPassword}`,
      ].join("\n"),
    )
    .join("\n\n");

  const generateBulkEmployeeAccounts = async () => {
    if (
      !window.confirm(
        "Generate accounts for all employees without linked user accounts? Temporary passwords will only be shown after this action.",
      )
    ) {
      return;
    }

    setBulkGeneratingAccounts(true);
    try {
      const result = await api<{
        accounts: BulkEmployeeAccount[];
        skipped: Array<{ employeeNo: string; employeeName: string; reason: string }>;
      }>("/api/admin/employee-accounts/bulk", { method: "POST" });
      await loadUsers();
      await loadEmployeeCandidates();
      setBulkEmployeeAccounts(result.accounts);
      if (result.accounts.length === 0) {
        toast.info("No employees need new accounts");
      } else {
        toast.success(`Created ${result.accounts.length} employee account(s)`);
      }
      if (result.skipped.length) {
        toast.warning(`${result.skipped.length} employee account(s) were skipped`);
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBulkGeneratingAccounts(false);
    }
  };

  const resetBulkEmployeePasswords = async () => {
    if (
      !window.confirm(
        "Reset temporary passwords for all active linked employee accounts? This will sign those employees out and force password change on next login.",
      )
    ) {
      return;
    }

    setBulkResettingPasswords(true);
    try {
      const result = await api<{ accounts: BulkEmployeeAccount[] }>(
        "/api/admin/employee-accounts/reset-passwords",
        { method: "POST" },
      );
      await loadUsers();
      setBulkEmployeeAccounts(result.accounts);
      if (result.accounts.length === 0) {
        toast.info("No active linked employee accounts to reset");
      } else {
        toast.success(`Reset ${result.accounts.length} employee password(s)`);
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBulkResettingPasswords(false);
    }
  };

  const copyBulkEmployeeAccounts = async () => {
    if (!bulkAccountText) return;
    try {
      await navigator.clipboard.writeText(
        `${bulkAccountText}\n\nEmployees must change these passwords on first login.`,
      );
      toast.success("Bulk credentials copied");
    } catch {
      toast.error("Unable to copy credentials");
    }
  };

  const printBulkEmployeeAccounts = () => {
    if (!bulkEmployeeAccounts.length) return;
    const printWindow = window.open("", "_blank", "width=900,height=720");
    if (!printWindow) {
      toast.error("Allow pop-ups to print bulk credentials");
      return;
    }

    const { document } = printWindow;
    document.title = "Employee Account Credentials";
    const style = document.createElement("style");
    style.textContent =
      "body{font-family:Arial,sans-serif;padding:28px;color:#111827}h1{font-size:20px;margin:0 0 6px}.note{font-size:12px;color:#4b5563;margin:0 0 18px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #d1d5db;padding:8px;text-align:left;vertical-align:top}th{background:#f3f4f6;font-weight:700}.mono{font-family:Consolas,monospace}";
    document.head.appendChild(style);

    const title = document.createElement("h1");
    title.textContent = "Employee Account Credentials";
    const note = document.createElement("p");
    note.className = "note";
    note.textContent =
      "Temporary passwords are shown only after account creation. Employees must change them on first login.";
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    for (const label of ["Employee", "Employee ID", "Username", "Temporary Password"]) {
      const cell = document.createElement("th");
      cell.textContent = label;
      headerRow.appendChild(cell);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    for (const account of bulkEmployeeAccounts) {
      const row = document.createElement("tr");
      for (const value of [
        account.employeeName,
        account.employeeNo,
        account.username,
        account.temporaryPassword,
      ]) {
        const cell = document.createElement("td");
        cell.textContent = value;
        if (value === account.username || value === account.temporaryPassword) {
          cell.className = "mono";
        }
        row.appendChild(cell);
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    document.body.append(title, note, table);
    printWindow.focus();
    printWindow.print();
  };

  const unlockUser = async (item: AdminUser) => {
    try {
      await api<{ ok: boolean }>(`/api/admin/users/${item.id}/unlock`, { method: "POST" });
      setUsers((prev) =>
        prev.map((user) =>
          user.id === item.id ? { ...user, failedLoginAttempts: 0, lockedAt: null } : user,
        ),
      );
      toast.success(`${item.username} unlocked`);
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
  const approverUsers = users.filter((item) => item.role === "Approver").length;
  const hasSuperAdmin = users.some((item) => item.role === "Super Admin" && item.isActive);
  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((item) =>
      [
        item.name,
        item.username,
        item.role,
        item.employeeName,
        item.employeeNo,
        item.isActive ? "active" : "inactive",
        item.mustChangePassword ? "temp password" : "",
        item.lockedAt ? "locked" : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [userSearch, users]);
  const roleOptions =
    user?.role === "Super Admin" || !hasSuperAdmin
      ? ROLE_OPTIONS
      : ROLE_OPTIONS.filter((role) => role !== "Super Admin");

  return (
    <AppShell
      title="System Administration"
      subtitle="Manage users, audit logs, and system configuration"
    >
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <AdminSummaryCard label="Active Users" value={activeUsers} icon={Users} />
        <AdminSummaryCard label="Approvers" value={approverUsers} icon={ShieldCheck} />
        <AdminSummaryCard label="Backups" value={backups.length} icon={Database} />
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 mb-4">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 font-medium">
          System Administration is restricted to administrators. HR maintains records, Approvers
          decide workflows, Viewers are read-only, and every privileged action is logged.
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
              <p className="text-xs text-muted-foreground">
                {filteredUsers.length === users.length
                  ? `${users.length} registered accounts`
                  : `${filteredUsers.length} of ${users.length} accounts shown`}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={generateBulkEmployeeAccounts}
                disabled={bulkGeneratingAccounts || bulkResettingPasswords}
                className="gap-1.5"
              >
                <Users className="h-4 w-4" />
                {bulkGeneratingAccounts ? "Generating..." : "Generate Employee Accounts"}
              </Button>
              <Button
                variant="outline"
                onClick={resetBulkEmployeePasswords}
                disabled={bulkGeneratingAccounts || bulkResettingPasswords}
                className="gap-1.5"
              >
                <Lock className="h-4 w-4" />
                {bulkResettingPasswords ? "Preparing..." : "Print Employee Password"}
              </Button>
              <Button
                onClick={openAddUser}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add User
              </Button>
            </div>
          </div>
          <div className="border-b border-border p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search users, usernames, roles, or employees..."
                className="pl-9"
              />
            </div>
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
                {filteredUsers.map((item, index) => (
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
                        title={ROLE_DESCRIPTIONS[item.role]}
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
                        {item.lockedAt && (
                          <Badge
                            variant="outline"
                            className="bg-rose-50 text-rose-700 border-rose-200"
                          >
                            Locked
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
                        {item.lockedAt && (
                          <button
                            onClick={() => unlockUser(item)}
                            className="h-7 w-7 grid place-items-center rounded-md hover:bg-emerald-50 text-muted-foreground hover:text-emerald-700 transition-colors"
                            aria-label="Unlock user"
                            title="Unlock user"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                          </button>
                        )}
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
                {filteredUsers.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                      {users.length === 0 ? "No users found." : "No users match your search."}
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

      {activeTab === "errors" && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-border">
            <div>
              <h4 className="font-semibold text-foreground">Error Log</h4>
              <p className="text-xs text-muted-foreground">
                Latest {errorLogs.length} unexpected system errors
              </p>
            </div>
            <Button
              variant="outline"
              onClick={loadErrorLogs}
              disabled={loadingErrors}
              className="gap-1.5"
            >
              <RefreshCw className={cn("h-4 w-4", loadingErrors && "animate-spin")} /> Refresh
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="px-4 py-3 font-semibold">Date/Time</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Request</th>
                  <th className="px-4 py-3 font-semibold">Message</th>
                  <th className="px-4 py-3 font-semibold">Stack</th>
                  <th className="px-4 py-3 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody>
                {errorLogs.map((log, index) => (
                  <tr
                    key={log.id}
                    className={cn(
                      "border-b border-border/50 last:border-0 align-top",
                      index % 2 === 1 && "bg-muted/10",
                    )}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{log.user?.name || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.user ? `@${log.user.username}` : "No account"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs">{log.method || "-"}</div>
                      <div className="max-w-[220px] truncate text-xs text-muted-foreground">
                        {log.path || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[260px] break-words text-rose-700">
                      {log.message}
                    </td>
                    <td className="px-4 py-3">
                      <pre className="max-h-28 max-w-[360px] overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">
                        {log.stack || "-"}
                      </pre>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{log.ipAddress || "-"}</td>
                  </tr>
                ))}
                {errorLogs.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                      {loadingErrors ? "Loading error logs..." : "No error logs found."}
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
        roleOptions={roleOptions}
        employeeCandidates={employeeCandidates}
        temporaryPassword={temporaryPassword}
        onOpenChange={handleAddUserOpenChange}
        onChange={setForm}
        onSubmit={createUser}
      />
      <UserDialog
        open={showEditUser}
        mode="edit"
        form={form}
        roleOptions={roleOptions}
        employeeCandidates={employeeCandidates}
        temporaryPassword={temporaryPassword}
        onOpenChange={setShowEditUser}
        onChange={setForm}
        onSubmit={updateUser}
      />
      <Dialog
        open={bulkEmployeeAccounts.length > 0}
        onOpenChange={(open) => !open && setBulkEmployeeAccounts([])}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {bulkEmployeeAccounts.length === 1
                ? "Employee Account Credentials"
                : "Bulk Employee Account Credentials"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              Temporary passwords are shown only now. Print or copy before closing, then give each
              employee only their own credentials.
            </div>
            <div className="max-h-[55vh] overflow-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">Employee</th>
                    <th className="px-3 py-2 font-semibold">Employee ID</th>
                    <th className="px-3 py-2 font-semibold">Username</th>
                    <th className="px-3 py-2 font-semibold">Temp Password</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkEmployeeAccounts.map((account) => (
                    <tr key={account.userId} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{account.employeeName}</td>
                      <td className="px-3 py-2 text-muted-foreground">{account.employeeNo}</td>
                      <td className="px-3 py-2 font-mono text-xs">{account.username}</td>
                      <td className="px-3 py-2 font-mono text-xs">{account.temporaryPassword}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyBulkEmployeeAccounts}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" onClick={printBulkEmployeeAccounts}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
            <Button onClick={() => setBulkEmployeeAccounts([])}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function UserDialog({
  open,
  mode,
  form,
  roleOptions,
  employeeCandidates,
  temporaryPassword,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  mode: "add" | "edit";
  form: { name: string; username: string; role: Role; employeeId: string; isActive: boolean };
  roleOptions: Role[];
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
                    {employee.lastname}, {employee.firstname} - {employee.employeeId}
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
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {ROLE_LABELS[form.role]}: {ROLE_DESCRIPTIONS[form.role]}
            </p>
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
  return `${employee.firstname}.${employee.lastname}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
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
