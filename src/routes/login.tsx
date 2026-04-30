import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  username: z.string().trim().min(1, "Username required").max(50),
  password: z.string().min(1, "Password required").max(100),
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
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await login(data.username, data.password);
      toast.success("Welcome back!");
      navigate({ to: search.redirect || "/" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-[var(--navy)] text-[var(--navy-foreground)]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-lg bg-white/10">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm uppercase tracking-widest opacity-70">Republic of the Philippines</div>
            <div className="font-semibold">Municipality of Boac, Marinduque</div>
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-semibold leading-tight">
            Personnel Management<br />Information System
          </h2>
          <p className="mt-4 text-white/70 max-w-md text-sm">
            Centralized 201 files, plantilla, leave, and salary records for all
            employees of the Local Government Unit.
          </p>
        </div>
        <div className="text-xs text-white/50">
          © {new Date().getFullYear()} LGU Boac · Internal use only
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2">
            <div className="h-9 w-9 grid place-items-center rounded-lg bg-[var(--navy)] text-[var(--navy-foreground)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="font-semibold">Boac PMIS</div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your credentials to access the system.
          </p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4">
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
            <Button type="submit" className="w-full bg-[var(--navy)] text-[var(--navy-foreground)] hover:bg-[var(--navy)]/90" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="mt-8 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            <div className="font-medium text-foreground mb-1">Demo accounts</div>
            <div>admin / admin · HR Officer: hr / hr · Viewer: viewer / viewer</div>
          </div>
        </div>
      </div>
    </div>
  );
}
