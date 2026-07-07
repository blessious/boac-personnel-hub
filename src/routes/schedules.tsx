import { createFileRoute } from "@tanstack/react-router";
import type { Dispatch, SetStateAction } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
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
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { formatLocalDate } from "@/components/ui/date-range-utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { canReadHrRecords, canWriteHrRecords, useAuth } from "@/lib/auth";
import {
  deleteScheduleOverride,
  listSchedules,
  updateDefaultSchedules,
  updateScheduleOverrides,
  type ScheduleEmployee,
  type ScheduleOverride,
  type ShiftTemplate,
} from "@/lib/schedules-api";
import { cn, formatDisplayDate } from "@/lib/utils";

export const Route = createFileRoute("/schedules")({
  component: SchedulesPage,
});

const today = new Date();
const DEFAULT_SCHEDULE_DATE = formatLocalDate(today);
type ScheduleForm = {
  target: "default" | "override";
  shiftCode: string;
  startDate: string;
  endDate: string;
  skipWeekends: boolean;
  amIn: string;
  amOut: string;
  pmIn: string;
  pmOut: string;
};

const EMPTY_FORM: ScheduleForm = {
  target: "override",
  shiftCode: "regular_8_5",
  startDate: DEFAULT_SCHEDULE_DATE,
  endDate: DEFAULT_SCHEDULE_DATE,
  skipWeekends: true,
  amIn: "08:00",
  amOut: "12:00",
  pmIn: "13:00",
  pmOut: "17:00",
};

function SchedulesPage() {
  const { user } = useAuth();
  const canRead = canReadHrRecords(user?.role);
  const canManage = canWriteHrRecords(user?.role);
  const [employees, setEmployees] = useState<ScheduleEmployee[]>([]);
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("all");
  const [scheduleDate, setScheduleDate] = useState(DEFAULT_SCHEDULE_DATE);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [overrideToDelete, setOverrideToDelete] = useState<ScheduleOverride | null>(null);
  const [activeEmployee, setActiveEmployee] = useState<ScheduleEmployee | null>(null);
  const [individualForm, setIndividualForm] = useState<ScheduleForm>(EMPTY_FORM);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);

  const selectedEmployees = useMemo(
    () => employees.filter((employee) => selectedIds.includes(employee.employeeId)),
    [employees, selectedIds],
  );

  const selectedAllVisible =
    employees.length > 0 &&
    employees.every((employee) => selectedIds.includes(employee.employeeId));

  const activeEmployeeOverrides = useMemo(
    () =>
      activeEmployee
        ? overrides.filter((override) => override.employeeId === activeEmployee.employeeId)
        : [],
    [activeEmployee, overrides],
  );
  const activeEmployeeSchedule = activeEmployeeOverrides[0];
  const overridesByEmployee = useMemo(
    () => new Map(overrides.map((override) => [override.employeeId, override])),
    [overrides],
  );

  const toggleEmployeeSelection = (employeeId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? current.includes(employeeId)
          ? current
          : [...current, employeeId]
        : current.filter((id) => id !== employeeId),
    );
  };

  const load = useCallback(() => {
    if (!canRead) {
      setLoading(false);
      return Promise.resolve();
    }
    setLoading(true);
    return listSchedules({
      q,
      department,
      from: scheduleDate,
      to: scheduleDate,
      page,
      pageSize,
    })
      .then((result) => {
        setEmployees(result.employees);
        setOverrides(result.overrides);
        setDepartments(result.departments);
        setShiftTemplates(result.shiftTemplates);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
        setSelectedIds((current) =>
          current.filter((id) => result.employees.some((employee) => employee.employeeId === id)),
        );
      })
      .catch((error) => toast.error(error.message || "Unable to load schedules"))
      .finally(() => setLoading(false));
  }, [canRead, department, page, pageSize, q, scheduleDate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q, department, scheduleDate]);

  const applyShiftTemplate = (code: string) => {
    if (code === "manual") {
      setForm((current) => ({ ...current, shiftCode: "manual" }));
      return;
    }
    const template = shiftTemplates.find((item) => item.code === code);
    if (!template) return;
    setForm((current) => ({
      ...current,
      shiftCode: code,
      ...scheduleTimesFromTemplate(template),
    }));
  };

  const applyIndividualShiftTemplate = (code: string) => {
    if (code === "manual") {
      setIndividualForm((current) => ({ ...current, shiftCode: "manual" }));
      return;
    }
    const template = shiftTemplates.find((item) => item.code === code);
    if (!template) return;
    setIndividualForm((current) => ({
      ...current,
      shiftCode: code,
      ...scheduleTimesFromTemplate(template),
    }));
  };

  const openEmployeeSchedule = (employee: ScheduleEmployee) => {
    setActiveEmployee(employee);
    setIndividualForm({
      ...EMPTY_FORM,
      target: "default",
      shiftCode: "manual",
      startDate: scheduleDate,
      endDate: scheduleDate,
      amIn: employee.scheduleAmIn,
      amOut: employee.scheduleAmOut,
      pmIn: employee.schedulePmIn,
      pmOut: employee.schedulePmOut,
    });
  };

  const loadOverrideIntoIndividualForm = (override: ScheduleOverride) => {
    setIndividualForm({
      target: "override",
      shiftCode: override.shiftCode || "manual",
      startDate: override.workDate,
      endDate: override.workDate,
      skipWeekends: false,
      amIn: override.amIn,
      amOut: override.amOut,
      pmIn: override.pmIn,
      pmOut: override.pmOut,
    });
  };

  const saveSchedule = async () => {
    if (!selectedIds.length) {
      toast.error("Select at least one employee");
      return;
    }
    if (!form.amIn || !form.amOut || !form.pmIn || !form.pmOut) {
      toast.error("Complete all schedule times");
      return;
    }
    if (form.target === "override" && (!form.startDate || !form.endDate)) {
      toast.error("Select the override date range");
      return;
    }
    if (form.target === "override" && form.startDate > form.endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setSaving(true);
    const payload = {
      employeeIds: selectedIds,
      shiftTemplateCode: form.shiftCode === "manual" ? undefined : form.shiftCode,
      schedule: {
        amIn: form.amIn,
        amOut: form.amOut,
        pmIn: form.pmIn,
        pmOut: form.pmOut,
      },
    };

    try {
      if (form.target === "default") {
        await updateDefaultSchedules(payload);
        toast.success("Default schedule updated");
      } else {
        await updateScheduleOverrides({
          ...payload,
          startDate: form.startDate,
          endDate: form.endDate,
          skipWeekends: form.skipWeekends,
        });
        toast.success("Schedule override saved");
      }
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save schedule");
    } finally {
      setSaving(false);
    }
  };

  const saveIndividualSchedule = async () => {
    if (!activeEmployee) return;
    if (
      !individualForm.amIn ||
      !individualForm.amOut ||
      !individualForm.pmIn ||
      !individualForm.pmOut
    ) {
      toast.error("Complete all schedule times");
      return;
    }
    if (
      individualForm.target === "override" &&
      (!individualForm.startDate || !individualForm.endDate)
    ) {
      toast.error("Select the override date range");
      return;
    }
    if (individualForm.target === "override" && individualForm.startDate > individualForm.endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setSaving(true);
    const payload = {
      employeeIds: [activeEmployee.employeeId],
      shiftTemplateCode:
        individualForm.shiftCode === "manual" ? undefined : individualForm.shiftCode,
      schedule: {
        amIn: individualForm.amIn,
        amOut: individualForm.amOut,
        pmIn: individualForm.pmIn,
        pmOut: individualForm.pmOut,
      },
    };

    try {
      if (individualForm.target === "default") {
        await updateDefaultSchedules(payload);
        toast.success("Employee default schedule updated");
      } else {
        await updateScheduleOverrides({
          ...payload,
          startDate: individualForm.startDate,
          endDate: individualForm.endDate,
          skipWeekends: individualForm.skipWeekends,
        });
        toast.success("Employee schedule override saved");
      }
      await load();
      setActiveEmployee((current) =>
        current
          ? {
              ...current,
              scheduleAmIn:
                individualForm.target === "default" ? individualForm.amIn : current.scheduleAmIn,
              scheduleAmOut:
                individualForm.target === "default" ? individualForm.amOut : current.scheduleAmOut,
              schedulePmIn:
                individualForm.target === "default" ? individualForm.pmIn : current.schedulePmIn,
              schedulePmOut:
                individualForm.target === "default" ? individualForm.pmOut : current.schedulePmOut,
            }
          : current,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save schedule");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteOverride = async () => {
    if (!overrideToDelete) return;
    setSaving(true);
    try {
      await deleteScheduleOverride(overrideToDelete.employeeId, overrideToDelete.workDate);
      toast.success("Schedule override removed");
      setOverrideToDelete(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove override");
    } finally {
      setSaving(false);
    }
  };

  if (!canRead) {
    return (
      <AppShell title="Schedule Management" subtitle="Employee work schedules and date overrides">
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          You do not have access to schedule management.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Schedule Management"
      subtitle="Maintain employee default schedules and date-specific duty overrides"
    >
      <div className="space-y-5">
        <section className="rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-3 md:grid-cols-[minmax(220px,1fr)_220px_170px]">
              <div className="space-y-1.5">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    placeholder="Employee, office, or position"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {departments.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field
                label="Schedule Date"
                type="date"
                value={scheduleDate}
                onChange={setScheduleDate}
              />
            </div>
            <Button
              variant="outline"
              onClick={load}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            The employee list shows the effective schedule for this date. If there is no dated
            override, the employee default schedule is used.
          </p>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_390px]">
          <section className="rounded-lg border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div>
                <div className="flex items-center gap-2 font-semibold">
                  <Users className="h-4 w-4 text-blue-600" />
                  Employees
                </div>
                <p className="text-sm text-muted-foreground">
                  {total} record(s), {selectedIds.length} selected
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!employees.length}
                onClick={() =>
                  setSelectedIds(
                    selectedAllVisible ? [] : employees.map((employee) => employee.employeeId),
                  )
                }
              >
                {selectedAllVisible ? "Clear visible" : "Select visible"}
              </Button>
            </div>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Employee</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead className="hidden lg:table-cell">Office</TableHead>
                    <TableHead className="w-28 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                        Loading schedules...
                      </TableCell>
                    </TableRow>
                  ) : employees.length ? (
                    employees.map((employee) => {
                      const selected = selectedIds.includes(employee.employeeId);
                      const override = overridesByEmployee.get(employee.employeeId);
                      return (
                        <TableRow key={employee.employeeId} data-state={selected ? "selected" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={selected}
                              onCheckedChange={(checked) =>
                                toggleEmployeeSelection(employee.employeeId, checked === true)
                              }
                              aria-label={`Select ${employee.employeeName}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{employee.employeeName}</div>
                          </TableCell>
                          <TableCell>
                            <ScheduleTimeText
                              amIn={override?.amIn || employee.scheduleAmIn}
                              amOut={override?.amOut || employee.scheduleAmOut}
                              pmIn={override?.pmIn || employee.schedulePmIn}
                              pmOut={override?.pmOut || employee.schedulePmOut}
                              source={override ? "Override" : "Default"}
                            />
                          </TableCell>
                          <TableCell className="hidden max-w-[260px] truncate text-muted-foreground lg:table-cell">
                            {employee.department || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEmployeeSchedule(employee)}
                            >
                              <Eye className="mr-1.5 h-4 w-4" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        No employees match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {loading ? (
                <MobileState icon="loading" message="Loading schedules..." />
              ) : employees.length ? (
                employees.map((employee) => {
                  const selected = selectedIds.includes(employee.employeeId);
                  const override = overridesByEmployee.get(employee.employeeId);
                  return (
                    <EmployeeScheduleCard
                      key={employee.employeeId}
                      employee={employee}
                      override={override}
                      selected={selected}
                      onSelect={(checked) => toggleEmployeeSelection(employee.employeeId, checked)}
                      onOpen={() => openEmployeeSchedule(employee)}
                    />
                  );
                })
              ) : (
                <MobileState message="No employees match the current filters." />
              )}
            </div>
            <TablePagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              itemLabel="employees"
              onPageChange={setPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
              disabled={loading}
              maxPageSize={100}
            />
          </section>

          <aside className="space-y-5">
            <section className="rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4 xl:sticky xl:top-4">
              <div className="flex items-center gap-2 font-semibold">
                <CalendarDays className="h-4 w-4 text-blue-600" />
                Apply Schedule
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedEmployees.length
                  ? `${selectedEmployees.length} employee(s) selected`
                  : "Select employees from the table first."}
              </p>
              <div className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label>Update Type</Label>
                  <Select
                    value={form.target}
                    onValueChange={(value: "default" | "override") =>
                      setForm((current) => ({ ...current, target: value }))
                    }
                    disabled={!canManage}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="override">Date override</SelectItem>
                      <SelectItem value="default">Employee default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.target === "override" && (
                  <div className="grid gap-3">
                    <div className="space-y-1.5">
                      <Label>Date Range</Label>
                      <DateRangePicker
                        from={form.startDate}
                        to={form.endDate}
                        disabled={!canManage}
                        onApply={(startDate, endDate) =>
                          setForm((current) => ({ ...current, startDate, endDate }))
                        }
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={form.skipWeekends}
                        disabled={!canManage}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            skipWeekends: event.target.checked,
                          }))
                        }
                      />
                      Skip Saturdays and Sundays
                    </label>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Shift</Label>
                  <Select
                    value={form.shiftCode}
                    onValueChange={applyShiftTemplate}
                    disabled={!canManage}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {shiftTemplates.map((template) => (
                        <SelectItem key={template.code} value={template.code}>
                          {template.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="manual">Manual schedule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="AM In"
                    type="time"
                    value={form.amIn}
                    disabled={!canManage}
                    onChange={(amIn) => setManualTime(setForm, { amIn })}
                  />
                  <Field
                    label="AM Out"
                    type="time"
                    value={form.amOut}
                    disabled={!canManage}
                    onChange={(amOut) => setManualTime(setForm, { amOut })}
                  />
                  <Field
                    label="PM In"
                    type="time"
                    value={form.pmIn}
                    disabled={!canManage}
                    onChange={(pmIn) => setManualTime(setForm, { pmIn })}
                  />
                  <Field
                    label="PM Out"
                    type="time"
                    value={form.pmOut}
                    disabled={!canManage}
                    onChange={(pmOut) => setManualTime(setForm, { pmOut })}
                  />
                </div>
                <Button
                  className="h-10 w-full bg-blue-600 text-white hover:bg-blue-700"
                  disabled={!canManage || saving || !selectedIds.length}
                  onClick={saveSchedule}
                >
                  {saving ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  )}
                  Save Schedule
                </Button>
              </div>
            </section>
          </aside>
        </div>

        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border p-3 sm:p-4">
            <div className="font-semibold">Date Overrides</div>
            <p className="text-sm text-muted-foreground">
              Overrides shown for the selected employee page on {formatDisplayDate(scheduleDate)}.
            </p>
          </div>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="hidden md:table-cell">Shift</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {overrides.length ? (
                  overrides.map((override) => (
                    <TableRow key={override.id}>
                      <TableCell className="font-medium">
                        {formatDisplayDate(override.workDate)}
                      </TableCell>
                      <TableCell>
                        <div>{override.employeeName}</div>
                        <div className="text-xs text-muted-foreground">{override.department}</div>
                      </TableCell>
                      <TableCell>
                        <ScheduleTimeText
                          amIn={override.amIn}
                          amOut={override.amOut}
                          pmIn={override.pmIn}
                          pmOut={override.pmOut}
                        />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {override.shiftName || "Manual"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!canManage}
                          onClick={() => setOverrideToDelete(override)}
                          title="Remove override"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No date overrides found for this range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 p-3 md:hidden">
            {overrides.length ? (
              overrides.map((override) => (
                <OverrideScheduleCard
                  key={override.id}
                  override={override}
                  canManage={canManage}
                  onDelete={() => setOverrideToDelete(override)}
                />
              ))
            ) : (
              <MobileState message="No date overrides found for this range." />
            )}
          </div>
        </section>
      </div>

      <Dialog
        open={Boolean(activeEmployee)}
        onOpenChange={(open) => !open && setActiveEmployee(null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto p-4 sm:max-w-4xl sm:p-6">
          <DialogHeader>
            <DialogTitle>Employee Schedule</DialogTitle>
          </DialogHeader>
          {activeEmployee && (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto] sm:p-4">
                <div>
                  <div className="text-lg font-semibold">{activeEmployee.employeeName}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {activeEmployee.department || "No department"}
                  </div>
                </div>
                <div className="rounded-md bg-muted px-3 py-2 text-sm">
                  <div className="font-medium">Current schedule</div>
                  <ScheduleTimeText
                    amIn={activeEmployeeSchedule?.amIn || activeEmployee.scheduleAmIn}
                    amOut={activeEmployeeSchedule?.amOut || activeEmployee.scheduleAmOut}
                    pmIn={activeEmployeeSchedule?.pmIn || activeEmployee.schedulePmIn}
                    pmOut={activeEmployeeSchedule?.pmOut || activeEmployee.schedulePmOut}
                    source={activeEmployeeSchedule ? "Override" : "Default"}
                  />
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                <section className="rounded-lg border border-border">
                  <div className="border-b border-border p-3">
                    <div className="font-semibold">Overrides for Selected Date</div>
                    <p className="text-sm text-muted-foreground">
                      {formatDisplayDate(scheduleDate)}
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Schedule</TableHead>
                          <TableHead className="hidden md:table-cell">Shift</TableHead>
                          <TableHead className="w-24 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeEmployeeOverrides.length ? (
                          activeEmployeeOverrides.map((override) => (
                            <TableRow key={override.id}>
                              <TableCell className="font-medium">
                                {formatDisplayDate(override.workDate)}
                              </TableCell>
                              <TableCell>
                                <ScheduleTimeText
                                  amIn={override.amIn}
                                  amOut={override.amOut}
                                  pmIn={override.pmIn}
                                  pmOut={override.pmOut}
                                />
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {override.shiftName || "Manual"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={!canManage}
                                    onClick={() => loadOverrideIntoIndividualForm(override)}
                                    title="Edit override"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={!canManage}
                                    onClick={() => setOverrideToDelete(override)}
                                    title="Remove override"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="py-8 text-center text-muted-foreground"
                            >
                              No overrides for this employee in the selected range.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="grid gap-3 p-3 md:hidden">
                    {activeEmployeeOverrides.length ? (
                      activeEmployeeOverrides.map((override) => (
                        <OverrideScheduleCard
                          key={override.id}
                          override={override}
                          canManage={canManage}
                          onEdit={() => loadOverrideIntoIndividualForm(override)}
                          onDelete={() => setOverrideToDelete(override)}
                        />
                      ))
                    ) : (
                      <MobileState message="No overrides for this employee in the selected range." />
                    )}
                  </div>
                </section>

                <section className="rounded-lg border border-border p-4">
                  <div className="font-semibold">Edit This Employee</div>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label>Update Type</Label>
                      <Select
                        value={individualForm.target}
                        onValueChange={(value: "default" | "override") =>
                          setIndividualForm((current) => ({ ...current, target: value }))
                        }
                        disabled={!canManage}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Employee default</SelectItem>
                          <SelectItem value="override">Date override</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {individualForm.target === "override" && (
                      <div className="grid gap-3">
                        <div className="space-y-1.5">
                          <Label>Date Range</Label>
                          <DateRangePicker
                            from={individualForm.startDate}
                            to={individualForm.endDate}
                            disabled={!canManage}
                            onApply={(startDate, endDate) =>
                              setIndividualForm((current) => ({
                                ...current,
                                startDate,
                                endDate,
                              }))
                            }
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={individualForm.skipWeekends}
                            disabled={!canManage}
                            onChange={(event) =>
                              setIndividualForm((current) => ({
                                ...current,
                                skipWeekends: event.target.checked,
                              }))
                            }
                          />
                          Skip Saturdays and Sundays
                        </label>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label>Shift</Label>
                      <Select
                        value={individualForm.shiftCode}
                        onValueChange={applyIndividualShiftTemplate}
                        disabled={!canManage}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {shiftTemplates.map((template) => (
                            <SelectItem key={template.code} value={template.code}>
                              {template.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="manual">Manual schedule</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="AM In"
                        type="time"
                        value={individualForm.amIn}
                        disabled={!canManage}
                        onChange={(amIn) => setManualTime(setIndividualForm, { amIn })}
                      />
                      <Field
                        label="AM Out"
                        type="time"
                        value={individualForm.amOut}
                        disabled={!canManage}
                        onChange={(amOut) => setManualTime(setIndividualForm, { amOut })}
                      />
                      <Field
                        label="PM In"
                        type="time"
                        value={individualForm.pmIn}
                        disabled={!canManage}
                        onChange={(pmIn) => setManualTime(setIndividualForm, { pmIn })}
                      />
                      <Field
                        label="PM Out"
                        type="time"
                        value={individualForm.pmOut}
                        disabled={!canManage}
                        onChange={(pmOut) => setManualTime(setIndividualForm, { pmOut })}
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setActiveEmployee(null)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
              disabled={!canManage || saving || !activeEmployee}
              onClick={saveIndividualSchedule}
            >
              {saving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
              )}
              Save Employee Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(overrideToDelete)}
        onOpenChange={(open) => !open && setOverrideToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Schedule Override?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the dated override for {overrideToDelete?.employeeName} on{" "}
              {overrideToDelete ? formatDisplayDate(overrideToDelete.workDate) : ""}. The employee
              default schedule will be used for that date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteOverride}
              disabled={saving}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Remove Override
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function Field({
  label,
  type,
  value,
  disabled,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function EmployeeScheduleCard({
  employee,
  override,
  selected,
  onSelect,
  onOpen,
}: {
  employee: ScheduleEmployee;
  override?: ScheduleOverride;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onOpen: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-3 shadow-sm transition-colors",
        selected ? "border-blue-300 bg-blue-50/60" : "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelect(checked === true)}
          className="mt-1"
          aria-label={`Select ${employee.employeeName}`}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{employee.employeeName}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {employee.department || "No department"}
          </div>
        </div>
        <Badge variant={override ? "default" : "secondary"} className="shrink-0">
          {override ? "Override" : "Default"}
        </Badge>
      </div>

      <div className="mt-3 rounded-md bg-muted/60 p-3">
        <ScheduleTimeText
          amIn={override?.amIn || employee.scheduleAmIn}
          amOut={override?.amOut || employee.scheduleAmOut}
          pmIn={override?.pmIn || employee.schedulePmIn}
          pmOut={override?.pmOut || employee.schedulePmOut}
        />
      </div>

      <Button variant="outline" className="mt-3 h-10 w-full" onClick={onOpen}>
        <Eye className="mr-1.5 h-4 w-4" />
        View Schedule
      </Button>
    </div>
  );
}

function OverrideScheduleCard({
  override,
  canManage,
  onEdit,
  onDelete,
}: {
  override: ScheduleOverride;
  canManage: boolean;
  onEdit?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium">{formatDisplayDate(override.workDate)}</div>
          <div className="mt-0.5 truncate text-sm text-muted-foreground">
            {override.employeeName}
          </div>
          {override.department && (
            <div className="truncate text-xs text-muted-foreground">{override.department}</div>
          )}
        </div>
        <Badge variant="outline" className="shrink-0">
          {override.shiftName || "Manual"}
        </Badge>
      </div>

      <div className="mt-3 rounded-md bg-muted/60 p-3">
        <ScheduleTimeText
          amIn={override.amIn}
          amOut={override.amOut}
          pmIn={override.pmIn}
          pmOut={override.pmOut}
        />
      </div>

      <div className={cn("mt-3 grid gap-2", onEdit ? "grid-cols-2" : "grid-cols-1")}>
        {onEdit && (
          <Button variant="outline" className="h-10" disabled={!canManage} onClick={onEdit}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
        )}
        <Button
          variant="outline"
          className="h-10 text-red-600 hover:text-red-700"
          disabled={!canManage}
          onClick={onDelete}
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          Remove
        </Button>
      </div>
    </div>
  );
}

function MobileState({ message, icon }: { message: string; icon?: "loading" }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {icon === "loading" && <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />}
      {message}
    </div>
  );
}

function ScheduleTimeText({
  amIn,
  amOut,
  pmIn,
  pmOut,
  source,
}: {
  amIn: string;
  amOut: string;
  pmIn: string;
  pmOut: string;
  source?: string;
}) {
  return (
    <div className="space-y-1 text-sm leading-5">
      {source && (
        <div className="inline-flex rounded border border-border bg-muted px-1.5 py-0.5 text-[0.68rem] font-medium uppercase tracking-normal text-muted-foreground">
          {source}
        </div>
      )}
      <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-2">
        <span className="text-xs font-medium text-muted-foreground">AM</span>
        <span className="font-medium text-foreground">
          {formatTime(amIn)} - {formatTime(amOut)}
        </span>
      </div>
      <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-2">
        <span className="text-xs font-medium text-muted-foreground">PM</span>
        <span className="font-medium text-foreground">
          {formatTime(pmIn)} - {formatTime(pmOut)}
        </span>
      </div>
    </div>
  );
}

function formatTime(value: string) {
  if (!value) return "-";
  const [hourText, minute = "00"] = value.split(":");
  const hour = Number(hourText);
  if (!Number.isFinite(hour)) return value;
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute} ${period}`;
}

function scheduleTimesFromTemplate(template: ShiftTemplate) {
  if (template.breakStart && template.breakEnd) {
    return {
      amIn: template.startTime,
      amOut: template.breakStart,
      pmIn: template.breakEnd,
      pmOut: template.endTime,
    };
  }
  if (template.shiftType === "night") {
    return {
      amIn: template.startTime,
      amOut: "23:59",
      pmIn: "00:00",
      pmOut: template.endTime,
    };
  }
  const midpoint = midpointTime(template.startTime, template.endTime);
  return {
    amIn: template.startTime,
    amOut: midpoint,
    pmIn: midpoint,
    pmOut: template.endTime,
  };
}

function midpointTime(startTime: string, endTime: string) {
  const start = minutesFromTime(startTime);
  let end = minutesFromTime(endTime);
  if (start === null || end === null) return startTime || endTime || "12:00";
  if (end <= start) end += 24 * 60;
  const value = Math.round((start + end) / 2) % (24 * 60);
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function minutesFromTime(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function setManualTime(
  setForm: Dispatch<SetStateAction<ScheduleForm>>,
  updates: Partial<ScheduleForm>,
) {
  setForm((current) => ({ ...current, shiftCode: "manual", ...updates }));
}
