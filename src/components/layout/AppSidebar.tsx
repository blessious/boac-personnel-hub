import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut, PanelLeftClose, PanelLeftOpen, Stethoscope } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings-context";
import { listLeaveApplications } from "@/lib/leave-api";
import { listDtrCorrectionRequests } from "@/lib/attendance-api";
import { navNotificationCount, useRealtime } from "@/lib/realtime";
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
  const { notifications } = useRealtime();

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
        "hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:sticky md:top-0 md:z-30 md:flex",
        collapsed ? "w-14" : "w-64",
      )}
    >
      <div
        className={cn(
          "relative flex h-14 items-center gap-2 border-b border-sidebar-border px-3 transition-all",
          collapsed && "justify-center",
        )}
      >
        <div
          className={cn(
            "grid shrink-0 place-items-center overflow-hidden rounded-lg transition-all",
            collapsed ? "absolute left-1/2 h-8 w-8 -translate-x-1/2" : "h-9 w-9",
            !agency.logoUrl && "bg-primary/10 text-primary",
          )}
        >
          {agency.logoUrl ? (
            <img src={agency.logoUrl} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <Stethoscope className={cn("text-primary", collapsed ? "h-5 w-5" : "h-6 w-6")} />
          )}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 overflow-hidden leading-tight">
            <div className="truncate text-sm font-semibold text-sidebar-foreground">
              {agency.name || "LGU BOAC HRIS"}
            </div>
            <div className="truncate text-xs font-light text-sidebar-foreground/65">HRIS</div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            collapsed && "absolute right-1 top-3",
          )}
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
        <nav className="space-y-2 px-2 py-3">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <div className="px-2 pb-1.5 pt-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.to, item.exact);
                  const Icon = item.icon;
                  const unreadCount = navNotificationCount(notifications, item.to);
                  const itemNotificationCount =
                    item.to === "/leave"
                      ? Math.max(pendingLeaveCount, unreadCount)
                      : item.to === "/attendance"
                        ? Math.max(pendingDtrCount, unreadCount)
                        : unreadCount;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex h-9 items-center gap-2 overflow-hidden rounded-md px-2.5 text-sm font-medium outline-none ring-sidebar-ring transition-colors focus-visible:ring-2",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "h-10 justify-center px-0",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-110",
                          active
                            ? "text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/75 group-hover:text-sidebar-accent-foreground",
                        )}
                      />
                      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                      {itemNotificationCount > 0 && (
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground",
                            collapsed ? "absolute right-2 top-1 h-4 min-w-4 px-1" : "px-2 py-0.5",
                          )}
                        >
                          {itemNotificationCount > 99 ? "99+" : itemNotificationCount}
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

      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={handleLogout}
          className={cn(
            "group flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive",
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
