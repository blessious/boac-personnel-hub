import {
  DEFAULT_ORGANIZATION_HIERARCHY,
  organizationPath,
  type OrganizationHierarchy,
  type OrganizationReferenceCategory,
  type ReferenceCategory,
  type ReferenceRow,
} from "@/lib/reference-libraries";

export type OrganizationSelection = Partial<Record<OrganizationReferenceCategory, string>>;

const organizationCategories: OrganizationReferenceCategory[] = [
  "sectors",
  "offices",
  "divisions",
  "sections",
];

function referenceById(
  libraries: Record<ReferenceCategory, ReferenceRow[]>,
  referenceId: string | number | null | undefined,
) {
  if (!referenceId) return undefined;
  const id = Number(referenceId);
  return organizationCategories
    .flatMap((category) => libraries[category] || [])
    .find((row) => row.id === id);
}

export function organizationAncestry(
  reference: ReferenceRow | undefined,
  libraries: Record<ReferenceCategory, ReferenceRow[]>,
) {
  if (!reference) return [];
  const byId = new Map(
    organizationCategories
      .flatMap((category) => libraries[category] || [])
      .map((row) => [row.id, row] as const),
  );
  const ancestry: ReferenceRow[] = [];
  const visited = new Set<number>();
  let current: ReferenceRow | undefined = reference;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    ancestry.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return ancestry;
}

export function organizationSelectionFromReferenceId(
  referenceId: string | number | null | undefined,
  libraries: Record<ReferenceCategory, ReferenceRow[]>,
  hierarchy: OrganizationHierarchy = DEFAULT_ORGANIZATION_HIERARCHY,
) {
  const selected = referenceById(libraries, referenceId);
  if (!selected) return {};
  return organizationPath(selected, libraries, hierarchy).reduce<OrganizationSelection>(
    (selection, row) => {
      selection[row.category as OrganizationReferenceCategory] = String(row.id);
      return selection;
    },
    {},
  );
}

export function selectedAssignableOrganization(
  selection: OrganizationSelection,
  libraries: Record<ReferenceCategory, ReferenceRow[]>,
  hierarchy: OrganizationHierarchy = DEFAULT_ORGANIZATION_HIERARCHY,
  options: { allowInactive?: boolean } = {},
) {
  const enabledLevels = hierarchy.levels.filter((level) => level.enabled);
  let deepest: { level: (typeof enabledLevels)[number]; row: ReferenceRow } | null = null;

  for (let index = 0; index < enabledLevels.length; index += 1) {
    const level = enabledLevels[index];
    const selectedId = selection[level.category];
    if (!selectedId) break;
    const row = (libraries[level.category] || []).find(
      (candidate) => String(candidate.id) === selectedId,
    );
    if (!row) return null;
    if (index > 0) {
      const previousLevel = enabledLevels[index - 1];
      const previousId = selection[previousLevel.category];
      if (
        !previousId ||
        !organizationPath(row, libraries, hierarchy).some(
          (ancestor) => String(ancestor.id) === previousId,
        )
      ) {
        return null;
      }
    }
    deepest = { level, row };
  }

  return deepest?.level.assignable && (deepest.row.isActive || options.allowInactive)
    ? deepest.row
    : null;
}
