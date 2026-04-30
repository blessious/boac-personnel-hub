import { type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  delta?: { value: string; positive: boolean };
  footnote?: string;
  action?: ReactNode;
}

export function StatCard({ label, value, delta, footnote, action }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm text-muted-foreground">{label}</div>
        {action ?? (
          <button className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:bg-accent">
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              delta.positive ? "text-success" : "text-destructive",
            )}
          >
            {delta.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta.value}
          </span>
        )}
      </div>
      {footnote && <div className="mt-2 text-[11px] text-muted-foreground">{footnote}</div>}
    </div>
  );
}
