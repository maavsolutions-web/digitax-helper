import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileCheck,
  Lock,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cas, setCas] = useState<any[]>([]);
  const [selectedCa, setSelectedCa] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // List of CAs the user can choose from. We list profiles whose user has the 'ca' role.
    const load = async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "ca");
      const ids = (roles ?? []).map((r) => r.user_id);
      if (ids.length === 0) return;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, firm_name")
        .in("id", ids);
      setCas(profiles ?? []);
      if (profiles && profiles.length > 0) setSelectedCa(profiles[0].id);
    };
    load();
  }, []);

  const choose = async (plan: "review" | "file") => {
    if (!user) {
      toast.error("Please sign in first");
      navigate("/signup");
      return;
    }
    if (!selectedCa) {
      toast.error("Choose a CA to continue");
      return;
    }
    setSubmitting(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, pan, income_type")
      .eq("id", user.id)
      .maybeSingle();

    const { error } = await supabase.from("clients").insert({
      ca_id: selectedCa,
      source_user_id: user.id,
      full_name: profile?.full_name || user.email || "New client",
      pan: profile?.pan ?? null,
      income_type: profile?.income_type ?? null,
      stage: "ready_for_review",
      risk: "medium",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Your CA has been assigned. They'll reach out shortly.");
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar showCta={false} />
      <main className="container max-w-3xl py-10 sm:py-14">
        <div className="animate-fade-in space-y-8 text-center">
          <div>
            <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-accent-foreground">
              <Sparkles className="h-3 w-3" /> Recommended for you
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Fix this with a Tax Expert
            </h1>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
              Your report flagged 3 issues and ₹84,500 in potential savings. A verified CA can handle it end-to-end.
            </p>
          </div>

          {/* CA picker */}
          {cas.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 text-left shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Choose your CA</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {cas.map((c) => {
                  const active = selectedCa === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCa(c.id)}
                      className={`flex items-center justify-between rounded-xl border px-3.5 py-3 text-left transition-base ${
                        active ? "border-primary bg-accent shadow-glow" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{c.full_name || "Verified CA"}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.firm_name || "Independent"}</p>
                      </div>
                      <BadgeCheck className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Plans */}
          <div className="grid gap-4 text-left sm:grid-cols-2">
            <PlanCard
              badge="Most popular"
              title="CA Review"
              price="₹ 499"
              priceHint="one-time"
              tagline="Get expert eyes on your return before you file."
              features={[
                "Verified CA reviews mismatches",
                "Fix-it action plan in 24 hrs",
                "Chat with expert · 1 week",
              ]}
              cta={submitting ? "Please wait…" : "Get CA Review"}
              variant="outline"
              onClick={() => choose("review")}
              disabled={submitting}
            />
            <PlanCard
              highlight
              badge="Best value"
              title="File My Taxes"
              price="₹ 1,499"
              priceHint="all-inclusive"
              tagline="CA reviews, optimises and files your ITR for you."
              features={[
                "Everything in CA Review",
                "Maximise deductions & savings",
                "ITR filed & acknowledged",
                "Notice support · 1 year",
              ]}
              cta={submitting ? "Please wait…" : "File My Taxes"}
              variant="hero"
              onClick={() => choose("file")}
              disabled={submitting}
            />
          </div>

          {/* Trust */}
          <div className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3 sm:p-6">
            <Trust icon={<BadgeCheck className="h-4 w-4" />} label="ICAI verified CAs" />
            <Trust icon={<Lock className="h-4 w-4" />} label="256-bit encrypted" />
            <Trust icon={<Clock3 className="h-4 w-4" />} label="Filed in 48 hours" />
          </div>

          {/* Reviews mini */}
          <div className="rounded-2xl border border-border bg-card p-5 text-left sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <span className="text-sm font-semibold">4.9</span>
                <span className="text-xs text-muted-foreground">· 2,300+ reviews</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> 10,000+ returns filed
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              "Caught a ₹40K AIS mismatch I had no idea about. Filing was effortless."
              <span className="ml-1 text-foreground">— Priya R., Bengaluru</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Link to="/report" className="text-xs text-muted-foreground hover:text-foreground">
              ← Back to report
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

const PlanCard = ({
  badge, title, price, priceHint, tagline, features, cta, variant, highlight, onClick, disabled,
}: {
  badge: string; title: string; price: string; priceHint: string; tagline: string;
  features: string[]; cta: string; variant: "hero" | "outline"; highlight?: boolean;
  onClick: () => void; disabled?: boolean;
}) => (
  <div
    className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-card transition-base ${
      highlight ? "border-primary/50 shadow-elevated ring-1 ring-primary/20" : "border-border"
    }`}
  >
    <div className="flex items-center justify-between">
      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${highlight ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
        {badge}
      </span>
      {highlight && <FileCheck className="h-5 w-5 text-primary" />}
    </div>

    <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>

    <div className="mt-5 flex items-baseline gap-1.5">
      <span className="font-display text-3xl font-bold tabular-nums">{price}</span>
      <span className="text-xs text-muted-foreground">{priceHint}</span>
    </div>

    <ul className="mt-5 space-y-2.5">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <span>{f}</span>
        </li>
      ))}
    </ul>

    <Button onClick={onClick} disabled={disabled} variant={variant} size="lg" className="mt-6 w-full">
      {cta} <ArrowRight />
    </Button>
  </div>
);

const Trust = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
    <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-foreground">{icon}</span>
    {label}
  </div>
);

export default Checkout;
