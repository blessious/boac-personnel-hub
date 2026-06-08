import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileText, Check, X, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ATTENDANCE_TODAY, LEAVE_REQUESTS, LEAVE_CREDITS, EMPLOYEES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/attendance")({
  component: AttendancePage,
});

const ATT_STATUS_COLOR: Record<string, string> = {
  Present: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Late: "bg-amber-100 text-amber-700 border-amber-200",
  Absent: "bg-rose-100 text-rose-700 border-rose-200",
  "Half-Day": "bg-blue-100 text-blue-700 border-blue-200",
};

const LEAVE_STATUS_COLOR: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Disapproved: "bg-rose-100 text-rose-700 border-rose-200",
};

function AttendancePage() {
  const [activeTab, setActiveTab] = useState<"attendance" | "leave">("attendance");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employee: "",
    leaveType: "",
    dateFrom: "",
    dateTo: "",
    reason: "",
  });

  const pendingRequests = LEAVE_REQUESTS.filter((r) => r.status === "Pending");
  const creditSummary = LEAVE_CREDITS.slice(0, 8).map((lc) => {
    const emp = EMPLOYEES.find((e) => e.id === lc.employeeId);
    return { ...lc, empName: emp ? `${emp.lastname}, ${emp.firstname}` : "—" };
  });

  return (
    <AppShell title="Attendance & Leave" subtitle="Manage daily time records and leave applications">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 w-fit mb-4">
        {(["attendance", "leave"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "attendance" ? "📋 Attendance" : "🗓️ Leave Management"}
          </button>
        ))}
      </div>

      {/* ─── ATTENDANCE SUB-TAB ─── */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          {/* Stat row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Present", value: ATTENDANCE_TODAY.filter(a => a.status === "Present").length, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
              { label: "Late", value: ATTENDANCE_TODAY.filter(a => a.status === "Late").length, color: "text-amber-600 bg-amber-50 border-amber-200" },
              { label: "Absent", value: ATTENDANCE_TODAY.filter(a => a.status === "Absent").length, color: "text-rose-600 bg-rose-50 border-rose-200" },
              { label: "Half-Day", value: ATTENDANCE_TODAY.filter(a => a.status === "Half-Day").length, color: "text-blue-600 bg-blue-50 border-blue-200" },
            ].map((s) => (
              <div key={s.label} className={cn("rounded-xl border p-4", s.color)}>
                <div className="text-2xl font-bold tabular-nums">{s.value}</div>
                <div className="text-xs font-semibold mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-border">
              <div>
                <h3 className="font-semibold text-foreground">Daily Time Records</h3>
                <p className="text-xs text-muted-foreground">June 8, 2026 — Today</p>
              </div>
              <div className="sm:ml-auto flex gap-2">
                <Input type="date" defaultValue="2026-06-08" className="h-9 w-auto text-sm" />
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Generating DTR…")}>
                  <FileText className="h-4 w-4" /> Generate DTR
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Exporting…")}>
                  <Download className="h-4 w-4" /> Export
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                    <th className="px-4 py-3 font-semibold">Employee</th>
                    <th className="px-4 py-3 font-semibold hidden md:table-cell">Department</th>
                    <th className="px-4 py-3 font-semibold">Time In</th>
                    <th className="px-4 py-3 font-semibold">Time Out</th>
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell">Total Hours</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ATTENDANCE_TODAY.map((a, i) => (
                    <tr key={a.employeeId} className={cn("border-b border-border/50 last:border-0", i % 2 === 1 && "bg-muted/10")}>
                      <td className="px-4 py-3 font-medium">{a.employeeName}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{a.department}</td>
                      <td className="px-4 py-3 font-mono text-sm">{a.timeIn || "—"}</td>
                      <td className="px-4 py-3 font-mono text-sm">{a.timeOut || "—"}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">{a.totalHours > 0 ? `${a.totalHours.toFixed(2)}h` : "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-[11px]", ATT_STATUS_COLOR[a.status])}>
                          {a.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── LEAVE MANAGEMENT SUB-TAB ─── */}
      {activeTab === "leave" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-foreground">Leave Management</h3>
              <p className="text-xs text-muted-foreground">{pendingRequests.length} pending request(s) awaiting approval</p>
            </div>
            <Button
              id="file-leave-btn"
              onClick={() => setShowLeaveModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              <Plus className="h-4 w-4" /> File a Leave
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            {/* Pending Requests — wider */}
            <div className="xl:col-span-3 rounded-2xl border border-border bg-card shadow-sm">
              <div className="p-4 border-b border-border">
                <h4 className="font-semibold text-foreground">Pending Leave Requests</h4>
                <p className="text-xs text-muted-foreground">Approval queue</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                      <th className="px-4 py-2.5 font-semibold">Name</th>
                      <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">Leave Type</th>
                      <th className="px-4 py-2.5 font-semibold hidden md:table-cell">Dates</th>
                      <th className="px-4 py-2.5 font-semibold">Days</th>
                      <th className="px-4 py-2.5 font-semibold">Status</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEAVE_REQUESTS.map((r, i) => (
                      <tr key={r.id} className={cn("border-b border-border/50 last:border-0", i % 2 === 1 && "bg-muted/10")}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{r.employeeName}</div>
                          <div className="text-xs text-muted-foreground">{r.department}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r.leaveType}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">{r.dateFrom} – {r.dateTo}</td>
                        <td className="px-4 py-3">{r.days}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[11px]", LEAVE_STATUS_COLOR[r.status])}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {r.status === "Pending" && (
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => toast.success(`Approved leave for ${r.employeeName}`)}
                                className="h-7 w-7 grid place-items-center rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                                title="Approve"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => toast.error(`Disapproved leave for ${r.employeeName}`)}
                                className="h-7 w-7 grid place-items-center rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                                title="Disapprove"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Leave Credit Summary */}
            <div className="xl:col-span-2 rounded-2xl border border-border bg-card shadow-sm">
              <div className="p-4 border-b border-border">
                <h4 className="font-semibold text-foreground">Leave Credit Summary</h4>
                <p className="text-xs text-muted-foreground">VL / SL balances</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                      <th className="px-4 py-2.5 font-semibold">Employee</th>
                      <th className="px-4 py-2.5 font-semibold text-center">VL</th>
                      <th className="px-4 py-2.5 font-semibold text-center">SL</th>
                      <th className="px-4 py-2.5 font-semibold text-center hidden sm:table-cell">FL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditSummary.map((lc, i) => (
                      <tr key={lc.employeeId} className={cn("border-b border-border/50 last:border-0", i % 2 === 1 && "bg-muted/10")}>
                        <td className="px-4 py-2.5 font-medium text-xs">{lc.empName}</td>
                        <td className="px-4 py-2.5 text-center font-semibold text-blue-600">{lc.vlBalance}</td>
                        <td className="px-4 py-2.5 text-center font-semibold text-emerald-600">{lc.slBalance}</td>
                        <td className="px-4 py-2.5 text-center hidden sm:table-cell">{lc.forcedLeave}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Leave Modal */}
      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>File a Leave Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Employee</Label>
              <Select value={leaveForm.employee} onValueChange={(v) => setLeaveForm({ ...leaveForm, employee: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {EMPLOYEES.slice(0, 10).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.lastname}, {e.firstname}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Leave Type</Label>
              <Select value={leaveForm.leaveType} onValueChange={(v) => setLeaveForm({ ...leaveForm, leaveType: v })}>
                <SelectTrigger><SelectValue placeholder="Select leave type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vacation Leave">Vacation Leave</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                  <SelectItem value="Solo Parent Leave">Solo Parent Leave</SelectItem>
                  <SelectItem value="Compensatory Time-Off">Compensatory Time-Off</SelectItem>
                  <SelectItem value="Special Leave Benefit">Special Leave Benefit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date From</Label>
                <Input type="date" value={leaveForm.dateFrom} onChange={(e) => setLeaveForm({ ...leaveForm, dateFrom: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Date To</Label>
                <Input type="date" value={leaveForm.dateTo} onChange={(e) => setLeaveForm({ ...leaveForm, dateTo: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Reason</Label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter reason for leave…"
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Supporting Document</Label>
              <Input type="file" className="text-sm" />
              <p className="text-xs text-muted-foreground">Upload medical certificate or other supporting documents.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                setShowLeaveModal(false);
                toast.success("Leave application submitted successfully!");
              }}
            >
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
