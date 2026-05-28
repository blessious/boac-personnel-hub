import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, Loader2, User, Lock } from "lucide-react";
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
    <div className="flex min-h-screen bg-background overflow-hidden font-sans">
      {/* Left Side: Hero Section */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{
            backgroundImage: agency.bannerUrl ? `url(${agency.bannerUrl})` : `url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')`,
          }}
        >
          {!agency.bannerUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
              <div className="relative z-10 text-center">
                <div className="text-white/40 text-sm font-bold uppercase tracking-[0.3em]"></div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-white/10" />
        </div>

        <div className="relative flex h-full items-center px-20">
          <div className="max-w-xl text-white">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-16 w-16 flex items-center justify-center">
                {agency.logoUrl ? (
                  <img src={agency.logoUrl} alt="Logo" className="h-full w-full object-contain drop-shadow-lg" />
                ) : (
                  <ShieldCheck className="h-14 w-14 text-white drop-shadow-md" />
                )}
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{agency.name || "HRPMIS"}</h2>
                <p className="text-white/70 font-medium uppercase tracking-widest text-xs mt-1">{agency.tagline}</p>
              </div>
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
              Personnel Management<br />
              <span className="text-white"> Information System</span>
            </h1>
            <p className="mt-6 text-xl text-white/80 max-w-md font-light leading-relaxed">
              A secure and efficient platform for modern government administration.
            </p>
          </div>
        </div>

      </div>

      {/* Right Side: Login Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-card shadow-2xl z-10">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="h-16 w-16 flex items-center justify-center">
                {agency.logoUrl ? (
                  <img src={agency.logoUrl} alt="Logo" className="h-full w-full object-contain drop-shadow-md" />
                ) : (
                  <ShieldCheck className="h-12 w-12 text-primary" />
                )}
              </div>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Sign in</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please enter your credentials to access your account
            </p>
          </div>

          <div className="mt-10">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                  <Input
                    id="username"
                    autoComplete="username"
                    placeholder="Enter username"
                    className="h-10 pl-8 bg-transparent border-t-0 border-x-0 border-b-2 border-border/60 rounded-none focus-visible:ring-0 focus:border-t-0 focus:border-x-0 focus:border-b-primary transition-none placeholder:text-muted-foreground/40 text-sm shadow-none"
                    {...form.register("username")}
                  />
                </div>
                {form.formState.errors.username && (
                  <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                  <a href="#" className="text-xs font-semibold text-primary hover:underline">Forgot Password?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-10 pl-8 bg-transparent border-t-0 border-x-0 border-b-2 border-border/60 rounded-none focus-visible:ring-0 focus:border-t-0 focus:border-x-0 focus:border-b-primary transition-none placeholder:text-muted-foreground/40 text-sm shadow-none"
                    {...form.register("password")}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Access Role</Label>
                <Select value={form.watch("role")} onValueChange={(v) => form.setValue("role", v as Role, { shouldValidate: true })}>
                  <SelectTrigger className="h-10 bg-transparent border-t-0 border-x-0 border-b-2 border-border/60 rounded-none focus:ring-0 focus:border-b-primary transition-none shadow-none px-0.5 outline-none text-sm shadow-none">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border shadow-2xl">
                    <SelectItem value="Admin" className="text-sm">Admin</SelectItem>
                    <SelectItem value="HR Officer" className="text-sm">HR Officer</SelectItem>
                    <SelectItem value="Viewer" className="text-sm">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.role.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary text-white hover:bg-primary/90 shadow-none transition-all duration-300 font-bold uppercase tracking-widest text-xs rounded-xl mt-4 active:scale-[0.98]"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-muted">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium tracking-widest">
                <span>© {new Date().getFullYear()}</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
