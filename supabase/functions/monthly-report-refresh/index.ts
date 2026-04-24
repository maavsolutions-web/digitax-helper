// Monthly report refresh — invoked by pg_cron at 00:01 on the 1st of every month.
// For each active client:
//   1. Snapshot the current live report into report_snapshots (previous month label)
//   2. If new docs uploaded since last refresh → re-run AI analysis
//   3. Otherwise carry forward previous data with is_stale = true
// Errors per-client are logged to cron_errors with a 6h retry window.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function previousMonthLabel(d = new Date()): string {
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const monthLabel = previousMonthLabel();
  const startedAt = new Date().toISOString();

  // Optional single-client override (used by retry / manual paths)
  let onlyClientId: string | null = null;
  try {
    const body = await req.json();
    if (body?.clientId) onlyClientId = String(body.clientId);
  } catch (_) { /* no body */ }

  // Fetch clients eligible — onboarded > 1 month ago
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  let q = admin.from("clients").select("id, ca_id, created_at").lt("created_at", oneMonthAgo.toISOString());
  if (onlyClientId) q = admin.from("clients").select("id, ca_id, created_at").eq("id", onlyClientId);

  const { data: clients, error: cErr } = await q;
  if (cErr) {
    console.error("clients fetch failed", cErr);
    return new Response(JSON.stringify({ error: cErr.message }), { status: 500, headers: corsHeaders });
  }

  let processed = 0;
  let snapshotted = 0;
  let stale = 0;
  let failed = 0;

  for (const client of clients ?? []) {
    try {
      // Latest live report
      const { data: report } = await admin
        .from("reports")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!report) continue;

      // 1. Snapshot the current report
      const { error: snapErr } = await admin.from("report_snapshots").upsert({
        client_id: client.id,
        ca_id: client.ca_id,
        snapshot_month: monthLabel,
        report_data: report,
        health_score: report.health_score ?? null,
        is_stale: false,
      }, { onConflict: "client_id,snapshot_month" });
      if (snapErr) throw snapErr;
      snapshotted++;

      // 2. Decide: new docs since last refresh?
      const since = report.last_refreshed_at ?? report.created_at;
      const { data: newDocs } = await admin
        .from("documents")
        .select("id")
        .eq("client_id", client.id)
        .gt("created_at", since)
        .limit(1);

      if (!newDocs || newDocs.length === 0) {
        // Carry forward — flag stale
        await admin
          .from("report_snapshots")
          .update({ is_stale: true })
          .eq("client_id", client.id)
          .eq("snapshot_month", monthLabel);
        await admin
          .from("reports")
          .update({
            last_refreshed_at: startedAt,
            next_refresh_due: nextFirstOfMonth(),
          })
          .eq("id", report.id);
        stale++;
        processed++;
        continue;
      }

      // 3. Trigger fresh AI analysis (service-role call to analyze-tax-docs)
      const aiRes = await fetch(`${SUPABASE_URL}/functions/v1/analyze-tax-docs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientId: client.id, _internal: true }),
      });

      if (!aiRes.ok) {
        const text = await aiRes.text();
        throw new Error(`analyze-tax-docs failed: ${aiRes.status} ${text}`);
      }

      await admin
        .from("reports")
        .update({
          last_refreshed_at: new Date().toISOString(),
          next_refresh_due: nextFirstOfMonth(),
        })
        .eq("client_id", client.id)
        .eq("status", "final");

      processed++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`monthly-refresh client ${client.id} failed`, msg);
      await admin.from("cron_errors").insert({
        job_name: "monthly-report-refresh",
        client_id: client.id,
        error_message: msg,
        retry_after: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  return new Response(
    JSON.stringify({ ok: true, monthLabel, processed, snapshotted, stale, failed }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

function nextFirstOfMonth(): string {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return next.toISOString().slice(0, 10);
}
