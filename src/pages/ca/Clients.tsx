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
  const [form, setForm] = useState({ full_name: "", pan: "", income_type: "Salaried" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("ca_id", user.id)
      .order("last_activity_at", { ascending: false });
    setClients(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter((c) =>
      [c.full_name, c.pan, c.income_type].filter(Boolean).some((v: string) => v.toLowerCase().includes(s))
    );
  }, [clients, q]);

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
                      <div className="text-xs text-muted-foreground">{c.income_type ?? "—"}</div>
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
