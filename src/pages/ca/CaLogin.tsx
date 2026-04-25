import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopBar } from "@/components/TopBar";
import { ArrowLeft, ArrowRight, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CaLogin = () => {
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = async () => {
    if (mode === "reset") {
      if (!email) {
        toast.error("Enter your email to receive a reset link");
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/ca/login`,
        });
        if (error) throw error;
        toast.success("Password reset link sent. Check your email.");
        setMode("signin");
      } catch (e: any) {
        toast.error(e.message ?? "Failed to send reset link");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!name || !firm || !membershipNumber) {
          toast.error("Name, firm, and ICAI membership number are required");
          setLoading(false);
          return;
        }
        if (!/^\d{6}$/.test(membershipNumber.trim())) {
          toast.error("Enter a valid 6-digit ICAI membership number");
          setLoading(false);
          return;
        }
        const redirectUrl = `${window.location.origin}/mitra`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: name, firm_name: firm, phone, membership_number: membershipNumber.trim(), role: "ca" },
          },
        });
        if (error) throw error;
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) throw signInErr;
        }
        toast.success("Welcome to Maav Mitra");
        navigate("/mitra");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        navigate("/mitra");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar showCta={false} />
      <main className="container max-w-md py-10 sm:py-16">
        <div className="rounded-3xl border border-border bg-card p-7 shadow-card sm:p-9 animate-fade-in">
          <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-accent text-primary">
            <Briefcase className="h-5 w-5" />
          </div>

          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Maav Mitra</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
            {mode === "signin" ? "CA sign in" : mode === "signup" ? "Create your CA workspace" : "Reset your password"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Access your client pipeline."
              : mode === "signup"
              ? "Manage clients, reviews, and filings."
              : "Enter your email and we'll send you a reset link."}
          </p>

          <div className="mt-6 space-y-3">
            {mode === "signup" && (
              <>
                <Field label="Full name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="CA Rohan Mehta" />
                </Field>
                <Field label="Firm name">
                  <Input value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="Mehta & Associates" />
                </Field>
                <Field label="Phone (optional)">
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                </Field>
              </>
            )}
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@firm.com" />
            </Field>
            {mode !== "reset" && (
              <Field label="Password">
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </Field>
            )}
          </div>

          <Button onClick={handle} disabled={loading} variant="hero" size="lg" className="mt-6 w-full">
            {loading ? "Please wait..." : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"} <ArrowRight />
          </Button>

          {mode === "signin" && (
            <button
              onClick={() => setMode("reset")}
              className="mt-3 block w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </button>
          )}

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "New to Maav Mitra? " : mode === "signup" ? "Already have an account? " : "Remembered it? "}
            <span className="font-medium text-primary">
              {mode === "signin" ? "Create account" : "Sign in"}
            </span>
          </button>
        </div>

        <Link to="/" className="mt-6 inline-flex items-center gap-1.5 px-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </main>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-medium text-muted-foreground">{label}</label>
    <div className="mt-1.5">{children}</div>
  </div>
);

export default CaLogin;
