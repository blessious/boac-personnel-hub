import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth, type PermissionKey, type User as AuthUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { useSettings } from "@/lib/settings-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import strhLogo from "@/assets/branding/STRH-logo.png";
import strhCover from "@/assets/branding/STRH-cover.jpg";

const schema = z.object({
  username: z.string().trim().min(1, "Username required").max(50),
  password: z.string().min(1, "Password required").max(100),
});
type FormData = z.infer<typeof schema>;

const setupSchema = z
  .object({
    name: z.string().trim().min(1, "Full name required").max(150),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(50)
      .regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dot, dash, or underscore"),
    password: z.string().min(8, "Password must be at least 8 characters").max(100),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type SetupFormData = z.infer<typeof setupSchema>;

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  component: LoginPage,
});

const KNOWN_STATIC_ROUTES = [
  "/",
  "/employees",
  "/employees/references",
  "/attendance",
  "/self-service",
  "/my-profile",
  "/requests",
  "/leave",
  "/reports",
  "/settings",
  "/admin",
  "/schedules",
  "/plantilla",
  "/movements",
  "/service-records",
] as const;

type KnownStaticRoute = (typeof KNOWN_STATIC_ROUTES)[number];

function isKnownRoute(value: string): value is KnownStaticRoute {
  return KNOWN_STATIC_ROUTES.includes(value as KnownStaticRoute);
}

function redirectPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    return url.pathname;
  } catch {
    return "/";
  }
}

function defaultRouteForUser(user: AuthUser) {
  const allowed = new Set(user.permissions || []);
  if (allowed.has("dashboard.view")) return "/";
  if (allowed.has("self_service.access")) return "/self-service";
  if (allowed.has("my_profile.access")) return "/my-profile";
  if (allowed.has("requests.access")) return "/requests";
  if (allowed.has("employees.read")) return "/employees";
  if (allowed.has("attendance.read")) return "/attendance";
  if (allowed.has("leave.read")) return "/leave";
  if (allowed.has("plantilla.read")) return "/plantilla";
  if (allowed.has("movements.read")) return "/movements";
  if (allowed.has("service_records.read")) return "/service-records";
  if (allowed.has("reports.view")) return "/reports";
  if (allowed.has("settings.manage")) return "/settings";
  return "/";
}

function canAccessRedirect(pathname: string, user: AuthUser) {
  const allowed = new Set<PermissionKey>(user.permissions || []);
  if (pathname === "/") return allowed.has("dashboard.view");
  if (pathname.startsWith("/self-service")) return allowed.has("self_service.access");
  if (pathname.startsWith("/my-profile")) return allowed.has("my_profile.access");
  if (pathname.startsWith("/requests")) return allowed.has("requests.access");
  if (pathname.startsWith("/admin")) {
    return ["admin.users", "admin.audit", "admin.errors", "role_permissions.manage"].some(
      (permission) => allowed.has(permission as PermissionKey),
    );
  }
  if (pathname.startsWith("/settings")) return allowed.has("settings.manage");
  if (pathname.startsWith("/leave")) return allowed.has("leave.read");
  if (pathname.startsWith("/attendance")) {
    return allowed.has("attendance.read") || allowed.has("self_service.access");
  }
  if (pathname.startsWith("/schedules")) return allowed.has("attendance.write");
  if (pathname.startsWith("/plantilla")) return allowed.has("plantilla.read");
  if (pathname.startsWith("/movements")) return allowed.has("movements.read");
  if (pathname.startsWith("/service-records")) return allowed.has("service_records.read");
  if (pathname.startsWith("/reports")) return allowed.has("reports.view");
  if (pathname.startsWith("/employees/references")) return allowed.has("settings.manage");
  if (pathname.startsWith("/employees/")) {
    return (
      allowed.has("employees.read") ||
      Boolean(user.employeeId && pathname === `/employees/${user.employeeId}`)
    );
  }
  if (pathname.startsWith("/employees")) return allowed.has("employees.read");
  return false;
}

function allowedRedirectForUser(redirect: string, user: AuthUser) {
  const path = redirectPath(redirect);
  return canAccessRedirect(path, user) ? path : defaultRouteForUser(user);
}

function LoginPage() {
  const { user, login } = useAuth();
  const { agency, agencyLoaded } = useSettings();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [submitting, setSubmitting] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [exiting, setExiting] = useState(false);
  const pendingRedirectRef = useRef<string | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });
  const setupForm = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: "System Administrator",
      username: "admin",
      password: "",
      confirmPassword: "",
    },
  });
  const passwordField = form.register("password");
  const logoSrc = agencyLoaded ? agency.logoUrl || strhLogo : "";
  const bannerSrc = agencyLoaded ? agency.bannerUrl || strhCover : "";
  const agencyLabel = agency.name || "LGU BOAC";
  const agencyName = agency.tagline || "Municipality of Boac Marinduque";

  useEffect(() => {
    let alive = true;
    api<{ setupRequired: boolean }>("/api/auth/bootstrap-status")
      .then((result) => {
        if (alive) setSetupRequired(result.setupRequired);
      })
      .catch(() => {
        if (alive) setSetupRequired(false);
      })
      .finally(() => {
        if (alive) setCheckingSetup(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (user && !exiting) {
      navigate({ to: "/" });
      return;
    }
    if (!user) {
      form.reset({ username: "", password: "" });
      window.setTimeout(() => {
        if (passwordInputRef.current) passwordInputRef.current.value = "";
      }, 0);
    }
  }, [user, navigate, form, exiting]);

  const doNavigate = (redirect: string, redirectUser: AuthUser) => {
    const target = allowedRedirectForUser(redirect, redirectUser);
    if (target.startsWith("/employees/")) {
      const id = target.split("/").filter(Boolean).at(-1);
      if (id) {
        navigate({ to: "/employees/$id", params: { id } });
        return;
      }
    }
    if (isKnownRoute(target)) {
      navigate({ to: target });
    } else {
      navigate({ to: "/" });
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const loggedInUser = await login(data.username, data.password);
      form.reset({ username: "", password: "" });
      toast.success("Welcome back!");
      const redirect = search.redirect || "/";
      // Start exit animation, then navigate after it finishes
      pendingRedirectRef.current = redirect;
      setExiting(true);
      setTimeout(() => {
        doNavigate(pendingRedirectRef.current || "/", loggedInUser);
      }, 600);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const onSetupSubmit = async (data: SetupFormData) => {
    setSubmitting(true);
    try {
      await api<{ ok: boolean; username: string }>("/api/auth/bootstrap-super-admin", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const loggedInUser = await login(data.username, data.password);
      setupForm.reset({
        name: "System Administrator",
        username: "admin",
        password: "",
        confirmPassword: "",
      });
      toast.success("Super Admin account created");
      pendingRedirectRef.current = "/";
      setExiting(true);
      setTimeout(() => {
        doNavigate("/", loggedInUser);
      }, 600);
    } catch (e) {
      toast.error((e as Error).message);
      api<{ setupRequired: boolean }>("/api/auth/bootstrap-status")
        .then((result) => setSetupRequired(result.setupRequired))
        .catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      className={`relative flex min-h-dvh overflow-hidden bg-white text-[#08275b] dark:bg-[#07111f] dark:text-slate-100 md:bg-[#f5f9ff] md:px-8 md:py-5 md:dark:bg-[#07111f] lg:px-10${exiting ? " login-page-fade-out" : ""}`}
    >
      <div
        className="absolute inset-x-0 top-0 h-[52dvh] bg-cover bg-center opacity-100 transition-opacity duration-500 dark:opacity-40 md:inset-0 md:h-auto md:bg-left-bottom md:opacity-85 md:dark:opacity-30"
        style={bannerSrc ? { backgroundImage: `url(${bannerSrc})` } : undefined}
      />
      <div className="absolute inset-x-0 top-0 h-[52dvh] bg-[linear-gradient(180deg,rgba(246,250,255,0.60)_0%,rgba(246,250,255,0.50)_42%,rgba(246,250,255,0.86)_100%)] dark:bg-[linear-gradient(180deg,rgba(7,17,31,0.30)_0%,rgba(7,17,31,0.56)_48%,rgba(7,17,31,0.96)_100%)] md:inset-0 md:h-auto md:bg-[linear-gradient(100deg,rgba(246,250,255,0.94)_0%,rgba(246,250,255,0.88)_39%,rgba(246,250,255,0.70)_57%,rgba(246,250,255,0.94)_74%,rgba(246,250,255,0.98)_100%)] md:dark:bg-[linear-gradient(100deg,rgba(7,17,31,0.94)_0%,rgba(7,17,31,0.86)_42%,rgba(7,17,31,0.62)_60%,rgba(7,17,31,0.90)_78%,rgba(7,17,31,0.98)_100%)]" />
      <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_38%_18%,rgba(0,75,170,0.10),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0)_0%,rgba(0,65,160,0.04)_100%)] dark:bg-[radial-gradient(circle_at_38%_18%,rgba(37,99,235,0.16),transparent_30%),linear-gradient(135deg,rgba(7,17,31,0)_0%,rgba(2,6,23,0.35)_100%)] md:block" />
      <div className="absolute -bottom-12 left-0 right-0 hidden h-24 rotate-[-2deg] bg-[#0047c7] md:block" />
      <div className="absolute -bottom-20 left-0 right-0 hidden h-24 rotate-[1.5deg] bg-[#0036a5] md:block" />
      <ThemeToggle className="absolute right-5 top-5 z-20 border-white/60 bg-white/80 text-[#16417e] shadow-[0_8px_24px_rgba(8,29,66,0.14)] dark:border-white/10 dark:bg-slate-950/65 dark:text-slate-200 md:right-9 md:top-8" />

      <section className="relative z-10 mx-auto flex min-h-dvh w-full flex-col justify-end md:grid md:min-h-[calc(100vh-2.5rem)] md:max-w-6xl md:grid-cols-1 md:items-center md:gap-8 lg:grid-cols-[1fr_410px]">
        <div
          className={`flex min-h-[52dvh] flex-col justify-between px-6 pb-9 pt-8 text-[#08275b] dark:text-slate-100 md:h-full md:min-h-[22rem] md:px-0 md:py-2 lg:py-6${exiting ? " login-exit-left" : " login-enter-left"}`}
        >
          <div className="flex items-center gap-3">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={agencyName}
                className="h-11 w-11 rounded-full object-contain shadow-sm"
              />
            ) : (
              <div className="h-11 w-11 rounded-full bg-white/55 shadow-sm dark:bg-white/10" />
            )}
            <div className="max-w-64 leading-tight">
              <div className="text-sm font-extrabold text-[#0b3f98] dark:text-blue-200">
                {agencyLabel} HRIS
              </div>
              <div className="text-[0.62rem] font-extrabold uppercase text-[#0b3f98] dark:text-blue-200">
                {agencyName}
              </div>
            </div>
          </div>

          <div className="max-w-xl py-8 md:py-10 lg:py-0">
            <div className="mb-5 hidden text-[1.65rem] font-extrabold leading-none text-[#0643a1] dark:text-blue-200 md:block">
              HRIS
            </div>
            <p className="mb-2 hidden text-[0.68rem] font-bold uppercase text-[#0b3f98]/70 dark:text-blue-200/70 md:block">
              Human Resource Information System
            </p>
            <h1 className="max-w-lg text-[2rem] font-extrabold leading-[1.08] tracking-normal text-[#0b3f98] dark:text-blue-100 md:text-[2.4rem] sm:text-[3.35rem] lg:text-[3.1rem] xl:text-[3.45rem]">
              Streamlining
              <br />
              Human Resources
            </h1>
            <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-[#14325f] dark:text-slate-300 md:mt-5">
              A secure and efficient platform for managing employee records, attendance, and
              personnel information in support of modern government HR administration.
            </p>
          </div>

          <div className="mb-10 hidden w-fit items-center gap-2 rounded-lg border border-white/70 bg-white/80 px-4 py-3 text-[0.72rem] font-bold text-[#16417e] shadow-[0_14px_34px_rgba(7,44,107,0.12)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55 dark:text-slate-300 dark:shadow-black/20 md:inline-flex">
            <ShieldCheck className="h-4 w-4 text-[#0047c7] dark:text-blue-300" />
            <span>Secure</span>
            <span className="h-1 w-1 rounded-full bg-[#87a8d8]" />
            <span>Reliable</span>
            <span className="h-1 w-1 rounded-full bg-[#87a8d8]" />
            <span>Efficient</span>
          </div>
        </div>

        <div
          className={`flex justify-center md:justify-center lg:justify-end${exiting ? " login-exit-right" : " login-enter-right"}`}
        >
          <div className="w-full rounded-t-[2rem] border border-white bg-white px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-7 shadow-[0_-18px_46px_rgba(8,29,66,0.18)] dark:border-white/10 dark:bg-[#111c2b] dark:shadow-[0_-18px_46px_rgba(0,0,0,0.42)] md:max-w-[410px] md:rounded-xl md:border-white/80 md:bg-white/95 md:p-7 md:shadow-[0_24px_70px_rgba(21,56,112,0.18)] md:backdrop-blur md:dark:border-white/10 md:dark:bg-[#111c2b]/95 md:dark:shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
            <div className="mb-7">
              <h2 className="text-2xl font-extrabold tracking-normal text-[#0b2454] dark:text-slate-50">
                {setupRequired ? "Create Super Admin" : "Sign in"}
              </h2>
              <p className="mt-1 text-xs font-semibold text-[#5e6c84] dark:text-slate-400">
                {setupRequired
                  ? "No users were found. Create the first administrator account."
                  : "Enter your official credentials to continue"}
              </p>
            </div>

            {setupRequired ? (
              <form
                onSubmit={setupForm.handleSubmit(onSetupSubmit)}
                className="space-y-4"
                autoComplete="off"
              >
                <div className="space-y-1.5">
                  <Label
                    htmlFor="setup-name"
                    className="text-[0.72rem] font-extrabold uppercase text-[#334e7c] dark:text-slate-300"
                  >
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f91b1] dark:text-slate-500" />
                    <Input
                      id="setup-name"
                      autoComplete="name"
                      className="h-11 rounded-xl border-[#dbe4f2] bg-white pl-11 text-sm text-[#0b2454] shadow-sm placeholder:text-[#7f91b1] focus-visible:border-[#0b57d0] focus-visible:ring-[#0b57d0] dark:border-white/10 dark:bg-[#0b1422] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-500"
                      {...setupForm.register("name")}
                    />
                  </div>
                  {setupForm.formState.errors.name && (
                    <p className="text-xs font-medium text-destructive">
                      {setupForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="setup-username"
                    className="text-[0.72rem] font-extrabold uppercase text-[#334e7c] dark:text-slate-300"
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f91b1] dark:text-slate-500" />
                    <Input
                      id="setup-username"
                      autoComplete="username"
                      className="h-11 rounded-xl border-[#dbe4f2] bg-white pl-11 text-sm text-[#0b2454] shadow-sm placeholder:text-[#7f91b1] focus-visible:border-[#0b57d0] focus-visible:ring-[#0b57d0] dark:border-white/10 dark:bg-[#0b1422] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-500"
                      {...setupForm.register("username")}
                    />
                  </div>
                  {setupForm.formState.errors.username && (
                    <p className="text-xs font-medium text-destructive">
                      {setupForm.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="setup-password"
                      className="text-[0.72rem] font-extrabold uppercase text-[#334e7c] dark:text-slate-300"
                    >
                      Password
                    </Label>
                    <Input
                      id="setup-password"
                      type="password"
                      autoComplete="new-password"
                      className="h-11 rounded-xl border-[#dbe4f2] bg-white text-sm text-[#0b2454] shadow-sm placeholder:text-[#7f91b1] focus-visible:border-[#0b57d0] focus-visible:ring-[#0b57d0] dark:border-white/10 dark:bg-[#0b1422] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-500"
                      {...setupForm.register("password")}
                    />
                    {setupForm.formState.errors.password && (
                      <p className="text-xs font-medium text-destructive">
                        {setupForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="setup-confirm-password"
                      className="text-[0.72rem] font-extrabold uppercase text-[#334e7c] dark:text-slate-300"
                    >
                      Confirm
                    </Label>
                    <Input
                      id="setup-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      className="h-11 rounded-xl border-[#dbe4f2] bg-white text-sm text-[#0b2454] shadow-sm placeholder:text-[#7f91b1] focus-visible:border-[#0b57d0] focus-visible:ring-[#0b57d0] dark:border-white/10 dark:bg-[#0b1422] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-500"
                      {...setupForm.register("confirmPassword")}
                    />
                    {setupForm.formState.errors.confirmPassword && (
                      <p className="text-xs font-medium text-destructive">
                        {setupForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-[#0b57d0] text-xs font-extrabold uppercase text-white shadow-[0_10px_18px_rgba(11,87,208,0.22)] transition-colors hover:bg-[#0647ad]"
                  disabled={submitting || checkingSetup}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Super Admin"}
                </Button>
              </form>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="username"
                    className="text-[0.72rem] font-extrabold uppercase text-[#334e7c] dark:text-slate-300"
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f91b1] dark:text-slate-500" />
                    <Input
                      id="username"
                      autoComplete="username"
                      placeholder="e.g. jdelacruz"
                      className="h-11 rounded-xl border-[#dbe4f2] bg-white pl-11 text-sm text-[#0b2454] shadow-sm placeholder:text-[#7f91b1] focus-visible:border-[#0b57d0] focus-visible:ring-[#0b57d0] dark:border-white/10 dark:bg-[#0b1422] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-500"
                      {...form.register("username")}
                    />
                  </div>
                  {form.formState.errors.username && (
                    <p className="text-xs font-medium text-destructive">
                      {form.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-[0.72rem] font-extrabold uppercase text-[#334e7c] dark:text-slate-300"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f91b1] dark:text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      placeholder="Password"
                      className="h-11 rounded-xl border-[#dbe4f2] bg-white pl-11 pr-11 text-sm text-[#0b2454] shadow-sm placeholder:text-[#7f91b1] focus-visible:border-[#0b57d0] focus-visible:ring-[#0b57d0] dark:border-white/10 dark:bg-[#0b1422] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-500"
                      {...passwordField}
                      ref={(element) => {
                        passwordField.ref(element);
                        passwordInputRef.current = element;
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[#6d7f9f] transition-colors hover:bg-[#eef4ff] hover:text-[#0b2454] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0b57d0] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100 dark:focus-visible:ring-blue-500"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-xs font-medium text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-[#0b57d0] text-xs font-extrabold uppercase text-white shadow-[0_10px_18px_rgba(11,87,208,0.22)] transition-colors hover:bg-[#0647ad]"
                  disabled={submitting || checkingSetup}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
            )}

            <div className="mt-9 text-center text-[0.72rem] font-semibold text-[#6c7890] dark:text-slate-500 md:hidden">
              Municipality of Boac © {new Date().getFullYear()}
            </div>
          </div>
        </div>

        <div className="absolute bottom-11 left-1/2 hidden -translate-x-1/2 text-[0.68rem] font-semibold text-[#526b91] dark:text-slate-500 lg:block">
          Municipality of Boac © {new Date().getFullYear()}
        </div>
      </section>
    </main>
  );
}
