import { useMemo, useState } from "react";
import { type DateRange } from "react-day-picker";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getDefaultDateRangePresets,
  formatLocalDate,
  parseLocalDate,
  type DateRangePreset,
} from "@/components/ui/date-range-utils";
import { cn, formatDisplayDateRange } from "@/lib/utils";

type DateRangePickerProps = {
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
  presets?: DateRangePreset[];
  disabled?: boolean;
  className?: string;
  labelFormatter?: (from: string, to: string) => string;
  min?: string;
  max?: string;
  allowEmpty?: boolean;
  allowOpenEnded?: boolean;
};

export function DateRangePicker({
  from,
  to,
  onApply,
  presets,
  disabled,
  className,
  labelFormatter = formatDisplayDateRange,
  min,
  max,
  allowEmpty = false,
  allowOpenEnded = false,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const pickerPresets = useMemo(() => presets || getDefaultDateRangePresets(), [presets]);
  const draftFromDate = parseLocalDate(draftFrom);
  const draftToDate = parseLocalDate(draftTo);
  const minDate = parseLocalDate(min || "");
  const maxDate = parseLocalDate(max || "");
  const selectedRange: DateRange | undefined = draftFromDate
    ? { from: draftFromDate, to: draftToDate || draftFromDate }
    : undefined;
  const emptyRangeIsValid = allowEmpty && !draftFrom && !draftTo;
  const selectedDatesAreValid = Boolean(
    draftFromDate &&
    (allowOpenEnded || draftToDate) &&
    (!draftToDate || draftFromDate.getTime() <= draftToDate.getTime()) &&
    (!minDate || draftFromDate.getTime() >= minDate.getTime()) &&
    (!maxDate || draftFromDate.getTime() <= maxDate.getTime()) &&
    (!draftToDate || !minDate || draftToDate.getTime() >= minDate.getTime()) &&
    (!draftToDate || !maxDate || draftToDate.getTime() <= maxDate.getTime()),
  );
  const rangeIsValid = emptyRangeIsValid || selectedDatesAreValid;

  const resetDraft = () => {
    setDraftFrom(from);
    setDraftTo(to);
  };

  const choosePreset = (preset: DateRangePreset) => {
    const nextRange = preset.getRange();
    setDraftFrom(nextRange.from);
    setDraftTo(nextRange.to);
  };

  const apply = () => {
    if (!rangeIsValid) {
      toast.error("Select a valid date range");
      return;
    }
    onApply(draftFrom, draftTo);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) resetDraft();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between border border-input bg-background px-3 shadow-sm hover:bg-background focus-visible:ring-1 focus-visible:ring-ring dark:bg-neutral-950/60 dark:hover:bg-neutral-950/80",
            className,
          )}
        >
          <span className="truncate text-left">{labelFormatter(from, to)}</span>
          <CalendarClock className="ml-2 h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(92vw,46rem)] p-0">
        <div className="grid gap-0 md:grid-cols-[12rem_minmax(0,1fr)]">
          <div className="border-b border-border p-3 md:border-b-0 md:border-r">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Presets</p>
            <div className="grid gap-1">
              {pickerPresets.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="ghost"
                  className="h-8 justify-start px-2 text-sm"
                  onClick={() => choosePreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-muted-foreground">From</Label>
                <Input
                  type="date"
                  min={min}
                  max={max}
                  value={draftFrom}
                  onChange={(event) => setDraftFrom(event.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-muted-foreground">
                  To{allowOpenEnded ? " (optional)" : ""}
                </Label>
                <Input
                  type="date"
                  min={draftFrom || min}
                  max={max}
                  value={draftTo}
                  onChange={(event) => setDraftTo(event.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="mt-3 overflow-x-auto rounded-md border border-border">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={selectedRange}
                onSelect={(range) => {
                  if (!range?.from) {
                    setDraftFrom("");
                    setDraftTo("");
                    return;
                  }
                  setDraftFrom(formatLocalDate(range.from));
                  setDraftTo(formatLocalDate(range.to || range.from));
                }}
                disabled={
                  minDate || maxDate
                    ? (date) =>
                        Boolean(
                          (minDate && date.getTime() < minDate.getTime()) ||
                          (maxDate && date.getTime() > maxDate.getTime()),
                        )
                    : undefined
                }
                className="mx-auto"
              />
            </div>

            {!rangeIsValid && (
              <p className="mt-2 text-xs font-medium text-destructive">
                Select a valid date range.
              </p>
            )}

            <div className="mt-3 flex justify-end gap-2">
              {allowEmpty && (draftFrom || draftTo) && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setDraftFrom("");
                    setDraftTo("");
                  }}
                >
                  Clear
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetDraft();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={apply} disabled={!rangeIsValid}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
