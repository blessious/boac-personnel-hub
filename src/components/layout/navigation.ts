import {
  ArrowRightLeft,
  BarChart3,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  FileClock,
  LayoutDashboard,
  Landmark,
  MonitorSmartphone,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { PermissionKey } from "@/lib/auth";

export type AppNavItem = {
  to:
    | "/"
    | "/employees"
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
    label: "Employee Management",
    shortLabel: "Employees",
    icon: Users,
    permission: "employees.read",
  },
  {
    to: "/attendance",
    label: "Attendance",
    shortLabel: "Attendance",
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
    label: "Plantilla & PSIPOP",
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
    label: "Self-Service Portal",
    shortLabel: "Services",
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
    label: "Reports & Analytics",
    shortLabel: "Reports",
    icon: BarChart3,
    permission: "reports.view",
  },
  {
    to: "/admin",
    label: "System Administration",
    shortLabel: "Admin",
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

const NAV_SECTION_ORDER = [
  "Overview",
  "Employee Records",
  "Attendance & Leave",
  "Reports",
  "Administration",
] as const;

function sectionForNavItem(item: AppNavItem): (typeof NAV_SECTION_ORDER)[number] {
  if (item.to === "/") return "Overview";
  if (
    ["/employees", "/my-profile", "/plantilla", "/movements", "/service-records"].includes(item.to)
  ) {
    return "Employee Records";
  }
  if (["/attendance", "/schedules", "/leave", "/self-service", "/requests"].includes(item.to)) {
    return "Attendance & Leave";
  }
  if (item.to === "/reports") return "Reports";
  return "Administration";
}

export function groupNavItems(items: AppNavItem[]): AppNavSection[] {
  return NAV_SECTION_ORDER.map((label) => ({
    label,
    items: items.filter((item) => sectionForNavItem(item) === label),
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
      return [
        "admin.users",
        "admin.audit",
        "admin.errors",
        "admin.backups",
        "role_permissions.manage",
      ].some((permission) => allowed.has(permission));
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
