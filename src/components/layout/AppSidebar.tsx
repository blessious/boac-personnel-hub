import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut, ChevronLeft, ChevronRight, Stethoscope } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings-context";
import { getDashboard } from "@/lib/employees-api";
import { listLeaveApplications } from "@/lib/leave-api";
import { listDtrCorrectionRequests } from "@/lib/attendance-api";
import { cn } from "@/lib/utils";
import { groupNavItems, navForPermissions } from "@/components/layout/navigation";

export function AppSidebar() {
  const { agency, sidebarCollapsed: collapsed, toggleSidebar } = useSettings();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const nav = navForPermissions(user?.permissions);
  const navSections = groupNavItems(nav);
  const canSeeLeaveNotifications = hasPermission("approvals.manage");
  const canSeeEmployeeStats = hasPermission("employees.read");

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: ({ signal }) => getDashboard({ signal }),
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

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login", search: {}, replace: true });
  };

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
          "relative flex h-14 items-center gap-2 border-b border-sidebar-border px-3 transition-all",
          collapsed && "justify-center",
        )}
      >
        <div
          className={cn(
            "grid place-items-center shrink-0 overflow-hidden transition-all",
            collapsed ? "absolute left-1/2 h-8 w-8 -translate-x-1/2" : "h-9 w-9",
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
            <div className="truncate text-[13px] font-bold text-sidebar-foreground">
              {agency.name || "STRH — HRIS"}
            </div>
            <div className="truncate text-[11px] text-sidebar-foreground/65">
              {agency.tagline || "DOH Southern Tagalog Region"}
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-md text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "absolute right-1 mt-0",
          )}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <nav className="px-2 py-2">
          {navSections.map((section) => (
            <div key={section.label} className={cn(!collapsed && "mb-2 last:mb-0")}>
              {!collapsed && (
                <div className="px-3 pb-1.5 pt-1.5 text-[9px] font-semibold uppercase tracking-widest text-sidebar-foreground/55">
                  {section.label}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.to, item.exact);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                        active
                          ? "bg-sidebar-primary/15 text-sidebar-primary"
                          : "text-sidebar-foreground/82 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active
                            ? "text-sidebar-primary"
                            : "text-sidebar-foreground/65 group-hover:text-sidebar-accent-foreground",
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
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-sidebar-border/50 p-2">
        <button
          onClick={handleLogout}
          className={cn(
            "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/82 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-1" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
