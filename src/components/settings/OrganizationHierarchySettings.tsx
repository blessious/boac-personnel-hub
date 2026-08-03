import { ArrowDown, ArrowUp, Building2, Eye, GripVertical, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import {
  DEFAULT_ORGANIZATION_HIERARCHY,
  type OrganizationHierarchy,
  type OrganizationHierarchyLevel,
  type OrganizationReferenceCategory,
  type ReferenceCategory,
  type ReferenceRow,
} from "@/lib/reference-libraries";
import { cn } from "@/lib/utils";

const optionCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

interface HierarchyPreview {
  hierarchy: OrganizationHierarchy;
  compatible: boolean;
  parentIssues: Array<{
    referenceId: number;
    category: OrganizationReferenceCategory;
    name: string;
    requiredParentCategory: OrganizationReferenceCategory;
  }>;
  assignmentIssues: Array<{
    referenceId: number;
    category: OrganizationReferenceCategory | "";
    name: string;
    employees: number;
    engagements: number;
    temporaryAssignments: number;
    movements: number;
    plantillaItems: number;
  }>;
  summary: {
    activeReferences: number;
    parentMappingsRequired: number;
    assignmentMappingsRequired: number;
    unresolvedLegacyDepartments: number;
  };
  departmentConsolidation: {
    matched: Array<{
      departmentId: number;
      departmentName: string;
      officeId: number;
      officeName: string;
    }>;
    unresolved: Array<{
      departmentId: number;
      departmentName: string;
      officeId: null;
      officeName: "";
    }>;
  };
}

function draftHierarchy(hierarchy: OrganizationHierarchy): OrganizationHierarchy {
  return {
    version: hierarchy.version,
    levels: hierarchy.levels.map((level) => ({ ...level })),
    enabledCategories: [...hierarchy.enabledCategories],
    assignableCategories: [...hierarchy.assignableCategories],
  };
}

function hierarchyPayload(levels: OrganizationHierarchyLevel[], version: number) {
  const enabled = levels.filter((level) => level.enabled);
  return {
    version,
    levels: levels.map((level) => ({ ...level, parentCategory: null })),
    enabledCategories: enabled.map((level) => level.category),
    assignableCategories: enabled
      .filter((level) => level.assignable)
      .map((level) => level.category),
  };
}

export function OrganizationHierarchySettings({
  onActivated,
}: {
  onActivated?: (hierarchy: OrganizationHierarchy) => void;
}) {
  const [saved, setSaved] = useState<OrganizationHierarchy>(DEFAULT_ORGANIZATION_HIERARCHY);
  const [levels, setLevels] = useState<OrganizationHierarchyLevel[]>(
    DEFAULT_ORGANIZATION_HIERARCHY.levels,
  );
  const [libraries, setLibraries] = useState<Record<ReferenceCategory, ReferenceRow[]> | null>(
    null,
  );
  const [preview, setPreview] = useState<HierarchyPreview | null>(null);
  const [parentMappings, setParentMappings] = useState<Record<number, string>>({});
  const [assignmentMappings, setAssignmentMappings] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedCategory, setDraggedCategory] = useState<OrganizationReferenceCategory | null>(
    null,
  );

  const load = async () => {
    setLoading(true);
    try {
      const result = await api<{
        hierarchy: OrganizationHierarchy;
        libraries: Record<ReferenceCategory, ReferenceRow[]>;
      }>("/api/settings/references");
      const hierarchy = result.hierarchy || DEFAULT_ORGANIZATION_HIERARCHY;
      setSaved(draftHierarchy(hierarchy));
      setLevels(hierarchy.levels.map((level) => ({ ...level })));
      setLibraries(result.libraries);
      setPreview(null);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const payload = useMemo(() => hierarchyPayload(levels, saved.version), [levels, saved.version]);
  const dirty = JSON.stringify(payload.levels) !== JSON.stringify(saved.levels);
  const enabled = levels.filter((level) => level.enabled);
  const valid =
    enabled.length > 0 &&
    enabled.some((level) => level.assignable) &&
    levels.every(
      (level) =>
        level.label.trim() && level.pluralLabel.trim() && (!level.assignable || level.enabled),
    );

  const updateLevel = (
    category: OrganizationReferenceCategory,
    update: Partial<OrganizationHierarchyLevel>,
  ) => {
    setLevels((current) =>
      current.map((level) =>
        level.category === category
          ? {
              ...level,
              ...update,
              assignable:
                update.enabled === false
                  ? false
                  : update.assignable === undefined
                    ? level.assignable
                    : update.assignable,
            }
          : level,
      ),
    );
    setPreview(null);
  };

  const move = (category: OrganizationReferenceCategory, offset: -1 | 1) => {
    setLevels((current) => {
      const index = current.findIndex((level) => level.category === category);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setPreview(null);
  };

  const dropBefore = (target: OrganizationReferenceCategory) => {
    if (!draggedCategory || draggedCategory === target) return;
    setLevels((current) => {
      const moving = current.find((level) => level.category === draggedCategory);
      if (!moving) return current;
      const without = current.filter((level) => level.category !== draggedCategory);
      const targetIndex = without.findIndex((level) => level.category === target);
      without.splice(targetIndex, 0, moving);
      return without;
    });
    setDraggedCategory(null);
    setPreview(null);
  };

  const runPreview = async () => {
    if (!valid) {
      toast.error("Enable at least one assignable level and complete every label");
      return;
    }
    setPreviewing(true);
    try {
      const result = await api<HierarchyPreview>("/api/settings/organization-hierarchy/preview", {
        method: "POST",
        body: JSON.stringify({ hierarchy: payload }),
      });
      setPreview(result);
      setParentMappings({});
      setAssignmentMappings({});
      if (result.compatible) toast.success("Structure is compatible and ready to activate");
      else toast.info("Review the required mappings before activation");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPreviewing(false);
    }
  };

  const activate = async () => {
    if (!preview) return;
    const missingParent = preview.parentIssues.some((issue) => !parentMappings[issue.referenceId]);
    const missingAssignment = preview.assignmentIssues.some(
      (issue) => !assignmentMappings[issue.referenceId],
    );
    if (missingParent || missingAssignment) {
      toast.error("Complete every required mapping before activation");
      return;
    }
    setSaving(true);
    try {
      const result = await api<HierarchyPreview>("/api/settings/organization-hierarchy", {
        method: "PUT",
        body: JSON.stringify({
          hierarchy: payload,
          parentMappings: preview.parentIssues.map((issue) => ({
            referenceId: issue.referenceId,
            parentId: Number(parentMappings[issue.referenceId]),
          })),
          assignmentMappings: preview.assignmentIssues.map((issue) => ({
            referenceId: issue.referenceId,
            replacementId: Number(assignmentMappings[issue.referenceId]),
          })),
        }),
      });
      setSaved(draftHierarchy(result.hierarchy));
      setLevels(result.hierarchy.levels.map((level) => ({ ...level })));
      setPreview(null);
      onActivated?.(result.hierarchy);
      toast.success("Organizational structure activated");
      await load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const activeRows = (category: OrganizationReferenceCategory) =>
    (libraries?.[category] || [])
      .filter((row) => row.isActive)
      .sort((left, right) => optionCollator.compare(left.name, right.name));
  const assignableRows = levels
    .flatMap((level) => (level.enabled && level.assignable ? activeRows(level.category) : []))
    .sort((left, right) => optionCollator.compare(left.name, right.name));

  return (
    <section className="mt-5 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-medium">
            <Building2 className="h-5 w-5 text-primary" />
            Organizational Structure
          </h3>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Arrange reusable organizational levels, choose their visible labels, and control which
            levels can receive employees. Disabling a level hides it without deactivating or
            deleting its records.
          </p>
        </div>
        <span className="w-fit rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
          Version {saved.version}
        </span>
      </div>

      <div className="space-y-3">
        {levels.map((level, index) => (
          <div
            key={level.category}
            draggable={!loading && !saving}
            onDragStart={() => setDraggedCategory(level.category)}
            onDragEnd={() => setDraggedCategory(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropBefore(level.category)}
            className={cn(
              "grid gap-3 rounded-lg border border-border p-3 transition-colors lg:grid-cols-[44px_110px_1fr_1fr_120px_92px]",
              level.enabled ? "bg-background" : "bg-muted/20 text-muted-foreground",
              draggedCategory === level.category && "opacity-50",
            )}
          >
            <div className="flex items-center justify-center">
              <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground" />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={level.enabled}
                disabled={loading || saving}
                onChange={(event) => updateLevel(level.category, { enabled: event.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              Enabled
            </label>
            <div className="grid gap-1">
              <Label htmlFor={`${level.category}-label`}>Singular label</Label>
              <Input
                id={`${level.category}-label`}
                value={level.label}
                maxLength={80}
                disabled={loading || saving}
                onChange={(event) => updateLevel(level.category, { label: event.target.value })}
              />
              <span className="text-[11px] text-muted-foreground">
                Internal type: {level.category}
              </span>
            </div>
            <div className="grid gap-1">
              <Label htmlFor={`${level.category}-plural`}>Plural label</Label>
              <Input
                id={`${level.category}-plural`}
                value={level.pluralLabel}
                maxLength={100}
                disabled={loading || saving}
                onChange={(event) =>
                  updateLevel(level.category, { pluralLabel: event.target.value })
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={level.assignable}
                disabled={!level.enabled || loading || saving}
                onChange={(event) =>
                  updateLevel(level.category, { assignable: event.target.checked })
                }
                className="h-4 w-4 rounded border-input"
              />
              Assignable
            </label>
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                size="icon"
                variant="outline"
                disabled={index === 0 || loading || saving}
                onClick={() => move(level.category, -1)}
                aria-label={`Move ${level.label} up`}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                disabled={index === levels.length - 1 || loading || saving}
                onClick={() => move(level.category, 1)}
                aria-label={`Move ${level.label} down`}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div
          className={cn(
            "mt-5 rounded-lg border p-4",
            preview.compatible
              ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20"
              : "border-amber-300 bg-amber-50/60 dark:bg-amber-950/20",
          )}
        >
          <h4 className="font-medium">
            {preview.compatible ? "Ready to activate" : "Mappings required"}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {preview.summary.activeReferences} active organizational references checked;{" "}
            {preview.summary.parentMappingsRequired} parent and{" "}
            {preview.summary.assignmentMappingsRequired} assignment mappings required.
          </p>
          {preview.summary.unresolvedLegacyDepartments > 0 && (
            <div className="mt-3 rounded-md border border-amber-300/70 bg-background/70 p-3 text-sm">
              <div className="font-medium">
                {preview.summary.unresolvedLegacyDepartments} legacy Department name(s) do not yet
                match an Office reference.
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Create or rename the matching organizational reference before retiring the legacy
                list. Structure activation does not delete these legacy rows.
              </p>
              <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                {preview.departmentConsolidation.unresolved.slice(0, 8).map((department) => (
                  <li key={department.departmentId}>{department.departmentName}</li>
                ))}
              </ul>
            </div>
          )}

          {preview.parentIssues.map((issue) => {
            const parentLevel = levels.find(
              (level) => level.category === issue.requiredParentCategory,
            );
            return (
              <div
                key={`parent-${issue.referenceId}`}
                className="mt-3 grid gap-2 sm:grid-cols-[1fr_280px] sm:items-center"
              >
                <span className="text-sm">
                  {issue.name} needs a {parentLevel?.label || issue.requiredParentCategory} parent.
                </span>
                <Select
                  value={parentMappings[issue.referenceId] || ""}
                  onValueChange={(value) =>
                    setParentMappings((current) => ({
                      ...current,
                      [issue.referenceId]: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeRows(issue.requiredParentCategory).map((row) => (
                      <SelectItem key={row.id} value={String(row.id)}>
                        {row.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}

          {preview.assignmentIssues.map((issue) => (
            <div
              key={`assignment-${issue.referenceId}`}
              className="mt-3 grid gap-2 sm:grid-cols-[1fr_280px] sm:items-center"
            >
              <span className="text-sm">
                {issue.name} has{" "}
                {issue.employees +
                  issue.engagements +
                  issue.temporaryAssignments +
                  issue.movements +
                  issue.plantillaItems}{" "}
                current assignment reference(s).
              </span>
              <Select
                value={assignmentMappings[issue.referenceId] || ""}
                onValueChange={(value) =>
                  setAssignmentMappings((current) => ({
                    ...current,
                    [issue.referenceId]: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose replacement" />
                </SelectTrigger>
                <SelectContent>
                  {assignableRows.map((row) => (
                    <SelectItem key={row.id} value={String(row.id)}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={!dirty || !valid || previewing || saving || loading}
          onClick={runPreview}
        >
          <Eye className="mr-2 h-4 w-4" />
          {previewing ? "Checking..." : "Preview Impact"}
        </Button>
        <Button
          type="button"
          disabled={!preview || saving || previewing}
          onClick={activate}
          className="bg-primary text-primary-foreground"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Activating..." : "Activate Structure"}
        </Button>
      </div>
    </section>
  );
}
