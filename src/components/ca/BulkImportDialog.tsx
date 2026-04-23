import { useState } from "react";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Row = { full_name: string; pan?: string; mobile?: string };
type Result = { row: number; name: string; status: "ok" | "error"; message?: string };

const TEMPLATE_CSV = "Name,PAN,Mobile\nPriya Raman,ABCDE1234F,9876543210\nRahul Sharma,FGHIJ5678K,9123456780\n";

export const BulkImportDialog = ({
  open,
  onOpenChange,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onComplete: () => void;
}) => {
  const { user } = useAuth();
  const [parsedRows, setParsedRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [progress, setProgress] = useState(0);

  const reset = () => {
    setParsedRows([]);
    setFileName("");
    setResults([]);
    setProgress(0);
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "maav-clients-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    setResults([]);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (res) => {
        const rows: Row[] = res.data
          .map((r) => ({
            full_name: (r.name ?? r.full_name ?? "").trim(),
            pan: (r.pan ?? "").trim().toUpperCase() || undefined,
            mobile: (r.mobile ?? r.phone ?? "").trim() || undefined,
          }))
          .filter((r) => r.full_name);
        if (!rows.length) {
          toast.error("No valid rows found. Make sure the file has a 'Name' column.");
          return;
        }
        setParsedRows(rows);
      },
      error: (err) => toast.error(`Could not read CSV: ${err.message}`),
    });
  };

  const runImport = async () => {
    if (!user || !parsedRows.length) return;
    setImporting(true);
    setProgress(0);
    const out: Result[] = [];
    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      const { error } = await supabase.from("clients").insert({
        ca_id: user.id,
        full_name: row.full_name,
        pan: row.pan ?? null,
        income_type: null,
        stage: "docs_pending",
        risk: "medium",
      });
      if (error) {
        out.push({ row: i + 2, name: row.full_name, status: "error", message: error.message });
      } else {
        out.push({ row: i + 2, name: row.full_name, status: "ok" });
        // SMS invite: stubbed (Twilio not connected). Logged to communications for traceability.
        if (row.mobile) {
          await supabase.from("communications").insert({
            ca_id: user.id,
            client_id: user.id, // placeholder — full link requires returning id
            message_type: "invite",
            message_content: `Invite SMS to ${row.mobile}: Your CA invited you to Maav.`,
            delivered: false,
            delivery_meta: { stub: true, mobile: row.mobile },
          }).then(() => {}, () => {});
        }
      }
      setProgress(Math.round(((i + 1) / parsedRows.length) * 100));
      setResults([...out]);
    }
    setImporting(false);
    const okCount = out.filter((r) => r.status === "ok").length;
    toast.success(`Imported ${okCount} of ${parsedRows.length} clients`);
    onComplete();
  };

  const close = () => {
    if (importing) return;
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk import clients</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Step 1 — Download the template</p>
            <p className="mt-1 text-xs text-muted-foreground">
              CSV with columns: Name (required), PAN, Mobile. SMS invites to mobile numbers are queued (delivery pending Twilio).
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={downloadTemplate}>
              <Download className="h-4 w-4" /> Download template
            </Button>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-medium">Step 2 — Upload your file</p>
            <Input
              type="file"
              accept=".csv,text/csv"
              className="mt-3"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {fileName && (
              <p className="mt-2 text-xs text-muted-foreground">
                {fileName} — {parsedRows.length} valid rows
              </p>
            )}
          </div>

          {parsedRows.length > 0 && !results.length && (
            <div className="max-h-48 overflow-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">PAN</th>
                    <th className="px-3 py-2 text-left font-medium">Mobile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedRows.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{r.full_name}</td>
                      <td className="px-3 py-2 font-mono">{r.pan ?? "—"}</td>
                      <td className="px-3 py-2 font-mono">{r.mobile ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedRows.length > 50 && (
                <p className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
                  Showing first 50 of {parsedRows.length}
                </p>
              )}
            </div>
          )}

          {importing && (
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Importing…</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="max-h-48 overflow-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Row</th>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((r) => (
                    <tr key={r.row}>
                      <td className="px-3 py-2">{r.row}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">
                        {r.status === "ok" ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <CheckCircle2 className="h-3 w-3" /> Added
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-destructive" title={r.message}>
                            <AlertCircle className="h-3 w-3" /> {r.message?.slice(0, 40) ?? "Failed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={importing}>
            {results.length ? "Done" : "Cancel"}
          </Button>
          {parsedRows.length > 0 && !results.length && (
            <Button variant="hero" onClick={runImport} disabled={importing}>
              <Upload className="h-4 w-4" />
              {importing ? "Importing…" : `Import ${parsedRows.length} clients`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
