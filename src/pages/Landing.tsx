import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, Briefcase, User2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/TopBar";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar showCta={false} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" aria-hidden />
        <div className="absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden />

        <div className="container relative max-w-5xl py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI-powered Tax Health for Indian taxpayers
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
              Smarter taxes. <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Zero surprises.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Whether you're filing your own return or managing hundreds of clients — MAAV is built for you.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to="/signup">
                <Button variant="hero" size="lg">Get Started Free <ArrowRight /></Button>
              </Link>
              <Link to="/signup?mode=signin">
                <Button variant="outline" size="lg">Sign In</Button>
              </Link>
            </div>
          </div>

          {/* Two role cards */}
          <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
            <RoleCard
              to="/signup"
              icon={<User2 className="h-5 w-5" />}
              eyebrow="For taxpayers"
              title="Check your Tax Health"
              desc="Upload Form 16, 26AS & AIS. Get a Tax Health Score, spot mismatches, and discover deductions in 2 minutes."
              cta="Get Started Free"
              variant="hero"
              badge="Free"
            />
            <RoleCard
              to="/ca/login"
              icon={<Briefcase className="h-5 w-5" />}
              eyebrow="For CA professionals"
              title="Maav Mitra"
              desc="Manage your client pipeline, review extracted data, flag risks and file faster — all in one workspace."
              cta="CA Login"
              variant="outline"
              badge="Pro"
            />
          </div>

          {/* Trust strip */}
          <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> 256-bit encrypted</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Reviewed by Chartered Accountants</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Trusted by 10,000+ taxpayers</span>
          </div>
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

const RoleCard = ({
  to, icon, eyebrow, title, desc, cta, variant, badge,
}: {
  to: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  desc: string;
  cta: string;
  variant: "hero" | "outline";
  badge: string;
}) => (
  <div className="group relative flex flex-col rounded-3xl border border-border bg-card p-7 shadow-card transition-base hover:-translate-y-0.5 hover:shadow-elevated">
    <div className="absolute right-5 top-5 rounded-full border border-border bg-background px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {badge}
    </div>
    <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary">{icon}</div>
    <p className="mt-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
    <h3 className="mt-1.5 font-display text-xl font-bold tracking-tight">{title}</h3>
    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    <Link to={to} className="mt-6">
      <Button variant={variant} size="lg" className="w-full">
        {cta} <ArrowRight />
      </Button>
    </Link>
  </div>
);

export default Landing;
