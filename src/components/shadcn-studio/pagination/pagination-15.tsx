import { useId } from "react";
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

const pages = [1, 2, 3];

const TablePaginationDemo = () => {
  const id = useId();

  const selectItems = [
    { label: "10", value: "10" },
    { label: "25", value: "25" },
    { label: "50", value: "50" },
  ];

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-6 max-sm:justify-center">
      <div className="flex shrink-0 items-center gap-3">
        <Label htmlFor={id}>Rows per page</Label>
        <Select defaultValue="10">
          <SelectTrigger id={id} className="w-fit whitespace-nowrap">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="[&_*[role=option]>span]:left-auto [&_*[role=option]>span]:right-2 [&_*[role=option]]:pl-2 [&_*[role=option]]:pr-8">
            <SelectGroup>
              {selectItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex grow items-center justify-end whitespace-nowrap text-muted-foreground max-sm:justify-center">
        <p className="whitespace-nowrap text-sm text-muted-foreground" aria-live="polite">
          Showing <span className="text-foreground">1</span> to{" "}
          <span className="text-foreground">10</span> of{" "}
          <span className="text-foreground">100</span> products
        </p>
      </div>
      <Pagination className="w-fit max-sm:mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label="Go to first page"
              size="icon"
              className="rounded-full"
            >
              <ChevronFirstIcon className="size-4" />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label="Go to previous page"
              size="icon"
              className="rounded-full"
            >
              <ChevronLeftIcon className="size-4" />
            </PaginationLink>
          </PaginationItem>
          {pages.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink href={`#${page}`} isActive={page === 2} className="rounded-full">
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <PaginationEllipsis />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>2 other pages</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label="Go to next page"
              size="icon"
              className="rounded-full"
            >
              <ChevronRightIcon className="size-4" />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label="Go to last page"
              size="icon"
              className="rounded-full"
            >
              <ChevronLastIcon className="size-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default TablePaginationDemo;
