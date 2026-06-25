import {
  ArrowRightLeft,
  BarChart3,
  CalendarDays,
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
import { canReadHrRecords, isSelfServiceRole } from "@/lib/auth";

export type AppNavItem = {
  to:
    | "/"
    | "/employees"
    | "/attendance"
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
};

export type AppNavSection = {
  label: string;
  items: AppNavItem[];
};

export const APP_NAV: AppNavItem[] = [
  { to: "/", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/my-profile", label: "My Profile", shortLabel: "Profile", icon: UserCircle },
  { to: "/employees", label: "Employee Management", shortLabel: "Employees", icon: Users },
  { to: "/attendance", label: "Attendance", shortLabel: "Attendance", icon: CalendarDays },
  { to: "/plantilla", label: "Plantilla & PSIPOP", shortLabel: "Plantilla", icon: Landmark },
  { to: "/movements", label: "Employee Movements", shortLabel: "Movements", icon: ArrowRightLeft },
  { to: "/service-records", label: "Service Records", shortLabel: "Records", icon: FileClock },
  { to: "/leave", label: "Leave Management", shortLabel: "Leave", icon: ClipboardCheck },
  {
    to: "/self-service",
    label: "Self-Service Portal",
    shortLabel: "Services",
    icon: MonitorSmartphone,
  },
  { to: "/requests", label: "My Requests", shortLabel: "Requests", icon: ClipboardCheck },
  { to: "/reports", label: "Reports & Analytics", shortLabel: "Reports", icon: BarChart3 },
  { to: "/admin", label: "System Administration", shortLabel: "Admin", icon: ShieldCheck },
  { to: "/settings", label: "Settings", shortLabel: "Settings", icon: Settings },
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
  if (["/attendance", "/leave", "/self-service", "/requests"].includes(item.to)) {
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
  const selfServiceOnly = ["/my-profile", "/self-service", "/requests"];
  if (role === "Super Admin") return APP_NAV;
  if (role === "Admin") {
    return APP_NAV.filter((item) => ["/", "/admin", "/settings"].includes(item.to));
  }
  if (role === "HR") {
    return APP_NAV.filter((item) => !["/admin", "/settings", ...selfServiceOnly].includes(item.to));
  }
  if (role === "Approver") {
    return APP_NAV.filter((item) =>
      [
        "/",
        "/employees",
        "/attendance",
        "/plantilla",
        "/movements",
        "/service-records",
        "/leave",
        "/reports",
      ].includes(item.to),
    );
  }
  if (canReadHrRecords(role)) {
    return APP_NAV.filter((item) =>
      [
        "/",
        "/employees",
        "/attendance",
        "/plantilla",
        "/movements",
        "/service-records",
        "/reports",
      ].includes(item.to),
    );
  }
  if (isSelfServiceRole(role)) {
    return APP_NAV.filter((item) =>
      ["/", "/my-profile", "/self-service", "/attendance", "/requests"].includes(item.to),
    );
  }
  return [];
}

export function mobileTabsForRole(role: string | undefined) {
  return navForRole(role).slice(0, 5);
}
