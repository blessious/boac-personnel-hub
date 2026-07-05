import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Power, Save, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [pendingDelete, setPendingDelete] = useState<ReferenceRow | null>(null);
  const [deleting, setDeleting] = useState(false);

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
  const activeCount = useMemo(() => rows.filter((row) => row.isActive).length, [rows]);
  const inactiveCount = rows.length - activeCount;

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
    setPendingDelete(row);
  };

  const confirmRemove = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api<{ ok: boolean }>(
        `/api/settings/references/${config.category}/${pendingDelete.id}`,
        {
          method: "DELETE",
        },
      );
      toast.success(`${config.label} deleted`);
      if (editingId === pendingDelete.id) resetForm();
      setPendingDelete(null);
      await onChanged();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-semibold text-foreground">{config.plural}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Maintain official {config.plural.toLowerCase()} for employee, Plantilla, and
                personnel-action records.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{rows.length} total</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                {activeCount} active
              </Badge>
              {inactiveCount > 0 && <Badge variant="secondary">{inactiveCount} inactive</Badge>}
            </div>
          </div>

          {canManage ? (
            <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/20 p-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                  Code
                  <Input
                    value={form.code}
                    maxLength={80}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder={`${config.label} code`}
                  />
                </label>
                <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                  Name
                  <Input
                    value={form.name}
                    maxLength={200}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={`${config.label} name`}
                  />
                </label>
                {config.parentCategory ? (
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    {config.parentLabel}
                    <Select
                      value={form.parentId}
                      onValueChange={(value) => setForm({ ...form, parentId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${config.parentLabel}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {parentRows
                          .filter((row) => row.isActive || String(row.id) === form.parentId)
                          .map((row) => (
                            <SelectItem key={row.id} value={String(row.id)}>
                              {row.code} - {row.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </label>
                ) : (
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Description
                    <Input
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Description (optional)"
                    />
                  </label>
                )}
                <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                  Sort order
                  <Input
                    type="number"
                    min="0"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    placeholder="Sort order"
                  />
                </label>
              </div>
              {config.parentCategory && (
                <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                  Description
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Description (optional)"
                  />
                </label>
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
                    {saving ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : editingId ? (
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

          <div className="relative mt-4 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${config.plural.toLowerCase()}...`}
              className="bg-muted/30 pl-9"
            />
          </div>
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
      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {config.label.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{pendingDelete?.name}" from {config.plural.toLowerCase()}? Deactivate it
              instead if it has already been used in employee, Plantilla, or personnel-action
              records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                confirmRemove();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
