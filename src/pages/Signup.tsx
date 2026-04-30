import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TopBar } from "@/components/TopBar";
import { ArrowLeft, ArrowRight, Mail, LogIn } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Signup = () => {
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "signin" ? "signin" : "signup";
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const routeAfterAuth = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, financial_year, full_name, pan")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.onboarding_completed) {
      // Returning user with completed report → straight to report
      navigate("/report");
      return;
    }
    // Resume from where they dropped off
    if (profile?.full_name && profile?.pan) {
      navigate("/upload");
    } else {
      navigate("/profile");
    }
  };

  const submit = async () => {
    if (!email.trim() || !password) {
      toast.error("Enter email and password");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
            data: { role: "individual" },
          },
        });
        if (error) throw error;
        if (data.session && data.user) {
          toast.success("Account created");
          navigate("/profile");
        } else {
          toast.success("Check your email to verify your account");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.user) {
          toast.success("Welcome back");
          await routeAfterAuth(data.user.id);
        }
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar showCta={false} />
      <main className="container max-w-md py-10 sm:py-16">
        <div className="rounded-3xl border border-border bg-card p-7 shadow-card sm:p-9 animate-fade-in">
          <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
            {mode === "signup" ? <Mail className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signup"
              ? "We'll save your progress so you can pick up where you left off."
              : "Sign in to view your latest Tax Health Report."}
          </p>

          <div className="mt-7 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
          </div>

          <Button onClick={submit} variant="hero" size="lg" className="mt-6 w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"} <ArrowRight />
          </Button>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "signup" ? "Already have an account? " : "New to MAAV? "}
            <button
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1.5 px-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </main>
    </div>
  );
};

export default Signup;
