import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Role = "Super Admin" | "Admin" | "HR" | "Approver" | "Employee" | "Viewer";

export const ROLE_LABELS: Record<Role, string> = {
  "Super Admin": "Super Administrator",
  Admin: "System Administrator",
  HR: "HR Officer",
  Approver: "Approver",
  Employee: "Employee Self-Service",
  Viewer: "Read-Only Viewer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  "Super Admin": "Full access to all system, HR, approval, reporting, and self-service functions.",
  Admin: "Manages users, settings, audit logs, backups, and system configuration.",
  HR: "Maintains employee records, attendance, leave setup, plantilla, movements, and service records.",
  Approver:
    "Reviews dashboards and HR records, approves leave and personnel movements, but cannot edit master data.",
  Employee: "Accesses only their own profile, requests, attendance, and self-service tools.",
  Viewer: "Read-only access to dashboard, reports, and non-administrative HR records.",
};

export const ROLE_OPTIONS: Role[] = [
  "Super Admin",
  "Admin",
  "HR",
  "Approver",
  "Employee",
  "Viewer",
];

export type PermissionKey =
  | "dashboard.view"
  | "employees.read"
  | "employees.write"
  | "attendance.read"
  | "attendance.write"
  | "leave.read"
  | "leave.write"
  | "approvals.manage"
  | "plantilla.read"
  | "plantilla.write"
  | "movements.read"
  | "movements.write"
  | "service_records.read"
  | "service_records.write"
  | "reports.view"
  | "admin.users"
  | "admin.audit"
  | "admin.errors"
  | "admin.backups"
  | "settings.manage"
  | "role_permissions.manage"
  | "my_profile.access"
  | "self_service.access"
  | "requests.access";

export function isSelfServiceRole(role: Role | string | undefined): role is "Employee" {
  return role === "Employee";
}

export function canSeeApprovals(role: Role | string | undefined) {
  return role === "Super Admin" || role === "Approver";
}

export function canReadHrRecords(role: Role | string | undefined) {
  return role === "Super Admin" || role === "HR" || role === "Approver" || role === "Viewer";
}

export function canWriteHrRecords(role: Role | string | undefined) {
  return role === "Super Admin" || role === "HR";
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: Role;
  permissions?: PermissionKey[];
  photoUrl?: string;
  mustChangePassword?: boolean;
  employeeId?: string;
  employeeNo?: string;
  employeeName?: string;
}

interface AuthCtx {
  user: User | null;
  login: (u: string, p: string, expectedRole?: Role) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<User>;
  hasPermission: (permission: PermissionKey) => boolean;
  can: (action: "edit" | "delete" | "manageUsers" | "approve" | "configureSystem") => boolean;
  ready: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let alive = true;
    api<{ user: User }>("/api/auth/me")
      .then(({ user }) => {
        if (alive) setUser(user);
      })
      .catch(() => {
        if (alive) setUser(null);
      })
      .finally(() => {
        if (alive) setReady(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  const login = async (username: string, password: string, expectedRole?: Role) => {
    const result = await api<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, role: expectedRole }),
    });
    setUser(result.user);
    return result.user;
  };

  const logout = async () => {
    setUser(null);
    await queryClient.cancelQueries();
    queryClient.removeQueries();

    try {
      await api<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
    } catch {
      // The user is already signed out locally; a stale or missing session should not block logout.
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error("Not logged in");
    const result = await api<{ user: User }>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify({
        name: updates.name ?? user.name,
        photoUrl: updates.photoUrl ?? user.photoUrl ?? "",
      }),
    });
    setUser(result.user);
    return result.user;
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const result = await api<{ user: User }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setUser(result.user);
    return result.user;
  };

  const can = (action: "edit" | "delete" | "manageUsers" | "approve" | "configureSystem") => {
    if (!user) return false;
    const permissions = new Set(user.permissions || []);
    if (action === "manageUsers") return permissions.has("admin.users");
    if (action === "configureSystem") return permissions.has("settings.manage");
    if (action === "approve") return permissions.has("approvals.manage");
    if (action === "edit" || action === "delete") return permissions.has("employees.write");
    return false;
  };

  const hasPermission = useCallback(
    (permission: PermissionKey) => Boolean(user?.permissions?.includes(permission)),
    [user?.permissions],
  );

  if (!ready) return null;
  return (
    <Ctx.Provider
      value={{ user, login, logout, updateProfile, changePassword, hasPermission, can, ready }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
