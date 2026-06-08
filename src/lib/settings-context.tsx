import React, { createContext, useContext, useState, useEffect } from "react";
import { SETTINGS } from "./mock-data";

export interface AgencySettings {
  name: string;
  tagline: string;
  logoUrl: string;
  iconUrl: string;
  bannerUrl?: string;
}

export type Theme = "light" | "dark";

interface SettingsContextType {
  agency: AgencySettings;
  updateAgency: (settings: Partial<AgencySettings>) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  theme: Theme;
  toggleTheme: () => void;
  title: string;
  setTitle: (t: string) => void;
  subtitle: string;
  setSubtitle: (s: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [agency, setAgency] = useState<AgencySettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pmis_agency_settings");
      if (saved) {
        try {
          return { ...SETTINGS.agency, ...JSON.parse(saved) };
        } catch (e) {
          console.error("Failed to parse saved settings", e);
        }
      }
    }
    return SETTINGS.agency;
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  return (
    <SettingsContext.Provider value={{ 
      agency, updateAgency, sidebarCollapsed, toggleSidebar, theme, toggleTheme,
      title, setTitle, subtitle, setSubtitle 
    }}>
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
