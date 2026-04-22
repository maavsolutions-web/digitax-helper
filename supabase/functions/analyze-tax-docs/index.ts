// Analyze uploaded tax documents with Gemini 2.5 Pro and persist a structured report.
// Callable by:
//   - the document owner (individual user) → analyzes their own latest docs
//   - a CA → must pass clientId, must own the client
//
// Request: { clientId?: string }
// Response: { reportId: string, status: 'final' | 'failed' }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM_PROMPT = `You are an expert Indian Chartered Accountant analysing a taxpayer's documents for FY 2024-25 (AY 2025-26).

You will receive scans/PDFs of any of: Form 26AS, Annual Information Statement (AIS), Form 16, salary slips, investment proofs.

Your job:
1. Cross-check income reported across documents.
2. Detect mismatches between Form 26AS and AIS.
3. Identify undeclared income, unclaimed deductions (80C, 80D, HRA, etc.).
4. Estimate tax liability vs TDS to compute refund or payable.
5. Score the taxpayer's overall "tax health" from 0-100 (100 = clean, fully optimised).
6. Produce a friendly natural-language summary (2-3 sentences) for the taxpayer.

Be conservative. If a number is not clearly visible, omit it rather than guess. All amounts in INR.

Always respond by calling the submit_tax_report function.`;

const REPORT_TOOL = {
  type: "function" as const,
  function: {
    name: "submit_tax_report",
    description: "Return the structured tax health report for the taxpayer.",
    parameters: {
      type: "object",
      properties: {
        health_score: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "Overall tax health 0-100",
        },
        filing_year: {
          type: "string",
          description: "e.g. 'FY 2024-25'",
        },
        refund_amount: {
          type: "number",
          description: "Estimated refund in INR. 0 if none.",
        },
        payable_amount: {
          type: "number",
          description: "Estimated additional tax payable in INR. 0 if none.",
        },
        total_income: {
          type: "number",
          description: "Estimated total income across all sources in INR.",
        },
        summary: {
          type: "string",
          description: "2-3 sentence taxpayer-friendly summary.",
        },
        key_issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              detail: { type: "string" },
              severity: { type: "string", enum: ["low", "medium", "high"] },
              tag: { type: "string", description: "Short label e.g. 'Mismatch'" },
            },
            required: ["title", "detail", "severity", "tag"],
            additionalProperties: false,
          },
        },
        risk_alerts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              detail: { type: "string" },
              severity: { type: "string", enum: ["low", "medium", "high"] },
            },
            required: ["title", "detail", "severity"],
            additionalProperties: false,
          },
        },
        savings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              section: { type: "string", description: "e.g. '80C', 'HRA'" },
              label: { type: "string" },
              amount: { type: "number", description: "Estimated savings in INR" },
              hint: { type: "string" },
            },
            required: ["section", "label", "amount", "hint"],
            additionalProperties: false,
          },
        },
      },
      required: [
        "health_score",
        "filing_year",
        "refund_amount",
        "payable_amount",
        "total_income",
        "summary",
        "key_issues",
        "risk_alerts",
        "savings",
      ],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Per-user client (verifies JWT)
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) return json({ error: "Unauthorized" }, 401);
    const user = userRes.user;

    // Service client for storage signing + writing reports
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const clientId: string | undefined = body.clientId;

    // Resolve owner_user_id and client_id
    let ownerUserId = user.id;
    let resolvedClientId: string | null = null;

    if (clientId) {
      const { data: client, error: clientErr } = await admin
        .from("clients")
        .select("id, ca_id, source_user_id")
        .eq("id", clientId)
        .maybeSingle();
      if (clientErr || !client) return json({ error: "Client not found" }, 404);
      // Authorise: either the CA who owns the client, or the source user
      if (client.ca_id !== user.id && client.source_user_id !== user.id) {
        return json({ error: "Forbidden" }, 403);
      }
      resolvedClientId = client.id;
      // Owner of the report is whoever uploaded the docs (source user) when present
      ownerUserId = client.source_user_id ?? user.id;
    }

    // Fetch the most recent documents for this owner / client
    let docsQuery = admin
      .from("documents")
      .select("id, doc_type, file_name, file_path, owner_user_id, client_id, created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    if (resolvedClientId) {
      docsQuery = docsQuery.eq("client_id", resolvedClientId);
    } else {
      docsQuery = docsQuery.eq("owner_user_id", ownerUserId);
    }

    const { data: docs, error: docsErr } = await docsQuery;
    if (docsErr) throw docsErr;
    if (!docs || docs.length === 0) {
      return json({ error: "No documents found to analyse" }, 400);
    }

    // Build signed URLs (5 min) for each file in storage
    const docParts: Array<{ type: "image_url"; image_url: { url: string } }> = [];
    const docList: string[] = [];
    for (const d of docs) {
      if (!d.file_path) continue;
      const { data: signed } = await admin.storage
        .from("tax-docs")
        .createSignedUrl(d.file_path, 60 * 5);
      if (signed?.signedUrl) {
        docParts.push({ type: "image_url", image_url: { url: signed.signedUrl } });
        docList.push(`- ${d.doc_type}: ${d.file_name}`);
      }
    }

    if (docParts.length === 0) {
      return json({ error: "Documents found but none have downloadable files" }, 400);
    }

    // Mark a "processing" report so the UI can poll
    const { data: pendingReport, error: pendingErr } = await admin
      .from("reports")
      .insert({
        owner_user_id: ownerUserId,
        client_id: resolvedClientId,
        status: "processing",
        health_score: 0,
        key_issues: [],
        risk_alerts: [],
        savings: [],
      })
      .select("id")
      .single();
    if (pendingErr) throw pendingErr;

    const userMessage = {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: `Please analyse the following ${docParts.length} tax document(s) and submit the structured report.\n\nDocuments provided:\n${docList.join("\n")}`,
        },
        ...docParts,
      ],
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          userMessage,
        ],
        tools: [REPORT_TOOL],
        tool_choice: { type: "function", function: { name: "submit_tax_report" } },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("AI gateway error", aiRes.status, text);
      await admin.from("reports").update({ status: "failed" }).eq("id", pendingReport.id);
      if (aiRes.status === 429) return json({ error: "Rate limit hit, try again in a minute" }, 429);
      if (aiRes.status === 402) return json({ error: "AI credits exhausted. Add funds in Workspace → Usage." }, 402);
      return json({ error: "AI analysis failed" }, 500);
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call returned", JSON.stringify(aiJson).slice(0, 500));
      await admin.from("reports").update({ status: "failed" }).eq("id", pendingReport.id);
      return json({ error: "AI returned no structured output" }, 500);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Tool arg parse failed", e);
      await admin.from("reports").update({ status: "failed" }).eq("id", pendingReport.id);
      return json({ error: "Could not parse AI output" }, 500);
    }

    const { error: updErr } = await admin
      .from("reports")
      .update({
        status: "final",
        health_score: parsed.health_score ?? 0,
        refund_amount: parsed.refund_amount ?? null,
        payable_amount: parsed.payable_amount ?? null,
        filing_year: parsed.filing_year ?? null,
        summary: parsed.summary ?? null,
        key_issues: parsed.key_issues ?? [],
        risk_alerts: parsed.risk_alerts ?? [],
        savings: parsed.savings ?? [],
        parsed_data: { total_income: parsed.total_income ?? null },
      })
      .eq("id", pendingReport.id);

    if (updErr) throw updErr;

    // Sync the headline score onto the client record (if any)
    if (resolvedClientId) {
      await admin
        .from("clients")
        .update({
          health_score: parsed.health_score ?? null,
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", resolvedClientId);
    }

    return json({ reportId: pendingReport.id, status: "final" });
  } catch (e) {
    console.error("analyze-tax-docs error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
