import {
  ArrowRightLeft,
  BarChart3,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  FileClock,
  Library,
  LayoutDashboard,
  Landmark,
  MonitorSmartphone,
  Settings,
  ShieldCheck,
  UserCircle,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { PermissionKey } from "@/lib/auth";

export type AppNavItem = {
  to:
    | "/"
    | "/employees"
    | "/employees/references"
    | "/attendance"
    | "/schedules"
    | "/plantilla"
    | "/movements"
    | "/service-records"
    | "/leave"
    | "/self-service"
    | "/reports"
    | "/admin"
    | "/settings"
    | "/my-profile"
    | "/requests";
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  exact?: boolean;
  permission: PermissionKey;
};

export type AppNavSection = {
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  items: AppNavItem[];
};

export const APP_NAV: AppNavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    shortLabel: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
    permission: "dashboard.view",
  },
  {
    to: "/my-profile",
    label: "My Profile",
    shortLabel: "Profile",
    icon: UserCircle,
    permission: "my_profile.access",
  },
  {
    to: "/employees",
    label: "Employees",
    shortLabel: "Employees",
    icon: Users,
    exact: true,
    permission: "employees.read",
  },
  {
    to: "/employees/references",
    label: "Employee References",
    shortLabel: "References",
    icon: Library,
    permission: "settings.manage",
  },
  {
    to: "/attendance",
    label: "DTR",
    shortLabel: "DTR",
    icon: CalendarDays,
    permission: "attendance.read",
  },
  {
    to: "/schedules",
    label: "Schedule Management",
    shortLabel: "Schedules",
    icon: CalendarRange,
    permission: "attendance.write",
  },
  {
    to: "/plantilla",
    label: "Plantilla",
    shortLabel: "Plantilla",
    icon: Landmark,
    permission: "plantilla.read",
  },
  {
    to: "/movements",
    label: "Employee Movements",
    shortLabel: "Movements",
    icon: ArrowRightLeft,
    permission: "movements.read",
  },
  {
    to: "/service-records",
    label: "Service Records",
    shortLabel: "Records",
    icon: FileClock,
    permission: "service_records.read",
  },
  {
    to: "/leave",
    label: "Leave Management",
    shortLabel: "Leave",
    icon: ClipboardCheck,
    permission: "leave.read",
  },
  {
    to: "/self-service",
    label: "Self-Service",
    shortLabel: "Self-Service",
    icon: MonitorSmartphone,
    permission: "self_service.access",
  },
  {
    to: "/requests",
    label: "My Requests",
    shortLabel: "Requests",
    icon: ClipboardCheck,
    permission: "requests.access",
  },
  {
    to: "/reports",
    label: "Analytics",
    shortLabel: "Analytics",
    icon: BarChart3,
    permission: "reports.view",
  },
  {
    to: "/admin",
    label: "Users & Roles",
    shortLabel: "Users",
    icon: ShieldCheck,
    permission: "admin.users",
  },
  {
    to: "/settings",
    label: "Settings",
    shortLabel: "Settings",
    icon: Settings,
    permission: "settings.manage",
  },
];

const NAV_SECTIONS: Array<{
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  routes: AppNavItem["to"][];
}> = [
  {
    label: "Dashboard",
    shortLabel: "Dashboard",
    icon: LayoutDashboard,
    routes: ["/"],
  },
  {
    label: "Employee Records",
    shortLabel: "Records",
    icon: Users,
    routes: ["/employees", "/my-profile", "/employees/references", "/service-records"],
  },
  {
    label: "Plantilla & Movements",
    shortLabel: "Plantilla",
    icon: Landmark,
    routes: ["/plantilla", "/movements"],
  },
  {
    label: "Attendance & Leave",
    shortLabel: "Attendance",
    icon: CalendarDays,
    routes: ["/attendance", "/schedules", "/leave", "/self-service", "/requests"],
  },
  {
    label: "Reports",
    shortLabel: "Reports",
    icon: BarChart3,
    routes: ["/reports"],
  },
  {
    label: "System",
    shortLabel: "System",
    icon: UserCog,
    routes: ["/admin", "/settings"],
  },
];

export function groupNavItems(items: AppNavItem[]): AppNavSection[] {
  const itemByRoute = new Map(items.map((item) => [item.to, item]));
  return NAV_SECTIONS.map((section) => ({
    label: section.label,
    shortLabel: section.shortLabel,
    icon: section.icon,
    items: section.routes.map((route) => itemByRoute.get(route)).filter(Boolean) as AppNavItem[],
  })).filter((section) => section.items.length > 0);
}

export function navForRole(role: string | undefined) {
  const fallbackByRole: Record<string, PermissionKey[]> = {
    "Super Admin": APP_NAV.map((item) => item.permission),
    Admin: ["dashboard.view", "admin.users", "settings.manage"],
    HR: [
      "dashboard.view",
      "employees.read",
      "attendance.read",
      "attendance.write",
      "leave.read",
      "plantilla.read",
      "movements.read",
      "service_records.read",
      "reports.view",
    ],
    Approver: [
      "dashboard.view",
      "employees.read",
      "attendance.read",
      "leave.read",
      "plantilla.read",
      "movements.read",
      "service_records.read",
      "reports.view",
    ],
    Employee: [
      "dashboard.view",
      "my_profile.access",
      "self_service.access",
      "attendance.read",
      "requests.access",
    ],
    Viewer: [
      "dashboard.view",
      "employees.read",
      "attendance.read",
      "plantilla.read",
      "movements.read",
      "service_records.read",
      "reports.view",
    ],
  };
  return navForPermissions(fallbackByRole[role || ""] || []);
}

export function navForPermissions(permissions: PermissionKey[] | undefined) {
  const allowed = new Set(permissions || []);
  return APP_NAV.filter((item) => {
    if (item.to === "/admin") {
      return ["admin.users", "admin.audit", "admin.errors", "role_permissions.manage"].some(
        (permission) => allowed.has(permission as PermissionKey),
      );
    }
    if (item.to === "/attendance") {
      return allowed.has("attendance.read") || allowed.has("self_service.access");
    }
    return allowed.has(item.permission);
  });
}

export function mobileTabsForRole(role: string | undefined) {
  return navForRole(role).slice(0, 5);
}

export function mobileTabsForPermissions(permissions: PermissionKey[] | undefined) {
  return navForPermissions(permissions).slice(0, 5);
}
