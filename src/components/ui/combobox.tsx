"use client";

import { useId, useState, type ButtonHTMLAttributes } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  description?: string;
  keywords?: readonly string[];
  disabled?: boolean;
  disabledDescription?: string;
};

type ComboboxProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  clearable?: boolean;
  clearLabel?: string;
  contentClassName?: string;
  triggerProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "onChange" | "onClick" | "value"
  > &
    Record<`data-${string}`, unknown>;
};

function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No matches found.",
  clearable = false,
  clearLabel = "Select...",
  contentClassName,
  triggerProps,
}: ComboboxProps) {
  const generatedId = useId();
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  const triggerId = triggerProps?.id || generatedId;

  const selectValue = (nextValue: string) => {
    onValueChange(nextValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          {...triggerProps}
          id={triggerId}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-9 w-full justify-between border border-input bg-background px-3 font-normal shadow-sm hover:bg-background focus-visible:ring-1 focus-visible:ring-ring dark:bg-neutral-950/60 dark:hover:bg-neutral-950/80",
            triggerProps?.className,
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          "max-h-[min(22rem,calc(100dvh-8rem))] w-[--radix-popover-trigger-width] overflow-hidden p-0",
          contentClassName,
        )}
        onWheelCapture={(event) => event.stopPropagation()}
        onTouchMoveCapture={(event) => event.stopPropagation()}
      >
        <Command
          className="max-h-[min(22rem,calc(100dvh-8rem))]"
          filter={(candidateValue, search) => {
            if (candidateValue === "__combobox-clear__") return 1;
            const option = options.find((item) => item.value === candidateValue);
            if (!option) return 0;
            const searchableText = [option.label, option.description, ...(option.keywords || [])]
              .filter(Boolean)
              .join(" ")
              .toLocaleLowerCase();
            return searchableText.includes(search.toLocaleLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[min(18rem,calc(100dvh-12rem))] overscroll-contain scrollbar-thin">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {clearable && (
                <CommandItem value="__combobox-clear__" onSelect={() => selectValue("")}>
                  <Check className={cn("size-4", value ? "opacity-0" : "opacity-100")} />
                  <span>{clearLabel}</span>
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  onSelect={() => selectValue(option.value)}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {(option.description || (option.disabled && option.disabledDescription)) && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {[option.description, option.disabled && option.disabledDescription]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { Combobox };
