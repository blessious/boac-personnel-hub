import { useEffect } from "react";
import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation, Navigate } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { SettingsProvider, useSettings } from "@/lib/settings-context";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

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
      { title: "PMIS ??? Personnel Management Information System" },
      { name: "description", content: "Personnel Management Information System for government agencies and organizations." },
      { property: "og:title", content: "PMIS" },
      { property: "og:description", content: "Personnel records, plantilla, leave and salary management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
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

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SettingsProvider>
            <RootWithSettings />
          </SettingsProvider>
        </AuthProvider>
    </QueryClientProvider>
  );
}

function RootWithSettings() {
  const { agency, title, subtitle } = useSettings();
  const { user } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  useEffect(() => {
    document.title = `${agency.name} PMIS`;
    
    if (agency.iconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = agency.iconUrl;
    }
  }, [agency.name, agency.iconUrl]);

  if (!user && !isLoginPage) {
    return <Navigate to="/login" search={{ redirect: location.pathname }} />;
  }

  return (
    <>
      {isLoginPage ? (
        <Outlet />
      ) : (
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <AppHeader title={title} subtitle={subtitle} />
            <main className="flex-1 p-3 sm:p-4 xl:p-5 min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
      )}
      <Toaster richColors position="top-right" />
    </>
  );
}
