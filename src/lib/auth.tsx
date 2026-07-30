import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

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
  Admin: "Manages users, settings, audit logs, and system configuration.",
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
  | "engagements.manage"
  | "movements.read"
  | "movements.write"
  | "service_records.read"
  | "service_records.write"
  | "reports.view"
  | "admin.users"
  | "admin.audit"
  | "admin.errors"
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
  changePassword: (newPassword: string, confirmPassword: string) => Promise<User>;
  hasPermission: (permission: PermissionKey) => boolean;
  can: (action: "edit" | "delete" | "manageUsers" | "approve" | "configureSystem") => boolean;
  ready: boolean;
  bootstrapError: string | null;
  reloadSession: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const loadSession = useCallback(() => {
    setReady(false);
    setBootstrapError(null);
    let alive = true;
    api<{ user: User | null }>("/api/auth/me")
      .then(({ user }) => {
        if (alive) setUser(user);
      })
      .catch((error) => {
        if (alive) {
          setUser(null);
          setBootstrapError(error instanceof Error ? error.message : "Unable to load your session");
        }
      })
      .finally(() => {
        if (alive) setReady(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => loadSession(), [loadSession]);

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

  const changePassword = async (newPassword: string, confirmPassword: string) => {
    const result = await api<{ user: User }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ newPassword, confirmPassword }),
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

  return (
    <Ctx.Provider
      value={{
        user,
        login,
        logout,
        updateProfile,
        changePassword,
        hasPermission,
        can,
        ready,
        bootstrapError,
        reloadSession: loadSession,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function SessionSkeleton() {
  return (
    <div className="flex min-h-dvh bg-background" role="status" aria-live="polite">
      <span className="sr-only">Loading your session...</span>
      <aside className="hidden w-[260px] shrink-0 border-r border-sidebar-border bg-sidebar p-3 md:block">
        <div className="mb-6 flex h-9 items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-2.5 w-36" />
          </div>
        </div>
        <div className="space-y-5">
          {[0, 1, 2].map((section) => (
            <div key={section} className="space-y-2">
              <Skeleton className="h-2.5 w-20" />
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border/50 px-4 md:px-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-64 max-w-[55vw]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="hidden h-9 w-28 rounded-md sm:block" />
          </div>
        </header>
        <section className="flex-1 space-y-4 p-3 sm:p-4 xl:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((card) => (
              <div key={card} className="rounded-lg border border-border bg-card p-4">
                <Skeleton className="mb-4 h-3 w-24" />
                <Skeleton className="mb-3 h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>
              <div className="space-y-3">
                {[0, 1, 2, 3, 4, 5].map((row) => (
                  <div key={row} className="grid grid-cols-[1fr_0.8fr_0.6fr] gap-3">
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                    <Skeleton className="h-4" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <Skeleton className="mb-5 h-4 w-32" />
              <div className="space-y-3">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
