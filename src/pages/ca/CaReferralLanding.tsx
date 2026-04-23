import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Briefcase, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { REFERRED_CA_KEY } from "@/lib/referral";

interface CaProfile {
  id: string;
  full_name: string | null;
  firm_name: string | null;
}

const CaReferralLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [ca, setCa] = useState<CaProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, firm_name")
        .eq("referral_slug", slug)
        .maybeSingle();
      if (!data) {
        setNotFound(true);
      } else {
        setCa(data as CaProfile);
        // persist for signup auto-link
        try {
          sessionStorage.setItem(REFERRED_CA_KEY, data.id);
        } catch {}
      }
      setLoading(false);
    })();
  }, [slug]);

  const start = () => navigate("/signup");

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar showCta={false} />
        <div className="container max-w-md py-16 text-center text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (notFound || !ca) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar showCta={false} />
        <main className="container max-w-md py-16">
          <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-card">
            <h1 className="font-display text-xl font-bold">Invite link not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">This referral link is invalid or expired.</p>
            <Link to="/" className="mt-5 inline-block">
              <Button variant="outline" size="sm">Back to home</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const displayName = ca.full_name || "Your CA";
  const firm = ca.firm_name;

  return (
    <div className="min-h-screen bg-background">
      <TopBar showCta={false} />
      <main className="container max-w-xl py-10 sm:py-16">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card sm:p-10 animate-fade-in">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-primary">
            <Briefcase className="h-5 w-5" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-primary">You've been invited</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
            {displayName} wants you to check your Tax Health on Maav
          </h1>
          {firm && <p className="mt-3 text-sm text-muted-foreground">{firm}</p>}
          <p className="mt-5 text-sm text-muted-foreground">
            Upload your tax documents and get an instant AI-powered Tax Health Report — reviewed by{" "}
            <span className="font-medium text-foreground">{displayName}</span> before filing.
          </p>

          <div className="mt-7 space-y-3">
            <Feature icon={<Sparkles className="h-4 w-4" />} text="Free Tax Health analysis in under 2 minutes" />
            <Feature icon={<ShieldCheck className="h-4 w-4" />} text="Your CA reviews & approves before filing" />
            <Feature icon={<Briefcase className="h-4 w-4" />} text="Securely linked to your CA's workspace" />
          </div>

          <Button onClick={start} variant="hero" size="lg" className="mt-8 w-full">
            Get started <ArrowRight />
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">Free to start · Takes 2 minutes</p>
        </div>
      </main>
    </div>
  );
};

const Feature = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
    <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-primary">{icon}</span>
    <span className="text-sm">{text}</span>
  </div>
);

export default CaReferralLanding;
