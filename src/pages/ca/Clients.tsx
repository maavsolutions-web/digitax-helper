import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CaGuard } from "@/components/ca/RoleGuard";
import { MitraShell } from "@/components/ca/MitraShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, UserPlus, ArrowRight, FileUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { RISK_TONE } from "@/lib/pipeline";
import { BulkImportDialog } from "@/components/ca/BulkImportDialog";

const ClientsInner = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", pan: "", income_type: "Salaried" });
  const [saving, setSaving] = useState(false);

  const [refreshMap, setRefreshMap] = useState<Record<string, string>>({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("ca_id", user.id)
      .order("last_activity_at", { ascending: false });
    const list = data ?? [];
    setClients(list);
    setLoading(false);

    // Fetch latest report refresh per client
    if (list.length > 0) {
      const ids = list.map((c) => c.id);
      const { data: reps } = await supabase
        .from("reports")
        .select("client_id, last_refreshed_at, created_at")
        .in("client_id", ids);
      const map: Record<string, string> = {};
      (reps ?? []).forEach((r: any) => {
        if (!r.client_id) return;
        const ts = r.last_refreshed_at ?? r.created_at;
        if (!map[r.client_id] || new Date(ts) > new Date(map[r.client_id])) map[r.client_id] = ts;
      });
      setRefreshMap(map);
    }
  };

  useEffect(() => { load(); }, [user]);

  type SortKey = "newest" | "oldest" | "week" | "month" | "lastMonth";
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = clients;
    if (s) {
      list = list.filter((c) =>
        [c.full_name, c.pan, c.income_type].filter(Boolean).some((v: string) => v.toLowerCase().includes(s))
      );
    }

    const reportTs = (id: string) => {
      const t = refreshMap[id];
      return t ? new Date(t).getTime() : 0;
    };

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const endOfLastMonth = startOfMonth;

    if (sortKey === "week") {
      list = list.filter((c) => reportTs(c.id) >= startOfWeek.getTime());
    } else if (sortKey === "month") {
      list = list.filter((c) => reportTs(c.id) >= startOfMonth);
    } else if (sortKey === "lastMonth") {
      list = list.filter((c) => {
        const t = reportTs(c.id);
        return t >= startOfLastMonth && t < endOfLastMonth;
      });
    }

    const sorted = [...list].sort((a, b) => {
      const ta = reportTs(a.id);
      const tb = reportTs(b.id);
      return sortKey === "oldest" ? ta - tb : tb - ta;
    });
    return sorted;
  }, [clients, q, sortKey, refreshMap]);

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "newest", label: "Newest report first" },
    { key: "oldest", label: "Oldest report first" },
    { key: "week", label: "This week" },
    { key: "month", label: "This month" },
    { key: "lastMonth", label: "Last month" },
  ];

  const add = async () => {
    if (!user) return;
    if (!form.full_name.trim()) {
      toast.error("Client name is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("clients").insert({
      ca_id: user.id,
      full_name: form.full_name.trim(),
      pan: form.pan.trim() || null,
      income_type: form.income_type || null,
      stage: "docs_pending",
      risk: "medium",
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Client added");
    setOpen(false);
    setForm({ full_name: "", pan: "", income_type: "Salaried" });
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search, add, and open your client files.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
            <FileUp className="h-4 w-4" /> Bulk import
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="sm">
                <UserPlus className="h-4 w-4" /> Add client
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Add new client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Field label="Full name">
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Priya Raman" />
              </Field>
              <Field label="PAN (optional)">
                <Input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} maxLength={10} placeholder="ABCDE1234F" />
              </Field>
              <Field label="Income type">
                <select
                  value={form.income_type}
                  onChange={(e) => setForm({ ...form, income_type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option>Salaried</option>
                  <option>Business</option>
                  <option>Freelance / Professional</option>
                  <option>Capital gains</option>
                  <option>Mixed</option>
                </select>
              </Field>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={add} disabled={saving}>{saving ? "Saving…" : "Add client"}</Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <BulkImportDialog open={bulkOpen} onOpenChange={setBulkOpen} onComplete={load} />

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, PAN or income type…"
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium">No clients found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {clients.length === 0 ? "Add your first client to get started." : "Try a different search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Client</th>
                  <th className="px-5 py-3 text-left font-medium">PAN</th>
                  <th className="px-5 py-3 text-left font-medium">Stage</th>
                  <th className="px-5 py-3 text-left font-medium">Risk</th>
                  <th className="px-5 py-3 text-left font-medium">Last activity</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="transition-base hover:bg-muted/30">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold">{c.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.income_type ?? "—"}
                        {refreshMap[c.id] && (
                          <span className="ml-2 text-[10px] text-muted-foreground/70">
                            · Refreshed {new Date(refreshMap[c.id]).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs">{c.pan ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                        {c.stage.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${RISK_TONE[c.risk]}`}>
                        {c.risk}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {new Date(c.last_activity_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to={`/mitra/clients/${c.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        Open <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-medium text-muted-foreground">{label}</label>
    <div className="mt-1.5">{children}</div>
  </div>
);

const Clients = () => (
  <CaGuard>
    <MitraShell>
      <ClientsInner />
    </MitraShell>
  </CaGuard>
);

export default Clients;
