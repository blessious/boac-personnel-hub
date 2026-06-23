import { useEffect, useMemo, useState } from "react";
import { Building2, FileText, Filter, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { generateMassDtrPdf, openGeneratedFile, type DtrNoter } from "@/lib/attendance-api";
import { listEmployees, type EmployeeRecord } from "@/lib/employees-api";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const CUTS = [
  { value: "full", label: "Full Month" },
  { value: "first", label: "1st Half" },
  { value: "last", label: "2nd Half" },
] as const;

type EmployeeType = "all" | "regular" | "jobOrder";
type Cut = "full" | "first" | "last";

type MassDtrPrintModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: EmployeeRecord[];
  noters: DtrNoter[];
  defaultOffice?: string;
};

export function MassDtrPrintModal({
  open,
  onOpenChange,
  employees,
  noters,
  defaultOffice = "",
}: MassDtrPrintModalProps) {
  const currentDate = new Date();
  const [modalEmployees, setModalEmployees] = useState<EmployeeRecord[]>(employees);
  const offices = useMemo(
    () =>
      Array.from(new Set(modalEmployees.map((employee) => employee.department).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }),
      ),
    [modalEmployees],
  );

  const [office, setOffice] = useState(defaultOffice);
  const [employeeType, setEmployeeType] = useState<EmployeeType>("all");
  const [noterSignatory, setNoterSignatory] = useState("");
  const [noterPosition, setNoterPosition] = useState("");
  const [firstMonth, setFirstMonth] = useState(currentDate.getMonth() + 1);
  const [firstYear, setFirstYear] = useState(currentDate.getFullYear());
  const [firstCut, setFirstCut] = useState<Cut>("full");
  const [useSecondPeriod, setUseSecondPeriod] = useState(true);
  const [secondMonth, setSecondMonth] = useState(currentDate.getMonth() + 1);
  const [secondYear, setSecondYear] = useState(currentDate.getFullYear());
  const [secondCut, setSecondCut] = useState<Cut>("full");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setModalEmployees(employees);
  }, [employees]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const loadAllEmployees = async () => {
      try {
        const pageSize = 100;
        const firstPage = await listEmployees({ page: 1, pageSize, empStatus: "Active" });
        const pages = Math.ceil(firstPage.total / pageSize);
        const rest = await Promise.all(
          Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
            listEmployees({ page: index + 2, pageSize, empStatus: "Active" }),
          ),
        );
        if (!cancelled) {
          setModalEmployees([firstPage, ...rest].flatMap((page) => page.employees));
        }
      } catch {
        if (!cancelled) setModalEmployees(employees);
      }
    };
    loadAllEmployees();
    return () => {
      cancelled = true;
    };
  }, [employees, open]);

  useEffect(() => {
    if (!open) return;
    const nextOffice = defaultOffice || offices[0] || "";
    setOffice((current) => current || nextOffice);
    const firstNoter = noters[0];
    if (firstNoter) {
      setNoterSignatory((current) => current || firstNoter.signatory);
      setNoterPosition((current) => current || firstNoter.position);
    }
  }, [defaultOffice, noters, offices, open]);

  const selectedEmployees = useMemo(
    () =>
      modalEmployees.filter((employee) => {
        if (employee.empStatus !== "Active") return false;
        if (employee.department !== office) return false;
        if (employeeType === "regular") return employee.regular;
        if (employeeType === "jobOrder") return !employee.regular;
        return true;
      }),
    [employeeType, modalEmployees, office],
  );

  const runMassPrint = async () => {
    if (!office) return toast.error("Select an office");
    if (!selectedEmployees.length) return toast.error("No employees found for the selected criteria");
    if (!noterSignatory || !noterPosition) return toast.error("Select a noter signatory and position");

    setBusy(true);
    try {
      const result = await generateMassDtrPdf({
        office,
        employeeType,
        noterSignatory,
        noterPosition,
        firstMonth,
        firstYear,
        firstCut,
        secondMonth: useSecondPeriod ? secondMonth : 0,
        secondYear: useSecondPeriod ? secondYear : 0,
        secondCut: useSecondPeriod ? secondCut : "full",
      });
      openGeneratedFile(result.previewUrl);
      toast.success(`PDF generated for ${result.employeeCount} employee(s)`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate mass DTR PDF");
    } finally {
      setBusy(false);
    }
  };

  const monthSelect = (value: number, onChange: (value: number) => void) => (
    <Select value={String(value)} onValueChange={(next) => onChange(Number(next))}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MONTHS.map((month, index) => (
          <SelectItem key={month} value={String(index + 1)}>
            {month}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const yearInput = (value: number, onChange: (value: number) => void) => (
    <Input
      type="number"
      value={value}
      min={1900}
      max={2999}
      onChange={(event) => onChange(Number(event.target.value) || currentDate.getFullYear())}
    />
  );

  const cutSelect = (value: Cut, onChange: (value: Cut) => void) => (
    <Select value={value} onValueChange={(next) => onChange(next as Cut)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CUTS.map((cut) => (
          <SelectItem key={cut.value} value={cut.value}>
            {cut.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Mass Print DTR
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Generate DTRs for multiple employees (PDF format)</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <section className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <Building2 className="h-4 w-4 text-blue-600" />
              Employee Selection
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Office *</Label>
                <Select value={office} onValueChange={setOffice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Office" />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Employee Type</Label>
                <Select value={employeeType} onValueChange={(next) => setEmployeeType(next as EmployeeType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    <SelectItem value="regular">Regular Only</SelectItem>
                    <SelectItem value="jobOrder">Job Order Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              <span>Employees to include:</span>
              <span className="rounded bg-blue-600 px-2 py-1 font-bold text-white">
                {selectedEmployees.length} employees
              </span>
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <Users className="h-4 w-4 text-emerald-600" />
              Noter Information
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Noter Signatory *</Label>
                <Select
                  value={noterSignatory}
                  onValueChange={(value) => {
                    const selected = noters.find((noter) => noter.signatory === value);
                    setNoterSignatory(value);
                    setNoterPosition(selected?.position || "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select noter" />
                  </SelectTrigger>
                  <SelectContent>
                    {noters.map((noter) => (
                      <SelectItem key={noter.id} value={noter.signatory}>
                        {noter.signatory} - {noter.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Noter Position *</Label>
                <Input value={noterPosition} onChange={(event) => setNoterPosition(event.target.value)} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <Filter className="h-4 w-4 text-violet-600" />
              Period Settings
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border p-3">
                <div className="mb-3 text-sm font-semibold">First Period</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label>Month</Label>
                    {monthSelect(firstMonth, setFirstMonth)}
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    {yearInput(firstYear, setFirstYear)}
                  </div>
                  <div className="space-y-2">
                    <Label>Cut-off</Label>
                    {cutSelect(firstCut, setFirstCut)}
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={useSecondPeriod}
                    onChange={(event) => setUseSecondPeriod(event.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  Include Second Period
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label>Month</Label>
                    {monthSelect(secondMonth, setSecondMonth)}
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    {yearInput(secondYear, setSecondYear)}
                  </div>
                  <div className="space-y-2">
                    <Label>Cut-off</Label>
                    {cutSelect(secondCut, setSecondCut)}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <DialogFooter className="border-t pt-4 sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Ready to generate PDF for {selectedEmployees.length} employees
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={runMassPrint} disabled={busy} className="bg-blue-600 text-white hover:bg-blue-700">
              <FileText className="mr-1.5 h-4 w-4" />
              {busy ? "Generating..." : "View PDF"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
