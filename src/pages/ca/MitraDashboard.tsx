import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Users, Clock, CheckCircle2, ArrowRight, KanbanSquare, UserPlus } from "lucide-react";
import { CaGuard } from "@/components/ca/RoleGuard";
import { MitraShell } from "@/components/ca/MitraShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Stats {
  total: number;
  awaiting: number;
  filed: number;
}

const MitraDashboardInner = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ total: 0, awaiting: 0, filed: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: clients } = await supabase
        .from("clients")
        .select("id, full_name, stage, risk, last_activity_at")
        .eq("ca_id", user.id)
        .order("last_activity_at", { ascending: false });

      const list = clients ?? [];
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      setStats({
        total: list.length,
        awaiting: list.filter((c) => c.stage === "ready_for_review" || c.stage === "awaiting_approval").length,
        filed: list.filter((c) => c.stage === "filed" && new Date(c.last_activity_at) >= startOfMonth).length,
      });
      setRecent(list.slice(0, 5));
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Maav Mitra</p>
            <h1 className="font-display text-2xl font-bold tracking-tight">Welcome back</h1>
          </div>
        </div>
        <Link to="/mitra/clients">
          <Button variant="hero" size="sm">
            <UserPlus className="h-4 w-4" /> Add client
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<Users className="h-4 w-4" />} label="Total clients" value={loading ? "…" : String(stats.total)} />
        <Stat icon={<Clock className="h-4 w-4" />} label="Awaiting review" value={loading ? "…" : String(stats.awaiting)} />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Filed this month" value={loading ? "…" : String(stats.filed)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/mitra/pipeline" className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-base hover:border-primary/40 hover:shadow-elevated">
          <div className="flex items-center justify-between">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-primary">
              <KanbanSquare className="h-4 w-4" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-base group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
          <p className="mt-4 font-display text-base font-semibold">Open pipeline</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Drag clients across stages — docs, review, filed.</p>
        </Link>
        <Link to="/mitra/clients" className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-base hover:border-primary/40 hover:shadow-elevated">
          <div className="flex items-center justify-between">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-primary">
              <Users className="h-4 w-4" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-base group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
          <p className="mt-4 font-display text-base font-semibold">All clients</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Search, add, and open client files.</p>
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-sm font-semibold">Recent activity</h2>
          <Link to="/mitra/clients" className="text-xs font-medium text-primary hover:underline">View all</Link>
        </div>
        {loading ? (
          <div className="p-10 text-center text-xs text-muted-foreground">Loading…</div>
        ) : recent.length === 0 ? (
          <div className="p-10 text-center text-xs text-muted-foreground">No clients yet. Add one to get started.</div>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((c) => (
              <li key={c.id}>
                <Link to={`/mitra/clients/${c.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition-base hover:bg-muted/50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.full_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.last_activity_at).toLocaleDateString()}</p>
                  </div>
                  <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                    {c.stage.replace(/_/g, " ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-primary">{icon}</span>
      <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
    </div>
    <div className="mt-3 font-display text-3xl font-bold tabular-nums">{value}</div>
  </div>
);

const MitraDashboard = () => (
  <CaGuard>
    <MitraShell>
      <MitraDashboardInner />
    </MitraShell>
  </CaGuard>
);

export default MitraDashboard;
