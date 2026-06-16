import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

export type Role = "Admin" | "HR" | "Employee" | "Viewer";

export function isSelfServiceRole(role: Role | string | undefined): role is "Employee" {
  return role === "Employee";
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: Role;
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
  can: (action: "edit" | "delete" | "manageUsers") => boolean;
  ready: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

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
    try {
      await api<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
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

  const can = (action: "edit" | "delete" | "manageUsers") => {
    if (!user) return false;
    if (user.role === "Admin") return true;
    if (user.role === "HR") return action !== "manageUsers";
    return false;
  };

  if (!ready) return null;
  return (
    <Ctx.Provider value={{ user, login, logout, updateProfile, changePassword, can, ready }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
