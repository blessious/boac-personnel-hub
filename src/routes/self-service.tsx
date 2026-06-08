import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarPlus, Building2, Clock, CreditCard, FileEdit,
  FileCheck, BookOpen, Bell, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MY_REQUESTS, MY_NOTIFICATIONS } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/self-service")({
  component: SelfServicePage,
});

const STATUS_COLOR: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Disapproved: "bg-rose-100 text-rose-700 border-rose-200",
};

const NOTIF_ICON: Record<string, typeof Bell> = {
  success: CheckCircle2,
  info: Bell,
  warning: AlertCircle,
};
const NOTIF_COLOR: Record<string, string> = {
  success: "text-emerald-600 bg-emerald-50",
  info: "text-blue-600 bg-blue-50",
  warning: "text-amber-600 bg-amber-50",
};

const ACTIONS = [
  { label: "File a Leave", icon: CalendarPlus, color: "from-blue-500 to-blue-700", desc: "Submit vacation or sick leave" },
  { label: "File OB Pass", icon: Building2, color: "from-purple-500 to-purple-700", desc: "Official business request" },
  { label: "View My DTR", icon: Clock, color: "from-amber-500 to-orange-600", desc: "Daily time record history" },
  { label: "View Leave Credits", icon: CreditCard, color: "from-emerald-500 to-emerald-700", desc: "Check your leave balances" },
  { label: "Update My Profile (PDS)", icon: FileEdit, color: "from-indigo-500 to-indigo-700", desc: "Personal data sheet update" },
  { label: "Request Certificate of Employment", icon: FileCheck, color: "from-rose-500 to-rose-600", desc: "Certificate issuance" },
  { label: "View Training Records", icon: BookOpen, color: "from-teal-500 to-teal-700", desc: "Seminars & training attended" },
];

function SelfServicePage() {
  const [leaveModal, setLeaveModal] = useState(false);
  const [obModal, setObModal] = useState(false);

  const handleAction = (label: string) => {
    if (label === "File a Leave") { setLeaveModal(true); return; }
    if (label === "File OB Pass") { setObModal(true); return; }
    toast.info(`${label} — coming soon`);
  };

  return (
    <AppShell title="Employee Self-Service Portal" subtitle="Manage your requests and profile">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-navy text-white p-6 mb-5 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-white/20 grid place-items-center text-2xl font-bold border-2 border-white/30">
            MS
          </div>
          <div>
            <div className="text-xl font-bold">Welcome, Maria Santos!</div>
            <div className="text-blue-100 text-sm">HR Officer · Finance Division · STRH</div>
            <div className="text-blue-200 text-xs mt-0.5">What would you like to do today?</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          {/* Action Cards */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Self-Service Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => handleAction(action.label)}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 text-center group"
                  >
                    <div className={cn("h-12 w-12 rounded-xl bg-gradient-to-br grid place-items-center text-white shadow-sm", action.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-xs font-semibold text-foreground leading-snug">{action.label}</div>
                    <div className="text-[10px] text-muted-foreground hidden sm:block">{action.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* My Pending Requests */}
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="p-4 border-b border-border">
              <h4 className="font-semibold text-foreground">My Requests</h4>
              <p className="text-xs text-muted-foreground">Track your submitted requests</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="px-4 py-2.5 font-semibold">Request Type</th>
                    <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">Date</th>
                    <th className="px-4 py-2.5 font-semibold hidden md:table-cell">Filed</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MY_REQUESTS.map((r, i) => (
                    <tr key={r.id} className={cn("border-b border-border/50 last:border-0", i % 2 === 1 && "bg-muted/10")}>
                      <td className="px-4 py-3 font-medium">{r.type}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">{r.dateFrom} – {r.dateTo}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">{r.filedDate}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-[11px]", STATUS_COLOR[r.status])}>
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Notifications Panel */}
        <div className="rounded-2xl border border-border bg-card shadow-sm h-fit">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-semibold text-foreground">Notifications</h4>
          </div>
          <div className="divide-y divide-border">
            {MY_NOTIFICATIONS.map((n) => {
              const Icon = NOTIF_ICON[n.type] ?? Bell;
              return (
                <div key={n.id} className="flex gap-3 p-4 hover:bg-muted/20 transition-colors">
                  <div className={cn("h-8 w-8 rounded-full grid place-items-center shrink-0 mt-0.5", NOTIF_COLOR[n.type])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{n.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* File Leave Modal */}
      <Dialog open={leaveModal} onOpenChange={setLeaveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>File a Leave Application</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Leave Type</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select leave type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vl">Vacation Leave</SelectItem>
                  <SelectItem value="sl">Sick Leave</SelectItem>
                  <SelectItem value="ml">Maternity Leave</SelectItem>
                  <SelectItem value="sp">Solo Parent Leave</SelectItem>
                  <SelectItem value="cto">Compensatory Time-Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Date From</Label><Input type="date" /></div>
              <div className="space-y-1"><Label>Date To</Label><Input type="date" /></div>
            </div>
            <div className="space-y-1">
              <Label>Reason</Label>
              <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Enter reason…" />
            </div>
            <div className="space-y-1">
              <Label>Supporting Document</Label>
              <Input type="file" className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveModal(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setLeaveModal(false); toast.success("Leave filed successfully!"); }}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OB Pass Modal */}
      <Dialog open={obModal} onOpenChange={setObModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>File OB Pass</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Purpose</Label><Input placeholder="Official business purpose" /></div>
            <div className="space-y-1"><Label>Destination</Label><Input placeholder="Office / venue" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Date</Label><Input type="date" /></div>
              <div className="space-y-1"><Label>Expected Return</Label><Input type="time" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setObModal(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setObModal(false); toast.success("OB Pass submitted!"); }}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
