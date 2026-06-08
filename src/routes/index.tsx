import { createFileRoute, Link } from "@tanstack/react-router";

import {
  Users, CalendarCheck, ClipboardList, UserPlus,
  FileText, Clock, Activity,
  CalendarPlus, FileBarChart2, Eye, UserCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")(({
  component: Dashboard,
}));

const STAT_CARDS = [
  {
    label: "Total Employees",
    value: "843",
    sub: "Active personnel",
    icon: Users,
    color: "bg-blue-500/10 text-blue-600",
    border: "border-blue-200",
  },
  {
    label: "On Leave Today",
    value: "12",
    sub: "3 Sick · 9 Vacation",
    icon: CalendarCheck,
    color: "bg-amber-500/10 text-amber-600",
    border: "border-amber-200",
  },
  {
    label: "Pending Leave Requests",
    value: "7",
    sub: "Awaiting approval",
    icon: ClipboardList,
    color: "bg-rose-500/10 text-rose-600",
    border: "border-rose-200",
  },
  {
    label: "New Applicants",
    value: "3",
    sub: "This month",
    icon: UserPlus,
    color: "bg-emerald-500/10 text-emerald-600",
    border: "border-emerald-200",
  },
];

const ICON_MAP: Record<string, typeof Activity> = {
  leave: CalendarPlus,
  pass: FileText,
  increment: FileBarChart2,
  dtr: Clock,
  onboard: UserCheck,
};

function Dashboard() {
  return (
    <AppShell title="Dashboard" subtitle="Welcome to STRH HRIS">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn(
                "rounded-2xl border bg-card p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow",
                card.border
              )}
            >
              <div className={cn("h-12 w-12 rounded-xl grid place-items-center shrink-0", card.color)}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums">{card.value}</div>
                <div className="text-sm font-medium text-foreground">{card.label}</div>
                <div className="text-xs text-muted-foreground">{card.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm mt-4">
        <h3 className="font-semibold text-foreground mb-1">Quick Actions</h3>
        <p className="text-xs text-muted-foreground mb-4">Frequently used shortcuts</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { to: "/attendance", label: "File Leave", desc: "Submit leave application", icon: CalendarPlus, color: "bg-blue-500/10 text-blue-600" },
            { to: "/attendance", label: "OB Pass", desc: "File official business", icon: FileText, color: "bg-purple-500/10 text-purple-600" },
            { to: "/attendance", label: "View DTR", desc: "Daily time records", icon: Clock, color: "bg-amber-500/10 text-amber-600" },
            { to: "/self-service", label: "Update Profile", desc: "Manage your 201 file", icon: UserCheck, color: "bg-emerald-500/10 text-emerald-600" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.to}
                className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-accent transition-colors"
              >
                <div className={cn("h-9 w-9 grid place-items-center rounded-lg shrink-0", action.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-foreground">{action.label}</div>
                  <div className="text-xs text-muted-foreground">{action.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Data Distribution Tables */}
      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table 1: Status of Plantilla Position */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold text-foreground text-sm">Table 1. Status of Plantilla Position by Division</h3>
              <p className="text-xs text-muted-foreground">as of June 08, 2026</p>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium border-b border-border">Divisions</th>
                    <th className="px-4 py-3 font-medium border-b border-border text-center" colSpan={2}>Position</th>
                    <th className="px-4 py-3 font-medium border-b border-border text-center" rowSpan={2}>Total</th>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium border-b border-border"></th>
                    <th className="px-4 py-2 font-medium border-b border-border text-center bg-emerald-500/5 text-emerald-600">Filled</th>
                    <th className="px-4 py-2 font-medium border-b border-border text-center bg-rose-500/5 text-rose-600">Unfilled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">Hospital Operation and Patient Support Division</td>
                    <td className="px-4 py-3 text-center font-medium">52</td>
                    <td className="px-4 py-3 text-center text-rose-500">2</td>
                    <td className="px-4 py-3 text-center font-bold">54</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors bg-muted/10">
                    <td className="px-4 py-3">Nursing Division</td>
                    <td className="px-4 py-3 text-center font-medium">138</td>
                    <td className="px-4 py-3 text-center text-rose-500">3</td>
                    <td className="px-4 py-3 text-center font-bold">141</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">Medical Division</td>
                    <td className="px-4 py-3 text-center font-medium">108</td>
                    <td className="px-4 py-3 text-center text-rose-500">4</td>
                    <td className="px-4 py-3 text-center font-bold">112</td>
                  </tr>
                </tbody>
                <tfoot className="bg-primary/5 font-bold">
                  <tr>
                    <td className="px-4 py-3 text-primary">Total</td>
                    <td className="px-4 py-3 text-center text-primary">298</td>
                    <td className="px-4 py-3 text-center text-primary">9</td>
                    <td className="px-4 py-3 text-center text-primary">307</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Table 2: Distribution by Sex & Level */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Table 2. Distribution of Permanent Employees by Level, Division Assignment and Sex</h3>
                <p className="text-xs text-muted-foreground">as of {new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</p>
              </div>
            </div>
            
            {/* Main Summary Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium border-b border-border" rowSpan={2}>Divisions</th>
                    <th className="px-4 py-2 font-medium border-b border-border text-center bg-muted/50" colSpan={3}>Level</th>
                    <th className="px-4 py-2 font-medium border-b border-border text-center" colSpan={2}>Sex</th>
                    <th className="px-4 py-3 font-medium border-b border-border text-center" rowSpan={2}>Total</th>
                  </tr>
                  <tr>
                    <th className="px-3 py-2 font-medium border-b border-border text-center bg-muted/30">1st</th>
                    <th className="px-3 py-2 font-medium border-b border-border text-center bg-muted/30">2nd</th>
                    <th className="px-3 py-2 font-medium border-b border-border text-center bg-muted/30">3rd</th>
                    <th className="px-4 py-2 font-medium border-b border-border text-center bg-blue-500/5 text-blue-600">Male</th>
                    <th className="px-4 py-2 font-medium border-b border-border text-center bg-pink-500/5 text-pink-600">Female</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">Hospital Operation and Patient Support</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">33</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">21</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">0</td>
                    <td className="px-4 py-3 text-center font-medium">23</td>
                    <td className="px-4 py-3 text-center font-medium">29</td>
                    <td className="px-4 py-3 text-center font-bold">52</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors bg-muted/10">
                    <td className="px-4 py-3">Nursing Division</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">42</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">99</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">0</td>
                    <td className="px-4 py-3 text-center font-medium">37</td>
                    <td className="px-4 py-3 text-center font-medium">101</td>
                    <td className="px-4 py-3 text-center font-bold">138</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">Medical Division</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">19</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">91</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">2</td>
                    <td className="px-4 py-3 text-center font-medium">41</td>
                    <td className="px-4 py-3 text-center font-medium">66</td>
                    <td className="px-4 py-3 text-center font-bold">107</td>
                  </tr>
                </tbody>
                <tfoot className="bg-primary/5 font-bold">
                  <tr>
                    <td className="px-4 py-3 text-primary">Total</td>
                    <td className="px-3 py-3 text-center text-primary/80">94</td>
                    <td className="px-3 py-3 text-center text-primary/80">211</td>
                    <td className="px-3 py-3 text-center text-primary/80">2</td>
                    <td className="px-4 py-3 text-center text-blue-600">101</td>
                    <td className="px-4 py-3 text-center text-pink-600">196</td>
                    <td className="px-4 py-3 text-center text-primary">297</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Level Breakdowns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border-t border-border bg-muted/10">
              
              {/* 1st Level */}
              <div className="p-0 overflow-x-auto">
                <div className="px-3 py-2 bg-muted/20 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                  1st Level Breakdown
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/10 text-[9px] uppercase text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-3 py-2 font-medium">Divisions</th>
                      <th className="px-2 py-2 font-medium text-center text-blue-600">M</th>
                      <th className="px-2 py-2 font-medium text-center text-pink-600">F</th>
                      <th className="px-2 py-2 font-medium text-center text-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    <tr className="hover:bg-muted/30">
                      <td className="px-3 py-1.5 truncate max-w-[100px]" title="Hospital Operation and Patient Support">HOPS</td>
                      <td className="px-2 py-1.5 text-center">16</td><td className="px-2 py-1.5 text-center">15</td><td className="px-2 py-1.5 text-center font-semibold">31</td>
                    </tr>
                    <tr className="hover:bg-muted/30 bg-muted/5">
                      <td className="px-3 py-1.5 truncate max-w-[100px]">Nursing</td>
                      <td className="px-2 py-1.5 text-center">12</td><td className="px-2 py-1.5 text-center">30</td><td className="px-2 py-1.5 text-center font-semibold">42</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="px-3 py-1.5 truncate max-w-[100px]">Medical</td>
                      <td className="px-2 py-1.5 text-center">8</td><td className="px-2 py-1.5 text-center">11</td><td className="px-2 py-1.5 text-center font-semibold">19</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-primary/5 font-bold border-t border-primary/20 text-[10px]">
                    <tr><td className="px-3 py-1.5">Total</td><td className="px-2 py-1.5 text-center text-blue-700">36</td><td className="px-2 py-1.5 text-center text-pink-700">56</td><td className="px-2 py-1.5 text-center text-primary">92</td></tr>
                  </tfoot>
                </table>
              </div>

              {/* 2nd Level */}
              <div className="p-0 overflow-x-auto">
                <div className="px-3 py-2 bg-muted/20 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                  2nd Level Breakdown
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/10 text-[9px] uppercase text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-3 py-2 font-medium">Divisions</th>
                      <th className="px-2 py-2 font-medium text-center text-blue-600">M</th>
                      <th className="px-2 py-2 font-medium text-center text-pink-600">F</th>
                      <th className="px-2 py-2 font-medium text-center text-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    <tr className="hover:bg-muted/30">
                      <td className="px-3 py-1.5 truncate max-w-[100px]" title="Hospital Operation and Patient Support">HOPS</td>
                      <td className="px-2 py-1.5 text-center">7</td><td className="px-2 py-1.5 text-center">14</td><td className="px-2 py-1.5 text-center font-semibold">21</td>
                    </tr>
                    <tr className="hover:bg-muted/30 bg-muted/5">
                      <td className="px-3 py-1.5 truncate max-w-[100px]">Nursing</td>
                      <td className="px-2 py-1.5 text-center">25</td><td className="px-2 py-1.5 text-center">71</td><td className="px-2 py-1.5 text-center font-semibold">96</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="px-3 py-1.5 truncate max-w-[100px]">Medical</td>
                      <td className="px-2 py-1.5 text-center">32</td><td className="px-2 py-1.5 text-center">54</td><td className="px-2 py-1.5 text-center font-semibold">86</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-primary/5 font-bold border-t border-primary/20 text-[10px]">
                    <tr><td className="px-3 py-1.5">Total</td><td className="px-2 py-1.5 text-center text-blue-700">64</td><td className="px-2 py-1.5 text-center text-pink-700">139</td><td className="px-2 py-1.5 text-center text-primary">203</td></tr>
                  </tfoot>
                </table>
              </div>

              {/* 3rd Level */}
              <div className="p-0 overflow-x-auto">
                <div className="px-3 py-2 bg-muted/20 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                  3rd Level Breakdown
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/10 text-[9px] uppercase text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-3 py-2 font-medium">Divisions</th>
                      <th className="px-2 py-2 font-medium text-center text-blue-600">M</th>
                      <th className="px-2 py-2 font-medium text-center text-pink-600">F</th>
                      <th className="px-2 py-2 font-medium text-center text-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    <tr className="hover:bg-muted/30">
                      <td className="px-3 py-1.5 truncate max-w-[100px]" title="Hospital Operation and Patient Support">HOPS</td>
                      <td className="px-2 py-1.5 text-center text-muted-foreground">0</td><td className="px-2 py-1.5 text-center text-muted-foreground">0</td><td className="px-2 py-1.5 text-center font-semibold text-muted-foreground">0</td>
                    </tr>
                    <tr className="hover:bg-muted/30 bg-muted/5">
                      <td className="px-3 py-1.5 truncate max-w-[100px]">Nursing</td>
                      <td className="px-2 py-1.5 text-center text-muted-foreground">0</td><td className="px-2 py-1.5 text-center text-muted-foreground">0</td><td className="px-2 py-1.5 text-center font-semibold text-muted-foreground">0</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="px-3 py-1.5 truncate max-w-[100px]">Medical</td>
                      <td className="px-2 py-1.5 text-center">1</td><td className="px-2 py-1.5 text-center">1</td><td className="px-2 py-1.5 text-center font-semibold">2</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-primary/5 font-bold border-t border-primary/20 text-[10px]">
                    <tr><td className="px-3 py-1.5">Total</td><td className="px-2 py-1.5 text-center text-blue-700">1</td><td className="px-2 py-1.5 text-center text-pink-700">1</td><td className="px-2 py-1.5 text-center text-primary">2</td></tr>
                  </tfoot>
                </table>
              </div>

            </div>
          </div>
        </div>

        {/* Table 3: Distribution by CADRE */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20">
            <h3 className="font-semibold text-foreground text-sm">Table 3. Distribution of Permanent Employees by CADRE</h3>
            <p className="text-xs text-muted-foreground">as of June 08, 2026</p>
          </div>
          <div className="p-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Medical Division */}
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/20 text-[10px] uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-3 py-2 font-medium">Medical Division</th>
                    <th className="px-2 py-2 font-medium text-center">F</th>
                    <th className="px-2 py-2 font-medium text-center">U</th>
                    <th className="px-2 py-2 font-medium text-center text-foreground">T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[
                    ["Administrative Aide", 2, 0, 2], ["Administrative Assistant", 6, 0, 6], ["Administrative Officer", 3, 0, 3],
                    ["Chemist", 1, 0, 1], ["Cook", 3, 0, 3], ["Data Controller", 1, 0, 1], ["Dental Aide", 1, 0, 1],
                    ["Dentist", 1, 1, 2], ["Health Ed. & Promo Officer", 1, 0, 1], ["Laboratory Aide", 5, 0, 5],
                    ["Medical Technologist", 13, 1, 14], ["Nutritionist-Dietitian", 2, 0, 2], ["Pharmacist", 6, 0, 6],
                    ["Physician", 51, 0, 51], ["Psychologist", 1, 0, 1], ["Radiologic Technologist", 3, 2, 5],
                    ["Respiratory Therapist", 3, 0, 3], ["Social Welfare", 1, 0, 1], ["Social Welfare Officer", 3, 0, 3],
                    ["Statistician", 1, 0, 1]
                  ].map((row, i) => (
                    <tr key={row[0] as string} className={cn("hover:bg-muted/20", i % 2 === 1 && "bg-muted/5")}>
                      <td className="px-3 py-1.5 truncate max-w-[150px]">{row[0]}</td>
                      <td className="px-2 py-1.5 text-center text-emerald-600">{row[1]}</td>
                      <td className="px-2 py-1.5 text-center text-rose-500">{row[2]}</td>
                      <td className="px-2 py-1.5 text-center font-semibold">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-primary/5 font-bold border-t border-primary/20 text-xs">
                  <tr><td className="px-3 py-2">Total</td><td className="px-2 py-2 text-center text-emerald-700">108</td><td className="px-2 py-2 text-center text-rose-600">4</td><td className="px-2 py-2 text-center text-primary">112</td></tr>
                </tfoot>
              </table>
            </div>
            
            {/* Nursing Division */}
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/20 text-[10px] uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-3 py-2 font-medium">Nursing Division</th>
                    <th className="px-2 py-2 font-medium text-center">F</th>
                    <th className="px-2 py-2 font-medium text-center">U</th>
                    <th className="px-2 py-2 font-medium text-center text-foreground">T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[
                    ["Administrative Aide", 1, 0, 1], ["Midwife", 3, 0, 3], ["Nurse", 96, 3, 99], ["Nursing Attendant", 38, 0, 38]
                  ].map((row, i) => (
                    <tr key={row[0] as string} className={cn("hover:bg-muted/20", i % 2 === 1 && "bg-muted/5")}>
                      <td className="px-3 py-1.5 truncate max-w-[150px]">{row[0]}</td>
                      <td className="px-2 py-1.5 text-center text-emerald-600">{row[1]}</td>
                      <td className="px-2 py-1.5 text-center text-rose-500">{row[2]}</td>
                      <td className="px-2 py-1.5 text-center font-semibold">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-primary/5 font-bold border-t border-primary/20 text-xs">
                  <tr><td className="px-3 py-2">Total</td><td className="px-2 py-2 text-center text-emerald-700">138</td><td className="px-2 py-2 text-center text-rose-600">3</td><td className="px-2 py-2 text-center text-primary">141</td></tr>
                </tfoot>
              </table>
            </div>

            {/* HOPS Division */}
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/20 text-[10px] uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-3 py-2 font-medium">HOPS Division</th>
                    <th className="px-2 py-2 font-medium text-center">F</th>
                    <th className="px-2 py-2 font-medium text-center">U</th>
                    <th className="px-2 py-2 font-medium text-center text-foreground">T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[
                    ["Accountant", 2, 0, 2], ["Administrative Aide", 15, 1, 16], ["Administrative Assistant", 10, 1, 11],
                    ["Administrative Officer", 15, 0, 15], ["Computer Maintenance Tech", 2, 0, 2], ["Engineer", 2, 0, 2],
                    ["Hospital Housekeeper", 1, 0, 1], ["Laundry Worker", 1, 0, 1], ["Medical Equipment Tech", 2, 0, 2],
                    ["Seamstress", 1, 0, 1], ["Warehouseman", 1, 0, 1]
                  ].map((row, i) => (
                    <tr key={row[0] as string} className={cn("hover:bg-muted/20", i % 2 === 1 && "bg-muted/5")}>
                      <td className="px-3 py-1.5 truncate max-w-[150px]">{row[0]}</td>
                      <td className="px-2 py-1.5 text-center text-emerald-600">{row[1]}</td>
                      <td className="px-2 py-1.5 text-center text-rose-500">{row[2]}</td>
                      <td className="px-2 py-1.5 text-center font-semibold">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-primary/5 font-bold border-t border-primary/20 text-xs">
                  <tr><td className="px-3 py-2">Total</td><td className="px-2 py-2 text-center text-emerald-700">52</td><td className="px-2 py-2 text-center text-rose-600">2</td><td className="px-2 py-2 text-center text-primary">54</td></tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Table 4: Distribution by Position */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-muted/20">
            <h3 className="font-semibold text-foreground text-sm">Table 4. Distribution of Permanent Employees by Position</h3>
            <p className="text-xs text-muted-foreground">as of {new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
            {/* HOPS Division */}
            <div className="flex flex-col h-[500px]">
              <div className="px-4 py-2 bg-muted/10 font-medium text-xs uppercase tracking-wide border-b border-border text-foreground">
                Hospital Operation and Patient Support
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-auto p-0">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-card/95 backdrop-blur z-10 text-[10px] uppercase text-muted-foreground border-b border-border shadow-sm">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Position</th>
                      <th className="px-2 py-2 font-semibold text-center w-12">Filled</th>
                      <th className="px-2 py-2 font-semibold text-center w-12">Unfilled</th>
                      <th className="px-2 py-2 font-semibold text-center w-12 text-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {[
                      ["Accountant II", 1, 0, 1], ["Accountant III", 1, 0, 1], ["Administrative Aide III", 2, 0, 2],
                      ["Administrative Aide IV", 5, 1, 6], ["Administrative Aide VI", 8, 0, 8], ["Administrative Assistant I", 3, 0, 3],
                      ["Administrative Assistant II", 5, 1, 6], ["Administrative Assistant III", 2, 0, 2], ["Administrative Officer I", 3, 0, 3],
                      ["Administrative Officer II", 3, 0, 3], ["Administrative Officer III", 1, 0, 1], ["Administrative Officer IV", 2, 0, 2],
                      ["Administrative Officer V", 5, 0, 5], ["Computer Maintenance Tech II", 1, 0, 1], ["Computer Maintenance Tech I", 1, 0, 1],
                      ["Engineer II", 1, 0, 1], ["Engineer III", 1, 0, 1], ["Hospital Housekeeper", 1, 0, 1],
                      ["Laundry Worker II", 1, 0, 1], ["Medical Equipment Tech II", 1, 0, 1], ["Medical Equipment Tech I", 1, 0, 1],
                      ["Seamstress", 1, 0, 1], ["Supervising Admin Officer", 1, 0, 1], ["Warehouseman II", 1, 0, 1]
                    ].map((row, i) => (
                      <tr key={row[0] as string} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 truncate" title={row[0] as string}>{row[0]}</td>
                        <td className="px-2 py-2 text-center text-emerald-600">{row[1]}</td>
                        <td className="px-2 py-2 text-center text-rose-500">{row[2]}</td>
                        <td className="px-2 py-2 text-center font-bold">{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-primary/5 border-t border-primary/20 px-3 py-2 flex justify-between font-bold text-xs">
                <span className="text-primary">Total</span>
                <div className="flex gap-4">
                  <span className="text-emerald-700 w-8 text-center">52</span>
                  <span className="text-rose-600 w-8 text-center">2</span>
                  <span className="text-primary w-8 text-center">54</span>
                </div>
              </div>
            </div>

            {/* Medical Division */}
            <div className="flex flex-col h-[500px]">
              <div className="px-4 py-2 bg-muted/10 font-medium text-xs uppercase tracking-wide border-b border-border text-foreground">
                Medical Division
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-auto p-0">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-card/95 backdrop-blur z-10 text-[10px] uppercase text-muted-foreground border-b border-border shadow-sm">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Position</th>
                      <th className="px-2 py-2 font-semibold text-center w-12">Filled</th>
                      <th className="px-2 py-2 font-semibold text-center w-12">Unfilled</th>
                      <th className="px-2 py-2 font-semibold text-center w-12 text-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {[
                      ["Administrative Aide III", 2, 0, 2], ["Administrative Assistant I", 4, 0, 4], ["Administrative Assistant II", 2, 0, 2],
                      ["Administrative Officer I", 1, 0, 1], ["Administrative Officer IV", 1, 0, 1], ["Administrative Officer V", 1, 0, 1],
                      ["Chemist", 1, 0, 1], ["CMPS", 1, 0, 1], ["Cook II", 3, 0, 3], ["Data Controller II", 1, 0, 1],
                      ["Dental Aide", 1, 0, 1], ["Dentist II", 0, 1, 1], ["Dentist IV", 1, 0, 1], ["Health Ed & Promo Officer", 1, 0, 1],
                      ["Laboratory Aide II", 5, 0, 5], ["Medical Center Chief", 1, 0, 1], ["Medical Lab Technician II", 0, 0, 0],
                      ["Medical Officer III", 16, 0, 16], ["Medical Officer IV", 6, 0, 6], ["Medical Specialist II", 12, 0, 12],
                      ["Medical Specialist III", 15, 0, 15], ["Medical Technologist I", 7, 1, 8], ["Medical Technologist II", 4, 0, 4],
                      ["Medical Technologist III", 2, 0, 2], ["Nutritionist-Dietitian I", 1, 0, 1], ["Nutritionist-Dietitian III", 1, 0, 1],
                      ["Pharmacist I", 5, 0, 5], ["Pharmacist III", 1, 0, 1], ["Psychologist II", 1, 0, 1],
                      ["Radiologic Technologist I", 1, 1, 2], ["Radiologic Technologist II", 1, 1, 2], ["Radiologic Technologist III", 1, 0, 1],
                      ["Respiratory Therapist I", 2, 0, 2], ["Respiratory Therapist II", 1, 0, 1], ["Social Welfare Assistant", 1, 0, 1],
                      ["Social Welfare Officer I", 2, 0, 2], ["Social Welfare Officer III", 1, 0, 1], ["Statistician II", 1, 0, 1]
                    ].map((row, i) => (
                      <tr key={row[0] as string} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 truncate" title={row[0] as string}>{row[0]}</td>
                        <td className="px-2 py-2 text-center text-emerald-600">{row[1]}</td>
                        <td className="px-2 py-2 text-center text-rose-500">{row[2]}</td>
                        <td className="px-2 py-2 text-center font-bold">{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-primary/5 border-t border-primary/20 px-3 py-2 flex justify-between font-bold text-xs">
                <span className="text-primary">Total</span>
                <div className="flex gap-4">
                  <span className="text-emerald-700 w-8 text-center">108</span>
                  <span className="text-rose-600 w-8 text-center">4</span>
                  <span className="text-primary w-8 text-center">112</span>
                </div>
              </div>
            </div>

            {/* Nursing Division */}
            <div className="flex flex-col h-[500px]">
              <div className="px-4 py-2 bg-muted/10 font-medium text-xs uppercase tracking-wide border-b border-border text-foreground">
                Nursing Division
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-auto p-0">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-card/95 backdrop-blur z-10 text-[10px] uppercase text-muted-foreground border-b border-border shadow-sm">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Position</th>
                      <th className="px-2 py-2 font-semibold text-center w-12">Filled</th>
                      <th className="px-2 py-2 font-semibold text-center w-12">Unfilled</th>
                      <th className="px-2 py-2 font-semibold text-center w-12 text-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {[
                      ["Administrative Aide VI", 1, 0, 1], ["Midwife I", 3, 0, 3], ["Nurse I", 51, 2, 53],
                      ["Nurse II", 35, 0, 35], ["Nurse III", 7, 1, 8], ["Nurse IV", 1, 0, 1],
                      ["Nurse V", 1, 0, 1], ["Nurse VI", 1, 0, 1], ["Nursing Attendant I", 21, 0, 21],
                      ["Nursing Attendant II", 17, 0, 17]
                    ].map((row, i) => (
                      <tr key={row[0] as string} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 truncate" title={row[0] as string}>{row[0]}</td>
                        <td className="px-2 py-2 text-center text-emerald-600">{row[1]}</td>
                        <td className="px-2 py-2 text-center text-rose-500">{row[2]}</td>
                        <td className="px-2 py-2 text-center font-bold">{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-primary/5 border-t border-primary/20 px-3 py-2 flex justify-between font-bold text-xs">
                <span className="text-primary">Total</span>
                <div className="flex gap-4">
                  <span className="text-emerald-700 w-8 text-center">138</span>
                  <span className="text-rose-600 w-8 text-center">3</span>
                  <span className="text-primary w-8 text-center">141</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
