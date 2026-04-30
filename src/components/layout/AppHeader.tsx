import { Bell, Moon, Sun, Camera, Upload, X, LogOut, User as UserIcon } from "lucide-react";
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
import { useNavigate } from "@tanstack/react-router";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useSettings();
  const dark = theme === "dark";
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <>
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
