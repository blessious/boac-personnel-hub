import { Bell, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const initials = user
    ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <header className="flex items-center justify-between gap-4 h-16 px-6 border-b border-border bg-background sticky top-0 z-20">
      <div className="min-w-0">
        <h1 className="text-[20px] font-semibold tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDark((d) => !d)}
          className="h-9 w-9 grid place-items-center rounded-full hover:bg-accent text-muted-foreground"
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <button className="relative h-9 w-9 grid place-items-center rounded-full hover:bg-accent text-muted-foreground" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-destructive" />
        </button>
        {user && (
          <div className="flex items-center gap-2 pl-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="leading-tight hidden sm:block">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-[11px] text-muted-foreground">{user.role}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
