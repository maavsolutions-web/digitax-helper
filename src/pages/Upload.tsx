import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/TopBar";
import { FlowShell, StepHeader, StepCheck } from "@/components/flow/StepHeader";
import { ArrowRight, Upload as UploadIcon, FileText, Info, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type DocTypeEnum = "form_26as" | "ais" | "form_16" | "investment_proof" | "other";

interface Doc {
  id: string;
  dbType: DocTypeEnum;
  name: string;
  why: string;
  required: boolean;
}

const docs: Doc[] = [
  { id: "26as", dbType: "form_26as", name: "Form 26AS", why: "TDS deducted on your PAN", required: true },
  { id: "ais", dbType: "ais", name: "Annual Information Statement (AIS)", why: "All financial transactions reported to IT dept", required: true },
  { id: "form16", dbType: "form_16", name: "Form 16 / Salary Slip", why: "Salary income & TDS proof", required: true },
  { id: "investments", dbType: "investment_proof", name: "Investment Proofs", why: "80C, 80D — to maximise deductions", required: false },
];

interface UploadedFile {
  fileName: string;
  filePath: string;
  documentId: string;
}

const Upload = () => {
  const { user } = useAuth();
  const [uploaded, setUploaded] = useState<Record<string, UploadedFile>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const progress = useMemo(() => {
    return Math.round((Object.keys(uploaded).length / docs.length) * 100);
  }, [uploaded]);

  const handleUpload = async (doc: Doc, file?: File) => {
    if (!file) return;
    if (!user) {
      toast.error("Please sign in first");
      navigate("/signup");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)");
      return;
    }

    setBusy((b) => ({ ...b, [doc.id]: true }));
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${user.id}/_inbox/${doc.dbType}-${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("tax-docs")
        .upload(filePath, file, { upsert: false, contentType: file.type || undefined });
      if (uploadError) throw uploadError;

      const { data: docRow, error: insertError } = await supabase
        .from("documents")
        .insert({
          owner_user_id: user.id,
          doc_type: doc.dbType,
          file_name: file.name,
          file_path: filePath,
          size_bytes: file.size,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      setUploaded((p) => ({
        ...p,
        [doc.id]: { fileName: file.name, filePath, documentId: docRow.id },
      }));
      toast.success(`${doc.name} uploaded`);
    } catch (e: any) {
      console.error("Upload failed", e);
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setBusy((b) => ({ ...b, [doc.id]: false }));
    }
  };

  const proceed = async () => {
    if (!user) {
      toast.error("Please sign in first");
      navigate("/signup");
      return;
    }
    const requiredCount = docs.filter((d) => d.required).length;
    const requiredUploaded = docs.filter((d) => d.required && uploaded[d.id]).length;
    if (requiredUploaded < Math.ceil(requiredCount / 2)) {
      toast.error("Upload at least Form 26AS or Form 16 to continue");
      return;
    }
    setSubmitting(true);
    navigate("/processing");
    setSubmitting(false);
  };

  return (
    <>
      <TopBar showCta={false} />
      <FlowShell>
        <div className="space-y-8 animate-fade-in">
          <StepHeader current={2} total={3} label="Documents" />

          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Upload your tax documents</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              The more you upload, the more accurate your Tax Health Report will be.
            </p>
          </div>

          {/* Progress card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Upload progress</div>
                <div className="mt-0.5 font-display text-2xl font-bold tabular-nums">{progress}%</div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-xs font-medium text-success">
                <Lock className="h-3 w-3" /> 256-bit encrypted
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full gradient-primary transition-base"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Doc list */}
          <div className="space-y-3">
            {docs.map((doc) => {
              const done = !!uploaded[doc.id];
              const isDrag = dragOver === doc.id;
              const isBusy = busy[doc.id];
              return (
                <label
                  key={doc.id}
                  htmlFor={`f-${doc.id}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(doc.id); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(null);
                    handleUpload(doc, e.dataTransfer.files?.[0]);
                  }}
                  className={`group flex cursor-pointer items-start gap-4 rounded-2xl border bg-card p-4 transition-base ${
                    isDrag
                      ? "border-primary bg-accent shadow-glow"
                      : done
                      ? "border-success/40 bg-success-soft/30"
                      : "border-border hover:border-primary/40 hover:bg-accent/30"
                  }`}
                >
                  <StepCheck done={done} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{doc.name}</span>
                      {doc.required ? (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-foreground">
                          Recommended
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Info className="h-3 w-3" /> {doc.why}
                    </p>
                    {done && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-success">
                        <FileText className="h-3 w-3" /> {uploaded[doc.id].fileName}
                      </p>
                    )}
                  </div>
                  <div className={`hidden shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-base group-hover:border-primary/50 group-hover:text-primary sm:inline-flex ${done ? "opacity-50" : ""}`}>
                    {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadIcon className="h-3.5 w-3.5" />}
                    {isBusy ? "Uploading…" : done ? "Replace" : "Drag or click"}
                  </div>
                  <input
                    id={`f-${doc.id}`}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    disabled={isBusy}
                    onChange={(e) => handleUpload(doc, e.target.files?.[0] ?? undefined)}
                  />
                </label>
              );
            })}
          </div>

          <Button onClick={proceed} variant="hero" size="lg" className="w-full" disabled={progress === 0 || submitting}>
            Analyze my taxes <ArrowRight />
          </Button>
        </div>
      </FlowShell>
    </>
  );
};

export default Upload;
