import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bug,
  Copy,
  Edit,
  Eye,
  EyeOff,
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
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TablePagination } from "@/components/ui/table-pagination";
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
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_OPTIONS,
  type PermissionKey,
  type Role,
  useAuth,
} from "@/lib/auth";
import { api } from "@/lib/api";
import type { EmployeeRecord } from "@/lib/employees-api";
import {
  cn,
  copyTextToClipboard,
  formatDisplayDateRange,
  formatDisplayDateTime,
  formatEmployeeName,
} from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type AdminTab = "users" | "permissions" | "audit" | "errors";

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

interface ImportLog {
  id: string;
  importId: string;
  level: "Info" | "Success" | "Warning" | "Error";
  rowNumber: number | null;
  employeeNo: string;
  message: string;
  source: string;
  fileName: string;
  periodFrom: string;
  periodTo: string;
  rowCount: number;
  status: string;
  importedAt: string;
  createdAt: string;
  user: { username: string; name: string; role: Role } | null;
}

interface LogPagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface BulkEmployeeAccount {
  userId: number;
  employeeId: string;
  employeeNo: string;
  employeeName: string;
  username: string;
  temporaryPassword: string;
}

interface RolePermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  group: string;
}

type RolePermissionMatrix = Record<Role, Record<PermissionKey, boolean>>;

interface RolePermissionResponse {
  permissions: RolePermissionDefinition[];
  roles: Role[];
  locked: Partial<Record<Role, PermissionKey[]>>;
  matrix: RolePermissionMatrix;
}

const ADMIN_TABS: {
  key: AdminTab;
  label: string;
  icon: typeof Users;
  permission: PermissionKey;
}[] = [
  { key: "users", label: "User Management", icon: Users, permission: "admin.users" },
  {
    key: "permissions",
    label: "Role Permissions",
    icon: ShieldCheck,
    permission: "role_permissions.manage",
  },
  { key: "audit", label: "Audit Log", icon: Activity, permission: "admin.audit" },
  { key: "errors", label: "Error Log", icon: Bug, permission: "admin.errors" },
];

const IMPORT_LOG_LEVEL_COLORS: Record<ImportLog["level"], string> = {
  Info: "border-slate-200 bg-slate-50 text-slate-600",
  Success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Warning: "border-amber-200 bg-amber-50 text-amber-700",
  Error: "border-rose-200 bg-rose-50 text-rose-700",
};

function AdminPage() {
  const { user, hasPermission } = useAuth();
  const canManageUsers = hasPermission("admin.users");
  const canManageRolePermissions = hasPermission("role_permissions.manage");
  const visibleTabs = useMemo(
    () =>
      ADMIN_TABS.filter((tab) =>
        tab.key === "permissions"
          ? canManageRolePermissions || canManageUsers
          : hasPermission(tab.permission),
      ),
    [canManageRolePermissions, canManageUsers, hasPermission],
  );
  const isAdmin = visibleTabs.length > 0;
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [employeeCandidates, setEmployeeCandidates] = useState<EmployeeRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [loadingErrors, setLoadingErrors] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [errorLogError, setErrorLogError] = useState("");
  const [auditFilters, setAuditFilters] = useState({ q: "", action: "", from: "", to: "" });
  const [errorFilters, setErrorFilters] = useState({ q: "", from: "", to: "", importLevel: "all" });
  const [auditPagination, setAuditPagination] = useState<LogPagination>({
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  });
  const [errorPagination, setErrorPagination] = useState<LogPagination>({
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  });
  const [importPagination, setImportPagination] = useState<LogPagination>({
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  });
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissionRole, setSavingPermissionRole] = useState<Role | null>(null);
  const [rolePermissionData, setRolePermissionData] = useState<RolePermissionResponse | null>(null);
  const [selectedPermissionRole, setSelectedPermissionRole] = useState<Role>("HR");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [bulkGeneratingAccounts, setBulkGeneratingAccounts] = useState(false);
  const [bulkResettingPasswords, setBulkResettingPasswords] = useState(false);
  const [bulkEmployeeAccounts, setBulkEmployeeAccounts] = useState<BulkEmployeeAccount[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [resettingTemporaryPasswordId, setResettingTemporaryPasswordId] = useState<number | null>(
    null,
  );
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
    if (!canManageUsers) return;
    try {
      const result = await api<{ users: AdminUser[] }>("/api/admin/users");
      setUsers(result.users);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [canManageUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const loadEmployeeCandidates = useCallback(async () => {
    if (!canManageUsers) return;
    try {
      const result = await api<{ employees: EmployeeRecord[] }>(
        "/api/admin/employee-account-candidates",
      );
      setEmployeeCandidates(result.employees);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [canManageUsers]);

  const loadAuditLogs = useCallback(async () => {
    if (!hasPermission("admin.audit")) return;
    setLoadingAudit(true);
    setAuditError("");
    try {
      const query = new URLSearchParams({
        page: String(auditPagination.page),
        pageSize: String(auditPagination.pageSize),
      });
      if (auditFilters.q.trim()) query.set("q", auditFilters.q.trim());
      if (auditFilters.action.trim()) query.set("action", auditFilters.action.trim());
      if (auditFilters.from) query.set("from", auditFilters.from);
      if (auditFilters.to) query.set("to", auditFilters.to);
      const result = await api<{ logs: AuditLog[]; pagination: LogPagination }>(
        `/api/admin/audit-logs?${query.toString()}`,
      );
      setAuditLogs(result.logs);
      setAuditPagination(result.pagination);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load audit logs";
      setAuditError(message);
      toast.error(message);
    } finally {
      setLoadingAudit(false);
    }
  }, [auditFilters, auditPagination.page, auditPagination.pageSize, hasPermission]);

  const loadErrorLogs = useCallback(async () => {
    if (!hasPermission("admin.errors")) return;
    setLoadingErrors(true);
    setErrorLogError("");
    try {
      const query = new URLSearchParams({
        page: String(errorPagination.page),
        pageSize: String(errorPagination.pageSize),
        importPage: String(importPagination.page),
        importPageSize: String(importPagination.pageSize),
      });
      if (errorFilters.q.trim()) query.set("q", errorFilters.q.trim());
      if (errorFilters.from) query.set("from", errorFilters.from);
      if (errorFilters.to) query.set("to", errorFilters.to);
      if (errorFilters.importLevel !== "all") query.set("importLevel", errorFilters.importLevel);
      const result = await api<{
        logs: ErrorLog[];
        importLogs: ImportLog[];
        pagination: LogPagination;
        importPagination: LogPagination;
      }>(`/api/admin/error-logs?${query.toString()}`);
      setErrorLogs(result.logs);
      setImportLogs(result.importLogs || []);
      setErrorPagination(result.pagination);
      setImportPagination(result.importPagination);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load error logs";
      setErrorLogError(message);
      toast.error(message);
    } finally {
      setLoadingErrors(false);
    }
  }, [
    errorFilters,
    errorPagination.page,
    errorPagination.pageSize,
    hasPermission,
    importPagination.page,
    importPagination.pageSize,
  ]);

  const loadRolePermissions = useCallback(async () => {
    if (!canManageRolePermissions && !canManageUsers) return;
    setLoadingPermissions(true);
    try {
      const result = await api<RolePermissionResponse>("/api/admin/role-permissions");
      setRolePermissionData(result);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoadingPermissions(false);
    }
  }, [canManageRolePermissions, canManageUsers]);

  useEffect(() => {
    if (activeTab === "users") loadEmployeeCandidates();
    if (activeTab === "permissions") loadRolePermissions();
    if (activeTab === "audit") loadAuditLogs();
    if (activeTab === "errors") loadErrorLogs();
  }, [activeTab, loadAuditLogs, loadEmployeeCandidates, loadErrorLogs, loadRolePermissions]);

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (!visibleTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(visibleTabs[0].key);
    }
  }, [activeTab, visibleTabs]);

  useRealtimeRefresh(() => {
    loadUsers();
    if (activeTab === "users") loadEmployeeCandidates();
    if (activeTab === "permissions") loadRolePermissions();
    if (activeTab === "audit") loadAuditLogs();
    if (activeTab === "errors") loadErrorLogs();
  }, ["admin", "employees", "attendance"]);

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
      await loadEmployeeCandidates();
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
              biometricId: "",
              firstname: item.employeeName || item.name,
              middlename: "",
              lastname: "",
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
              lifecycleState: "Active",
              currentOrganizationId: null,
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
              scheduleAmIn: "",
              scheduleAmOut: "",
              schedulePmIn: "",
              schedulePmOut: "",
              dtrSignatory: "",
              dtrNoterId: "",
              isDtrNoter: false,
              isHidden: false,
              regular: false,
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
      await loadEmployeeCandidates();
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
      await loadEmployeeCandidates();
      toast.success("User deleted");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const openSetPassword = (item: AdminUser) => {
    setPasswordUser(item);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowSetPassword(true);
  };

  const setPassword = async () => {
    if (!passwordUser) return;
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSettingPassword(true);
    try {
      const result = await api<{ user: AdminUser }>(
        `/api/admin/users/${passwordUser.id}/reset-password`,
        {
          method: "POST",
          body: JSON.stringify({ newPassword, confirmPassword }),
        },
      );
      setUsers((prev) => prev.map((item) => (item.id === result.user.id ? result.user : item)));
      setShowSetPassword(false);
      setPasswordUser(null);
      setNewPassword("");
      setConfirmPassword("");
      toast.success(`Password updated for ${result.user.username}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSettingPassword(false);
    }
  };

  const resetRowTemporaryPassword = async (item: AdminUser) => {
    if (
      !window.confirm(
        `Generate and view a new temporary password for ${item.username}? This will reset the current password and sign this user out.`,
      )
    ) {
      return;
    }

    setResettingTemporaryPasswordId(item.id);
    try {
      const result = await api<{ user: AdminUser; account: BulkEmployeeAccount }>(
        `/api/admin/users/${item.id}/reset-temporary-password`,
        { method: "POST" },
      );
      setUsers((current) =>
        current.map((userItem) => (userItem.id === result.user.id ? result.user : userItem)),
      );
      setBulkEmployeeAccounts([result.account]);
      toast.success(`Temporary password reset for ${result.user.username}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setResettingTemporaryPasswordId(null);
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
        "View and print new temporary passwords for all active employee accounts? This will reset their current passwords and sign them out.",
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
      await copyTextToClipboard(
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

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, RolePermissionDefinition[]>();
    for (const permission of rolePermissionData?.permissions || []) {
      const current = groups.get(permission.group) || [];
      current.push(permission);
      groups.set(permission.group, current);
    }
    return Array.from(groups.entries()).map(([group, permissions]) => ({ group, permissions }));
  }, [rolePermissionData]);

  const selectedRolePermissions = rolePermissionData?.matrix[selectedPermissionRole];
  const selectedRoleAllowedCount = rolePermissionData
    ? rolePermissionData.permissions.filter(
        (permission) => selectedRolePermissions?.[permission.key],
      ).length
    : 0;
  const selectedRoleTotalCount = rolePermissionData?.permissions.length || 0;
  const countRolePermissions = (role: Role) =>
    rolePermissionData
      ? rolePermissionData.permissions.filter(
          (permission) => rolePermissionData.matrix[role]?.[permission.key],
        ).length
      : 0;

  const toggleRolePermission = (role: Role, permission: PermissionKey, allowed: boolean) => {
    if (!rolePermissionData || !canManageRolePermissions) return;
    if (rolePermissionData.locked[role]?.includes(permission)) return;
    setRolePermissionData({
      ...rolePermissionData,
      matrix: {
        ...rolePermissionData.matrix,
        [role]: {
          ...rolePermissionData.matrix[role],
          [permission]: allowed,
        },
      },
    });
  };

  const saveRolePermissions = async (role: Role) => {
    if (!rolePermissionData || !canManageRolePermissions) return;
    setSavingPermissionRole(role);
    try {
      const permissions = rolePermissionData.permissions
        .filter((permission) => rolePermissionData.matrix[role]?.[permission.key])
        .map((permission) => permission.key);
      const result = await api<RolePermissionResponse>("/api/admin/role-permissions", {
        method: "PATCH",
        body: JSON.stringify({ role, permissions }),
      });
      setRolePermissionData(result);
      toast.success(`${role} permissions saved`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSavingPermissionRole(null);
    }
  };

  const formatDateTime = (value: string) => formatDisplayDateTime(value);
  const resetAuditPage = (updates: Partial<typeof auditFilters>) => {
    setAuditFilters((current) => ({ ...current, ...updates }));
    setAuditPagination((current) => ({ ...current, page: 1 }));
  };
  const resetErrorPage = (updates: Partial<typeof errorFilters>) => {
    setErrorFilters((current) => ({ ...current, ...updates }));
    setErrorPagination((current) => ({ ...current, page: 1 }));
    setImportPagination((current) => ({ ...current, page: 1 }));
  };

  const activeUsers = users.filter((item) => item.isActive).length;
  const approverUsers = users.filter((item) => item.role === "Approver").length;
  const hasSuperAdmin = users.some((item) => item.role === "Super Admin" && item.isActive);
  const missingAccountCandidates = useMemo(() => {
    const linkedEmployeeIds = new Set(
      users.map((item) => item.employeeId).filter((employeeId) => Boolean(employeeId)),
    );
    return employeeCandidates.filter((employee) => !linkedEmployeeIds.has(employee.id));
  }, [employeeCandidates, users]);
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
  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
  const paginatedUsers = useMemo(
    () => filteredUsers.slice((userPage - 1) * userPageSize, userPage * userPageSize),
    [filteredUsers, userPage, userPageSize],
  );
  useEffect(() => {
    setUserPage((current) => Math.min(current, userTotalPages));
  }, [userTotalPages]);
  const roleOptions =
    user?.role === "Super Admin" || !hasSuperAdmin
      ? ROLE_OPTIONS
      : ROLE_OPTIONS.filter((role) => role !== "Super Admin");

  if (!isAdmin) {
    return (
      <AppShell
        title="System Administration"
        subtitle="Manage users, audit logs, and system configuration"
      >
        <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h4 className="font-semibold text-foreground">System Administration access required</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account does not have any administration permissions.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="System Administration"
      subtitle="Manage users, audit logs, and system configuration"
    >
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <AdminSummaryCard label="Active Users" value={activeUsers} icon={Users} />
        <AdminSummaryCard label="Approvers" value={approverUsers} icon={ShieldCheck} />
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/15">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-200" />
        <p className="text-sm font-medium text-amber-800 dark:text-amber-100">
          System Administration is restricted to administrators. HR maintains records, Approvers
          decide workflows, Viewers are read-only, and every privileged action is logged.
        </p>
      </div>

      <div className="mb-5 flex w-fit flex-wrap gap-1 rounded-lg bg-muted/40 p-1">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all whitespace-nowrap",
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
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h4 className="font-semibold text-foreground">System Users</h4>
              <p className="text-xs text-muted-foreground">
                {filteredUsers.length === users.length
                  ? `${users.length} registered accounts`
                  : `${filteredUsers.length} of ${users.length} accounts shown`}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {missingAccountCandidates.length > 0 && (
                <Button
                  variant="outline"
                  onClick={generateBulkEmployeeAccounts}
                  disabled={bulkGeneratingAccounts || bulkResettingPasswords}
                  className="gap-1.5"
                >
                  <Users className="h-4 w-4" />
                  {bulkGeneratingAccounts
                    ? "Creating..."
                    : `Create Missing Accounts (${missingAccountCandidates.length})`}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={resetBulkEmployeePasswords}
                disabled={bulkGeneratingAccounts || bulkResettingPasswords}
                className="gap-1.5"
              >
                <Printer className="h-4 w-4" />
                {bulkResettingPasswords ? "Preparing..." : "View / Print Temporary Passwords"}
              </Button>
              <Button
                onClick={openAddUser}
                className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
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
                onChange={(event) => {
                  setUserSearch(event.target.value);
                  setUserPage(1);
                }}
                placeholder="Search users, usernames, roles, or employees..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-sm uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Username</th>
                  <th className="px-4 py-3 font-semibold">Employee Record</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((item, index) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-b border-border/50 last:border-0",
                      index % 2 === 1 && "bg-muted/10",
                    )}
                  >
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">@{item.username}</td>
                    <td className="px-4 py-3">
                      {item.employeeId ? (
                        <div>
                          <div className="font-medium">{item.employeeName}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No linked employee</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm" title={ROLE_DESCRIPTIONS[item.role]}>
                        {item.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-x-2 gap-y-1">
                        <span
                          className={
                            item.isActive
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-muted-foreground"
                          }
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                        {item.mustChangePassword && (
                          <span className="text-amber-700 dark:text-amber-300">
                            Temporary password
                          </span>
                        )}
                        {item.lockedAt && (
                          <span className="text-rose-700 dark:text-rose-300">Locked</span>
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
                          onClick={() => openSetPassword(item)}
                          className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent text-muted-foreground transition-colors"
                          aria-label="Set new password"
                          title="Set new password"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => resetRowTemporaryPassword(item)}
                          disabled={resettingTemporaryPasswordId !== null}
                          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="View temporary password"
                          title="View temporary password"
                        >
                          <Eye className="h-3.5 w-3.5" />
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
          <TablePagination
            page={userPage}
            totalPages={userTotalPages}
            total={filteredUsers.length}
            pageSize={userPageSize}
            itemLabel="accounts"
            onPageChange={setUserPage}
            onPageSizeChange={(pageSize) => {
              setUserPageSize(pageSize);
              setUserPage(1);
            }}
          />
        </div>
      )}

      {activeTab === "permissions" && (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div>
              <h4 className="font-semibold text-foreground">Role Permission Review</h4>
              <p className="text-xs text-muted-foreground">
                Select a role, then turn the functions that role can use on or off.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={loadRolePermissions}
              disabled={loadingPermissions}
              className="gap-1.5"
            >
              <RefreshCw className={cn("h-4 w-4", loadingPermissions && "animate-spin")} />
              Refresh
            </Button>
          </div>
          {!canManageRolePermissions && (
            <div className="border-b border-border bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Only Super Admin accounts can change role permissions. This account can review the
              current matrix only.
            </div>
          )}

          {!rolePermissionData ? (
            <div className="px-4 py-12 text-center text-muted-foreground">
              {loadingPermissions ? "Loading role permissions..." : "No role permissions loaded."}
            </div>
          ) : (
            <div>
              <div className="border-b border-border bg-muted/20 p-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  {rolePermissionData.roles.map((role) => {
                    const active = selectedPermissionRole === role;
                    const allowedCount = countRolePermissions(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedPermissionRole(role)}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors",
                          active
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-card hover:bg-muted/40",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">{role}</span>
                          {role === "Super Admin" && (
                            <Badge
                              variant="outline"
                              className="border-border bg-background text-foreground"
                            >
                              Protected
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {allowedCount} of {rolePermissionData.permissions.length} functions on
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    Editing {selectedPermissionRole}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedRoleAllowedCount} of {selectedRoleTotalCount} functions enabled
                  </div>
                </div>
                <Button
                  onClick={() => saveRolePermissions(selectedPermissionRole)}
                  disabled={!canManageRolePermissions || savingPermissionRole !== null}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {savingPermissionRole === selectedPermissionRole ? "Saving..." : "Save Changes"}
                </Button>
              </div>

              <div className="divide-y divide-border">
                {permissionGroups.map(({ group, permissions }) => (
                  <section key={group} className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group}
                      </h5>
                      <span className="text-xs text-muted-foreground">
                        {
                          permissions.filter(
                            (permission) => selectedRolePermissions?.[permission.key],
                          ).length
                        }{" "}
                        / {permissions.length} enabled
                      </span>
                    </div>
                    <div className="grid gap-2 lg:grid-cols-2">
                      {permissions.map((permission) => {
                        const locked = rolePermissionData.locked[selectedPermissionRole]?.includes(
                          permission.key,
                        );
                        const checked = Boolean(selectedRolePermissions?.[permission.key]);
                        return (
                          <div
                            key={permission.key}
                            className={cn(
                              "flex min-h-[86px] items-start justify-between gap-4 rounded-lg border border-border bg-background p-3",
                              checked && "border-primary bg-primary/10",
                            )}
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="font-medium text-foreground">
                                  {permission.label}
                                </div>
                                {locked && (
                                  <Badge
                                    variant="outline"
                                    className="border-border bg-background text-foreground"
                                  >
                                    Locked
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {permission.description}
                              </div>
                            </div>
                            <Switch
                              checked={checked}
                              disabled={!canManageRolePermissions || locked}
                              onCheckedChange={(value) =>
                                toggleRolePermission(selectedPermissionRole, permission.key, value)
                              }
                              aria-label={`${selectedPermissionRole} ${permission.label}`}
                              title={locked ? "Locked for Super Admin safety" : permission.label}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "audit" && (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h4 className="font-semibold text-foreground">Audit Log</h4>
              <p className="text-xs text-muted-foreground">
                Showing {auditLogs.length} of {auditPagination.total} recorded system actions
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
          <div className="grid gap-2 border-b border-border p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(14rem,1fr)]">
            <Input
              value={auditFilters.q}
              onChange={(event) => resetAuditPage({ q: event.target.value })}
              placeholder="Search user or action"
            />
            <Input
              value={auditFilters.action}
              onChange={(event) => resetAuditPage({ action: event.target.value })}
              placeholder="Action contains"
            />
            <div>
              <Label className="sr-only">Date Range</Label>
              <DateRangePicker
                from={auditFilters.from}
                to={auditFilters.to}
                allowEmpty
                labelFormatter={(from, to) => formatDisplayDateRange(from, to, "All dates")}
                onApply={(from, to) => resetAuditPage({ from, to })}
              />
            </div>
          </div>
          {auditError ? (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{auditError}</span>
                </div>
                <Button variant="outline" size="sm" onClick={loadAuditLogs} disabled={loadingAudit}>
                  Retry
                </Button>
              </div>
            </div>
          ) : null}
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
          <LogPager
            pagination={auditPagination}
            loading={loadingAudit}
            onPageChange={(page) => setAuditPagination((current) => ({ ...current, page }))}
            onPageSizeChange={(pageSize) =>
              setAuditPagination((current) => ({ ...current, page: 1, pageSize }))
            }
          />
        </div>
      )}

      {activeTab === "errors" && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h4 className="font-semibold text-foreground">Error Log</h4>
                <p className="text-xs text-muted-foreground">
                  Showing {errorLogs.length} of {errorPagination.total} unexpected system errors and{" "}
                  {importLogs.length} of {importPagination.total} DTR import log entries
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
            <div className="grid gap-2 border-b border-border p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(14rem,1fr)_10rem]">
              <Input
                value={errorFilters.q}
                onChange={(event) => resetErrorPage({ q: event.target.value })}
                placeholder="Search path, message, user, file, employee"
              />
              <div>
                <Label className="sr-only">Date Range</Label>
                <DateRangePicker
                  from={errorFilters.from}
                  to={errorFilters.to}
                  allowEmpty
                  labelFormatter={(from, to) => formatDisplayDateRange(from, to, "All dates")}
                  onApply={(from, to) => resetErrorPage({ from, to })}
                />
              </div>
              <Select
                value={errorFilters.importLevel}
                onValueChange={(value) => resetErrorPage({ importLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All import levels</SelectItem>
                  <SelectItem value="Info">Info</SelectItem>
                  <SelectItem value="Success">Success</SelectItem>
                  <SelectItem value="Warning">Warning</SelectItem>
                  <SelectItem value="Error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errorLogError ? (
              <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errorLogError}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadErrorLogs}
                    disabled={loadingErrors}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : null}
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
            <LogPager
              pagination={errorPagination}
              loading={loadingErrors}
              onPageChange={(page) => setErrorPagination((current) => ({ ...current, page }))}
              onPageSizeChange={(pageSize) =>
                setErrorPagination((current) => ({ ...current, page: 1, pageSize }))
              }
            />
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="border-b border-border p-4">
              <h4 className="font-semibold text-foreground">DTR Import Logs</h4>
              <p className="text-xs text-muted-foreground">
                Row-level DTR import messages, including file and biometric import errors.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="px-4 py-3 font-semibold">Date/Time</th>
                    <th className="px-4 py-3 font-semibold">Level</th>
                    <th className="px-4 py-3 font-semibold">Import</th>
                    <th className="px-4 py-3 font-semibold">Row</th>
                    <th className="px-4 py-3 font-semibold">Message</th>
                    <th className="px-4 py-3 font-semibold">By</th>
                  </tr>
                </thead>
                <tbody>
                  {importLogs.map((log, index) => (
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
                        <Badge variant="outline" className={IMPORT_LOG_LEVEL_COLORS[log.level]}>
                          {log.level}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {log.source || "DTR"} {log.status ? `- ${log.status}` : ""}
                        </div>
                        <div className="max-w-[260px] truncate text-xs text-muted-foreground">
                          {log.fileName || log.importId || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.periodFrom && log.periodTo
                            ? `${log.periodFrom} to ${log.periodTo}`
                            : `${log.rowCount || 0} imported`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.rowNumber ? `Row ${log.rowNumber}` : "-"}
                        {log.employeeNo ? (
                          <div className="text-xs">ID: {log.employeeNo}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 max-w-md break-words">{log.message}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{log.user?.name || "System"}</div>
                        <div className="text-xs text-muted-foreground">
                          {log.user ? `@${log.user.username}` : "No account"}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {importLogs.length === 0 && (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                        {loadingErrors ? "Loading DTR import logs..." : "No DTR import logs found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <LogPager
              pagination={importPagination}
              loading={loadingErrors}
              onPageChange={(page) => setImportPagination((current) => ({ ...current, page }))}
              onPageSizeChange={(pageSize) =>
                setImportPagination((current) => ({ ...current, page: 1, pageSize }))
              }
            />
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
        temporaryPassword=""
        onOpenChange={setShowEditUser}
        onChange={setForm}
        onSubmit={updateUser}
      />
      <SetPasswordDialog
        open={showSetPassword}
        user={passwordUser}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        showNewPassword={showNewPassword}
        showConfirmPassword={showConfirmPassword}
        submitting={settingPassword}
        onOpenChange={(open) => {
          if (settingPassword) return;
          setShowSetPassword(open);
          if (!open) {
            setPasswordUser(null);
            setNewPassword("");
            setConfirmPassword("");
          }
        }}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onToggleNewPassword={() => setShowNewPassword((current) => !current)}
        onToggleConfirmPassword={() => setShowConfirmPassword((current) => !current)}
        onSubmit={setPassword}
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
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100">
              Temporary passwords are shown only now. Print or copy before closing, then give each
              employee only their own credentials.
            </div>
            <div className="max-h-[55vh] overflow-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr className="text-left text-sm uppercase tracking-wider text-muted-foreground">
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
                      <td className="px-3 py-2 font-mono">{account.username}</td>
                      <td className="px-3 py-2 font-mono">{account.temporaryPassword}</td>
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

function SetPasswordDialog({
  open,
  user,
  newPassword,
  confirmPassword,
  showNewPassword,
  showConfirmPassword,
  submitting,
  onOpenChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onSubmit,
}: {
  open: boolean;
  user: AdminUser | null;
  newPassword: string;
  confirmPassword: string;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onSubmit: () => void;
}) {
  const meetsLength = newPassword.length >= 8;
  const passwordsMatch = confirmPassword.length === 0 || newPassword === confirmPassword;
  const characterGroups = [
    /[a-z]/.test(newPassword),
    /[A-Z]/.test(newPassword),
    /\d/.test(newPassword),
    /[^A-Za-z0-9]/.test(newPassword),
  ].filter(Boolean).length;
  const strengthScore = newPassword
    ? Math.min(
        4,
        1 +
          (newPassword.length >= 8 ? 1 : 0) +
          (characterGroups >= 3 ? 1 : 0) +
          (newPassword.length >= 12 && characterGroups === 4 ? 1 : 0),
      )
    : 0;
  const strength = [
    { label: "", color: "bg-muted" },
    { label: "Weak", color: "bg-rose-500" },
    { label: "Fair", color: "bg-orange-500" },
    { label: "Strong", color: "bg-amber-500" },
    { label: "Very strong", color: "bg-emerald-500" },
  ][strengthScore] || { label: "", color: "bg-muted" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Set New Password</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Set a permanent password for{" "}
            <span className="font-medium text-foreground">{user?.username || "this user"}</span>.
            Their current sessions will be signed out.
          </p>
          <div className="space-y-2">
            <Label htmlFor="admin-new-password">New Password</Label>
            <div className="relative">
              <Input
                id="admin-new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => onNewPasswordChange(event.target.value)}
                autoComplete="new-password"
                className="pr-10"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={onToggleNewPassword}
                className="absolute right-0 top-0 grid h-9 w-10 place-items-center text-muted-foreground hover:text-foreground"
                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                aria-pressed={showNewPassword}
                disabled={submitting}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div
              className="grid grid-cols-4 gap-1"
              role="meter"
              aria-label="Password strength"
              aria-valuemin={0}
              aria-valuemax={4}
              aria-valuenow={strengthScore}
              aria-valuetext={strength.label || "No password entered"}
            >
              {[1, 2, 3, 4].map((segment) => (
                <div
                  key={segment}
                  className={cn(
                    "h-1 rounded-full transition-colors",
                    segment <= strengthScore ? strength.color : "bg-muted",
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Strength: {strength.label || "Enter a password"}
            </p>
            {!meetsLength && newPassword && (
              <p className="text-xs text-muted-foreground">
                Use at least 8 characters to save this password.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-confirm-password">Confirm Password</Label>
            <div className="relative">
              <Input
                id="admin-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => onConfirmPasswordChange(event.target.value)}
                autoComplete="new-password"
                className="pr-10"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={onToggleConfirmPassword}
                className="absolute right-0 top-0 grid h-9 w-10 place-items-center text-muted-foreground hover:text-foreground"
                aria-label={
                  showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"
                }
                aria-pressed={showConfirmPassword}
                disabled={submitting}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && (
              <p
                className={cn(
                  "text-xs",
                  passwordsMatch
                    ? "text-emerald-600 dark:text-emerald-300"
                    : "text-rose-600 dark:text-rose-300",
                )}
              >
                {passwordsMatch ? "Passwords match." : "Passwords do not match."}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting || !meetsLength || !confirmPassword || !passwordsMatch}
          >
            {submitting ? "Saving..." : "Save New Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
            <Combobox
              value={form.employeeId}
              onValueChange={(employeeId) => {
                const employee = employeeCandidates.find((item) => item.id === employeeId);
                onChange({
                  ...form,
                  employeeId,
                  name: employee ? formatEmployeeName(employee) : form.name,
                  username: mode === "add" && employee ? suggestUsername(employee) : form.username,
                  role: form.role || "Employee",
                });
              }}
              placeholder="No linked employee"
              searchPlaceholder="Search employees..."
              emptyText="No employees found."
              clearable
              clearLabel="No linked employee"
              options={employeeCandidates.map((employee) => ({
                value: employee.id,
                label: formatEmployeeName(employee),
                description: [employee.employeeId, employee.department, employee.position]
                  .filter(Boolean)
                  .join(" · "),
              }))}
            />
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
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/40 dark:bg-amber-500/15">
              <div className="text-xs font-semibold text-amber-800 dark:text-amber-100">
                Temporary Password
              </div>
              <div className="mt-1 font-mono text-sm text-amber-900 dark:text-amber-50">
                {temporaryPassword}
              </div>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                Give this to the user. They must change it on first access.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onSubmit}
          >
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
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-muted text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function LogPager({
  pagination,
  loading,
  onPageChange,
  onPageSizeChange,
}: {
  pagination: LogPagination;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  return (
    <TablePagination
      page={pagination.page}
      totalPages={pagination.totalPages}
      total={pagination.total}
      pageSize={pagination.pageSize}
      itemLabel="entries"
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      disabled={loading}
      minPageSize={10}
      maxPageSize={200}
      pageSizeOptions={[25, 50, 100, 200]}
    />
  );
}
