import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut, ChevronLeft, ChevronRight, Stethoscope } from "lucide-react";
import { isSelfServiceRole, useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings-context";
import { getDashboard } from "@/lib/employees-api";
import { listLeaveApplications } from "@/lib/leave-api";
import { listDtrCorrectionRequests } from "@/lib/attendance-api";
import { cn } from "@/lib/utils";
import { navForRole } from "@/components/layout/navigation";

export function AppSidebar() {
  const { agency, sidebarCollapsed: collapsed, toggleSidebar } = useSettings();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const nav = navForRole(user?.role);
  const canSeeLeaveNotifications = user?.role === "Admin" || user?.role === "HR";
  const canSeeEmployeeStats = !isSelfServiceRole(user?.role);

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    enabled: canSeeEmployeeStats,
  });

  const { data: leaveNotifications } = useQuery({
    queryKey: ["leave-notifications", user?.role],
    queryFn: () => listLeaveApplications({ status: "Pending" }),
    enabled: canSeeLeaveNotifications,
  });

  const { data: dtrNotifications } = useQuery({
    queryKey: ["dtr-correction-notifications", user?.role],
    queryFn: () => listDtrCorrectionRequests({ status: "Pending" }),
    enabled: canSeeLeaveNotifications,
  });

  const pendingLeaveCount = leaveNotifications?.summary.pending || 0;
  const pendingDtrCount = dtrNotifications?.requests.length || 0;

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  const deptColors = [
    "bg-blue-400",
    "bg-emerald-400",
    "bg-amber-400",
    "bg-purple-400",
    "bg-cyan-400",
    "bg-rose-400",
    "bg-indigo-400",
  ];

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen sticky top-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 z-30",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* Logo / Header */}
      <div
        className={cn(
          "flex items-center h-16 border-b border-sidebar-border transition-all px-3 gap-2",
          collapsed && "justify-center",
        )}
      >
        <div
          className={cn(
            "grid place-items-center shrink-0 overflow-hidden transition-all",
            collapsed ? "h-9 w-9" : "h-10 w-10",
          )}
        >
          {agency.logoUrl ? (
            <img src={agency.logoUrl} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <Stethoscope className={cn("text-primary", collapsed ? "h-5 w-5" : "h-6 w-6")} />
          )}
        </div>
        {!collapsed && (
          <div className="leading-tight overflow-hidden flex-1">
            <div className="font-bold text-[14px] truncate text-sidebar-foreground">
              {agency.name || "STRH — HRIS"}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {agency.tagline || "DOH Southern Tagalog Region"}
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "h-7 w-7 grid place-items-center rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-colors shrink-0",
            collapsed && "mt-0",
          )}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {!collapsed && (
          <div className="px-4 pt-4 pb-1 text-[10px] tracking-widest uppercase text-muted-foreground font-semibold">
            Main Menu
          </div>
        )}

        <nav className="px-2 space-y-0.5 py-2">
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
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-muted/50",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    active
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-sidebar-foreground",
                  )}
                />
                {!collapsed && <span className="flex-1 leading-snug">{item.label}</span>}
                {item.to === "/employees" && !collapsed && dashboard && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/20 text-primary shrink-0">
                    {dashboard.totalEmployees}
                  </span>
                )}
                {item.to === "/leave" && pendingLeaveCount > 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shrink-0",
                      collapsed ? "absolute right-2 top-1 h-4 min-w-4 px-1" : "px-2 py-0.5",
                    )}
                  >
                    {pendingLeaveCount > 99 ? "99+" : pendingLeaveCount}
                  </span>
                )}
                {item.to === "/attendance" && pendingDtrCount > 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shrink-0",
                      collapsed ? "absolute right-2 top-1 h-4 min-w-4 px-1" : "px-2 py-0.5",
                    )}
                  >
                    {pendingDtrCount > 99 ? "99+" : pendingDtrCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Departments Section */}
        {!collapsed && canSeeEmployeeStats && dashboard && dashboard.byDivision.length > 0 && (
          <>
            <div className="px-4 pt-4 pb-1 text-[10px] tracking-widest uppercase text-muted-foreground font-semibold">
              Departments
            </div>
            <nav className="px-2 space-y-0.5 py-1">
              {dashboard.byDivision.map((dept, idx) => (
                <Link
                  key={dept.department}
                  to="/employees"
                  search={{ department: dept.department }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-sidebar-foreground hover:bg-muted/50 transition-all duration-150"
                >
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full shrink-0",
                      deptColors[idx % deptColors.length],
                    )}
                  />
                  <span className="flex-1 leading-snug">{dept.department}</span>
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary shrink-0">
                    {dept.filled}
                  </span>
                </Link>
              ))}
            </nav>
          </>
        )}
      </div>

      <div className="p-3 border-t border-sidebar-border/50">
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
