import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DeductionsBox } from "@/components/report/DeductionsBox";

interface Issue {
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
  tag?: string;
}
interface Saving {
  section: string;
  label: string;
  amount: number;
  hint: string;
}

const Report = () => {
  const { user, loading: authLoading } = useAuth();
  const [params] = useSearchParams();
  const reportId = params.get("id");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    (async () => {
      let q = supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(1);
      if (reportId) q = supabase.from("reports").select("*").eq("id", reportId).limit(1);
      const { data } = await q;
      const r = data?.[0] ?? null;
      setReport(r);
      setLoading(false);
      // Mark onboarding complete once user has a report
      if (r) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("id", user.id);
      }
    })();
  }, [authLoading, user, reportId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar showCta={false} />
        <div className="grid min-h-[60vh] place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar showCta={false} />
        <main className="container max-w-xl py-16 text-center">
          <h1 className="font-display text-2xl font-bold">No report yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">Upload your tax documents to generate one.</p>
          <Link to="/upload"><Button variant="hero" size="lg" className="mt-6">Upload documents <ArrowRight /></Button></Link>
        </main>
      </div>
    );
  }

  const score: number = report.health_score ?? 0;
  const tone = score >= 80 ? "success" : score >= 60 ? "warning" : "danger";
  const toneLabel = score >= 80 ? "Healthy" : score >= 60 ? "Needs attention" : "At risk";
  const gradVar =
    tone === "success" ? "var(--gradient-score-good)" :
    tone === "warning" ? "var(--gradient-score-mid)" : "var(--gradient-score-bad)";

  const issues: Issue[] = Array.isArray(report.key_issues) ? report.key_issues : [];
  const risks: Issue[] = Array.isArray(report.risk_alerts) ? report.risk_alerts : [];
  const savings: Saving[] = Array.isArray(report.savings) ? report.savings : [];
  const totalSavings = savings.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const totalIncome = report.parsed_data?.total_income;

  const fmt = (n: number | null | undefined) =>
    n == null ? "—" : `₹ ${Number(n).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-background">
      <TopBar showCta={false} />
      <main className="container max-w-5xl py-8 sm:py-12">
        <div className="animate-fade-in space-y-8">
          {/* Header */}
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-accent-foreground">
                <Sparkles className="h-3 w-3" /> Tax Health Report · {report.filing_year ?? "FY 2024-25"}
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Your AI-generated tax report
              </h1>
              {report.summary && (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{report.summary}</p>
              )}
            </div>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>

          {/* Refresh banner */}
          <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-accent/40 p-4 sm:flex-row sm:items-center">
            <div className="text-sm">
              <span className="font-semibold text-foreground">Last updated:</span>{" "}
              <span className="text-muted-foreground">
                {new Date(report.last_refreshed_at ?? report.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </span>
              <span className="ml-2 text-xs text-muted-foreground">— Upload new documents to refresh your report</span>
            </div>
            <Link to="/upload">
              <Button variant="outline" size="sm">Refresh report <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>

          {/* Top: Score + Tax Summary */}
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card lg:col-span-1">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tax Health Score</div>
              <div className="mt-5 grid place-items-center">
                <ScoreRing score={score} gradient={gradVar} />
                <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-${tone}-soft text-${tone}`}>
                  <span className={`h-1.5 w-1.5 rounded-full bg-${tone}`} />
                  {toneLabel}
                </div>
                <p className="mt-3 max-w-xs text-center text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{issues.length} issue{issues.length === 1 ? "" : "s"}</span> to fix and{" "}
                  <span className="font-semibold text-success">{fmt(totalSavings)}</span> in potential savings.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
              <SummaryCard tone="danger" icon={<TrendingDown className="h-4 w-4" />} label="Tax payable" amount={fmt(report.payable_amount)} hint="After TDS adjustment" />
              <SummaryCard tone="success" icon={<TrendingUp className="h-4 w-4" />} label="Potential refund" amount={fmt(report.refund_amount)} hint="With current return" />
              <SummaryCard tone="primary" icon={<Wallet className="h-4 w-4" />} label="Total income" amount={fmt(totalIncome)} hint="All sources" />
              <SummaryCard tone="success" icon={<BadgeIndianRupee className="h-4 w-4" />} label="Possible savings" amount={fmt(totalSavings)} hint="If you fix issues below" emphasize />
            </div>
          </div>

          {/* Issues + Risks */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Key Issues" subtitle="Found in your filings" icon={<AlertTriangle className="h-4 w-4" />} tone="warning">
              {issues.length === 0 ? (
                <EmptyRow text="No issues detected. Nice." />
              ) : (
                issues.map((i, idx) => (
                  <IssueRow
                    key={idx}
                    tone={i.severity === "high" ? "danger" : "warning"}
                    title={i.title}
                    detail={i.detail}
                    tag={i.tag ?? (i.severity === "high" ? "Action needed" : "Verify")}
                  />
                ))
              )}
            </Section>

            <Section title="Risk Alerts" subtitle="If you file as-is" icon={<Bell className="h-4 w-4" />} tone="danger">
              {risks.length === 0 ? (
                <EmptyRow text="No major risks flagged." />
              ) : (
                risks.map((r, idx) => (
                  <IssueRow
                    key={idx}
                    tone={r.severity === "high" ? "danger" : "warning"}
                    title={r.title}
                    detail={r.detail}
                    tag={r.severity[0].toUpperCase() + r.severity.slice(1)}
                    icon={r.severity === "medium" ? <Clock className="h-3.5 w-3.5" /> : undefined}
                  />
                ))
              )}
            </Section>
          </div>

          {/* Savings */}
          <Section title="Savings Opportunities" subtitle="Money you're leaving on the table" icon={<Lightbulb className="h-4 w-4" />} tone="success">
            {savings.length === 0 ? (
              <EmptyRow text="You're already maximising deductions." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {savings.map((s, idx) => (
                  <SavingTile key={idx} label={`${s.section} — ${s.label}`} amount={fmt(s.amount)} hint={s.hint} />
                ))}
              </div>
            )}
          </Section>

          {/* Deductions available */}
          <DeductionsBox totalIncome={totalIncome} />

          {/* CTA */}
          <div className="rounded-3xl border border-border bg-gradient-to-br from-accent to-card p-6 shadow-elevated sm:p-8">
            <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-primary text-primary-foreground">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">Fix all of this with a Tax Expert</h3>
                  <p className="mt-1 text-sm text-muted-foreground">A verified CA reviews your data, fixes mismatches, and files for you.</p>
                </div>
              </div>
              <Link to="/checkout" className="w-full sm:w-auto">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">Continue <ArrowRight /></Button>
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
        <circle cx="70" cy="70" r={r} stroke="url(#scoreGrad)" strokeWidth="10" fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease-out" }} />
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

const SummaryCard = ({ tone, icon, label, amount, hint, emphasize }: { tone: "success" | "warning" | "danger" | "primary"; icon: React.ReactNode; label: string; amount: string; hint: string; emphasize?: boolean; }) => {
  const map = { success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", danger: "bg-danger-soft text-danger", primary: "bg-accent text-primary" } as const;
  return (
    <div className={`rounded-2xl border bg-card p-5 shadow-card transition-base ${emphasize ? "border-success/40 ring-1 ring-success/20" : "border-border"}`}>
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${map[tone]}`}>{icon}</div>
      <div className="mt-3 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold tabular-nums">{amount}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
};

const Section = ({ title, subtitle, icon, tone, children }: { title: string; subtitle: string; icon: React.ReactNode; tone: "success" | "warning" | "danger"; children: React.ReactNode; }) => {
  const map = { success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", danger: "bg-danger-soft text-danger" } as const;
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

const IssueRow = ({ tone, title, detail, tag, icon }: { tone: "danger" | "warning"; title: string; detail: string; tag: string; icon?: React.ReactNode; }) => {
  const map = { danger: "bg-danger-soft text-danger", warning: "bg-warning-soft text-warning" } as const;
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

const EmptyRow = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">{text}</div>
);

const SavingTile = ({ label, amount, hint }: { label: string; amount: string; hint: string }) => (
  <div className="rounded-xl border border-success/30 bg-success-soft/40 p-4">
    <div className="text-xs font-medium text-muted-foreground">{label}</div>
    <div className="mt-1 font-display text-xl font-bold tabular-nums text-success">{amount}</div>
    <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
  </div>
);

export default Report;
