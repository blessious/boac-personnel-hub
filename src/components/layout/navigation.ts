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
import { isSelfServiceRole } from "@/lib/auth";

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

export const APP_NAV: AppNavItem[] = [
  { to: "/", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, exact: true },
  { to: "/my-profile", label: "My Profile", shortLabel: "Profile", icon: UserCircle },
  { to: "/employees", label: "Employee Management", shortLabel: "People", icon: Users },
  { to: "/attendance", label: "Attendance", shortLabel: "DTR", icon: CalendarDays },
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

export function navForRole(role: string | undefined) {
  const selfServiceOnly = ["/my-profile", "/self-service", "/requests"];
  if (role === "Admin") return APP_NAV.filter((item) => !selfServiceOnly.includes(item.to));
  if (role === "HR") {
    return APP_NAV.filter((item) => !["/admin", ...selfServiceOnly].includes(item.to));
  }
  if (role === "Viewer") {
    return APP_NAV.filter((item) =>
      ["/", "/employees", "/plantilla", "/movements", "/service-records", "/reports"].includes(
        item.to,
      ),
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
  const nav = navForRole(role);
  const preferred = isSelfServiceRole(role)
    ? ["/", "/my-profile", "/attendance", "/requests", "/self-service"]
    : ["/", "/employees", "/attendance", "/leave", "/reports"];

  return preferred
    .map((to) => nav.find((item) => item.to === to))
    .filter((item): item is AppNavItem => Boolean(item))
    .slice(0, 5);
}
