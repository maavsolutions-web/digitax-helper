import { TopBar } from "@/components/TopBar";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Briefcase, Users, Clock, CheckCircle2 } from "lucide-react";

const MitraDashboard = () => {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/ca/login" replace />;
  if (role !== "ca") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <TopBar showCta={false} />
      <main className="container max-w-6xl py-10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Maav Mitra</p>
            <h1 className="font-display text-2xl font-bold tracking-tight">Welcome back</h1>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat icon={<Users className="h-4 w-4" />} label="Total clients" value="—" />
          <Stat icon={<Clock className="h-4 w-4" />} label="Awaiting review" value="—" />
          <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Filed this month" value="—" />
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Your client pipeline (kanban), client list, detail view, and bulk actions are coming next.
          </p>
        </div>
      </main>
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

export default MitraDashboard;
