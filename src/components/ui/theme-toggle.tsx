import { Moon, Sun } from "lucide-react";

import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useSettings();
  const dark = theme === "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        toggleTheme({ x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 });
      }}
      aria-label={label}
      title={label}
      className={cn(
        "relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-border/60 bg-background/75 text-muted-foreground shadow-sm backdrop-blur-md transition-[color,background-color,border-color,box-shadow,transform] duration-200 hover:bg-background hover:text-foreground hover:shadow-md active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <Sun
        className={cn(
          "absolute h-4 w-4 transition-[opacity,transform] duration-300 ease-out",
          dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0",
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-[opacity,transform] duration-300 ease-out",
          dark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100",
        )}
      />
    </button>
  );
}
