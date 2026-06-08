import { Bell, Moon, Sun, Camera, Upload, X, LogOut, User as UserIcon, Menu, LayoutDashboard, Users, FileText, CalendarDays, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggleTheme, agency } = useSettings();
  const dark = theme === "dark";
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [formData, setFormData] = useState({ name: "", photoUrl: "" });

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name, photoUrl: user.photoUrl || "" });
    }
  }, [user]);

  const initials = user
    ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const handleSaveProfile = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error("Name is required");
        return;
      }
      await updateProfile({ name: formData.name.trim(), photoUrl: formData.photoUrl });
      toast.success("Profile updated successfully");
      setShowProfileDialog(false);
    } catch (e) {
      toast.error("Failed to update profile");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  const isActive = (to: string, exact?: boolean) => exact ? path === to : path === to || path.startsWith(to + "/");

  const NAV: { to: "/" | "/employees" | "/leave" | "/reports" | "/settings" | "/self-service"; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/employees", label: "Employees", icon: Users },
    { to: "/leave", label: "Leave Management", icon: CalendarDays },
    { to: "/self-service", label: "Self-Service", icon: UserIcon },
    { to: "/reports", label: "Reports", icon: FileText },
    { to: "/settings", label: "Settings", icon: SettingsIcon },
  ];
  const mobileNav = NAV.filter((item) => {
    if (!user) return false;
    if (user.role === "Admin") return true;
    if (item.to === "/" || item.to === "/self-service") return true;
    if (user.role === "Employee") return false;
    return item.to !== "/settings";
  });

  return (
    <>
      <header className="flex items-center justify-between gap-4 h-16 px-4 md:px-6 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden shrink-0 h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
              <div className="flex items-center gap-2 h-16 border-b border-sidebar-border px-4 shrink-0">
                <div className={cn(
                  "rounded-lg grid place-items-center shrink-0 overflow-hidden h-9 w-9",
                  agency.logoUrl ? "" : "bg-[var(--navy)] text-[var(--navy-foreground)] shadow-sm"
                )}>
                  {agency.logoUrl ? (
                    <img src={agency.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}
                </div>
                <div className="leading-tight overflow-hidden flex-1">
                  <div className="font-semibold text-sm truncate">{agency.name} PMIS</div>
                  <div className="text-[11px] text-muted-foreground truncate">{agency.tagline}</div>
                </div>
              </div>
              <div className="px-4 pt-4 pb-2 text-[10px] tracking-widest uppercase text-muted-foreground">Menu</div>
              <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 py-2">
                {mobileNav.map((item) => {
                  const active = isActive(item.to, item.exact);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-200",
                        active ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(var(--primary),0.1)]" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-sidebar-border/50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group"
                >
                  <LogOut className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-translate-x-1" />
                  <span>Log Out</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold tracking-tight text-foreground/90 truncate">{title}</h1>
            {subtitle && <p className="text-[11px] text-muted-foreground/80 font-medium truncate hidden sm:block">{subtitle}</p>}
          </div>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/10 border border-border/50 cursor-pointer hover:ring-primary/30 transition-all">
                      <AvatarImage src={user.photoUrl} alt={user.name} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowProfileDialog(true)} className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Edit Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-border shadow-sm">
                  <AvatarImage src={formData.photoUrl} alt="Preview" className="object-cover" />
                  <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {formData.photoUrl ? (
                  <button 
                    onClick={() => setFormData({ ...formData, photoUrl: "" })}
                    className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-destructive text-destructive-foreground grid place-items-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              <Label htmlFor="profile-photo-upload" className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20">
                <Upload className="h-3.5 w-3.5" /> {formData.photoUrl ? "Change Photo" : "Upload Photo"}
              </Label>
              <input 
                id="profile-photo-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setFormData({ ...formData, photoUrl: reader.result as string });
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Display Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                className="h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <Input
                value={user?.role || ""}
                disabled
                className="h-10 bg-muted/50 text-muted-foreground"
              />
              <p className="text-[10px] text-muted-foreground">Your role is managed by the system administrator.</p>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowProfileDialog(false)}>Cancel</Button>
            <Button className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]" onClick={handleSaveProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
