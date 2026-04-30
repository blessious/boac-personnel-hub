import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, FileText, CalendarDays, Settings as SettingsIcon,
  LogOut, ChevronLeft, ChevronRight, ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/leave", label: "Leave Management", icon: CalendarDays },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
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
      <div className="flex items-center gap-2 px-4 h-16 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg bg-[var(--navy)] text-[var(--navy-foreground)] grid place-items-center shrink-0 shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-semibold text-sm">Boac PMIS</div>
            <div className="text-[11px] text-muted-foreground">Marinduque LGU</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto h-7 w-7 grid place-items-center rounded-md hover:bg-sidebar-accent text-muted-foreground"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pt-4 pb-2 text-[10px] tracking-widest uppercase text-muted-foreground">Menu</div>
      )}

      <nav className="px-3 flex-1 space-y-1">
        {NAV.map((item) => {
          const active = isActive(item.to, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        {!collapsed && user && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Signed in as <span className="text-foreground font-medium">{user.role}</span>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
