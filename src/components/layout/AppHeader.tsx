import { Bell, Moon, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useSettings();
  const dark = theme === "dark";

  const initials = user
    ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <header className="flex items-center justify-between gap-4 h-16 px-6 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-20">
      <div className="min-w-0">
        <h1 className="text-[18px] font-bold tracking-tight text-foreground/90">{title}</h1>
        {subtitle && <p className="text-[11px] text-muted-foreground/80 font-medium">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-muted/30 p-1 rounded-full border border-border/40 mr-2">
          <button
            onClick={toggleTheme}
            className="h-8 w-8 grid place-items-center rounded-full hover:bg-background hover:shadow-sm text-muted-foreground transition-all duration-200"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button 
            className="relative h-8 w-8 grid place-items-center rounded-full hover:bg-background hover:shadow-sm text-muted-foreground transition-all duration-200" 
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive ring-2 ring-background" />
          </button>
        </div>

        {user && (
          <div className="flex items-center gap-2.5 pl-2 py-1 border-l border-border/50">
            <div className="leading-tight text-right hidden sm:block">
              <div className="text-xs font-semibold">{user.name}</div>
              <div className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">{user.role}</div>
            </div>
            <Avatar className="h-8 w-8 ring-2 ring-primary/10 border border-border/50">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </header>
  );
}
