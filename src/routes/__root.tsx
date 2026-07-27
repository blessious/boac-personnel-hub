import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth, type PermissionKey } from "@/lib/auth";
import { SettingsProvider } from "@/lib/settings-context";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useDeviceProfile } from "@/hooks/use-mobile";
import { useSettings } from "@/lib/settings-context";
import { useEffect } from "react";
import { RealtimeProvider } from "@/lib/realtime";

import appCss from "../styles.css?url";
import appIcon from "../assets/branding/STRH-logo.png";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function AccessDeniedComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-5xl font-bold text-foreground">403</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Access denied</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account does not have permission to view this page.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

function RedirectingToLoginComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="text-center" role="status" aria-live="polite">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-foreground">Redirecting to sign in…</p>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "STRH HRIS — Human Resource Information System" },
      {
        name: "description",
        content: "Human Resource Information System for DOH Southern Tagalog Regional Hospital.",
      },
      { property: "og:title", content: "STRH HRIS" },
      {
        property: "og:description",
        content: "Personnel records, attendance, leave and HR management.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: appIcon },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("pmis_theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}',
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeProvider>
          <SettingsProvider>
            <AppLayout />
          </SettingsProvider>
        </RealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { title, subtitle } = useSettings();
  const deviceProfile = useDeviceProfile();
  const requestedPath = location.href || location.pathname || "/";
  const isLoginPage = location.pathname === "/login";
  const isChangePasswordPage = location.pathname === "/change-password";
  const authorized =
    !user ||
    isLoginPage ||
    isChangePasswordPage ||
    canAccessPath(user.permissions || [], location.pathname, user.employeeId);

  useEffect(() => {
    if (!user && !isLoginPage) {
      navigate({
        to: "/login",
        search: { redirect: requestedPath },
        replace: true,
      });
      return;
    }
    if (user?.mustChangePassword && !isChangePasswordPage) {
      navigate({ to: "/change-password", replace: true });
      return;
    }
    if (
      user &&
      !isLoginPage &&
      !canAccessPath(user.permissions || [], location.pathname, user.employeeId)
    ) {
      // Keep the requested URL visible so the user gets a clear 403 state.
      return;
    }
  }, [user, isLoginPage, isChangePasswordPage, location.pathname, navigate, requestedPath]);

  useEffect(() => {
    document.body.dataset.device = deviceProfile.device;
    document.body.dataset.touch = String(deviceProfile.isTouch);
  }, [deviceProfile.device, deviceProfile.isTouch]);

  if (!user && !isLoginPage) return <RedirectingToLoginComponent />;
  if (!authorized) return <AccessDeniedComponent />;

  return (
    <>
      {isLoginPage || isChangePasswordPage ? (
        <Outlet />
      ) : (
        <div className="app-frame flex min-h-dvh w-full bg-background">
          <div className="dash-sidebar-enter">
            <AppSidebar />
          </div>
          <div className="dash-content-enter flex min-w-0 flex-1 flex-col">
            <AppHeader title={title || "STRH HRIS"} subtitle={subtitle} />
            <main className="mobile-app-content min-w-0 flex-1 p-3 sm:p-4 xl:p-5">
              <Outlet />
            </main>
          </div>
          <MobileBottomNav />
        </div>
      )}
      <Toaster richColors position="top-right" />
    </>
  );
}

function canAccessPath(permissions: PermissionKey[], pathname: string, employeeId?: string) {
  const allowed = new Set(permissions);
  if (pathname === "/") return allowed.has("dashboard.view");
  if (pathname.startsWith("/self-service")) return allowed.has("self_service.access");
  if (pathname.startsWith("/my-profile")) return allowed.has("my_profile.access");
  if (pathname.startsWith("/requests")) return allowed.has("requests.access");
  if (pathname.startsWith("/admin")) {
    return ["admin.users", "admin.audit", "admin.errors", "role_permissions.manage"].some(
      (permission) => allowed.has(permission as PermissionKey),
    );
  }
  if (pathname.startsWith("/settings")) return allowed.has("settings.manage");
  if (pathname.startsWith("/leave")) return allowed.has("leave.read");
  if (pathname.startsWith("/attendance")) {
    return allowed.has("attendance.read") || allowed.has("self_service.access");
  }
  if (pathname.startsWith("/schedules")) return allowed.has("attendance.write");
  if (pathname.startsWith("/plantilla")) return allowed.has("plantilla.read");
  if (pathname.startsWith("/movements")) return allowed.has("movements.read");
  if (pathname.startsWith("/service-records")) return allowed.has("service_records.read");
  if (pathname.startsWith("/reports")) return allowed.has("reports.view");
  if (pathname.startsWith("/employees/references")) return allowed.has("settings.manage");
  if (pathname.startsWith("/employees/")) {
    return (
      allowed.has("employees.read") ||
      Boolean(employeeId && pathname === `/employees/${employeeId}`)
    );
  }
  if (pathname.startsWith("/employees")) return allowed.has("employees.read");
  return false;
}
