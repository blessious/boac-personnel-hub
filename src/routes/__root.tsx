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
import { AuthProvider, isSelfServiceRole, useAuth, type Role } from "@/lib/auth";
import { SettingsProvider } from "@/lib/settings-context";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useDeviceProfile } from "@/hooks/use-mobile";
import { useSettings } from "@/lib/settings-context";
import { useEffect } from "react";
import { RealtimeProvider } from "@/lib/realtime";

import appCss from "../styles.css?url";

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
    <html lang="en">
      <head>
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

const queryClient = new QueryClient();

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
  const isLoginPage = location.pathname === "/login";
  const isChangePasswordPage = location.pathname === "/change-password";
  const authorized =
    !user ||
    isLoginPage ||
    isChangePasswordPage ||
    canAccessPath(user.role, location.pathname, user.employeeId);

  useEffect(() => {
    if (!user && !isLoginPage) {
      navigate({ to: "/login", search: { redirect: "/" }, replace: true });
      return;
    }
    if (user?.mustChangePassword && !isChangePasswordPage) {
      navigate({ to: "/change-password", replace: true });
      return;
    }
    if (user && !isLoginPage && !canAccessPath(user.role, location.pathname, user.employeeId)) {
      navigate({ to: "/", replace: true });
    }
  }, [user, isLoginPage, isChangePasswordPage, location.pathname, navigate]);

  useEffect(() => {
    document.body.dataset.device = deviceProfile.device;
    document.body.dataset.touch = String(deviceProfile.isTouch);
  }, [deviceProfile.device, deviceProfile.isTouch]);

  if ((!user && !isLoginPage) || !authorized) return null;

  return (
    <>
      {isLoginPage || isChangePasswordPage ? (
        <Outlet />
      ) : (
        <div className="app-frame flex min-h-dvh w-full bg-background">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
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

function canAccessPath(role: Role, pathname: string, employeeId?: string) {
  const isSelfServicePath =
    pathname.startsWith("/self-service") ||
    pathname.startsWith("/my-profile") ||
    pathname.startsWith("/requests");

  if (pathname === "/") return true;
  if (isSelfServicePath) return isSelfServiceRole(role);
  if (role === "Admin") return true;
  if (isSelfServiceRole(role)) {
    if (pathname === "/attendance") return true;
    return Boolean(employeeId && pathname === `/employees/${employeeId}`);
  }
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/settings")) return role === "HR";
  return role === "HR" || role === "Viewer";
}
