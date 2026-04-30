import React, { createContext, useContext, useState, useEffect } from "react";
import { SETTINGS } from "./mock-data";

export interface AgencySettings {
  name: string;
  tagline: string;
  logoUrl: string;
  iconUrl: string;
}

interface SettingsContextType {
  agency: AgencySettings;
  updateAgency: (settings: Partial<AgencySettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [agency, setAgency] = useState<AgencySettings>(() => {
    const saved = localStorage.getItem("pmis_agency_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
    return SETTINGS.agency;
  });

  const updateAgency = (newSettings: Partial<AgencySettings>) => {
    setAgency((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("pmis_agency_settings", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ agency, updateAgency }}>
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
