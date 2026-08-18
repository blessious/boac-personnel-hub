import { api } from "@/lib/api";

export interface AgencyInfo {
  name?: string;
  tagline?: string;
}

export interface SummaryMetric {
  total: number;
  active?: number;
  inactive?: number;
  regular?: number;
  nonPlantilla?: number;
  authorized?: number;
  occupied?: number;
  vacant?: number;
  vacancyRate?: number;
}

export interface CountSeries {
  label: string;
  total: number;
  active?: number;
  inactive?: number;
  occupied?: number;
  vacant?: number;
}

export interface PlantillaItemReportRow {
  itemNumber: string;
  positionTitle: string;
  salaryGrade: number | string;
  salaryStep: number | string;
  salaryAmount: number | null;
  division: string;
  section: string;
  plantillaType: string;
  itemStatus: string;
  occupancyStatus: string;
  occupantName: string;
  occupantNo: string;
}

export interface PersonnelPlantillaReport {
  generatedAt: string;
  scope: string;
  employeeSummary: SummaryMetric;
  plantillaSummary: SummaryMetric;
  charts: {
    byDepartment: CountSeries[];
    byEmploymentStatus: CountSeries[];
    byLevel: CountSeries[];
    byGender: CountSeries[];
    byCivilStatus: CountSeries[];
    byAgeGroup: CountSeries[];
    topPositions: CountSeries[];
    plantillaByDivision: CountSeries[];
    plantillaBySalaryGrade: CountSeries[];
  };
  tables: {
    plantillaItems: PlantillaItemReportRow[];
    plantillaItemsTotal: number;
  };
}

export interface PersonnelPlantillaResponse {
  agency: AgencyInfo;
  report: PersonnelPlantillaReport;
}

export function getPersonnelPlantillaReport() {
  return api<PersonnelPlantillaResponse>("/api/reports/personnel-plantilla");
}

export function exportPersonnelPlantillaReport(format: "xlsx" | "pdf") {
  return api<{ fileName: string; downloadUrl: string }>(
    `/api/reports/personnel-plantilla/export/${format}`,
    { method: "POST" },
  );
}
