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

export type OrganizationReferenceCategory = "sectors" | "offices" | "divisions" | "sections";

export interface OrganizationHierarchyLevel {
  category: OrganizationReferenceCategory;
  label: string;
  pluralLabel: string;
  enabled: boolean;
  assignable: boolean;
  parentCategory: OrganizationReferenceCategory | null;
}

export interface OrganizationHierarchy {
  version: number;
  levels: OrganizationHierarchyLevel[];
  enabledCategories: OrganizationReferenceCategory[];
  assignableCategories: OrganizationReferenceCategory[];
}

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
  enabled?: boolean;
  assignable?: boolean;
}

export const ORGANIZATION_REFERENCE_CATEGORIES: OrganizationReferenceCategory[] = [
  "sectors",
  "offices",
  "divisions",
  "sections",
];

export const DEFAULT_ORGANIZATION_HIERARCHY: OrganizationHierarchy = {
  version: 1,
  levels: [
    {
      category: "sectors",
      label: "Sector",
      pluralLabel: "Sectors",
      enabled: true,
      assignable: false,
      parentCategory: null,
    },
    {
      category: "offices",
      label: "Office",
      pluralLabel: "Offices",
      enabled: true,
      assignable: true,
      parentCategory: "sectors",
    },
    {
      category: "divisions",
      label: "Division",
      pluralLabel: "Divisions",
      enabled: true,
      assignable: true,
      parentCategory: "offices",
    },
    {
      category: "sections",
      label: "Section / Unit",
      pluralLabel: "Sections / Units",
      enabled: true,
      assignable: true,
      parentCategory: "divisions",
    },
  ],
  enabledCategories: ["sectors", "offices", "divisions", "sections"],
  assignableCategories: ["offices", "divisions", "sections"],
};

const STATIC_REFERENCE_LIBRARY_CONFIG: ReferenceLibraryConfig[] = [
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

export const REFERENCE_LIBRARY_CONFIG = STATIC_REFERENCE_LIBRARY_CONFIG;

export function referenceLibraryConfigForHierarchy(
  hierarchy: OrganizationHierarchy = DEFAULT_ORGANIZATION_HIERARCHY,
) {
  const organization = hierarchy.levels.map<ReferenceLibraryConfig>((level) => {
    const parent = level.parentCategory
      ? hierarchy.levels.find((candidate) => candidate.category === level.parentCategory)
      : null;
    return {
      category: level.category,
      label: level.label,
      plural: level.pluralLabel,
      parentCategory: level.parentCategory || undefined,
      parentLabel: parent?.label,
      enabled: level.enabled,
      assignable: level.assignable,
    };
  });
  return [
    ...organization,
    ...STATIC_REFERENCE_LIBRARY_CONFIG.filter(
      (config) =>
        !ORGANIZATION_REFERENCE_CATEGORIES.includes(
          config.category as OrganizationReferenceCategory,
        ),
    ),
  ];
}

export function enabledOrganizationLevels(
  hierarchy: OrganizationHierarchy = DEFAULT_ORGANIZATION_HIERARCHY,
) {
  return hierarchy.levels.filter((level) => level.enabled);
}

export function organizationAssignmentLabel(
  hierarchy: OrganizationHierarchy = DEFAULT_ORGANIZATION_HIERARCHY,
) {
  const labels = hierarchy.levels
    .filter((level) => level.enabled && level.assignable)
    .map((level) => level.label);
  return labels.length === 1 ? labels[0] : "Organizational unit";
}

export function assignableOrganizationRows(
  libraries: Record<ReferenceCategory, ReferenceRow[]>,
  hierarchy: OrganizationHierarchy = DEFAULT_ORGANIZATION_HIERARCHY,
) {
  const assignable = new Set(hierarchy.assignableCategories);
  return hierarchy.levels.flatMap((level) =>
    assignable.has(level.category)
      ? (libraries[level.category] || []).filter((row) => row.isActive)
      : [],
  );
}

export function organizationPath(
  row: ReferenceRow | undefined,
  libraries: Record<ReferenceCategory, ReferenceRow[]>,
  hierarchy: OrganizationHierarchy = DEFAULT_ORGANIZATION_HIERARCHY,
) {
  if (!row) return [];
  const byId = new Map(
    ORGANIZATION_REFERENCE_CATEGORIES.flatMap((category) => libraries[category] || []).map(
      (candidate) => [candidate.id, candidate] as const,
    ),
  );
  const ancestry: ReferenceRow[] = [];
  const visited = new Set<number>();
  let current: ReferenceRow | undefined = row;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    ancestry.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  const enabled = new Set(hierarchy.enabledCategories);
  return ancestry.filter((candidate) =>
    enabled.has(candidate.category as OrganizationReferenceCategory),
  );
}
