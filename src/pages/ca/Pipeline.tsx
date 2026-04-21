import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CaGuard } from "@/components/ca/RoleGuard";
import { MitraShell } from "@/components/ca/MitraShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { STAGES, StageId, RISK_TONE } from "@/lib/pipeline";
import { toast } from "sonner";
import { GripVertical } from "lucide-react";

const PipelineInner = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<StageId | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("ca_id", user.id)
      .order("last_activity_at", { ascending: false });
    setClients(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const onDrop = async (stage: StageId) => {
    setDropTarget(null);
    if (!dragId) return;
    const c = clients.find((x) => x.id === dragId);
    if (!c || c.stage === stage) { setDragId(null); return; }
    setClients((p) => p.map((x) => (x.id === dragId ? { ...x, stage } : x)));
    setDragId(null);
    const { error } = await supabase
      .from("clients")
      .update({ stage, last_activity_at: new Date().toISOString() })
      .eq("id", c.id);
    if (error) {
      toast.error("Could not update stage");
      load();
    } else {
      toast.success(`Moved to ${STAGES.find((s) => s.id === stage)!.label}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">Drag client cards across stages.</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-xs text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((s) => {
            const list = clients.filter((c) => c.stage === s.id);
            const isOver = dropTarget === s.id;
            return (
              <div
                key={s.id}
                onDragOver={(e) => { e.preventDefault(); setDropTarget(s.id); }}
                onDragLeave={() => setDropTarget((t) => (t === s.id ? null : t))}
                onDrop={() => onDrop(s.id)}
                className={`flex flex-col rounded-2xl border bg-card p-3 transition-base ${
                  isOver ? "border-primary bg-accent/40 shadow-glow" : "border-border"
                }`}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wider">{s.label}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {list.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {list.map((c) => (
                    <Link
                      key={c.id}
                      to={`/mitra/clients/${c.id}`}
                      draggable
                      onDragStart={() => setDragId(c.id)}
                      onDragEnd={() => setDragId(null)}
                      className={`block cursor-grab rounded-xl border border-border bg-background p-3 shadow-sm transition-base hover:border-primary/40 active:cursor-grabbing ${
                        dragId === c.id ? "opacity-40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{c.full_name}</p>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {c.income_type ?? "—"}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${RISK_TONE[c.risk]}`}>
                              {c.risk}
                            </span>
                            {c.health_score != null && (
                              <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                                Score {c.health_score}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {list.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Pipeline = () => (
  <CaGuard>
    <MitraShell>
      <PipelineInner />
    </MitraShell>
  </CaGuard>
);

export default Pipeline;
