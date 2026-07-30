import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/change-password")({
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const { changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const meetsLength = newPassword.length >= 8;
  const passwordsMatch = confirmPassword.length === 0 || newPassword === confirmPassword;
  const characterGroups = [
    /[a-z]/.test(newPassword),
    /[A-Z]/.test(newPassword),
    /\d/.test(newPassword),
    /[^A-Za-z0-9]/.test(newPassword),
  ].filter(Boolean).length;
  const strengthScore = newPassword
    ? Math.min(
        4,
        1 +
          (newPassword.length >= 8 ? 1 : 0) +
          (characterGroups >= 3 ? 1 : 0) +
          (newPassword.length >= 12 && characterGroups === 4 ? 1 : 0),
      )
    : 0;
  const strength = [
    { label: "", color: "bg-muted" },
    { label: "Weak", color: "bg-rose-500" },
    { label: "Fair", color: "bg-orange-500" },
    { label: "Strong", color: "bg-amber-500" },
    { label: "Very strong", color: "bg-emerald-500" },
  ][strengthScore] || { label: "", color: "bg-muted" };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const passwordError = getPasswordError(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(newPassword, confirmPassword);
      toast.success("Password changed");
      navigate({ to: "/" });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm space-y-5"
      >
        <div className="space-y-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold">Change temporary password</h1>
          <p className="text-sm text-muted-foreground">
            Your account is using a temporary password. Set a new password before continuing.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="pr-10"
              disabled={submitting}
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((current) => !current)}
              className="absolute right-0 top-0 grid h-9 w-10 place-items-center text-muted-foreground hover:text-foreground"
              aria-label={showNewPassword ? "Hide new password" : "Show new password"}
              aria-pressed={showNewPassword}
              disabled={submitting}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div
            className="grid grid-cols-4 gap-1"
            role="meter"
            aria-label="Password strength"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={strengthScore}
            aria-valuetext={strength.label || "No password entered"}
          >
            {[1, 2, 3, 4].map((segment) => (
              <div
                key={segment}
                className={cn(
                  "h-1 rounded-full transition-colors",
                  segment <= strengthScore ? strength.color : "bg-muted",
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Strength: {strength.label || "Enter a password"}
          </p>
          {!meetsLength && newPassword && (
            <p className="text-xs leading-5 text-muted-foreground">
              Use at least 8 characters to save this password.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="pr-10"
              disabled={submitting}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute right-0 top-0 grid h-9 w-10 place-items-center text-muted-foreground hover:text-foreground"
              aria-label={
                showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"
              }
              aria-pressed={showConfirmPassword}
              disabled={submitting}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword && (
            <p
              className={cn(
                "text-xs",
                passwordsMatch
                  ? "text-emerald-600 dark:text-emerald-300"
                  : "text-rose-600 dark:text-rose-300",
              )}
            >
              {passwordsMatch ? "Passwords match." : "Passwords do not match."}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={async () => {
              await logout();
              navigate({ to: "/login", search: { redirect: "/" } });
            }}
          >
            Sign out
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary text-white"
            disabled={submitting || !meetsLength || !confirmPassword || !passwordsMatch}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function getPasswordError(password: string) {
  if (password.length < 8) return "New password must be at least 8 characters";
  return "";
}
