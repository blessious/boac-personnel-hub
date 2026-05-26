import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Agency, Department, Position, SalaryGrade } from "../../server/prisma/generated/client";

interface SettingsContextType {
  agency: Agency & { logoUrl?: string; iconUrl?: string; bannerUrl?: string; tagline?: string; name: string; contactNo: string; address: string; logoBase64: string | null; id?: number };
  departments: Department[];
  positions: Position[];
  salaryGrades: SalaryGrade[];
  title: string;
  subtitle: string;
  theme?: string;
  toggleTheme?: () => void;
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  updateAgency: (settings: any) => void;
  addDepartment: (dept: Partial<Department>) => void;
  deleteDepartment: (id: number) => void;
  addPosition: (pos: Partial<Position>) => void;
  deletePosition: (id: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    }
  });

  const [title, setTitle] = useState("Dashboard");
  const [subtitle, setSubtitle] = useState("Overview and statistics");

  if (isLoading || !data) {
    return <div>Loading...</div>;
  }

  const updateAgency = async (settings: any) => {
    try {
      await fetch('/api/settings/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const addDepartment = async (dept: Partial<Department>) => {
    try {
      await fetch('/api/settings/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dept)
      });
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteDepartment = async (id: number) => {
    // Implement delete if needed later on the backend
  };

  const addPosition = async (pos: Partial<Position>) => {
    try {
      await fetch('/api/settings/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pos)
      });
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const deletePosition = async (id: number) => {
    // Implement delete if needed later on the backend
  };

  const value = {
    agency: data.agency,
    departments: data.departments,
    positions: data.positions,
    salaryGrades: data.salaryGrades,
    title,
    subtitle,
    setTitle,
    setSubtitle,
    updateAgency,
    addDepartment,
    deleteDepartment,
    addPosition,
    deletePosition,
  };

  return (
    <SettingsContext.Provider value={value}>
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
