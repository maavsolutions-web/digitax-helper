import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CaGuard } from "@/components/ca/RoleGuard";
import { MitraShell } from "@/components/ca/MitraShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { STAGES, StageId, RISK_TONE } from "@/lib/pipeline";
import { ArrowLeft, FileText, MessageSquare, Activity, Trash2, Sparkles, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { CommunicationsLog } from "@/components/ca/CommunicationsLog";
import { ReportHistoryPanel } from "@/components/ca/ReportHistoryPanel";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Detail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [sourcePhone, setSourcePhone] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("current");

  const monthLabel = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const refreshNow = async () => {
    if (!id || !user || !report) return;
    setRefreshing(true);
    try {
      // Snapshot current report under current month before refresh
      await supabase.from("report_snapshots").upsert({
        client_id: id,
        ca_id: user.id,
        snapshot_month: monthLabel(),
        report_data: report,
        health_score: report.health_score ?? null,
        is_stale: false,
      }, { onConflict: "client_id,snapshot_month" });

      const { error } = await supabase.functions.invoke("analyze-tax-docs", { body: { clientId: id } });
      if (error) throw error;
      await supabase.from("reports").update({ last_refreshed_at: new Date().toISOString() }).eq("id", report.id);
      toast.success("Report refreshed");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Refresh failed");
    } finally {
      setRefreshing(false);
      setConfirmRefresh(false);
    }
  };

  const load = async () => {
    if (!id || !user) return;
    const [{ data: c }, { data: d }, { data: r }, { data: n }, { data: snaps }] = await Promise.all([
      supabase.from("clients").select("*").eq("id", id).maybeSingle(),
      supabase.from("documents").select("*").eq("client_id", id).order("created_at", { ascending: false }),
      supabase.from("reports").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("notes").select("*").eq("client_id", id).order("created_at", { ascending: false }),
      supabase.from("report_snapshots").select("*").eq("client_id", id).eq("ca_id", user.id).order("snapshot_month", { ascending: false }),
    ]);
    setClient(c);
    setDocs(d ?? []);
    setReport(r);
    setNotes(n ?? []);
    setSnapshots(snaps ?? []);

    // Pull the linked user's phone for WhatsApp deep-link, if any
    if (c?.source_user_id) {
      const { data: srcProfile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", c.source_user_id)
        .maybeSingle();
      setSourcePhone(srcProfile?.phone ?? null);
    } else {
      setSourcePhone(null);
    }

    setLoading(false);
  };

  useEffect(() => { load(); }, [id, user]);

  const updateStage = async (stage: StageId) => {
    if (!client) return;
    setClient({ ...client, stage });
    const { error } = await supabase
      .from("clients")
      .update({ stage, last_activity_at: new Date().toISOString() })
      .eq("id", client.id);
    if (error) toast.error("Could not update");
    else toast.success("Stage updated");
  };

  const updateRisk = async (risk: "low" | "medium" | "high") => {
    if (!client) return;
    setClient({ ...client, risk });
    const { error } = await supabase.from("clients").update({ risk }).eq("id", client.id);
    if (error) toast.error("Could not update risk");
  };

  const addNote = async () => {
    if (!noteBody.trim() || !user || !id) return;
    const body = noteBody.trim();
    setNoteBody("");
    const { error, data } = await supabase
      .from("notes")
      .insert({ ca_id: user.id, client_id: id, body })
      .select()
      .single();
    if (error) {
      toast.error("Could not save note");
      setNoteBody(body);
    } else {
      setNotes((p) => [data, ...p]);
    }
  };

  const deleteNote = async (noteId: string) => {
    const prev = notes;
    setNotes(notes.filter((n) => n.id !== noteId));
    const { error } = await supabase.from("notes").delete().eq("id", noteId);
    if (error) {
      toast.error("Could not delete");
      setNotes(prev);
    }
  };

  const generateReport = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-tax-docs", {
        body: { clientId: id },
      });
      if (error) throw error;
      toast.success("AI report generated");
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Could not generate report");
    } finally {
      setAnalyzing(false);
    }
  };

  const approveReport = async () => {
    if (!report) return;
    const { error } = await supabase
      .from("reports")
      .update({ ca_approved: true, status: "final" })
      .eq("id", report.id);
    if (error) {
      toast.error("Could not approve");
      return;
    }
    toast.success("Report approved");
    setReport({ ...report, ca_approved: true, status: "final" });
  };

  if (loading) return (
    <CaGuard><MitraShell><div className="p-10 text-sm text-muted-foreground">Loading client…</div></MitraShell></CaGuard>
  );

  const formatMonth = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
  };
  const isArchived = selectedMonth !== "current";
  const activeSnap = isArchived ? snapshots.find((s) => s.snapshot_month === selectedMonth) : null;
  const viewedReport = activeSnap ? { ...(activeSnap.report_data ?? {}), health_score: activeSnap.health_score ?? activeSnap.report_data?.health_score } : report;

  if (!client) return (
    <CaGuard><MitraShell>
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <p className="text-sm font-semibold">Client not found</p>
        <Button onClick={() => navigate("/mitra/clients")} variant="outline" size="sm" className="mt-4">Back to clients</Button>
      </div>
    </MitraShell></CaGuard>
  );

  return (
    <CaGuard>
      <MitraShell>
        <div className="space-y-6 animate-fade-in">
          <Link to="/mitra/clients" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> All clients
          </Link>

          {/* Header */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">{client.full_name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {client.pan && <span className="font-mono">{client.pan}</span>}
                  {client.income_type && <span>· {client.income_type}</span>}
                  <span>· Added {new Date(client.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Risk</span>
                {(["low", "medium", "high"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => updateRisk(r)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-base ${
                      client.risk === r ? RISK_TONE[r] : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage stepper */}
            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stage</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {STAGES.map((s) => {
                  const active = client.stage === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => updateStage(s.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-base ${
                        active
                          ? "bg-primary text-primary-foreground shadow-glow"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Report card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-1">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold">Tax health</h3>
                {report?.ca_approved && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">
                    <CheckCircle2 className="h-3 w-3" /> Approved
                  </span>
                )}
              </div>
              {report ? (
                <>
                  <div className="mt-4 font-display text-4xl font-bold tabular-nums">{report.health_score}</div>
                  <p className="text-xs text-muted-foreground">out of 100 · {report.filing_year ?? "FY 2024-25"}</p>
                  {report.summary && (
                    <p className="mt-3 text-xs text-muted-foreground">{report.summary}</p>
                  )}
                  <div className="mt-4 space-y-2 text-xs">
                    {report.refund_amount != null && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Refund</span><span className="font-semibold text-success">₹{Number(report.refund_amount).toLocaleString("en-IN")}</span></div>
                    )}
                    {report.payable_amount != null && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Payable</span><span className="font-semibold text-warning">₹{Number(report.payable_amount).toLocaleString("en-IN")}</span></div>
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">No report generated yet.</p>
              )}

              <div className="mt-4 flex flex-col gap-2">
                <Button onClick={generateReport} disabled={analyzing || docs.length === 0} variant="hero" size="sm" className="w-full">
                  {analyzing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…</> : <><Sparkles className="h-3.5 w-3.5" /> {report ? "Regenerate with AI" : "Generate AI report"}</>}
                </Button>
                {report && (
                  <Button onClick={() => setConfirmRefresh(true)} disabled={refreshing || docs.length === 0} variant="outline" size="sm" className="w-full">
                    {refreshing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Refreshing…</> : <><RefreshCw className="h-3.5 w-3.5" /> Refresh report now</>}
                  </Button>
                )}
                {report && !report.ca_approved && (
                  <Button onClick={approveReport} variant="outline" size="sm" className="w-full">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve & finalize
                  </Button>
                )}
                {report?.last_refreshed_at && (
                  <p className="text-[11px] text-muted-foreground">
                    Last refreshed {new Date(report.last_refreshed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                )}
                {docs.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">Upload documents first to enable AI analysis.</p>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold">Documents</h3>
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {docs.length}
                </span>
              </div>
              {docs.length === 0 ? (
                <p className="mt-4 text-xs text-muted-foreground">No documents uploaded.</p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.file_name}</p>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{d.doc_type.replace(/_/g, " ")}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold">Internal notes</h3>
            </div>
            <div className="mt-4 space-y-2">
              <Textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Add a note about this client (visible only to you)…"
                rows={3}
              />
              <div className="flex justify-end">
                <Button onClick={addNote} variant="hero" size="sm" disabled={!noteBody.trim()}>Add note</Button>
              </div>
            </div>
            {notes.length > 0 && (
              <ul className="mt-4 divide-y divide-border">
                {notes.map((n) => (
                  <li key={n.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => deleteNote(n.id)} className="text-muted-foreground hover:text-danger">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Report history */}
          <ReportHistoryPanel clientId={client.id} />

          {/* Communications */}
          <CommunicationsLog clientId={client.id} clientName={client.full_name} clientPhone={sourcePhone} />
        </div>

        <AlertDialog open={confirmRefresh} onOpenChange={setConfirmRefresh}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Refresh report now?</AlertDialogTitle>
              <AlertDialogDescription>
                This will regenerate the report using the client's latest uploaded documents.
                The current report will be saved as a snapshot before refreshing. Continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={refreshing}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={refreshNow} disabled={refreshing}>
                {refreshing ? "Refreshing…" : "Yes, refresh"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </MitraShell>
    </CaGuard>
  );
};

export default Detail;
