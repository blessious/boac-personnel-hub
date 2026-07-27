import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/20",
  info: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/20",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/20",
  danger:
    "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/20",
  accent:
    "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-50 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-200 dark:hover:bg-purple-500/20",
  neutral: "border-border bg-muted/50 text-muted-foreground hover:bg-muted/50",
} as const;

export type StatusBadgeTone = keyof typeof TONE_CLASSES;

type StatusBadgeProps = Omit<ComponentProps<typeof Badge>, "variant"> & {
  tone?: StatusBadgeTone;
};

export function StatusBadge({ tone = "neutral", className, ...props }: StatusBadgeProps) {
  return <Badge variant="outline" className={cn(TONE_CLASSES[tone], className)} {...props} />;
}

const EMPLOYMENT_TONES: Record<string, StatusBadgeTone> = {
  Permanent: "success",
  Regular: "info",
  Casual: "accent",
  JO: "warning",
  COS: "warning",
  "JO/COS": "warning",
  "Job Order": "warning",
  "Contract of Service": "warning",
};

export function EmploymentTypeBadge({ status, className }: { status: string; className?: string }) {
  return (
    <StatusBadge
      tone={EMPLOYMENT_TONES[status] ?? "neutral"}
      className={cn("text-[10px] font-semibold uppercase", className)}
    >
      {status}
    </StatusBadge>
  );
}

const WORKFLOW_TONES: Record<string, StatusBadgeTone> = {
  Active: "success",
  Approved: "success",
  Occupied: "success",
  Posted: "success",
  Ready: "info",
  Scheduled: "info",
  Pending: "warning",
  Draft: "warning",
  Vacant: "warning",
  Disapproved: "danger",
  Rejected: "danger",
  Locked: "danger",
  Reversed: "accent",
  Cancelled: "neutral",
  Inactive: "neutral",
};

export function WorkflowStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <StatusBadge tone={WORKFLOW_TONES[status] ?? "neutral"} className={className}>
      {status}
    </StatusBadge>
  );
}
