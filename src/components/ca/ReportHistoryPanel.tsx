import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, History, AlertCircle, CheckCircle2 } from "lucide-react";

type Snapshot = {
  id: string;
  snapshot_month: string;
  health_score: number | null;
  is_stale: boolean;
  created_at: string;
  report_data: any;
};

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
};

export const ReportHistoryPanel = ({ clientId }: { clientId: string }) => {
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("report_snapshots")
        .select("*")
        .eq("client_id", clientId)
        .order("snapshot_month", { ascending: false });
      setSnaps((data as any) ?? []);
      setLoading(false);
    })();
  }, [clientId]);

  const active = snaps.find((s) => s.id === selected);

  if (loading) return null;
  if (snaps.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold">Report history</h3>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          No archived reports yet. The first snapshot will appear after the next monthly refresh
          (1st of the month) or after a manual refresh.
        </p>
      </div>
    );
  }

  const r = active?.report_data ?? null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-3">
        <History className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold">Report history</h3>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="ml-auto h-9 rounded-md border border-input bg-background px-3 text-xs"
        >
          <option value="">Select a month…</option>
          {snaps.map((s) => (
            <option key={s.id} value={s.id}>
              {monthLabel(s.snapshot_month)} {s.is_stale ? "· carried forward" : ""}
            </option>
          ))}
        </select>
      </div>

      {active && (
        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-soft px-3 py-2 text-xs text-warning">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Viewing archived report — <strong>{monthLabel(active.snapshot_month)}</strong>. This is a read-only snapshot
              {active.is_stale ? " (no new docs that month — carried forward)." : "."}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Activity className="h-3 w-3" /> Health
              </div>
              <div className="mt-2 font-display text-3xl font-bold tabular-nums">
                {active.health_score ?? r?.health_score ?? "—"}
              </div>
              <p className="text-[11px] text-muted-foreground">{r?.filing_year ?? "FY 2024-25"}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Refund</div>
              <div className="mt-2 font-display text-2xl font-bold tabular-nums text-success">
                {r?.refund_amount != null ? `₹${Number(r.refund_amount).toLocaleString("en-IN")}` : "—"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Payable</div>
              <div className="mt-2 font-display text-2xl font-bold tabular-nums text-warning">
                {r?.payable_amount != null ? `₹${Number(r.payable_amount).toLocaleString("en-IN")}` : "—"}
              </div>
            </div>
          </div>

          {r?.summary && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Summary</p>
              <p className="mt-1 text-xs text-muted-foreground">{r.summary}</p>
            </div>
          )}

          {Array.isArray(r?.key_issues) && r.key_issues.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Key issues</p>
              <ul className="mt-2 space-y-1.5">
                {r.key_issues.map((i: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 text-primary" />
                    <div>
                      <span className="font-medium">{i.title}</span>
                      <span className="text-muted-foreground"> — {i.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(r?.savings) && r.savings.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Savings</p>
              <ul className="mt-2 space-y-1.5">
                {r.savings.map((s: any, idx: number) => (
                  <li key={idx} className="flex items-center justify-between text-xs">
                    <span><span className="font-mono">{s.section}</span> · {s.label}</span>
                    <span className="font-semibold text-success">₹{Number(s.amount).toLocaleString("en-IN")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
