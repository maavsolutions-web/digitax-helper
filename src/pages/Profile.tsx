import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TopBar } from "@/components/TopBar";
import { FlowShell, StepHeader } from "@/components/flow/StepHeader";
import { ArrowRight, Briefcase, User, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const incomeOptions = [
  { id: "salary", label: "Salaried", desc: "Form 16 from employer", icon: Wallet },
  { id: "freelancer", label: "Freelancer", desc: "Multiple clients / 44ADA", icon: User },
  { id: "business", label: "Business", desc: "Proprietor / firm income", icon: Briefcase },
] as const;

const Profile = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [pan, setPan] = useState("");
  const [income, setIncome] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  // Pre-fill from existing profile so returning users see saved data
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, pan, income_type")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        if (data.full_name) setName(data.full_name);
        if (data.pan) setPan(data.pan);
        if (data.income_type) setIncome(data.income_type);
      }
    })();
  }, [user]);

  const submit = async () => {
    if (!name.trim()) return toast.error("Enter your name");
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return toast.error("Enter a valid PAN");
    if (!income) return toast.error("Select your income type");
    if (!user) {
      toast.error("Please sign in first");
      navigate("/signup");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: name.trim(),
          pan: pan.toUpperCase(),
          income_type: income,
          onboarding_completed: false,
        }, { onConflict: "id" });
      if (error) throw error;
      navigate("/upload");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TopBar showCta={false} />
      <FlowShell>
        <div className="space-y-8 animate-fade-in">
          <StepHeader current={1} total={3} label="Profile" />

          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Tell us about you</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">We use this to fetch the right tax data.</p>
          </div>

          <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Full name (as per PAN)</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aman Sharma" className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pan" className="text-xs font-medium text-muted-foreground">PAN number</Label>
              <Input
                id="pan"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                placeholder="ABCDE1234F"
                maxLength={10}
                className="h-11 font-mono uppercase tracking-wider"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Income type</Label>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {incomeOptions.map((opt) => {
                  const active = income === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setIncome(opt.id)}
                      className={`group rounded-xl border p-4 text-left transition-base ${
                        active
                          ? "border-primary bg-accent shadow-glow"
                          : "border-border bg-background hover:border-primary/40 hover:bg-accent/50"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="mt-2.5 text-sm font-semibold">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <Button onClick={submit} variant="hero" size="lg" className="w-full">
            Continue <ArrowRight />
          </Button>
        </div>
      </FlowShell>
    </>
  );
};

export default Profile;
