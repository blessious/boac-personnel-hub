import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, FileText, CalendarDays, Settings as SettingsIcon,
  LogOut, ChevronLeft, ChevronRight, ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";

type NavItem = { to: "/" | "/employees" | "/leave" | "/reports" | "/settings"; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/leave", label: "Leave Management", icon: CalendarDays },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const { agency, sidebarCollapsed: collapsed, toggleSidebar } = useSettings();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-[72px]" : "w-[248px]",
      )}
    >
      <div className={cn(
        "flex items-center h-16 border-b border-sidebar-border transition-all px-4",
        collapsed ? "justify-between px-3 gap-0" : "gap-2"
      )}>
        <div className={cn(
          "rounded-lg grid place-items-center shrink-0 overflow-hidden transition-all",
          agency.logoUrl ? "" : "bg-[var(--navy)] text-[var(--navy-foreground)] shadow-sm",
          collapsed ? "h-8 w-8" : "h-9 w-9"
        )}>
          {agency.logoUrl ? (
            <img src={agency.logoUrl} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <ShieldCheck className={collapsed ? "h-4 w-4" : "h-5 w-5"} />
          )}
        </div>
        {!collapsed && (
          <div className="leading-tight overflow-hidden flex-1">
            <div className="font-semibold text-sm truncate">{agency.name} PMIS</div>
            <div className="text-[11px] text-muted-foreground truncate">{agency.tagline}</div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "h-7 w-7 grid place-items-center rounded-md hover:bg-sidebar-accent text-muted-foreground transition-colors shrink-0",
            collapsed ? "" : "ml-auto"
          )}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pt-4 pb-2 text-[10px] tracking-widest uppercase text-muted-foreground">Menu</div>
      )}

      <nav className="px-4 flex-1 space-y-1.5 py-4">
        {NAV.map((item) => {
          const active = isActive(item.to, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-200 relative",
                active
                  ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(var(--primary),0.1)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {!collapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {active && !collapsed && (
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border/50 space-y-2">
        {!collapsed && user && (
          <div className="px-3 py-2 bg-muted/30 rounded-xl mb-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Role</div>
            <div className="text-xs text-foreground font-semibold">{user.role}</div>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-translate-x-1" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
