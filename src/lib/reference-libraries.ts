export type ReferenceCategory =
  | "sectors"
  | "offices"
  | "divisions"
  | "sections"
  | "eligibilities"
  | "employment-statuses"
  | "job-levels"
  | "plantilla-types"
  | "budget-codes";

export interface ReferenceRow {
  id: number;
  category: ReferenceCategory;
  code: string;
  name: string;
  description: string;
  parentId: number | null;
  parentName: string;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  sortOrder: number;
}

export interface ReferenceLibraryConfig {
  category: ReferenceCategory;
  label: string;
  plural: string;
  parentCategory?: ReferenceCategory;
  parentLabel?: string;
}

export const REFERENCE_LIBRARY_CONFIG: ReferenceLibraryConfig[] = [
  { category: "sectors", label: "Sector", plural: "Sectors" },
  {
    category: "offices",
    label: "Office",
    plural: "Offices",
    parentCategory: "sectors",
    parentLabel: "Sector",
  },
  {
    category: "divisions",
    label: "Division",
    plural: "Divisions",
    parentCategory: "offices",
    parentLabel: "Office",
  },
  {
    category: "sections",
    label: "Section / Unit",
    plural: "Sections / Units",
    parentCategory: "divisions",
    parentLabel: "Division",
  },
  { category: "eligibilities", label: "Eligibility", plural: "Eligibilities" },
  { category: "employment-statuses", label: "Employment Status", plural: "Employment Statuses" },
  { category: "job-levels", label: "Job Level", plural: "Job Levels" },
  { category: "plantilla-types", label: "Plantilla Classification", plural: "Plantilla Classes" },
  { category: "budget-codes", label: "Budget Code", plural: "Budget Codes" },
];
