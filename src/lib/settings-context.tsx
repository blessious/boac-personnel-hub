import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { api } from "@/lib/api";

export interface AgencySettings {
  name: string;
  tagline: string;
  logoUrl: string;
  iconUrl: string;
  bannerUrl?: string;
}

export type Theme = "light" | "dark";
type ThemeToggleOrigin = { x: number; y: number };

interface SettingsContextType {
  agency: AgencySettings;
  updateAgency: (settings: Partial<AgencySettings>) => void;
  loadAgencySettings: () => Promise<void>;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  theme: Theme;
  toggleTheme: (origin?: ThemeToggleOrigin) => void;
  title: string;
  setTitle: (t: string) => void;
  subtitle: string;
  setSubtitle: (s: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_AGENCY: AgencySettings = {
  name: "STRH - HRIS",
  tagline: "DOH Southern Tagalog Regional Hospital",
  logoUrl: "",
  iconUrl: "",
  bannerUrl: "",
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [agency, setAgency] = useState<AgencySettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pmis_agency_settings");
      if (saved) {
        try {
          return { ...DEFAULT_AGENCY, ...JSON.parse(saved) };
        } catch (e) {
          console.error("Failed to parse saved settings", e);
        }
      }
    }
    return DEFAULT_AGENCY;
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pmis_sidebar_collapsed");
      return saved === "true";
    }
    return false;
  });

  const updateAgency = (newSettings: Partial<AgencySettings>) => {
    setAgency((prev) => {
      const updated = { ...prev, ...newSettings };
      // Only store non-image data in localStorage to avoid quota issues
      const { logoUrl, iconUrl, bannerUrl, ...textSettings } = updated;
      if (typeof window !== "undefined") {
        localStorage.setItem("pmis_agency_settings", JSON.stringify(textSettings));
      }
      // Images are kept in memory only
      return updated;
    });
  };

  const loadAgencySettings = useCallback(async () => {
    const data = await api<{ agency: AgencySettings }>("/api/public/agency");
    setAgency((prev) => {
      const updated = { ...prev, ...data.agency };
      const { logoUrl, iconUrl, bannerUrl, ...textSettings } = updated;
      if (typeof window !== "undefined") {
        localStorage.setItem("pmis_agency_settings", JSON.stringify(textSettings));
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    loadAgencySettings().catch((error) => {
      console.error("Failed to load agency settings", error);
    });
  }, [loadAgencySettings]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("pmis_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pmis_theme") as Theme;
      if (saved === "dark" || saved === "light") return saved;
    }
    return "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("pmis_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window !== "undefined" && agency.iconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = agency.iconUrl;
    }
  }, [agency.iconUrl]);

  const toggleTheme = (origin?: ThemeToggleOrigin) => {
    const nextTheme = theme === "light" ? "dark" : "light";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const transitionDocument = document as Document & {
      startViewTransition?: (callback: () => void) => { ready: Promise<void> };
    };

    if (!transitionDocument.startViewTransition || reducedMotion) {
      if (!reducedMotion) {
        document.documentElement.classList.add("theme-transitioning");
        window.setTimeout(
          () => document.documentElement.classList.remove("theme-transitioning"),
          460,
        );
      }
      setTheme(nextTheme);
      return;
    }

    const x = origin?.x ?? window.innerWidth - 32;
    const y = origin?.y ?? 32;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    const transition = transitionDocument.startViewTransition(() => {
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      localStorage.setItem("pmis_theme", nextTheme);
      flushSync(() => setTheme(nextTheme));
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
          },
          {
            duration: 520,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement: "::view-transition-new(root)",
          } as KeyframeAnimationOptions,
        );
      })
      .catch(() => undefined);
  };

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  return (
    <SettingsContext.Provider
      value={{
        agency,
        updateAgency,
        loadAgencySettings,
        sidebarCollapsed,
        toggleSidebar,
        theme,
        toggleTheme,
        title,
        setTitle,
        subtitle,
        setSubtitle,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
