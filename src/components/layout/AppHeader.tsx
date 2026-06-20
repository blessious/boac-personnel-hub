import {
  Bell,
  ClipboardList,
  Moon,
  Sun,
  Upload,
  X,
  LogOut,
  User as UserIcon,
  Menu,
  ShieldCheck,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { listLeaveApplications } from "@/lib/leave-api";
import { listDtrCorrectionRequests } from "@/lib/attendance-api";
import { useRealtime } from "@/lib/realtime";
import { cn } from "@/lib/utils";
import { navForRole } from "@/components/layout/navigation";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggleTheme, agency } = useSettings();
  const dark = theme === "dark";
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [formData, setFormData] = useState({ name: "", photoUrl: "" });
  const canSeeLeaveNotifications = user?.role === "Admin" || user?.role === "HR";
  const { connected, notifications, unreadCount, markRead, markAllRead } = useRealtime();

  const { data: leaveNotifications } = useQuery({
    queryKey: ["leave-notifications", user?.role],
    queryFn: () => listLeaveApplications({ status: "Pending" }),
    enabled: canSeeLeaveNotifications,
  });

  const { data: dtrNotifications } = useQuery({
    queryKey: ["dtr-correction-notifications", user?.role],
    queryFn: () => listDtrCorrectionRequests({ status: "Pending" }),
    enabled: canSeeLeaveNotifications,
  });

  const pendingLeaveCount = leaveNotifications?.summary.pending || 0;
  const pendingDtrCount = dtrNotifications?.requests.length || 0;

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name, photoUrl: user.photoUrl || "" });
    }
  }, [user]);

  const initials = user
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
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
    navigate({ to: "/login", search: { redirect: "/" } });
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  const mobileNav = navForRole(user?.role);

  return (
    <>
      <header className="mobile-app-header flex h-16 items-center justify-between gap-3 border-b border-border/50 bg-background/90 px-3 backdrop-blur-md md:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-[min(88vw,340px)] flex-col border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
            >
              <div className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
                <div
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl",
                    agency.logoUrl
                      ? ""
                      : "bg-[var(--navy)] text-[var(--navy-foreground)] shadow-sm",
                  )}
                >
                  {agency.logoUrl ? (
                    <img src={agency.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="break-words text-sm font-semibold">{agency.name} PMIS</div>
                  <div className="break-words text-[11px] text-muted-foreground">
                    {agency.tagline}
                  </div>
                </div>
              </div>
              <div className="px-4 pt-5 pb-2 text-[10px] tracking-widest uppercase text-muted-foreground">
                Menu
              </div>
              <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-2">
                {mobileNav.map((item) => {
                  const active = isActive(item.to, item.exact);
                  const Icon = item.icon;
                  const itemPendingCount =
                    item.to === "/leave"
                      ? pendingLeaveCount
                      : item.to === "/attendance"
                        ? pendingDtrCount
                        : 0;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "group flex min-h-12 items-center gap-3 rounded-2xl px-3.5 py-3 text-[14px] font-medium transition-all duration-200",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110",
                          active
                            ? "text-primary-foreground"
                            : "text-muted-foreground group-hover:text-foreground",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                      {itemPendingCount > 0 && (
                        <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                          {itemPendingCount > 99 ? "99+" : itemPendingCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-sidebar-border/50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                {user && (
                  <div className="mb-3 rounded-2xl bg-muted/40 px-3 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Logged in as
                    </div>
                    <div className="break-words text-sm font-semibold text-sidebar-foreground">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{user.role}</div>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="group flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-translate-x-1" />
                  <span>Log Out</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-bold tracking-tight text-foreground/90 md:text-[18px]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground/80 font-medium truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <div className="mr-0 flex items-center rounded-full border border-border/40 bg-muted/30 p-1 md:mr-2">
            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-background hover:shadow-sm md:h-8 md:w-8"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-background hover:shadow-sm md:h-8 md:w-8"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-4 text-destructive-foreground ring-2 ring-background">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="max-h-[min(32rem,75vh)] w-80 overflow-y-auto"
              >
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  <span className="flex items-center gap-1 text-[10px] font-normal text-muted-foreground">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        connected ? "bg-emerald-500" : "bg-amber-500",
                      )}
                    />
                    {connected ? "Live" : "Reconnecting"}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.slice(0, 10).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={async () => {
                      await markRead(notification.id);
                      if (notification.path) window.location.assign(notification.path);
                    }}
                    className={cn(
                      "cursor-pointer items-start gap-2",
                      !notification.readAt && "bg-primary/5",
                    )}
                  >
                    <span className="relative mt-0.5">
                      <Bell className="h-4 w-4 text-primary" />
                      {!notification.readAt && (
                        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive ring-1 ring-background" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{notification.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-[10px] text-muted-foreground/70">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))}
                {unreadCount > 0 && (
                  <>
                    <DropdownMenuItem
                      onClick={markAllRead}
                      className="justify-center gap-2 text-xs"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all as read
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {canSeeLeaveNotifications && pendingDtrCount > 0 && (
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/attendance" })}
                    className="cursor-pointer items-start gap-2"
                  >
                    <ClipboardList className="mt-0.5 h-4 w-4 text-blue-600" />
                    <span>
                      <span className="block text-sm font-medium">
                        {pendingDtrCount} pending DTR request{pendingDtrCount === 1 ? "" : "s"}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Open Attendance to review.
                      </span>
                    </span>
                  </DropdownMenuItem>
                )}
                {canSeeLeaveNotifications && pendingLeaveCount > 0 ? (
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/leave" })}
                    className="cursor-pointer items-start gap-2"
                  >
                    <ClipboardList className="mt-0.5 h-4 w-4 text-amber-600" />
                    <span>
                      <span className="block text-sm font-medium">
                        {pendingLeaveCount} pending leave request
                        {pendingLeaveCount === 1 ? "" : "s"}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Open Leave Management to review.
                      </span>
                    </span>
                  </DropdownMenuItem>
                ) : pendingDtrCount === 0 && notifications.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No notifications.
                  </div>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {user && (
            <div className="flex min-w-0 items-center gap-2.5 border-l border-border/50 py-1 pl-2">
              <div className="hidden max-w-[min(34vw,18rem)] text-right leading-tight sm:block">
                <div className="break-words text-xs font-semibold leading-snug">{user.name}</div>
                <div className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">
                  {user.role}
                </div>
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
                  <DropdownMenuItem
                    onClick={() => setShowProfileDialog(true)}
                    className="cursor-pointer"
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Edit Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
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
              <Label
                htmlFor="profile-photo-upload"
                className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20"
              >
                <Upload className="h-3.5 w-3.5" />{" "}
                {formData.photoUrl ? "Change Photo" : "Upload Photo"}
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
                    reader.onloadend = () =>
                      setFormData({ ...formData, photoUrl: reader.result as string });
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
              <p className="text-[10px] text-muted-foreground">
                Your role is managed by the system administrator.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowProfileDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
              onClick={handleSaveProfile}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
