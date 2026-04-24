import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, ShieldCheck, BadgeCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/TopBar";
import { cn } from "@/lib/utils";

const DEADLINE = new Date("2025-07-31T23:59:59+05:30").getTime();

function useCountdown(target: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

type Feat = { label: string; included: boolean };

interface PlanCardProps {
  badge: string;
  badgeTone: "gray" | "green" | "teal" | "amber";
  name: string;
  price: string;
  priceSuffix?: string;
  competitor?: string;
  features: Feat[];
  note?: string;
  ctaLabel: string;
  ctaHref: string;
  ctaVariant?: "default" | "outline";
  featured?: boolean;
}

const toneClasses: Record<PlanCardProps["badgeTone"], string> = {
  gray: "bg-muted text-muted-foreground border-transparent",
  green: "bg-success-soft text-success border-transparent",
  teal: "bg-primary text-primary-foreground border-transparent",
  amber: "bg-warning-soft text-warning border-transparent",
};

const PlanCard = ({
  badge, badgeTone, name, price, priceSuffix, competitor,
  features, note, ctaLabel, ctaHref, ctaVariant = "default", featured,
}: PlanCardProps) => (
  <div
    className={cn(
      "relative flex flex-col rounded-2xl border bg-card p-6 shadow-card transition-base",
      featured
        ? "border-primary/60 shadow-elevated ring-1 ring-primary/30"
        : "border-border hover:border-primary/30 hover:shadow-elevated",
    )}
  >
    {featured && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-elevated">
          Most Popular
        </span>
      </div>
    )}
    <div className="flex items-center justify-between">
      <Badge className={cn("rounded-full", toneClasses[badgeTone])} variant="outline">
        {badge}
      </Badge>
    </div>
    <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground">{name}</h3>
    <div className="mt-3 flex items-baseline gap-1">
      <span className="font-display text-3xl font-bold text-foreground">{price}</span>
      {priceSuffix && <span className="text-sm text-muted-foreground">{priceSuffix}</span>}
    </div>
    {competitor && (
      <p className="mt-1 text-xs text-muted-foreground">
        vs <span className="line-through">{competitor}</span>
      </p>
    )}
    <div className="my-5 h-px w-full bg-border" />
    <ul className="space-y-2.5">
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm">
          {f.included ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
          ) : (
            <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
          )}
          <span className={cn(f.included ? "text-foreground" : "text-muted-foreground line-through decoration-muted-foreground/40")}>
            {f.label}
          </span>
        </li>
      ))}
    </ul>
    {note && <p className="mt-5 text-xs italic text-muted-foreground">{note}</p>}
    <div className="mt-6 flex-1" />
    <Link to={ctaHref} className="block">
      <Button className="w-full" size="lg" variant={ctaVariant}>{ctaLabel}</Button>
    </Link>
  </div>
);

const individualPlans: PlanCardProps[] = [
  {
    badge: "Free", badgeTone: "gray",
    name: "Tax Health Check", price: "₹0", priceSuffix: "always free",
    features: [
      { label: "AI Tax Health Score", included: true },
      { label: "Mismatch detection", included: true },
      { label: "Savings opportunities", included: true },
      { label: "Filing not included", included: false },
      { label: "No CA access", included: false },
    ],
    note: "Your entry point — everyone starts here.",
    ctaLabel: "Get Started Free", ctaHref: "/signup", ctaVariant: "outline",
  },
  {
    badge: "Salaried", badgeTone: "green",
    name: "Salary + Investments", price: "₹799", priceSuffix: "one-time",
    competitor: "ClearTax ₹1,299 · TaxBuddy ₹999",
    features: [
      { label: "ITR-1 or ITR-2 filing", included: true },
      { label: "CA reviews and files", included: true },
      { label: "HRA + 80C optimisation", included: true },
      { label: "Form 16 + 26AS analysis", included: true },
      { label: "3-day turnaround", included: true },
    ],
    ctaLabel: "Get Started", ctaHref: "/signup",
  },
  {
    badge: "Most Popular", badgeTone: "teal", featured: true,
    name: "Salary + Capital Gains", price: "₹1,299", priceSuffix: "one-time",
    competitor: "ClearTax ₹1,799 · TaxBuddy ₹1,499",
    features: [
      { label: "ITR-2 filing", included: true },
      { label: "Mutual funds + stocks", included: true },
      { label: "LTCG / STCG calculation", included: true },
      { label: "Property income included", included: true },
      { label: "Notice support 90 days", included: true },
    ],
    ctaLabel: "Get Started", ctaHref: "/signup",
  },
  {
    badge: "Freelancer", badgeTone: "amber",
    name: "Self-Employed", price: "₹2,499", priceSuffix: "one-time",
    competitor: "ClearTax ₹3,700 · TaxBuddy ₹2,999",
    features: [
      { label: "ITR-3 or ITR-4 filing", included: true },
      { label: "Presumptive tax 44ADA", included: true },
      { label: "GST reconciliation check", included: true },
      { label: "Multiple income sources", included: true },
      { label: "Notice support 6 months", included: true },
    ],
    ctaLabel: "Get Started", ctaHref: "/signup",
  },
  {
    badge: "Complex", badgeTone: "gray",
    name: "F&O + Crypto", price: "₹3,499", priceSuffix: "one-time",
    competitor: "ClearTax ₹4,949 · TaxBuddy ₹4,499",
    features: [
      { label: "ITR-3 filing", included: true },
      { label: "F&O P&L reconciliation", included: true },
      { label: "Crypto gains calculation", included: true },
      { label: "Loss carry-forward", included: true },
      { label: "Priority CA 48hr turnaround", included: true },
    ],
    ctaLabel: "Get Started", ctaHref: "/signup",
  },
  {
    badge: "NRI", badgeTone: "gray",
    name: "NRI Filing", price: "₹2,999", priceSuffix: "one-time",
    competitor: "ClearTax ₹3,100 · TaxBuddy ₹3,499",
    features: [
      { label: "ITR-2 or ITR-3 filing", included: true },
      { label: "NRO/NRE income", included: true },
      { label: "DTAA benefit claim", included: true },
      { label: "Foreign asset disclosure", included: true },
      { label: "Notice support 1 year", included: true },
    ],
    ctaLabel: "Get Started", ctaHref: "/signup",
  },
];

interface CaPlan {
  badge: string;
  badgeTone: PlanCardProps["badgeTone"];
  name: string;
  monthly: number;
  yearly: number;
  included: string[];
  excluded: string[];
  featured?: boolean;
}

const caPlans: CaPlan[] = [
  {
    badge: "Starter", badgeTone: "gray", name: "Solo CA",
    monthly: 999, yearly: 8999,
    included: ["Up to 50 clients", "AI document scanning", "Pipeline management", "Client communication log"],
    excluded: ["No white-label PDF", "No bulk import", "No team members"],
  },
  {
    badge: "Best for Growth", badgeTone: "teal", name: "CA Pro", featured: true,
    monthly: 2499, yearly: 21999,
    included: [
      "Up to 200 clients", "White-label PDF reports", "Bulk client import",
      "Deadline calendar + SMS reminders", "AI notice reply drafting", "2 team member seats",
    ],
    excluded: ["No revenue dashboard"],
  },
  {
    badge: "Firm", badgeTone: "amber", name: "CA Firm",
    monthly: 4999, yearly: 44999,
    included: [
      "Unlimited clients", "Everything in Pro", "Up to 10 team members",
      "Revenue dashboard", "Priority support 4hr SLA", "Custom referral link", "Early access to new features",
    ],
    excluded: [],
  },
];

const addons = [
  { name: "Notice Reply", price: "₹1,499", unit: "per notice", desc: "AI-drafted reply reviewed by CA. Covers 143(1), 148, 139(9) notices." },
  { name: "Revised Return", price: "₹499", unit: "per revision", desc: "For corrections after filing. CA assisted, same financial year." },
  { name: "Advance Tax Calculation", price: "₹299", unit: "per quarter", desc: "Exact amount + due date reminder + challan generation." },
  { name: "Tax Planning Session", price: "₹999", unit: "per session", desc: "30-minute video call with a CA. Regime comparison and investment roadmap." },
];

const Pricing = () => {
  const { d, h, m, s } = useCountdown(DEADLINE);
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  const formatINR = (n: number) => "₹" + n.toLocaleString("en-IN");

  return (
    <div className="min-h-screen bg-background">
      <TopBar showCta />

      {/* Sticky urgency bar */}
      <div className="sticky top-16 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="container flex flex-col items-center justify-center gap-1 py-2 text-center sm:flex-row sm:gap-3">
          <span className="text-xs font-medium text-foreground sm:text-sm">
            Filing season is open — prices valid until July 31
          </span>
          <span className="font-mono text-xs font-semibold text-primary sm:text-sm">
            {d}d {String(h).padStart(2, "0")}h {String(m).padStart(2, "0")}m {String(s).padStart(2, "0")}s
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" aria-hidden />
        <div className="container relative max-w-4xl py-14 text-center sm:py-20">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            One AI-powered platform for taxpayers and CAs. Pay only for what you need.
          </p>
        </div>
      </section>

      {/* Section 1 — Individual Plans */}
      <section className="container py-10 sm:py-14">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Plans for every taxpayer
          </h2>
          <p className="mt-3 text-muted-foreground">From a free health check to complex filings — choose what fits.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {individualPlans.map((p) => (
            <PlanCard key={p.name} {...p} />
          ))}
        </div>
      </section>

      {/* Section 2 — CA Plans */}
      <section className="border-t border-border bg-secondary/30 py-14 sm:py-20">
        <div className="container">
          <div className="mb-8 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              For Chartered Accountants
            </h2>
            <p className="mt-3 text-muted-foreground">Run your entire practice on MAAV.</p>
          </div>

          {/* Billing toggle */}
          <div className="mb-10 flex items-center justify-center gap-3">
            <div className="inline-flex items-center rounded-full border border-border bg-card p-1 shadow-sm">
              <button
                onClick={() => setBilling("monthly")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-base",
                  billing === "monthly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-base",
                  billing === "yearly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Yearly
              </button>
            </div>
            <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
              Save 25%
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {caPlans.map((p) => {
              const features: Feat[] = [
                ...p.included.map((label) => ({ label, included: true })),
                ...p.excluded.map((label) => ({ label, included: false })),
              ];
              return (
                <PlanCard
                  key={p.name}
                  badge={p.badge}
                  badgeTone={p.badgeTone}
                  name={p.name}
                  price={billing === "monthly" ? formatINR(p.monthly) : formatINR(p.yearly)}
                  priceSuffix={billing === "monthly" ? "/month" : "/year"}
                  features={features}
                  ctaLabel="Start Free Trial"
                  ctaHref="/ca/login"
                  featured={p.featured}
                />
              );
            })}
          </div>

          {/* Launch offer banner */}
          <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/10 p-5 text-center">
            <p className="text-sm font-medium text-foreground sm:text-base">
              <span className="font-semibold text-primary">Launch offer —</span> First 3 months free for any CA who signs up before July 31 2025. No credit card needed.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 — Add-ons */}
      <section className="container py-14 sm:py-20">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pay only when you need it
          </h2>
          <p className="mt-3 text-muted-foreground">À la carte services for one-off needs.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {addons.map((a) => (
            <div key={a.name} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-base hover:border-primary/30 hover:shadow-elevated">
              <h3 className="font-display text-lg font-bold text-foreground">{a.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-2xl font-bold text-primary">{a.price}</span>
                <span className="text-xs text-muted-foreground">{a.unit}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 — Trust bar */}
      <section className="border-t border-border bg-secondary/30 py-10">
        <div className="container">
          <div className="mx-auto grid max-w-5xl gap-6 text-center sm:grid-cols-3">
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium text-foreground">Pay after ITR is filed — no upfront payment risk</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <BadgeCheck className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium text-foreground">All CAs are ICAI verified</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Lock className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium text-foreground">Your data is encrypted and never sold</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MAAV. Built for Indian taxpayers and CAs.
      </footer>
    </div>
  );
};

export default Pricing;
