import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "Admin" | "HR Officer" | "Viewer";
export interface User { username: string; name: string; role: Role }

interface AuthCtx {
  user: User | null;
  login: (u: string, p: string) => Promise<User>;
  logout: () => void;
  can: (action: "edit" | "delete" | "manageUsers") => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

const ACCOUNTS: Record<string, { password: string; user: User }> = {
  admin: { password: "admin", user: { username: "admin", name: "Brooklyn Simmons", role: "Admin" } },
  hr: { password: "hr", user: { username: "hr", name: "Maria Santos", role: "HR Officer" } },
  viewer: { password: "viewer", user: { username: "viewer", name: "Pedro Cruz", role: "Viewer" } },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("pmis-user");
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* noop */ }
    }
    setReady(true);
  }, []);

  const login = async (username: string, password: string) => {
    const acc = ACCOUNTS[username.toLowerCase()];
    if (!acc || acc.password !== password) throw new Error("Invalid username or password");
    setUser(acc.user);
    window.localStorage.setItem("pmis-user", JSON.stringify(acc.user));
    return acc.user;
  };

  const logout = () => {
    setUser(null);
    window.localStorage.removeItem("pmis-user");
  };

  const can = (action: "edit" | "delete" | "manageUsers") => {
    if (!user) return false;
    if (user.role === "Admin") return true;
    if (user.role === "HR Officer") return action !== "manageUsers";
    return false;
  };

  if (!ready) return null;
  return <Ctx.Provider value={{ user, login, logout, can }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
