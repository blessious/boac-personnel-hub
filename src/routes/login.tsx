import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type Role, useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const schema = z.object({
  username: z.string().trim().min(1, "Username required").max(50),
  password: z.string().min(1, "Password required").max(100),
  role: z.enum(["Admin", "HR Officer", "Viewer"]),
});
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, login } = useAuth();
  const { agency } = useSettings();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "", role: "Viewer" },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await login(data.username, data.password, data.role as Role);
      toast.success("Welcome back!");
      const redirect = search.redirect || "/";
      if (redirect.startsWith("/employees/")) {
        const id = redirect.split("/").filter(Boolean).at(-1);
        if (id) {
          navigate({ to: "/employees/$id", params: { id } });
          return;
        }
      }
      if (redirect === "/" || redirect === "/employees" || redirect === "/leave" || redirect === "/reports" || redirect === "/settings") {
        navigate({ to: redirect });
      } else {
        navigate({ to: "/" });
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(30,58,95,0.09),transparent_45%),radial-gradient(circle_at_80%_15%,rgba(99,102,241,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.96),rgba(245,247,251,0.96))] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className={cn(
              "grid h-20 w-20 place-items-center rounded-full overflow-hidden",
              agency.logoUrl ? "" : "border-2 border-dashed border-[var(--navy)]/35 bg-[var(--navy)]/5"
            )}>
              {agency.logoUrl ? (
                <img src={agency.logoUrl} alt="Seal" className="h-full w-full object-contain" />
              ) : (
                <ShieldCheck className="h-8 w-8 text-[var(--navy)]" />
              )}
            </div>
            <div className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {agency.logoUrl ? "Agency Seal" : "Seal Placeholder"}
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">{agency.name} PMIS Login</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Personnel Management Information System
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" autoComplete="username" {...form.register("username")} />
              {form.formState.errors.username && (
                <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.watch("role")} onValueChange={(v) => form.setValue("role", v as Role, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="HR Officer">HR Officer</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-xs text-destructive">{form.formState.errors.role.message}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-md hover:shadow-blue-500/20 transition-all duration-200" 
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Login
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            <div className="font-medium text-foreground mb-1">Demo accounts</div>
            <div>admin / admin · HR Officer: hr / hr · Viewer: viewer / viewer</div>
          </div>

          <div className="mt-4 text-center text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} {agency.name}
          </div>
        </div>
      </div>
    </div>
  );
}
