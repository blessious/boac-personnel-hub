import { useMemo, useState } from "react";
import { Pencil, Plus, Power, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

import type { ReferenceLibraryConfig, ReferenceRow } from "@/lib/reference-libraries";

interface FormState {
  code: string;
  name: string;
  description: string;
  parentId: string;
  effectiveFrom: string;
  effectiveTo: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  code: "",
  name: "",
  description: "",
  parentId: "",
  effectiveFrom: "",
  effectiveTo: "",
  sortOrder: "0",
  isActive: true,
};

interface Props {
  config: ReferenceLibraryConfig;
  rows: ReferenceRow[];
  parentRows: ReferenceRow[];
  canManage: boolean;
  onChanged: () => Promise<void> | void;
}

export function ReferenceLibraryPanel({ config, rows, parentRows, canManage, onChanged }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [row.code, row.name, row.description, row.parentName]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query, rows]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const editRow = (row: ReferenceRow) => {
    setEditingId(row.id);
    setForm({
      code: row.code,
      name: row.name,
      description: row.description,
      parentId: row.parentId ? String(row.parentId) : "",
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
      sortOrder: String(row.sortOrder),
      isActive: row.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    if (!form.code.trim() || !form.name.trim() || (config.parentCategory && !form.parentId)) return;
    setSaving(true);
    try {
      const endpoint = editingId
        ? `/api/settings/references/${config.category}/${editingId}`
        : `/api/settings/references/${config.category}`;
      await api<{ value: ReferenceRow }>(endpoint, {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify({
          ...form,
          parentId: form.parentId ? Number(form.parentId) : null,
          sortOrder: Number(form.sortOrder || 0),
        }),
      });
      toast.success(`${config.label} ${editingId ? "updated" : "added"}`);
      resetForm();
      await onChanged();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: ReferenceRow) => {
    try {
      await api<{ value: ReferenceRow }>(`/api/settings/references/${config.category}/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...row, isActive: !row.isActive }),
      });
      toast.success(`${config.label} ${row.isActive ? "deactivated" : "activated"}`);
      await onChanged();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const remove = async (row: ReferenceRow) => {
    if (!window.confirm(`Delete "${row.name}"? Deactivate it instead if it has been used.`)) return;
    try {
      await api<{ ok: boolean }>(`/api/settings/references/${config.category}/${row.id}`, {
        method: "DELETE",
      });
      toast.success(`${config.label} deleted`);
      if (editingId === row.id) resetForm();
      await onChanged();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5">
        <h2 className="font-semibold text-foreground">{config.plural}</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Maintain official {config.plural.toLowerCase()} for employee, Plantilla, and
          personnel-action records.
        </p>

        {canManage ? (
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Input
                value={form.code}
                maxLength={80}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder={`${config.label} code`}
              />
              <Input
                value={form.name}
                maxLength={200}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={`${config.label} name`}
              />
              {config.parentCategory ? (
                <select
                  value={form.parentId}
                  required
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="h-8 rounded-md border border-input bg-background px-2.5 text-sm shadow-sm"
                >
                  <option value="" disabled>
                    Select {config.parentLabel}
                  </option>
                  {parentRows
                    .filter((row) => row.isActive || String(row.id) === form.parentId)
                    .map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.code} - {row.name}
                      </option>
                    ))}
                </select>
              ) : (
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description (optional)"
                />
              )}
              <Input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                placeholder="Sort order"
              />
            </div>
            {config.parentCategory && (
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description (optional)"
              />
            )}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
              <label className="grid gap-1 text-xs text-muted-foreground">
                Effective from
                <Input
                  type="date"
                  value={form.effectiveFrom}
                  onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Effective to
                <Input
                  type="date"
                  value={form.effectiveTo}
                  onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })}
                />
              </label>
              <div className="flex items-end gap-2">
                <Button
                  onClick={save}
                  disabled={
                    saving ||
                    !form.code.trim() ||
                    !form.name.trim() ||
                    Boolean(config.parentCategory && !form.parentId)
                  }
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {editingId ? (
                    <Save className="mr-1 h-4 w-4" />
                  ) : (
                    <Plus className="mr-1 h-4 w-4" />
                  )}
                  {editingId ? "Save" : "Add"}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={resetForm} disabled={saving}>
                    <X className="mr-1 h-4 w-4" /> Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            View only. An administrator manages reference-library values.
          </div>
        )}

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${config.plural.toLowerCase()}...`}
          className="mt-4 max-w-sm bg-muted/30"
        />
      </div>

      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              {config.parentCategory && (
                <th className="px-4 py-3 font-medium">{config.parentLabel}</th>
              )}
              <th className="px-4 py-3 font-medium">Effectivity</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => (
              <tr
                key={row.id}
                className={cn("border-b border-border/70", index % 2 && "bg-muted/30")}
              >
                <td className="px-4 py-3 font-mono text-xs">{row.code}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{row.name}</div>
                  {row.description && (
                    <div className="mt-0.5 max-w-xl text-xs text-muted-foreground">
                      {row.description}
                    </div>
                  )}
                </td>
                {config.parentCategory && <td className="px-4 py-3">{row.parentName || "-"}</td>}
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {row.effectiveFrom || row.effectiveTo
                    ? `${row.effectiveFrom || "Open"} to ${row.effectiveTo || "Open"}`
                    : "Open-ended"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs font-medium",
                      row.isActive
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-slate-500/10 text-slate-600",
                    )}
                  >
                    {row.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      disabled={!canManage}
                      onClick={() => editRow(row)}
                      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      disabled={!canManage}
                      onClick={() => toggleActive(row)}
                      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                      title={row.isActive ? "Deactivate" : "Activate"}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      disabled={!canManage}
                      onClick={() => remove(row)}
                      className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td
                  colSpan={config.parentCategory ? 6 : 5}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No {config.plural.toLowerCase()} found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
