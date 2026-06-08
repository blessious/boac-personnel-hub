import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, CalendarDays, MonitorSmartphone,
  BarChart3, ShieldCheck, Settings,
  LogOut, ChevronLeft, ChevronRight, Stethoscope,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";

type NavItem = {
  to: "/" | "/employees" | "/attendance" | "/self-service" | "/reports" | "/admin" | "/settings";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/employees", label: "Employee Management", icon: Users },
  { to: "/attendance", label: "Attendance & Leave", icon: CalendarDays },
  { to: "/self-service", label: "Self-Service Portal", icon: MonitorSmartphone },
  { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/admin", label: "System Administration", icon: ShieldCheck },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const { agency, sidebarCollapsed: collapsed, toggleSidebar } = useSettings();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const nav = NAV.filter((item) => {
    if (!user) return false;
    if (user.role === "Admin") return true;
    if (item.to === "/" || item.to === "/self-service") return true;
    if (user.role === "Employee") return false;
    return item.to !== "/admin";
  });

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen sticky top-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 z-30",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* Logo / Header */}
      <div className={cn(
        "flex items-center h-16 border-b border-sidebar-border transition-all px-3 gap-2",
        collapsed && "justify-center"
      )}>
        <div className={cn(
          "grid place-items-center shrink-0 overflow-hidden transition-all",
          collapsed ? "h-9 w-9" : "h-10 w-10"
        )}>
          {agency.logoUrl ? (
            <img src={agency.logoUrl} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <Stethoscope className={cn("text-primary", collapsed ? "h-5 w-5" : "h-6 w-6")} />
          )}
        </div>
        {!collapsed && (
          <div className="leading-tight overflow-hidden flex-1">
            <div className="font-bold text-[13px] truncate text-foreground">{agency.name || "STRH — HRIS"}</div>
            <div className="text-[10px] text-muted-foreground truncate">{agency.tagline || "DOH Southern Tagalog"}</div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "h-7 w-7 grid place-items-center rounded-md hover:bg-sidebar-accent text-muted-foreground transition-colors shrink-0",
            collapsed && "mt-0"
          )}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pt-4 pb-1 text-[10px] tracking-widest uppercase text-muted-foreground font-semibold">
          Main Menu
        </div>
      )}

      <nav className="px-2 flex-1 space-y-0.5 py-2 overflow-y-auto">
        {nav.map((item) => {
          const active = isActive(item.to, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150 relative",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {!collapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {active && !collapsed && (
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border/50">
        {!collapsed && user && (
          <div className="px-3 py-2 bg-muted/30 rounded-xl mb-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Logged in as</div>
            <div className="text-xs text-foreground font-semibold truncate">{user.name}</div>
            <div className="text-[10px] text-muted-foreground">{user.role}</div>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-translate-x-1 shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
