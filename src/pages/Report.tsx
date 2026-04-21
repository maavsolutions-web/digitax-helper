import { Link } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowRight,
  BadgeIndianRupee,
  Bell,
  CheckCircle2,
  Clock,
  Download,
  Lightbulb,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

const SCORE = 68;

const Report = () => {
  const tone = SCORE >= 80 ? "success" : SCORE >= 60 ? "warning" : "danger";
  const toneLabel = SCORE >= 80 ? "Healthy" : SCORE >= 60 ? "Needs attention" : "At risk";
  const gradVar =
    tone === "success" ? "var(--gradient-score-good)" :
    tone === "warning" ? "var(--gradient-score-mid)" : "var(--gradient-score-bad)";

  return (
    <div className="min-h-screen bg-background">
      <TopBar showCta={false} />
      <main className="container max-w-5xl py-8 sm:py-12">
        <div className="animate-fade-in space-y-8">
          {/* Header */}
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-accent-foreground">
                <Sparkles className="h-3 w-3" /> Tax Health Report · FY 2024-25
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Hey Aman, here's your report
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on Form 26AS, AIS and Form 16 you uploaded.
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>

          {/* Top: Score + Tax Summary */}
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Score card */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card lg:col-span-1">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tax Health Score</div>
              <div className="mt-5 grid place-items-center">
                <ScoreRing score={SCORE} gradient={gradVar} />
                <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-${tone}-soft text-${tone}`}>
                  <span className={`h-1.5 w-1.5 rounded-full bg-${tone}`} />
                  {toneLabel}
                </div>
                <p className="mt-3 max-w-xs text-center text-xs text-muted-foreground">
                  You have <span className="font-semibold text-foreground">3 issues</span> to fix and <span className="font-semibold text-success">₹84,500</span> in potential savings.
                </p>
              </div>
            </div>

            {/* Tax Summary */}
            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
              <SummaryCard
                tone="danger"
                icon={<TrendingDown className="h-4 w-4" />}
                label="Tax payable"
                amount="₹ 24,300"
                hint="After TDS adjustment"
              />
              <SummaryCard
                tone="success"
                icon={<TrendingUp className="h-4 w-4" />}
                label="Potential refund"
                amount="₹ 0"
                hint="With current return"
              />
              <SummaryCard
                tone="primary"
                icon={<Wallet className="h-4 w-4" />}
                label="Total income"
                amount="₹ 14,82,000"
                hint="Salary + Other sources"
              />
              <SummaryCard
                tone="success"
                icon={<BadgeIndianRupee className="h-4 w-4" />}
                label="Possible savings"
                amount="₹ 84,500"
                hint="If you fix issues below"
                emphasize
              />
            </div>
          </div>

          {/* Issues + Risks */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Section
              title="Key Issues"
              subtitle="Found in your filings"
              icon={<AlertTriangle className="h-4 w-4" />}
              tone="warning"
            >
              <IssueRow
                tone="danger"
                title="Missing income from interest"
                detail="₹ 32,400 from FD interest shown in AIS not in your return."
                tag="Mismatch"
              />
              <IssueRow
                tone="warning"
                title="Form 26AS vs AIS mismatch"
                detail="2 entries differ. Likely TDS by HDFC Bank not matched."
                tag="Verify"
              />
              <IssueRow
                tone="warning"
                title="Capital gains undeclared"
                detail="Mutual fund redemptions worth ₹ 1.2L found in AIS."
                tag="Action needed"
              />
            </Section>

            <Section
              title="Risk Alerts"
              subtitle="If you file as-is"
              icon={<Bell className="h-4 w-4" />}
              tone="danger"
            >
              <IssueRow
                tone="danger"
                title="High notice risk"
                detail="Mismatches above ₹ 50K trigger automated IT notices."
                tag="High"
              />
              <IssueRow
                tone="warning"
                title="Advance tax shortfall"
                detail="Interest u/s 234B/234C may apply — approx ₹ 2,100 extra."
                tag="Medium"
                icon={<Clock className="h-3.5 w-3.5" />}
              />
            </Section>
          </div>

          {/* Savings Opportunities */}
          <Section
            title="Savings Opportunities"
            subtitle="Money you're leaving on the table"
            icon={<Lightbulb className="h-4 w-4" />}
            tone="success"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <SavingTile label="80C — ELSS / PPF" amount="₹ 38,000" hint="Limit not used" />
              <SavingTile label="80D — Health Insurance" amount="₹ 16,500" hint="Parents' policy missing" />
              <SavingTile label="HRA Exemption" amount="₹ 30,000" hint="Rent receipts not claimed" />
            </div>
          </Section>

          {/* CTA strip */}
          <div className="rounded-3xl border border-border bg-gradient-to-br from-accent to-card p-6 shadow-elevated sm:p-8">
            <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-primary text-primary-foreground">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">Fix all of this with a Tax Expert</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A verified CA reviews your data, fixes mismatches, and files for you.
                  </p>
                </div>
              </div>
              <Link to="/checkout" className="w-full sm:w-auto">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  Continue <ArrowRight />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const ScoreRing = ({ score, gradient }: { score: number; gradient: string }) => {
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative grid h-40 w-40 place-items-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary-glow))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={r} stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
        <circle
          cx="70"
          cy="70"
          r={r}
          stroke="url(#scoreGrad)"
          strokeWidth="10"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute text-center" style={{ background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        <div className="font-display text-5xl font-bold tabular-nums">{score}</div>
        <div className="-mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground" style={{ WebkitTextFillColor: "hsl(var(--muted-foreground))" }}>
          out of 100
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({
  tone, icon, label, amount, hint, emphasize,
}: {
  tone: "success" | "warning" | "danger" | "primary";
  icon: React.ReactNode; label: string; amount: string; hint: string; emphasize?: boolean;
}) => {
  const map = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    primary: "bg-accent text-primary",
  } as const;
  return (
    <div className={`rounded-2xl border bg-card p-5 shadow-card transition-base ${emphasize ? "border-success/40 ring-1 ring-success/20" : "border-border"}`}>
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${map[tone]}`}>{icon}</div>
      <div className="mt-3 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold tabular-nums">{amount}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
};

const Section = ({
  title, subtitle, icon, tone, children,
}: {
  title: string; subtitle: string; icon: React.ReactNode;
  tone: "success" | "warning" | "danger"; children: React.ReactNode;
}) => {
  const map = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
  } as const;
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <header className="mb-4 flex items-center gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-xl ${map[tone]}`}>{icon}</div>
        <div>
          <h2 className="font-display text-base font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </header>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
};

const IssueRow = ({
  tone, title, detail, tag, icon,
}: {
  tone: "danger" | "warning"; title: string; detail: string; tag: string; icon?: React.ReactNode;
}) => {
  const map = {
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning",
  } as const;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-3.5">
      <div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${map[tone]}`}>
        {icon ?? <AlertTriangle className="h-3.5 w-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${map[tone]}`}>{tag}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
};

const SavingTile = ({ label, amount, hint }: { label: string; amount: string; hint: string }) => (
  <div className="rounded-xl border border-success/30 bg-success-soft/40 p-4">
    <div className="text-xs font-medium text-muted-foreground">{label}</div>
    <div className="mt-1 font-display text-xl font-bold tabular-nums text-success">{amount}</div>
    <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
  </div>
);

export default Report;
