import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, FileSearch, Bell, Activity, Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";

type CommType = "document_request" | "reminder" | "status_update" | "invite" | "custom";

interface Comm {
  id: string;
  message_type: CommType;
  message_content: string;
  delivered: boolean;
  sent_at: string;
}

const TYPE_META: Record<CommType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  document_request: { label: "Doc request", icon: FileSearch },
  reminder: { label: "Reminder", icon: Bell },
  status_update: { label: "Status update", icon: Activity },
  invite: { label: "Invite", icon: Send },
  custom: { label: "Message", icon: MessageCircle },
};

interface Props {
  clientId: string;
  clientName?: string;
  clientPhone?: string | null;
}

export const CommunicationsLog = ({ clientId, clientName, clientPhone }: Props) => {
  const { user } = useAuth();
  const [comms, setComms] = useState<Comm[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [type, setType] = useState<CommType>("custom");
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("communications")
      .select("id, message_type, message_content, delivered, sent_at")
      .eq("client_id", clientId)
      .order("sent_at", { ascending: false });
    setComms((data ?? []) as Comm[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [clientId]);

  const presetTemplates = (t: CommType) => {
    switch (t) {
      case "document_request":
        return `Hi ${clientName ?? "there"}, please upload your Form 26AS, AIS and Form 16 on Maav so we can prepare your filing.`;
      case "reminder":
        return `Friendly reminder: your tax filing deadline is approaching. Please share pending documents.`;
      case "status_update":
        return `Update: your return is ${"under review"}. We'll share the draft for your approval shortly.`;
      default:
        return "";
    }
  };

  const onTypeChange = (t: CommType) => {
    setType(t);
    if (!draft.trim()) setDraft(presetTemplates(t));
  };

  const send = async (alsoWhatsapp: boolean) => {
    if (!user || !draft.trim()) return;
    setSending(true);
    const { data, error } = await supabase
      .from("communications")
      .insert({
        ca_id: user.id,
        client_id: clientId,
        message_type: type,
        message_content: draft.trim(),
        delivered: false, // SMS not wired yet
        delivery_meta: { channel: "in_app" },
      })
      .select()
      .single();
    setSending(false);
    if (error || !data) {
      toast.error("Could not save message");
      return;
    }
    setComms((p) => [data as Comm, ...p]);
    if (alsoWhatsapp && clientPhone) {
      const cleaned = clientPhone.replace(/[^\d]/g, "");
      window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(draft.trim())}`, "_blank");
    } else if (alsoWhatsapp) {
      toast.message("No phone on file — message saved to log only");
    } else {
      toast.success("Logged");
    }
    setDraft("");
    setType("custom");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold">Client communications</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
          {comms.length}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(Object.keys(TYPE_META) as CommType[]).filter((t) => t !== "invite").map((t) => {
          const M = TYPE_META[t];
          const active = type === t;
          return (
            <button
              key={t}
              onClick={() => onTypeChange(t)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-base ${
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <M.icon className="h-3 w-3" /> {M.label}
            </button>
          );
        })}
      </div>

      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Write a message to the client…"
        rows={3}
        className="mt-3"
      />
      <div className="mt-2 flex flex-wrap justify-end gap-2">
        <Button onClick={() => send(false)} variant="outline" size="sm" disabled={sending || !draft.trim()}>
          Log only
        </Button>
        <Button onClick={() => send(true)} variant="hero" size="sm" disabled={sending || !draft.trim()}>
          <MessageCircle className="h-3.5 w-3.5" /> Send via WhatsApp
        </Button>
      </div>

      <div className="mt-5">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : comms.length === 0 ? (
          <p className="text-xs text-muted-foreground">No messages yet. Use the buttons above to start a conversation.</p>
        ) : (
          <ul className="divide-y divide-border">
            {comms.map((c) => {
              const M = TYPE_META[c.message_type];
              return (
                <li key={c.id} className="flex items-start gap-3 py-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                    <M.icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <span className="font-semibold">{M.label}</span>
                      <span>·</span>
                      <span>{new Date(c.sent_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{c.message_content}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
