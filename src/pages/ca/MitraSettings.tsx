import { useEffect, useState } from "react";
import { CaGuard } from "@/components/ca/RoleGuard";
import { MitraShell } from "@/components/ca/MitraShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { buildReferralSlug } from "@/lib/referral";
import { Copy, Link2, Users, Trash2, Send, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FirmMember {
  id: string;
  member_user_id: string | null;
  invited_phone: string | null;
  invited_email: string | null;
  role: "owner" | "senior" | "junior";
  invited_at: string;
  accepted_at: string | null;
}

const Inner = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [members, setMembers] = useState<FirmMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"senior" | "junior">("junior");

  const referralUrl = profile?.referral_slug
    ? `${window.location.origin}/ca/${profile.referral_slug}`
    : null;

  const load = async () => {
    if (!user) return;
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("firm_members")
        .select("id, member_user_id, invited_phone, invited_email, role, invited_at, accepted_at")
        .eq("firm_id", user.id)
        .order("invited_at", { ascending: false }),
    ]);
    setProfile(p);
    setMembers((m ?? []) as FirmMember[]);
    setLoading(false);

    // Auto-generate slug if missing
    if (p && !p.referral_slug) {
      await generateSlug(p);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const generateSlug = async (base: any = profile) => {
    if (!user) return;
    setBusy(true);
    let attempts = 0;
    while (attempts < 5) {
      const slug = buildReferralSlug(base?.full_name || "ca");
      const { error } = await supabase
        .from("profiles")
        .update({ referral_slug: slug })
        .eq("id", user.id);
      if (!error) {
        toast.success("Referral link ready");
        await load();
        setBusy(false);
        return;
      }
      attempts += 1;
    }
    toast.error("Could not generate slug — try a different name");
    setBusy(false);
  };

  const copyLink = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    toast.success("Link copied");
  };

  const inviteMember = async () => {
    if (!user) return;
    if (!newPhone && !newEmail) {
      toast.error("Enter a phone or email");
      return;
    }
    setBusy(true);
    const { error, data } = await supabase
      .from("firm_members")
      .insert({
        firm_id: user.id,
        invited_by: user.id,
        invited_phone: newPhone || null,
        invited_email: newEmail || null,
        role: newRole,
      })
      .select()
      .single();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMembers((p) => [data as FirmMember, ...p]);
    setNewPhone("");
    setNewEmail("");
    setNewRole("junior");
    toast.success("Invite logged. SMS will go out once Twilio is wired.");
  };

  const removeMember = async (id: string) => {
    const prev = members;
    setMembers(members.filter((m) => m.id !== id));
    const { error } = await supabase.from("firm_members").delete().eq("id", id);
    if (error) {
      toast.error("Could not remove");
      setMembers(prev);
    } else {
      toast.success("Removed");
    }
  };

  if (loading) {
    return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Workspace</p>
        <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      {/* Referral link */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <h2 className="font-display text-sm font-semibold">Your referral link</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Share this link with clients. Anyone who signs up through it is automatically added to your client list.
        </p>

        {referralUrl ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <code className="flex-1 truncate rounded-xl border border-border bg-muted px-3 py-2.5 font-mono text-xs">
              {referralUrl}
            </code>
            <Button onClick={copyLink} variant="outline" size="sm">
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
            <Button onClick={() => generateSlug()} variant="ghost" size="sm" disabled={busy}>
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </Button>
          </div>
        ) : (
          <Button onClick={() => generateSlug()} variant="hero" size="sm" className="mt-4" disabled={busy}>
            Generate referral link
          </Button>
        )}
      </section>

      {/* Team */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="font-display text-sm font-semibold">Team</h2>
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {members.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Invite juniors and seniors to your firm. Juniors can upload docs and add notes; seniors can do everything except manage the team.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_140px_auto]">
          <div>
            <Label className="text-[11px] font-medium text-muted-foreground">Phone</Label>
            <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+91 98765 43210" className="mt-1" />
          </div>
          <div>
            <Label className="text-[11px] font-medium text-muted-foreground">Email (optional)</Label>
            <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="junior@firm.com" className="mt-1" />
          </div>
          <div>
            <Label className="text-[11px] font-medium text-muted-foreground">Role</Label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="junior">Junior</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={inviteMember} variant="hero" size="sm" disabled={busy} className="w-full sm:w-auto">
              <Send className="h-3.5 w-3.5" /> Invite
            </Button>
          </div>
        </div>

        {members.length > 0 && (
          <ul className="mt-5 divide-y divide-border">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {m.invited_email || m.invited_phone || "Member"}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {m.role} · {m.accepted_at ? <span className="inline-flex items-center gap-1 text-success"><Check className="h-3 w-3" /> Active</span> : "Invited"}
                  </p>
                </div>
                <button onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-danger" aria-label="Remove">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

const MitraSettings = () => (
  <CaGuard>
    <MitraShell>
      <Inner />
    </MitraShell>
  </CaGuard>
);

export default MitraSettings;
