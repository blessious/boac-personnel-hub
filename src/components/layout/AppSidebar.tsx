import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, LogOut, PanelLeftClose, PanelLeftOpen, Stethoscope } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings-context";
import { listLeaveApplications } from "@/lib/leave-api";
import { listDtrCorrectionRequests } from "@/lib/attendance-api";
import { navNotificationCount, useRealtime } from "@/lib/realtime";
import { cn } from "@/lib/utils";
import { groupNavItems, navForPermissions } from "@/components/layout/navigation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function AppSidebar() {
  const { agency, sidebarCollapsed: collapsed, toggleSidebar } = useSettings();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const nav = useMemo(() => navForPermissions(user?.permissions), [user?.permissions]);
  const navSections = useMemo(() => groupNavItems(nav), [nav]);
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

  const isActive = useCallback(
    (to: string, exact?: boolean) =>
      exact ? path === to : path === to || path.startsWith(to + "/"),
    [path],
  );

  const activeSectionLabels = useMemo(
    () =>
      navSections
        .filter((section) => section.items.some((item) => isActive(item.to, item.exact)))
        .map((section) => section.label),
    [isActive, navSections],
  );

  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(activeSectionLabels));

  useEffect(() => {
    if (activeSectionLabels.length === 0) return;
    setOpenSections((current) => {
      if (activeSectionLabels.every((label) => current.has(label))) {
        return current;
      }
      const next = new Set(current);
      activeSectionLabels.forEach((label) => next.add(label));
      return next;
    });
  }, [activeSectionLabels]);

  const toggleSection = (label: string) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const itemNotificationCount = (to: string) => {
    const unreadCount = navNotificationCount(notifications, to);
    if (to === "/leave") return Math.max(pendingLeaveCount, unreadCount);
    if (to === "/attendance") return Math.max(pendingDtrCount, unreadCount);
    return unreadCount;
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login", search: {}, replace: true });
  };

  return (
    <aside
      className={cn(
        "hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar font-sans text-sidebar-foreground transition-[width] duration-200 md:sticky md:top-0 md:z-30 md:flex",
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
        <nav className={cn("px-2 py-3", collapsed ? "space-y-0.5" : "space-y-1")}>
          {collapsed
            ? nav.map((item) => {
                const active = isActive(item.to, item.exact);
                const Icon = item.icon;
                const notificationCount = itemNotificationCount(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={item.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-10 items-center justify-center overflow-hidden rounded-md text-sm font-medium outline-none ring-sidebar-ring transition-colors focus-visible:ring-2",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active
                          ? "text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground",
                      )}
                    />
                    {notificationCount > 0 && (
                      <span className="absolute right-1.5 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </span>
                    )}
                  </Link>
                );
              })
            : navSections.map((section) => {
                const open = openSections.has(section.label);
                const sectionActive = section.items.some((item) => isActive(item.to, item.exact));
                const SectionIcon = section.icon;
                const sectionNotificationCount = section.items.reduce(
                  (total, item) => total + itemNotificationCount(item.to),
                  0,
                );

                return (
                  <Collapsible
                    key={section.label}
                    open={open}
                    onOpenChange={() => toggleSection(section.label)}
                  >
                    <CollapsibleTrigger
                      className={cn(
                        "group flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[14px] font-medium outline-none ring-sidebar-ring transition-colors focus-visible:ring-2",
                        sectionActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <SectionIcon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          sectionActive
                            ? "text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{section.label}</span>
                      {sectionNotificationCount > 0 && (
                        <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                          {sectionNotificationCount > 99 ? "99+" : sectionNotificationCount}
                        </span>
                      )}
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 shrink-0 text-sidebar-foreground/60 transition-transform duration-200",
                          open && "rotate-90",
                        )}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-[15px] space-y-0.5 border-l border-sidebar-border py-1 pl-[18px]">
                        {section.items.map((item) => {
                          const active = isActive(item.to, item.exact);
                          const notificationCount = itemNotificationCount(item.to);
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "relative flex h-8 items-center gap-2 overflow-hidden rounded-md px-2 text-[14px] font-medium outline-none ring-sidebar-ring transition-colors focus-visible:ring-2",
                                active
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              )}
                            >
                              <span
                                className={cn("min-w-0 flex-1 truncate", active && "font-semibold")}
                              >
                                {item.label}
                              </span>
                              {notificationCount > 0 && (
                                <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                                  {notificationCount > 99 ? "99+" : notificationCount}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
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
