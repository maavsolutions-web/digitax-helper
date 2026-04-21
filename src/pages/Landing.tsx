import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, FileText, Bell, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/TopBar";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" aria-hidden />
        <div className="absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden />

        <div className="container relative max-w-5xl py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI-powered Tax Health Check for Indian taxpayers
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
              Check your <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Tax Health</span>
              <br className="hidden sm:block" /> in 2 minutes
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Avoid IT notices, spot mismatches in Form 26AS & AIS, and discover deductions you missed — before you file.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup">
                <Button size="xl" variant="hero" className="w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight />
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">No credit card · Takes 2 mins · 100% secure</p>
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> 256-bit encrypted</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Reviewed by Chartered Accountants</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Trusted by 10,000+ taxpayers</span>
            </div>
          </div>

          {/* Hero card preview */}
          <div className="mx-auto mt-16 max-w-3xl">
            <div className="rounded-3xl border border-border bg-card p-2 shadow-elevated">
              <div className="rounded-2xl bg-gradient-to-br from-secondary to-background p-6 sm:p-10">
                <div className="grid gap-6 sm:grid-cols-3">
                  <ScoreTile />
                  <div className="sm:col-span-2 space-y-3">
                    <MiniRow color="success" label="Form 16 verified" value="₹ 12,40,000" />
                    <MiniRow color="warning" label="AIS mismatch detected" value="2 items" />
                    <MiniRow color="success" label="Deductions identified" value="₹ 84,500 saved" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="container max-w-5xl py-16">
        <div className="mb-10 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Built to keep you out of trouble</h2>
          <p className="mt-2 text-muted-foreground">Three things every Indian taxpayer worries about — solved.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature
            icon={<Bell className="h-5 w-5" />}
            title="Avoid IT notices"
            desc="We cross-check Form 26AS, AIS and your return for mismatches before you file."
            tone="warning"
          />
          <Feature
            icon={<TrendingUp className="h-5 w-5" />}
            title="Save more tax"
            desc="Spot missed deductions under 80C, 80D, HRA and more — automatically."
            tone="success"
          />
          <Feature
            icon={<FileText className="h-5 w-5" />}
            title="File with a CA"
            desc="One tap to hand off to a verified Chartered Accountant. No paperwork chase."
            tone="primary"
          />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container max-w-3xl pb-20">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <h3 className="font-display text-2xl font-bold">Ready to see your Tax Health Score?</h3>
          <p className="mt-2 text-sm text-muted-foreground">Free analysis. Pay only when you choose CA-assisted filing.</p>
          <Link to="/signup">
            <Button size="lg" variant="hero" className="mt-6">
              Get Started Free <ArrowRight />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} MAAV — Tax Health, simplified.</span>
          <span>Made for Indian taxpayers 🇮🇳</span>
        </div>
      </footer>
    </div>
  );
};

const ScoreTile = () => (
  <div className="grid place-items-center rounded-2xl border border-border bg-card p-6">
    <div className="relative grid h-28 w-28 place-items-center rounded-full" style={{ background: "var(--gradient-score-good)" }}>
      <div className="grid h-[88%] w-[88%] place-items-center rounded-full bg-card">
        <div className="text-center">
          <div className="font-display text-3xl font-bold text-success">82</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Health</div>
        </div>
      </div>
    </div>
    <div className="mt-3 text-xs font-medium text-success">Healthy</div>
  </div>
);

const MiniRow = ({ color, label, value }: { color: "success" | "warning" | "danger"; label: string; value: string }) => {
  const map = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
  } as const;
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-center gap-3">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${map[color]}`}>
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
};

const Feature = ({ icon, title, desc, tone }: { icon: React.ReactNode; title: string; desc: string; tone: "success" | "warning" | "primary" }) => {
  const map = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    primary: "bg-accent text-primary",
  } as const;
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card transition-base hover:-translate-y-0.5 hover:shadow-elevated">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${map[tone]}`}>{icon}</div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
};

export default Landing;
