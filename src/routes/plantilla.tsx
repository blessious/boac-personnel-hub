import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  BriefcaseBusiness,
  ChevronRight,
  History,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
      <div className="grid grid-cols-6 gap-2 md:gap-3 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1">
          <StatCard
            title="Authorized"
            value={summary.authorized || 0}
            subtext="Total positions"
            subtextColor="text-muted-foreground"
            icon={<BriefcaseBusiness className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-50 dark:bg-blue-500/15"
            chartColor="stroke-blue-500"
            trend="up"
          />
        </div>
        <div className="col-span-2 lg:col-span-1">
          <StatCard
            title="Active"
            value={summary.active || 0}
            subtext="Currently active"
            subtextColor="text-muted-foreground"
            icon={<Activity className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-50 dark:bg-emerald-500/15"
            chartColor="stroke-emerald-500"
            trend="up"
          />
        </div>
        <div className="col-span-2 lg:col-span-1">
          <StatCard
            title="Inactive"
            value={summary.inactive || 0}
            subtext="Inactive positions"
            subtextColor="text-muted-foreground"
            icon={<Archive className="h-5 w-5 text-amber-600" />}
            iconBg="bg-amber-50 dark:bg-amber-500/15"
            chartColor="stroke-amber-500"
            trend="down"
          />
        </div>
        <div className="col-span-3 lg:col-span-1">
          <StatCard
            title="Occupied"
            value={summary.occupied || 0}
            subtext="Filled positions"
            subtextColor="text-muted-foreground"
            icon={<UserCheck className="h-5 w-5 text-purple-600" />}
            iconBg="bg-purple-50 dark:bg-purple-500/15"
            chartColor="stroke-purple-500"
            trend="up"
          />
        </div>
        <div className="col-span-3 lg:col-span-1">
          <StatCard
            title="Vacant"
            value={summary.vacant || 0}
            subtext="Available for hire"
            subtextColor="text-muted-foreground"
            icon={<UserPlus className="h-5 w-5 text-fuchsia-600" />}
            iconBg="bg-fuchsia-50 dark:bg-fuchsia-500/15"
            chartColor="stroke-fuchsia-500"
            trend="down"
          />
        </div>
      </div>
      <div className="mt-5 grid gap-2 md:flex md:flex-wrap">
        <div className="relative min-w-0 flex-1 md:min-w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search item, position, or employee"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className={fieldClass + " md:max-w-40"}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Abolished</option>
        </select>
        <select
          className={fieldClass + " md:max-w-40"}
          value={occupancy}
          onChange={(e) => setOccupancy(e.target.value)}
        >
          <option value="all">All occupancy</option>
          <option value="occupied">Occupied</option>
          <option value="vacant">Vacant</option>
        </select>
        {canManage && (
          <Button onClick={() => openEdit()} className="bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            New item
          </Button>
        )}
      </div>
      <div className="mobile-record-list mt-4 md:hidden">
        {items.map((i) => (
          <article className="rounded-xl border border-border bg-white p-3 shadow-sm" key={i.id}>
            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_4.75rem_1.25rem] items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-foreground">{i.itemNumber}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {i.positionTitle}
                  {i.salaryGrade
                    ? ` - SG ${i.salaryGrade.grade}, Step ${i.salaryGrade.step}`
                    : " - No salary grade"}
                </div>
                <div className="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground">
                  {[i.sectorName, i.officeName, i.divisionName, i.sectionName]
                    .filter(Boolean)
                    .join(" / ") || "-"}
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full border px-2 py-1 text-center text-xs font-semibold",
                  i.itemStatus === "Active"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700",
                )}
              >
                {i.itemStatus}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border/70 pt-3">
              <div className="border-l border-border/70 pl-3">
                <span className="text-xs text-muted-foreground">Classification / Fund</span>
                <span className="block truncate text-sm font-semibold text-foreground">
                  {i.plantillaTypeName || "-"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {i.budgetCodeName || "No fund code"}
                </span>
              </div>
              <div className="border-l border-border/70 pl-3">
                <span className="text-xs text-muted-foreground">Occupancy</span>
                <span
                  className={cn(
                    "block truncate text-sm font-semibold",
                    i.occupant ? "text-foreground" : "text-amber-700",
                  )}
                >
                  {i.occupant ? i.occupant.employeeName : "Vacant"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {i.occupant?.employeeNo || "-"}
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

function StatCard({
  title,
  value,
  subtext,
  subtextColor,
  subtextDot,
  icon,
  iconBg,
  chartColor,
  trend,
}: {
  title: string;
  value: string | number;
  subtext: string;
  subtextColor?: string;
  subtextDot?: string;
  icon: React.ReactNode;
  iconBg: string;
  chartColor: string;
  trend: "up" | "down";
}) {
  return (
    <div className="relative min-h-[7.25rem] overflow-hidden rounded-xl border border-border bg-card p-2.5 text-card-foreground shadow-sm md:min-h-0 md:p-4">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground/80">{title}</p>
          <h2 className="mt-1 text-xl font-bold text-foreground md:text-2xl">{value}</h2>
        </div>
        <div className={cn("rounded-lg p-1.5 md:p-2", iconBg)}>{icon}</div>
      </div>
      <div className="relative z-10 mt-2 flex items-center text-[10px]">
        {subtextDot && <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", subtextDot)} />}
        <span className={subtextColor}>{subtext}</span>
      </div>
      <div className="absolute bottom-2 right-2 z-0 h-7 w-16 opacity-50 md:h-8 md:w-24">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-full w-full">
          {trend === "up" ? (
            <path
              d="M0,25 C20,20 40,30 60,10 C80,-5 100,5 100,5"
              fill="none"
              className={chartColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M0,5 C20,5 40,-5 60,15 C80,30 100,20 100,20"
              fill="none"
              className={chartColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
