import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, Loader2, User, Lock, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings-context";
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
  const { agency } = useSettings();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const redirect = search.redirect || "/";
      if (redirect.startsWith("/employees/")) {
        const id = redirect.split("/").filter(Boolean).at(-1);
        if (id) {
          navigate({ to: "/employees/$id", params: { id } });
          return;
        }
      }
      if (
        redirect === "/" ||
        redirect === "/employees" ||
        redirect === "/attendance" ||
        redirect === "/self-service" ||
        redirect === "/leave" ||
        redirect === "/reports" ||
        redirect === "/settings" ||
        redirect === "/admin"
      ) {
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
            backgroundImage: agency.bannerUrl
              ? `url(${agency.bannerUrl})`
              : `url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')`,
          }}
        >
          {!agency.bannerUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="relative z-10 text-center">
                <div className="mx-auto h-32 w-32 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-6 shadow-2xl animate-pulse">
                  <ShieldCheck className="h-16 w-16 text-white" />
                </div>
                <div className="text-white/40 text-sm font-bold uppercase tracking-[0.3em]">
                  Agency Branding Placeholder
                </div>
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
                  <img
                    src={agency.logoUrl}
                    alt="Logo"
                    className="h-full w-full object-contain drop-shadow-lg"
                  />
                ) : (
                  <ShieldCheck className="h-14 w-14 text-white drop-shadow-md" />
                )}
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{agency.name || "HRPMIS"}</h2>
                <p className="text-white/70 font-medium uppercase tracking-widest text-xs mt-1">
                  {agency.tagline}
                </p>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
              Streamlining <br />
              <span className="text-white">Human Resources</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-lg font-light leading-relaxed text-pretty">
              A secure and efficient platform for managing employee records, attendance, and
              personnel information in support of modern government HR administration.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-24 xl:px-32 bg-background z-10 border-l border-border/50 shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="mx-auto w-full max-w-sm">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-8">
              <div className="h-16 w-16 flex items-center justify-center bg-[#0033a0] rounded-2xl shadow-lg p-3">
                {agency.logoUrl ? (
                  <img src={agency.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <ShieldCheck className="h-10 w-10 text-white" />
                )}
              </div>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Sign in</h2>
            <p className="mt-2 text-sm text-muted-foreground font-medium">
              Enter your official credentials to continue
            </p>
          </div>

          <div className="mt-10">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Username
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <User className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <Input
                    id="username"
                    autoComplete="username"
                    placeholder="e.g. jdelacruz"
                    className="h-12 pl-10 bg-card border-border/60 rounded-xl focus-visible:ring-1 focus-visible:ring-[#0033a0] focus-visible:border-[#0033a0] transition-colors shadow-sm text-sm"
                    {...form.register("username")}
                  />
                </div>
                {form.formState.errors.username && (
                  <p className="text-xs font-medium text-destructive mt-1">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-12 pl-10 pr-12 bg-card border-border/60 rounded-xl focus-visible:ring-1 focus-visible:ring-[#0033a0] focus-visible:border-[#0033a0] transition-colors shadow-sm text-sm"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground/70 transition-colors hover:text-foreground focus:outline-none focus-visible:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs font-medium text-destructive mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#0033a0] text-white hover:bg-[#002270] shadow-md hover:shadow-lg transition-all duration-200 font-bold uppercase tracking-widest text-xs rounded-xl mt-6"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <div className="mt-10 pt-6 border-t border-border/60 flex items-center justify-center">
              <div className="text-xs text-muted-foreground/60 font-semibold tracking-wider ">
                41 Information Technology Services © {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
