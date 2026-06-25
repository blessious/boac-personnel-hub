import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import strhLogo from "@/STRH-logo.png";
import strhCover from "../../STRH-cover.jpg";

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
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });
  const passwordField = form.register("password");
  const logoSrc = agency.logoUrl || strhLogo;
  const bannerSrc = agency.bannerUrl || strhCover;
  const agencyName = agency.tagline || "SOUTHERN TAGALOG REGIONAL HOSPITAL";

  useEffect(() => {
    if (user) {
      navigate({ to: "/" });
      return;
    }
    form.reset({ username: "", password: "" });
    window.setTimeout(() => {
      if (passwordInputRef.current) passwordInputRef.current.value = "";
    }, 0);
  }, [user, navigate, form]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await login(data.username, data.password);
      form.reset({ username: "", password: "" });
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
    <main className="relative flex min-h-dvh overflow-hidden bg-white text-[#08275b] md:bg-[#f5f9ff] md:px-8 md:py-5 lg:px-10">
      <div
        className="absolute inset-x-0 top-0 h-[52dvh] bg-cover bg-center opacity-100 md:inset-0 md:h-auto md:bg-left-bottom md:opacity-85"
        style={{ backgroundImage: `url(${bannerSrc})` }}
      />
      <div className="absolute inset-x-0 top-0 h-[52dvh] bg-[linear-gradient(180deg,rgba(246,250,255,0.68)_0%,rgba(246,250,255,0.58)_42%,rgba(246,250,255,0.90)_100%)] md:inset-0 md:h-auto md:bg-[linear-gradient(100deg,rgba(246,250,255,0.98)_0%,rgba(246,250,255,0.94)_39%,rgba(246,250,255,0.78)_57%,rgba(246,250,255,0.98)_74%,rgba(246,250,255,1)_100%)]" />
      <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_38%_18%,rgba(0,75,170,0.10),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0)_0%,rgba(0,65,160,0.04)_100%)] md:block" />
      <div className="absolute -bottom-12 left-0 right-0 hidden h-24 rotate-[-2deg] bg-[#0047c7] md:block" />
      <div className="absolute -bottom-20 left-0 right-0 hidden h-24 rotate-[1.5deg] bg-[#0036a5] md:block" />

      <section className="relative z-10 mx-auto flex min-h-dvh w-full flex-col justify-end md:grid md:min-h-[calc(100vh-2.5rem)] md:max-w-6xl md:grid-cols-1 md:items-center md:gap-8 lg:grid-cols-[1fr_410px]">
        <div className="flex min-h-[52dvh] flex-col justify-between px-6 pb-9 pt-8 text-[#08275b] md:h-full md:min-h-[22rem] md:px-0 md:py-2 lg:py-6">
          <div className="flex items-center gap-3">
            <img
              src={logoSrc}
              alt={agencyName}
              className="h-11 w-11 rounded-full object-contain shadow-sm"
            />
            <div className="max-w-64 leading-tight">
              <div className="text-sm font-extrabold text-[#0b3f98]">STRH HRIS</div>
              <div className="text-[0.62rem] font-extrabold uppercase text-[#0b3f98]">
                {agencyName}
              </div>
            </div>
          </div>

          <div className="max-w-xl py-8 md:py-10 lg:py-0">
            <div className="mb-5 hidden text-[1.65rem] font-extrabold leading-none text-[#0643a1] md:block">
              HRIS
            </div>
            <p className="mb-2 hidden text-[0.68rem] font-bold uppercase text-[#0b3f98]/70 md:block">
              Human Resource Information System
            </p>
            <h1 className="max-w-lg text-[2rem] font-extrabold leading-[1.08] tracking-normal text-[#0b3f98] md:text-[2.4rem] sm:text-[3.35rem] lg:text-[3.1rem] xl:text-[3.45rem]">
              Streamlining
              <br />
              Human Resources
            </h1>
            <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-[#14325f] md:mt-5">
              A secure and efficient platform for managing employee records, attendance, and
              personnel information in support of modern government HR administration.
            </p>
          </div>

          <div className="mb-10 hidden w-fit items-center gap-2 rounded-lg border border-white/70 bg-white/80 px-4 py-3 text-[0.72rem] font-bold text-[#16417e] shadow-[0_14px_34px_rgba(7,44,107,0.12)] backdrop-blur md:inline-flex">
            <ShieldCheck className="h-4 w-4 text-[#0047c7]" />
            <span>Secure</span>
            <span className="h-1 w-1 rounded-full bg-[#87a8d8]" />
            <span>Reliable</span>
            <span className="h-1 w-1 rounded-full bg-[#87a8d8]" />
            <span>Efficient</span>
          </div>
        </div>

        <div className="flex justify-center md:justify-center lg:justify-end">
          <div className="w-full rounded-t-[2rem] border border-white bg-white px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-7 shadow-[0_-18px_46px_rgba(8,29,66,0.18)] md:max-w-[410px] md:rounded-xl md:border-white/80 md:bg-white/95 md:p-7 md:shadow-[0_24px_70px_rgba(21,56,112,0.18)] md:backdrop-blur">
            <div className="mb-7">
              <h2 className="text-2xl font-extrabold tracking-normal text-[#0b2454]">Sign in</h2>
              <p className="mt-1 text-xs font-semibold text-[#5e6c84]">
                Enter your official credentials to continue
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
              <div className="space-y-1.5">
                <Label
                  htmlFor="username"
                  className="text-[0.72rem] font-extrabold uppercase text-[#334e7c]"
                >
                  Username
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f91b1]" />
                  <Input
                    id="username"
                    autoComplete="username"
                    placeholder="e.g. jdelacruz"
                    className="h-11 rounded-xl border-[#dbe4f2] bg-white pl-11 text-sm text-[#0b2454] shadow-sm placeholder:text-[#7f91b1] focus-visible:border-[#0b57d0] focus-visible:ring-[#0b57d0]"
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
                  className="text-[0.72rem] font-extrabold uppercase text-[#334e7c]"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f91b1]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    placeholder="Password"
                    className="h-11 rounded-xl border-[#dbe4f2] bg-white pl-11 pr-11 text-sm text-[#0b2454] shadow-sm placeholder:text-[#7f91b1] focus-visible:border-[#0b57d0] focus-visible:ring-[#0b57d0]"
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
                    className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[#6d7f9f] transition-colors hover:bg-[#eef4ff] hover:text-[#0b2454] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0b57d0]"
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
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
              </Button>
            </form>

            <div className="mt-7 text-center">
              <div className="mx-auto flex max-w-[16rem] items-start justify-center gap-2 text-[0.72rem] font-semibold leading-5 text-[#73829d]">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0b57d0]" />
                <span>
                  Your information is secure
                  <br />
                  Protected by enterprise-grade security
                </span>
              </div>
            </div>

            <div className="mt-9 text-center text-[0.72rem] font-semibold text-[#6c7890] md:hidden">
              41 Information Technology Services (c) {new Date().getFullYear()}
            </div>
          </div>
        </div>

        <div className="absolute bottom-11 left-1/2 hidden -translate-x-1/2 text-[0.68rem] font-semibold text-[#526b91] lg:block">
          41 Information Technology Services (c) {new Date().getFullYear()}
        </div>
      </section>
    </main>
  );
}
