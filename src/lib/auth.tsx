import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "Admin" | "HR Officer" | "Viewer";
export interface User { username: string; name: string; role: Role; photoUrl?: string }

interface AuthCtx {
  user: User | null;
  login: (u: string, p: string, expectedRole?: Role) => Promise<User>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  can: (action: "edit" | "delete" | "manageUsers") => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

const ACCOUNTS: Record<string, { password: string; user: User }> = {
  admin: { password: "admin", user: { username: "admin", name: "Brooklyn Simmons", role: "Admin" } },
  hr: { password: "hr", user: { username: "hr", name: "Maria Santos", role: "HR Officer" } },
  viewer: { password: "viewer", user: { username: "viewer", name: "Pedro Cruz", role: "Viewer" } },
};

const AUTH_COOKIE = "pmis_jwt";

function makeMockJwt(user: User) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: user.username, role: user.role, iat: Date.now() }));
  return `${header}.${payload}.mock-signature`;
}

function setAuthCookie(token: string) {
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 8).toUTCString();
  document.cookie = `${AUTH_COOKIE}=${token}; expires=${expires}; path=/; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function hasAuthCookie() {
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${AUTH_COOKIE}=`));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasAuthCookie()) {
      window.localStorage.removeItem("pmis-user");
      setReady(true);
      return;
    }
    const raw = window.localStorage.getItem("pmis-user");
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* noop */ }
    }
    setReady(true);
  }, []);

  const login = async (username: string, password: string, expectedRole?: Role) => {
    const acc = ACCOUNTS[username.toLowerCase()];
    if (!acc || acc.password !== password) throw new Error("Invalid username or password");
    if (expectedRole && acc.user.role !== expectedRole) {
      throw new Error("Selected role does not match this account");
    }
    const token = makeMockJwt(acc.user);
    setAuthCookie(token);
    setUser(acc.user);
    window.localStorage.setItem("pmis-user", JSON.stringify(acc.user));
    return acc.user;
  };

  const logout = () => {
    setUser(null);
    clearAuthCookie();
    window.localStorage.removeItem("pmis-user");
  };

  const updateProfile = async (updates: Partial<User>) => {
    // Backend-ready: In the future, this will be an API call (e.g., PUT /api/users/profile)
    // For now, we update the local state and localStorage.
    if (!user) throw new Error("Not logged in");
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    window.localStorage.setItem("pmis-user", JSON.stringify(updatedUser));
    // If we were updating the backend, we might get a new token back, but for mock, it's fine.
    return updatedUser;
  };

  const can = (action: "edit" | "delete" | "manageUsers") => {
    if (!user) return false;
    if (user.role === "Admin") return true;
    if (user.role === "HR Officer") return action !== "manageUsers";
    return false;
  };

  if (!ready) return null;
  return <Ctx.Provider value={{ user, login, logout, updateProfile, can }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
