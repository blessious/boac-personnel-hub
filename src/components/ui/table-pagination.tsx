import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  disabled?: boolean;
  minPageSize?: number;
  maxPageSize?: number;
  className?: string;
};

export function TablePagination({
  page,
  totalPages,
  total,
  pageSize,
  itemLabel,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  minPageSize = 1,
  maxPageSize = 200,
  className,
}: TablePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  const updatePageSize = (rawValue: string) => {
    const numericValue = Number(rawValue);
    const nextPageSize = Number.isFinite(numericValue)
      ? Math.min(maxPageSize, Math.max(minPageSize, Math.trunc(numericValue)))
      : minPageSize;
    onPageSizeChange(nextPageSize);
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-4 border-t border-border/50 p-4 text-xs text-muted-foreground sm:flex-row",
        className,
      )}
    >
      <div>
        Showing {start} to {end} of {total} {itemLabel}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={disabled || safePage === 1}
            className="h-8 w-8 p-0 text-muted-foreground"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="mx-1 flex items-center gap-1">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-md bg-blue-600 font-medium text-white"
              aria-current="page"
            >
              {safePage}
            </button>
            {safeTotalPages > 1 && safePage < safeTotalPages && (
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-md border border-border font-medium text-muted-foreground transition-colors hover:bg-muted/50"
                onClick={() => onPageChange(safePage + 1)}
                disabled={disabled}
              >
                {safePage + 1}
              </button>
            )}
            {safeTotalPages > safePage + 1 && (
              <div className="grid h-8 w-8 place-items-center text-muted-foreground/70">...</div>
            )}
            {safeTotalPages > safePage + 1 && (
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-md border border-border font-medium text-muted-foreground transition-colors hover:bg-muted/50"
                onClick={() => onPageChange(safeTotalPages)}
                disabled={disabled}
              >
                {safeTotalPages}
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))}
            disabled={disabled || safePage === safeTotalPages}
            className="h-8 w-8 p-0 text-muted-foreground"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Label
            htmlFor={`${itemLabel.replace(/\s+/g, "-")}-page-size`}
            className="text-xs font-normal"
          >
            Show
          </Label>
          <Input
            id={`${itemLabel.replace(/\s+/g, "-")}-page-size`}
            type="number"
            min={minPageSize}
            max={maxPageSize}
            value={pageSize}
            onChange={(event) => updatePageSize(event.target.value)}
            disabled={disabled}
            className="h-8 w-20 bg-card text-xs"
          />
        </div>
      </div>
    </div>
  );
}
