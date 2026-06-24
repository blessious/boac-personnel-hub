import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, History, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { canWriteHrRecords, useAuth } from "@/lib/auth";
import { type SettingsOptions } from "@/lib/employees-api";
import {
  emptyPlantilla,
  deletePlantilla,
  listPlantilla,
  savePlantilla,
  type PlantillaItem,
  type PlantillaPayload,
} from "@/lib/plantilla-api";
import type { ReferenceCategory, ReferenceRow } from "@/lib/reference-libraries";

export const Route = createFileRoute("/plantilla")({ component: PlantillaPage });
const fieldClass = "h-9 w-full rounded-md border bg-background px-3 text-sm";
const categories: ReferenceCategory[] = [
  "sectors",
  "offices",
  "divisions",
  "sections",
  "plantilla-types",
  "budget-codes",
];
function PlantillaPage() {
  const { user } = useAuth(),
    canManage = canWriteHrRecords(user?.role);
  const [items, setItems] = useState<PlantillaItem[]>([]),
    [summary, setSummary] = useState({
      authorized: 0,
      active: 0,
      inactive: 0,
      occupied: 0,
      vacant: 0,
    });
  const [settings, setSettings] = useState<SettingsOptions>({
    departments: [],
    positions: [],
    salaryGrades: [],
  });
  const [refs, setRefs] = useState<Record<ReferenceCategory, ReferenceRow[]>>(
      {} as Record<ReferenceCategory, ReferenceRow[]>,
    );
  const [q, setQ] = useState(""),
    [status, setStatus] = useState("all"),
    [occupancy, setOccupancy] = useState("all"),
    [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<PlantillaItem | null | undefined>(undefined),
    [form, setForm] = useState<PlantillaPayload>(emptyPlantilla);
  const [history, setHistory] = useState<
      Array<{ id: number; action: string; changedBy: string; createdAt: string }>
    >([]),
    [historyItem, setHistoryItem] = useState<PlantillaItem | null>(null);
  const load = useCallback(async () => {
    try {
      const x = await listPlantilla(q, status, occupancy);
      setItems(x.items);
      setSummary(x.summary);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [q, status, occupancy]);
  useEffect(() => {
    Promise.all([
      api<SettingsOptions>("/api/settings"),
      api<{ libraries: Record<ReferenceCategory, ReferenceRow[]> }>("/api/settings/references"),
    ])
      .then(([s, r]) => {
        setSettings(s);
        setRefs(r.libraries);
      })
      .catch((e) => toast.error(e.message));
  }, []);
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);
  const active = (c: ReferenceCategory) => refs[c]?.filter((x) => x.isActive) || [];
  const offices = useMemo(
    () =>
      (refs["offices"] || [])
        .filter((x) => x.isActive)
        .filter((x) => !form.sectorId || String(x.parentId) === form.sectorId),
    [refs, form.sectorId],
  );
  const divisions = useMemo(
    () =>
      (refs["divisions"] || [])
        .filter((x) => x.isActive)
        .filter((x) => !form.officeId || String(x.parentId) === form.officeId),
    [refs, form.officeId],
  );
  const sections = useMemo(
    () =>
      (refs["sections"] || [])
        .filter((x) => x.isActive)
        .filter((x) => !form.divisionId || String(x.parentId) === form.divisionId),
    [refs, form.divisionId],
  );
  const openEdit = (item?: PlantillaItem) => {
    setEdit(item || null);
    setForm(
      item
        ? {
            itemNumber: item.itemNumber,
            positionId: String(item.positionId),
            salaryGradeId: item.salaryGradeId ? String(item.salaryGradeId) : "",
            sectorId: item.sectorId ? String(item.sectorId) : "",
            officeId: item.officeId ? String(item.officeId) : "",
            divisionId: item.divisionId ? String(item.divisionId) : "",
            sectionId: item.sectionId ? String(item.sectionId) : "",
            plantillaTypeId: item.plantillaTypeId ? String(item.plantillaTypeId) : "",
            budgetCodeId: item.budgetCodeId ? String(item.budgetCodeId) : "",
            authorizedSalary: item.authorizedSalary == null ? "" : String(item.authorizedSalary),
            itemStatus: item.itemStatus,
            effectiveFrom: item.effectiveFrom || "",
            effectiveTo: item.effectiveTo || "",
            notes: item.notes,
          }
        : emptyPlantilla,
    );
  };
  const save = async () => {
    setBusy(true);
    try {
      await savePlantilla(form, edit?.id);
      toast.success(edit ? "Plantilla item updated" : "Plantilla item created");
      setEdit(undefined);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (item: PlantillaItem) => {
    if (
      !window.confirm(
        `Delete plantilla item ${item.itemNumber}? This is only allowed for mistaken entries with no occupancy or movement history. Used items should be marked Inactive or Abolished.`,
      )
    )
      return;
    setBusy(true);
    try {
      await deletePlantilla(item.id);
      toast.success("Plantilla item deleted");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const showHistory = async (item: PlantillaItem) => {
    try {
      const x = await api<{ history: typeof history }>(`/api/plantilla/${item.id}/history`);
      setHistory(x.history);
      setHistoryItem(item);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <AppShell
      title="Plantilla & PSIPOP"
      subtitle="Authorized positions, occupancy, vacancies, and movement history"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(summary).map(([k, v]) => (
          <Card key={k}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs uppercase text-muted-foreground">{k}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{v}</CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search item, position, or employee"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className={fieldClass + " max-w-40"}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Abolished</option>
        </select>
        <select
          className={fieldClass + " max-w-40"}
          value={occupancy}
          onChange={(e) => setOccupancy(e.target.value)}
        >
          <option value="all">All occupancy</option>
          <option value="occupied">Occupied</option>
          <option value="vacant">Vacant</option>
        </select>
        {canManage && (
          <Button onClick={() => openEdit()}>
            <Plus className="mr-2 h-4 w-4" />
            New item
          </Button>
        )}
      </div>
      <div className="mobile-record-list mt-4 md:hidden">
        {items.map((i) => (
          <article className="mobile-record-card" key={i.id}>
            <div className="mobile-record-card__header">
              <div>
                <div className="mobile-record-card__title">{i.itemNumber}</div>
                <div className="mobile-record-card__meta">
                  {i.positionTitle} -{" "}
                  {i.salaryGrade
                    ? `SG ${i.salaryGrade.grade}, Step ${i.salaryGrade.step}`
                    : "No salary grade"}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs font-medium">
                {i.itemStatus}
              </span>
            </div>
            <div className="mobile-record-card__grid">
              <div className="mobile-record-card__field">
                <span className="mobile-record-card__label">Occupancy</span>
                <span className="mobile-record-card__value">
                  {i.occupant ? i.occupant.employeeName : "Vacant"}
                </span>
              </div>
              <div className="mobile-record-card__field">
                <span className="mobile-record-card__label">Employee no.</span>
                <span className="mobile-record-card__value">{i.occupant?.employeeNo || "-"}</span>
              </div>
              <div className="mobile-record-card__field">
                <span className="mobile-record-card__label">Organization</span>
                <span className="mobile-record-card__value">
                  {[i.sectorName, i.officeName, i.divisionName, i.sectionName]
                    .filter(Boolean)
                    .join(" / ") || "-"}
                </span>
              </div>
              <div className="mobile-record-card__field">
                <span className="mobile-record-card__label">Class / fund</span>
                <span className="mobile-record-card__value">
                  {[i.plantillaTypeName, i.budgetCodeName].filter(Boolean).join(" / ") || "-"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              <Button size="icon" variant="ghost" title="History" onClick={() => showHistory(i)}>
                <History className="h-4 w-4" />
              </Button>
              {canManage && (
                <>
                  <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(i)}>
                    <BriefcaseBusiness className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Delete"
                    disabled={busy}
                    onClick={() => remove(i)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </article>
        ))}
        {!items.length && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No plantilla items found.
          </div>
        )}
      </div>
      <div className="mobile-desktop-table mt-4 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              {[
                "Item no.",
                "Position / SG",
                "Organization",
                "Classification / Fund",
                "Occupancy",
                "Status",
                "Actions",
              ].map((x) => (
                <th className="p-3" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr className="border-t" key={i.id}>
                <td className="p-3 font-medium">{i.itemNumber}</td>
                <td className="p-3">
                  {i.positionTitle}
                  <div className="text-xs text-muted-foreground">
                    {i.salaryGrade
                      ? `SG ${i.salaryGrade.grade}, Step ${i.salaryGrade.step}`
                      : "No salary grade"}
                  </div>
                </td>
                <td className="p-3">
                  {[i.sectorName, i.officeName, i.divisionName, i.sectionName]
                    .filter(Boolean)
                    .join(" / ") || "-"}
                </td>
                <td className="p-3">
                  {i.plantillaTypeName || "-"}
                  <div className="text-xs text-muted-foreground">
                    {i.budgetCodeName || "No fund code"}
                  </div>
                </td>
                <td className="p-3">
                  {i.occupant ? (
                    <>
                      <span className="font-medium">{i.occupant.employeeName}</span>
                      <div className="text-xs text-muted-foreground">{i.occupant.employeeNo}</div>
                    </>
                  ) : (
                    <span className="text-amber-700">Vacant</span>
                  )}
                </td>
                <td className="p-3">{i.itemStatus}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="History"
                      onClick={() => showHistory(i)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    {canManage && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Edit"
                          onClick={() => openEdit(i)}
                        >
                          <BriefcaseBusiness className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Delete"
                          disabled={busy}
                          onClick={() => remove(i)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td className="p-8 text-center text-muted-foreground" colSpan={7}>
                  No plantilla items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={edit !== undefined} onOpenChange={(o) => !o && setEdit(undefined)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{edit ? "Edit" : "Create"} plantilla item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <F l="Item number">
              <Input
                value={form.itemNumber}
                onChange={(e) => setForm({ ...form, itemNumber: e.target.value })}
              />
            </F>
            <Sel
              l="Position"
              v={form.positionId}
              set={(v) => setForm({ ...form, positionId: v })}
              rows={settings.positions.map((x) => [String(x.id), x.title])}
            />
            <Sel
              l="Salary grade / step"
              v={form.salaryGradeId}
              set={(v) => setForm({ ...form, salaryGradeId: v })}
              rows={settings.salaryGrades.map((x) => [
                String(x.id),
                `SG ${x.grade} Step ${x.step} - PHP ${x.amount.toLocaleString()}`,
              ])}
            />
            <F l="Authorized salary">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.authorizedSalary}
                onChange={(e) => setForm({ ...form, authorizedSalary: e.target.value })}
              />
            </F>
            <Sel
              l="Sector"
              v={form.sectorId}
              set={(v) =>
                setForm({ ...form, sectorId: v, officeId: "", divisionId: "", sectionId: "" })
              }
              rows={active("sectors").map((x) => [String(x.id), x.name])}
            />
            <Sel
              l="Office"
              v={form.officeId}
              set={(v) => setForm({ ...form, officeId: v, divisionId: "", sectionId: "" })}
              rows={offices.map((x) => [String(x.id), x.name])}
            />
            <Sel
              l="Division"
              v={form.divisionId}
              set={(v) => setForm({ ...form, divisionId: v, sectionId: "" })}
              rows={divisions.map((x) => [String(x.id), x.name])}
            />
            <Sel
              l="Section"
              v={form.sectionId}
              set={(v) => setForm({ ...form, sectionId: v })}
              rows={sections.map((x) => [String(x.id), x.name])}
            />
            <Sel
              l="Plantilla classification"
              v={form.plantillaTypeId}
              set={(v) => setForm({ ...form, plantillaTypeId: v })}
              rows={active("plantilla-types").map((x) => [String(x.id), x.name])}
            />
            <Sel
              l="Budget / fund code"
              v={form.budgetCodeId}
              set={(v) => setForm({ ...form, budgetCodeId: v })}
              rows={active("budget-codes").map((x) => [String(x.id), x.name])}
            />
            <Sel
              l="Status"
              v={form.itemStatus}
              set={(v) => setForm({ ...form, itemStatus: v })}
              rows={[
                ["Active", "Active"],
                ["Inactive", "Inactive"],
                ["Abolished", "Abolished"],
              ]}
            />
            <F l="Effective from">
              <Input
                type="date"
                value={form.effectiveFrom}
                onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
              />
            </F>
            <F l="Effective to">
              <Input
                type="date"
                value={form.effectiveTo}
                onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })}
              />
            </F>
            <F l="Notes">
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </F>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(undefined)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={save}>
              Save item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!historyItem} onOpenChange={(o) => !o && setHistoryItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movement history - {historyItem?.itemNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {history.map((h) => (
              <div className="rounded border p-3" key={h.id}>
                <div className="font-medium">{h.action}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(h.createdAt).toLocaleString()} - {h.changedBy || "System"}
                </div>
              </div>
            ))}
            {!history.length && <p className="text-sm text-muted-foreground">No history yet.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
function F({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{l}</Label>
      {children}
    </div>
  );
}
function Sel({
  l,
  v,
  set,
  rows,
}: {
  l: string;
  v: string;
  set: (v: string) => void;
  rows: string[][];
}) {
  return (
    <F l={l}>
      <select className={fieldClass} value={v} onChange={(e) => set(e.target.value)}>
        <option value="">Not specified</option>
        {rows.map(([id, n]) => (
          <option key={id} value={id}>
            {n}
          </option>
        ))}
      </select>
    </F>
  );
}
