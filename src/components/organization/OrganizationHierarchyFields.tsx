import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_ORGANIZATION_HIERARCHY,
  organizationPath,
  type OrganizationHierarchy,
  type ReferenceCategory,
  type ReferenceRow,
} from "@/lib/reference-libraries";
import type { OrganizationSelection } from "@/lib/organization-selection";
import { cn } from "@/lib/utils";

type OrganizationHierarchyFieldsProps = {
  libraries: Record<ReferenceCategory, ReferenceRow[]>;
  hierarchy?: OrganizationHierarchy;
  value: OrganizationSelection;
  onValueChange: (value: OrganizationSelection) => void;
  disabled?: boolean;
  error?: string;
  fieldKey?: string;
  className?: string;
};

export function OrganizationHierarchyFields({
  libraries,
  hierarchy = DEFAULT_ORGANIZATION_HIERARCHY,
  value,
  onValueChange,
  disabled = false,
  error,
  fieldKey = "organization",
  className,
}: OrganizationHierarchyFieldsProps) {
  const enabledLevels = hierarchy.levels.filter((level) => level.enabled);

  return (
    <>
      {enabledLevels.map((level, index) => {
        const previousLevel = index > 0 ? enabledLevels[index - 1] : null;
        const previousValue = previousLevel ? value[previousLevel.category] || "" : "";
        const selectedValue = value[level.category] || "";
        const rows = (libraries[level.category] || [])
          .filter((row) => {
            if (!row.isActive && String(row.id) !== selectedValue) return false;
            if (!previousLevel) return true;
            if (!previousValue) return false;
            return organizationPath(row, libraries, hierarchy).some(
              (ancestor) => String(ancestor.id) === previousValue,
            );
          })
          .sort((left, right) =>
            left.name.localeCompare(right.name, undefined, {
              numeric: true,
              sensitivity: "base",
            }),
          );
        const showError = Boolean(error && index === 0);

        return (
          <div
            key={level.category}
            className={cn("space-y-1.5", className)}
            data-add-field={index === 0 ? fieldKey : undefined}
            data-organization-category={level.category}
            tabIndex={index === 0 ? -1 : undefined}
          >
            <Label htmlFor={`${fieldKey}-${level.category}`}>
              {level.label}
              {!level.assignable && (
                <span className="font-normal text-muted-foreground"> (grouping level)</span>
              )}
            </Label>
            <Combobox
              value={selectedValue}
              onValueChange={(nextValue) => {
                const next = { ...value, [level.category]: nextValue };
                enabledLevels.slice(index + 1).forEach((laterLevel) => {
                  next[laterLevel.category] = "";
                });
                onValueChange(next);
              }}
              options={rows.map((row) => ({
                value: String(row.id),
                label: row.name,
                disabled: !row.isActive,
                disabledDescription: "Inactive",
              }))}
              placeholder={
                previousLevel && !previousValue
                  ? `Select ${previousLevel.label.toLowerCase()} first`
                  : `Select ${level.label.toLowerCase()}`
              }
              searchPlaceholder={`Search ${level.label.toLowerCase()}...`}
              emptyText={`No ${level.pluralLabel.toLowerCase()} found.`}
              clearable={index > 0}
              clearLabel={`No ${level.label.toLowerCase()}`}
              triggerProps={{
                id: `${fieldKey}-${level.category}`,
                disabled: disabled || Boolean(previousLevel && !previousValue),
                "aria-invalid": showError,
              }}
            />
            {showError && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );
      })}
    </>
  );
}
