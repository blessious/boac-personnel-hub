import { api } from "@/lib/api";
export type PlantillaItem = {
  id: string;
  itemNumber: string;
  positionId: number;
  positionTitle: string;
  salaryGradeId: number | null;
  salaryGrade: { ordinance: string; grade: number; step: number; amount: number } | null;
  sectorId: number | null;
  sectorName: string;
  officeId: number | null;
  officeName: string;
  divisionId: number | null;
  divisionName: string;
  sectionId: number | null;
  sectionName: string;
  plantillaTypeId: number | null;
  plantillaTypeName: string;
  budgetCodeId: number | null;
  budgetCodeName: string;
  authorizedSalary: number | null;
  itemStatus: "Active" | "Inactive" | "Abolished";
  effectiveFrom: string;
  effectiveTo: string;
  notes: string;
  occupant: null | {
    occupancyId: string;
    employeeId: string;
    employeeNo: string;
    employeeName: string;
    dateFrom: string;
    movementType: string;
    appointmentNumber: string;
  };
  createdAt: string;
  updatedAt: string;
};
export type PlantillaPayload = {
  itemNumber: string;
  positionId: string;
  salaryGradeId: string;
  sectorId: string;
  officeId: string;
  divisionId: string;
  sectionId: string;
  plantillaTypeId: string;
  budgetCodeId: string;
  authorizedSalary: string;
  itemStatus: string;
  effectiveFrom: string;
  effectiveTo: string;
  notes: string;
};
export const emptyPlantilla: PlantillaPayload = {
  itemNumber: "",
  positionId: "",
  salaryGradeId: "",
  sectorId: "",
  officeId: "",
  divisionId: "",
  sectionId: "",
  plantillaTypeId: "",
  budgetCodeId: "",
  authorizedSalary: "",
  itemStatus: "Active",
  effectiveFrom: "",
  effectiveTo: "",
  notes: "",
};
export const listPlantilla = (q = "", status = "all", occupancy = "all") =>
  api<{
    items: PlantillaItem[];
    summary: {
      authorized: number;
      active: number;
      inactive: number;
      occupied: number;
      vacant: number;
    };
  }>(`/api/plantilla?q=${encodeURIComponent(q)}&status=${status}&occupancy=${occupancy}`);
export const savePlantilla = (value: PlantillaPayload, id?: string) =>
  api<{ item: PlantillaItem }>(id ? `/api/plantilla/${id}` : "/api/plantilla", {
    method: id ? "PATCH" : "POST",
    body: JSON.stringify(value),
  });
