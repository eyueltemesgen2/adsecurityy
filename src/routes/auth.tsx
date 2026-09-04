import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/site/Logo";
import { AppearanceStyles } from "@/components/site/AppearanceStyles";
import { useAuth } from "@/hooks/use-auth";

type AuthSearch = { mode?: string; redirect?: string };

function safePath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    mode: search.mode === "register" || search.mode === "reset" ? search.mode : undefined,
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or create an account — AD Security Camera Solution" },
      {
        name: "description",
        content: "Access your customer portal to track orders, service requests and notifications.",
      },
      { property: "og:title", content: "Customer Login" },
      { property: "og:description", content: "Sign in to the AD Security customer portal." },
    ],
  }),
  component: AuthPage,
});

const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<string>(search.mode ?? "login");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const target = safePath(search.redirect);

  useEffect(() => {
    if (!loading && user) navigate({ to: target, replace: true });
  }, [loading, user, navigate, target]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    navigate({ to: target, replace: true });
  }

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      full_name: String(form.get("full_name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}${target}`,
        data: { full_name: parsed.data.full_name, phone: parsed.data.phone ?? "" },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setCheckEmail(true);
      toast.success("Account created — check your email to confirm");
      return;
    }
    toast.success("Account created");
    navigate({ to: target, replace: true });
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(String(form.get("email") ?? "").trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset link sent to your email");
    setMode("login");
  }

  async function googleSignIn() {
    setBusy(true);
    try {
      if (typeof window !== "undefined" && target !== "/account") {
        window.sessionStorage.setItem("ad-auth-redirect", target);
      }
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed. Please try again.");
        return;
      }
      if (result.redirected) return;
      navigate({ to: target, replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AppearanceStyles />
      <aside className="hidden flex-1 flex-col justify-between bg-surface p-10 text-surface-foreground lg:flex">
        <Logo invert />
        <div>
          <h2 className="max-w-md text-3xl font-bold leading-tight">
            Your security systems, orders and service history in one place.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-surface-foreground/80">
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-accent" /> Track orders and delivery status
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-accent" /> Book and follow up service requests
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-accent" /> Save addresses and get notifications
            </li>
          </ul>
        </div>
        <p className="text-xs text-surface-foreground/50">Secure customer portal</p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Logo />
          </div>

          {checkEmail ? (
            <div className="mt-8 border border-border bg-card p-8 text-center">
              <h1 className="text-xl font-bold">Confirm your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent you a confirmation link. Click it to activate your account, then sign in.
              </p>
              <Button className="mt-6 w-full" variant="outline" onClick={() => setCheckEmail(false)}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <div className="mt-8 border border-border bg-card p-6 sm:p-8">
              <h1 className="text-2xl font-bold">
                {mode === "register" ? "Create your account" : mode === "reset" ? "Reset password" : "Sign in"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {mode === "register"
                  ? "Order equipment and track service requests."
                  : mode === "reset"
                    ? "We'll email you a secure reset link."
                    : "Welcome back to your customer portal."}
              </p>

              {mode !== "reset" ? (
                <Tabs value={mode} onValueChange={setMode} className="mt-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Sign in</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                </Tabs>
              ) : null}

              {mode === "login" ? (
                <form onSubmit={signIn} className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" className="mt-2 h-11" required />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" className="mt-2 h-11" required />
                  </div>
                  <Button type="submit" className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={busy}>
                    {busy ? "Signing in…" : "Sign in"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-sm text-muted-foreground hover:text-accent"
                  >
                    Forgot your password?
                  </button>
                </form>
              ) : mode === "register" ? (
                <form onSubmit={register} className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="full_name">Full name</Label>
                    <Input id="full_name" name="full_name" className="mt-2 h-11" required />
                  </div>
                  <div>
                    <Label htmlFor="reg-email">Email</Label>
                    <Input id="reg-email" name="email" type="email" className="mt-2 h-11" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" className="mt-2 h-11" />
                  </div>
                  <div>
                    <Label htmlFor="reg-password">Password</Label>
                    <Input id="reg-password" name="password" type="password" className="mt-2 h-11" required />
                    <p className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>
                  </div>
                  <Button type="submit" className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={busy}>
                    {busy ? "Creating account…" : "Create account"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={resetPassword} className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="reset-email">Email</Label>
                    <Input id="reset-email" name="email" type="email" className="mt-2 h-11" required />
                  </div>
                  <Button type="submit" className="h-11 w-full" disabled={busy}>
                    {busy ? "Sending…" : "Send reset link"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-sm text-muted-foreground hover:text-accent"
                  >
                    Back to sign in
                  </button>
                </form>
              )}

              {mode !== "reset" ? (
                <>
                  <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                    <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
                  </div>
                  <Button variant="outline" className="h-11 w-full" onClick={() => void googleSignIn()} disabled={busy}>
                    Continue with Google
                  </Button>
                </>
              ) : null}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-accent">
              ← Back to website
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
