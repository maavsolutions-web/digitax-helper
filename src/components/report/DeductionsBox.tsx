import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookOpenCheck, ChevronDown, ChevronUp } from "lucide-react";

type Deduction = {
  section: string;
  title: string;
  limit: string;
  detail: string;
  act?: string;
};

// Deductions under the Income Tax Act, 1961 (Old regime mostly; some apply to New regime)
const COMMON: Deduction[] = [
  { section: "80C", title: "Investments & savings", limit: "Up to ₹1,50,000", detail: "PPF, ELSS, EPF, LIC, 5-yr FD, NSC, Sukanya Samriddhi, principal on home loan, tuition fees." },
  { section: "80CCD(1B)", title: "Additional NPS contribution", limit: "Up to ₹50,000", detail: "Over and above the 80C limit, for self-contribution to NPS Tier-I." },
  { section: "80D", title: "Health insurance premium", limit: "₹25,000 (₹50,000 for senior citizens)", detail: "Premium for self, spouse, children + extra ₹25k/₹50k for parents. Includes ₹5k preventive check-up." },
  { section: "80TTA / 80TTB", title: "Interest on savings / deposits", limit: "₹10,000 (₹50,000 for seniors)", detail: "80TTA: savings a/c interest. 80TTB: all bank/post office interest for senior citizens." },
  { section: "80G", title: "Donations to charity", limit: "50% or 100% of donation", detail: "Donations to approved funds and institutions. Cash donations capped at ₹2,000." },
  { section: "80E", title: "Interest on education loan", limit: "No upper limit", detail: "Interest paid on a higher-education loan, for up to 8 years." },
  { section: "80EEA", title: "Interest on home loan (affordable)", limit: "Up to ₹1,50,000", detail: "Additional interest deduction on a first home loan sanctioned 2019–2022 (stamp value ≤ ₹45L)." },
  { section: "24(b)", title: "Home loan interest", limit: "Up to ₹2,00,000", detail: "Interest paid on a self-occupied house loan." },
  { section: "80U / 80DD", title: "Disability deductions", limit: "₹75,000 / ₹1,25,000", detail: "Self disability (80U) or dependent with disability (80DD), based on severity." },
  { section: "80DDB", title: "Treatment of specified diseases", limit: "₹40,000 (₹1,00,000 for seniors)", detail: "Medical treatment of self or dependent for specified illnesses." },
];

const SALARIED: Deduction[] = [
  { section: "16(ia)", title: "Standard deduction", limit: "₹50,000 (Old) / ₹75,000 (New)", detail: "Flat deduction for every salaried taxpayer and pensioner." },
  { section: "10(13A)", title: "House Rent Allowance (HRA)", limit: "Least of 3 formulas", detail: "Exempt if you live in rented accommodation and HRA is part of salary." },
  { section: "10(5)", title: "Leave Travel Allowance (LTA)", limit: "Actual travel cost", detail: "Twice in a block of 4 calendar years, for domestic travel." },
  { section: "10(14)", title: "Special allowances", limit: "As notified", detail: "Children education allowance, hostel allowance, uniform allowance, etc." },
];

const FREELANCER: Deduction[] = [
  { section: "44ADA", title: "Presumptive taxation", limit: "50% of gross receipts treated as income", detail: "Available if professional gross receipts ≤ ₹75 lakh (with ≤5% cash). No need to maintain books." },
  { section: "37(1)", title: "Business / professional expenses", limit: "Actual expenses", detail: "Internet, rent, software, travel, depreciation on laptop — anything wholly for the profession." },
  { section: "80GG", title: "Rent paid (no HRA)", limit: "Up to ₹60,000/yr", detail: "If you pay rent but receive no HRA. Subject to other conditions." },
];

const BUSINESS: Deduction[] = [
  { section: "44AD", title: "Presumptive taxation", limit: "6% / 8% of turnover", detail: "Eligible small businesses with turnover ≤ ₹3 cr (with ≤5% cash receipts)." },
  { section: "32", title: "Depreciation on assets", limit: "As per IT rates", detail: "Plant, machinery, vehicles, computers used for business." },
  { section: "36 / 37", title: "Business expenses", limit: "Actual", detail: "Salaries, rent, repairs, insurance, interest on business loans, marketing, etc." },
  { section: "80JJAA", title: "Additional employee cost", limit: "30% of additional wages × 3 years", detail: "For hiring new employees (subject to conditions)." },
];

// Indian tax slabs FY 2024-25 (New regime)
const slabFor = (income: number): { regime: string; slab: string; rate: string } => {
  if (income <= 300000) return { regime: "New (FY 24-25)", slab: "Up to ₹3L", rate: "Nil" };
  if (income <= 700000) return { regime: "New (FY 24-25)", slab: "₹3L – ₹7L", rate: "5%" };
  if (income <= 1000000) return { regime: "New (FY 24-25)", slab: "₹7L – ₹10L", rate: "10%" };
  if (income <= 1200000) return { regime: "New (FY 24-25)", slab: "₹10L – ₹12L", rate: "15%" };
  if (income <= 1500000) return { regime: "New (FY 24-25)", slab: "₹12L – ₹15L", rate: "20%" };
  return { regime: "New (FY 24-25)", slab: "Above ₹15L", rate: "30%" };
};

interface Props {
  incomeType?: string | null;
  totalIncome?: number | null;
}

export const DeductionsBox = ({ incomeType: incomeTypeProp, totalIncome }: Props) => {
  const { user } = useAuth();
  const [incomeType, setIncomeType] = useState<string | null>(incomeTypeProp ?? null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (incomeTypeProp || !user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("income_type").eq("id", user.id).maybeSingle();
      setIncomeType(data?.income_type ?? null);
    })();
  }, [user, incomeTypeProp]);

  let typed: Deduction[] = [];
  let typedLabel = "";
  if (incomeType === "salary" || incomeType === "salaried") { typed = SALARIED; typedLabel = "For salaried taxpayers"; }
  else if (incomeType === "freelancer") { typed = FREELANCER; typedLabel = "For freelancers / professionals"; }
  else if (incomeType === "business") { typed = BUSINESS; typedLabel = "For business owners"; }

  const slab = totalIncome != null ? slabFor(Number(totalIncome)) : null;
  const all = [...typed, ...COMMON];

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-primary">
          <BookOpenCheck className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-base font-bold">Deductions available to you</h2>
          <p className="text-xs text-muted-foreground">
            Based on your income type{incomeType ? ` (${incomeType})` : ""}
            {slab ? ` and current tax slab` : ""} — under the Income Tax Act, 1961.
          </p>
        </div>
        {slab && (
          <div className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-primary">
            Slab: {slab.slab} · {slab.rate} · {slab.regime}
          </div>
        )}
      </header>

      {typedLabel && (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{typedLabel}</p>
      )}

      <div className="space-y-2">
        {all.map((d, idx) => {
          const key = `${d.section}-${idx}`;
          const isOpen = open === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setOpen(isOpen ? null : key)}
              className="w-full rounded-xl border border-border bg-background p-3.5 text-left transition-base hover:border-primary/40"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex shrink-0 items-center rounded-md bg-accent px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                  {d.section}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{d.title}</span>
                    <span className="text-[11px] font-medium text-success">{d.limit}</span>
                  </div>
                  {isOpen && <p className="mt-1.5 text-xs text-muted-foreground">{d.detail}</p>}
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        Limits and eligibility are indicative for FY 2024-25. Most deductions apply under the Old regime; standard deduction and a few others apply under the New regime. A MAAV-verified CA can confirm what fits your case.
      </p>
    </section>
  );
};

export default DeductionsBox;
