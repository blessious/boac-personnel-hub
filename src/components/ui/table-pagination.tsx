import { useId, type ReactNode } from "react";
import { ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  pageSizeOptions?: number[];
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
  pageSizeOptions = [10, 25, 50, 100],
  className,
}: TablePaginationProps) {
  const id = useId();
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);
  const selectItems = Array.from(
    new Set(
      [...pageSizeOptions, pageSize]
        .map((value) => Math.trunc(value))
        .filter((value) => value >= minPageSize && value <= maxPageSize),
    ),
  ).sort((a, b) => a - b);
  const visiblePages = getVisiblePages(safePage, safeTotalPages);
  const hiddenPageCount = Math.max(0, safeTotalPages - visiblePages.length);
  const itemText = itemLabel || "items";

  const goToPage = (nextPage: number) => {
    if (disabled) return;
    onPageChange(Math.min(safeTotalPages, Math.max(1, nextPage)));
  };

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-6 border-t border-border/50 p-4 text-sm max-sm:justify-center",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-3">
        <Label htmlFor={id} className="text-sm font-normal text-muted-foreground">
          Rows per page
        </Label>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          disabled={disabled}
        >
          <SelectTrigger id={id} className="h-9 w-fit min-w-16 whitespace-nowrap bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="[&_*[role=option]>span]:left-auto [&_*[role=option]>span]:right-2 [&_*[role=option]]:pl-2 [&_*[role=option]]:pr-8">
            <SelectGroup>
              {selectItems.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <p
        className="flex grow items-center justify-end whitespace-nowrap text-sm text-muted-foreground max-sm:justify-center"
        aria-live="polite"
      >
        Showing <span className="px-1 text-foreground">{start}</span> to{" "}
        <span className="px-1 text-foreground">{end}</span> of{" "}
        <span className="px-1 text-foreground">{total}</span> {itemText}
      </p>

      <Pagination className="mx-0 w-fit">
        <PaginationContent>
          <PaginationItem>
            <PageControl
              ariaLabel="Go to first page"
              disabled={disabled || safePage === 1}
              onClick={() => goToPage(1)}
            >
              <ChevronFirstIcon className="size-4" />
            </PageControl>
          </PaginationItem>
          <PaginationItem>
            <PageControl
              ariaLabel="Go to previous page"
              disabled={disabled || safePage === 1}
              onClick={() => goToPage(safePage - 1)}
            >
              <ChevronLeftIcon className="size-4" />
            </PageControl>
          </PaginationItem>
          {visiblePages.map((visiblePage) => (
            <PaginationItem key={visiblePage}>
              <PageControl
                ariaLabel={`Go to page ${visiblePage}`}
                isActive={visiblePage === safePage}
                disabled={disabled}
                onClick={() => goToPage(visiblePage)}
              >
                {visiblePage}
              </PageControl>
            </PaginationItem>
          ))}
          {hiddenPageCount > 0 && (
            <PaginationItem>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <PaginationEllipsis />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {hiddenPageCount} other {hiddenPageCount === 1 ? "page" : "pages"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </PaginationItem>
          )}
          <PaginationItem>
            <PageControl
              ariaLabel="Go to next page"
              disabled={disabled || safePage === safeTotalPages}
              onClick={() => goToPage(safePage + 1)}
            >
              <ChevronRightIcon className="size-4" />
            </PageControl>
          </PaginationItem>
          <PaginationItem>
            <PageControl
              ariaLabel="Go to last page"
              disabled={disabled || safePage === safeTotalPages}
              onClick={() => goToPage(safeTotalPages)}
            >
              <ChevronLastIcon className="size-4" />
            </PageControl>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 3) return Array.from({ length: totalPages }, (_, index) => index + 1);

  if (page <= 2) return [1, 2, 3];
  if (page >= totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages];

  return [page - 1, page, page + 1];
}

function PageControl({
  ariaLabel,
  children,
  disabled = false,
  isActive = false,
  onClick,
}: {
  ariaLabel: string;
  children: ReactNode;
  disabled?: boolean;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <PaginationLink
      href="#"
      aria-label={ariaLabel}
      aria-disabled={disabled}
      isActive={isActive}
      size="icon"
      className={cn(
        "rounded-full",
        disabled && "pointer-events-none opacity-50",
        isActive &&
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
      )}
      onClick={(event) => {
        event.preventDefault();
        if (!disabled) onClick();
      }}
    >
      {children}
    </PaginationLink>
  );
}
