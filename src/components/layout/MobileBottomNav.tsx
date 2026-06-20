import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { useAuth } from "@/lib/auth";
import { listLeaveApplications } from "@/lib/leave-api";
import { listDtrCorrectionRequests } from "@/lib/attendance-api";
import { cn } from "@/lib/utils";
import { mobileTabsForRole } from "@/components/layout/navigation";

export function MobileBottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const tabs = mobileTabsForRole(user?.role);
  const canSeeLeaveNotifications = user?.role === "Admin" || user?.role === "HR";

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
  const activeIndex = Math.max(
    0,
    tabs.findIndex((item) => isActive(item.to, item.exact)),
  );

  if (!tabs.length) return null;

  return (
    <nav className="mobile-bottom-nav md:hidden" aria-label="Primary mobile navigation">
      <div
        className="mobile-bottom-nav__rail"
        style={
          {
            "--active-index": activeIndex,
            "--item-count": tabs.length,
          } as CSSProperties
        }
      >
        <span className="mobile-bottom-nav__highlight" aria-hidden="true" />
        {tabs.map((item) => {
          const active = isActive(item.to, item.exact);
          const Icon = item.icon;
          const itemPendingCount =
            item.to === "/leave"
              ? pendingLeaveCount
              : item.to === "/attendance"
                ? pendingDtrCount
                : 0;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn("mobile-bottom-nav__item", active && "mobile-bottom-nav__item--active")}
              aria-current={active ? "page" : undefined}
            >
              <span className="mobile-bottom-nav__icon">
                <Icon className="h-5 w-5" />
              </span>
              <span className="mobile-bottom-nav__label">{item.shortLabel}</span>
              {itemPendingCount > 0 && (
                <span className="mobile-bottom-nav__badge">
                  {itemPendingCount > 9 ? "9+" : itemPendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
