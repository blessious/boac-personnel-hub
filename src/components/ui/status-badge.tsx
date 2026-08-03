import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  success: "text-emerald-700 dark:text-emerald-300",
  info: "text-blue-700 dark:text-blue-300",
  warning: "text-amber-700 dark:text-amber-300",
  danger: "text-rose-700 dark:text-rose-300",
  accent: "text-purple-700 dark:text-purple-300",
  neutral: "text-muted-foreground",
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
