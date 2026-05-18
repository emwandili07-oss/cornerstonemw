import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatMWK } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/subscriptions")({ component: Subs });

async function logAudit(adminId: string | undefined, payload: {
  action: string; entity: string; entity_id?: string | null; target_user_id?: string | null;
  reason?: string | null; notes?: string | null; metadata?: any;
}) {
  if (!adminId) return;
  await supabase.from("admin_audit_log").insert({ admin_id: adminId, ...payload });
}

function Subs() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [reasonFor, setReasonFor] = useState<{ sub: any; kind: "reject" | "cancel" } | null>(null);
  const [reason, setReason] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-subs"],
    queryFn: async () => {
      const { data: subs, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((subs ?? []).map((s: any) => s.user_id)));
      let profilesById: Record<string, { full_name: string | null; phone: string | null }> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", ids);
        profilesById = Object.fromEntries((profs ?? []).map((p: any) => [p.id, { full_name: p.full_name, phone: p.phone }]));
      }
      return (subs ?? []).map((s: any) => ({ ...s, profiles: profilesById[s.user_id] ?? null }));
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-subs-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, (payload) => {
        qc.invalidateQueries({ queryKey: ["admin-subs"] });
        if (payload.eventType === "INSERT" && (payload.new as any)?.status === "pending") {
          toast.info("New subscription request received");
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const computeExpiry = (plan: string, from = new Date()) => {
    const exp = new Date(from);
    if (plan === "seeker_weekly") exp.setDate(exp.getDate() + 7);
    else exp.setDate(exp.getDate() + 30);
    return exp;
  };

  const approve = useMutation({
    mutationFn: async (s: any) => {
      const now = new Date();
      const exp = computeExpiry(s.plan, now);
      const { error } = await supabase.from("subscriptions").update({
        status: "active", starts_at: now.toISOString(), expires_at: exp.toISOString(), approved_at: now.toISOString(), approved_by: user?.id ?? null,
      }).eq("id", s.id);
      if (error) throw error;
      await supabase.from("profiles").update({
        approval_status: "approved", approved_at: now.toISOString(), approved_by: user?.id ?? null,
      }).eq("id", s.user_id);
      await supabase.from("admin_notices").insert({
        user_id: s.user_id, kind: "approval",
        title: "Subscription approved",
        message: `Your ${s.plan.replaceAll("_"," ")} subscription is now active until ${exp.toLocaleDateString()}.`,
        created_by: user?.id ?? null,
      });
      await logAudit(user?.id, { action: "approve", entity: "subscription", entity_id: s.id, target_user_id: s.user_id, metadata: { plan: s.plan, amount: s.amount_mwk } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-subs"] }); toast.success("Subscription approved & user activated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const renew = useMutation({
    mutationFn: async (s: any) => {
      const now = new Date();
      const base = s.expires_at && new Date(s.expires_at).getTime() > now.getTime() ? new Date(s.expires_at) : now;
      const exp = computeExpiry(s.plan, base);
      const { error } = await supabase.from("subscriptions").update({
        status: "active", starts_at: now.toISOString(), expires_at: exp.toISOString(), approved_at: now.toISOString(), approved_by: user?.id ?? null,
      }).eq("id", s.id);
      if (error) throw error;
      await supabase.from("profiles").update({
        approval_status: "approved", approved_at: now.toISOString(), approved_by: user?.id ?? null,
      }).eq("id", s.user_id);
      await logAudit(user?.id, { action: "renew", entity: "subscription", entity_id: s.id, target_user_id: s.user_id, metadata: { plan: s.plan, new_expiry: exp.toISOString() } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-subs"] }); toast.success("Renewed"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remind = useMutation({
    mutationFn: async (s: any) => {
      const exp = s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "soon";
      const { error } = await supabase.from("admin_notices").insert({
        user_id: s.user_id, kind: "reminder",
        title: "Subscription payment reminder",
        message: `Your ${s.plan.replaceAll("_"," ")} subscription expires on ${exp}. Please renew. Amount: ${formatMWK(s.amount_mwk)}.`,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
      await logAudit(user?.id, { action: "remind", entity: "subscription", entity_id: s.id, target_user_id: s.user_id });
    },
    onSuccess: () => toast.success("Reminder sent"),
    onError: (e: any) => toast.error(e.message),
  });

  const decide = useMutation({
    mutationFn: async ({ sub, kind, reason }: { sub: any; kind: "reject" | "cancel"; reason: string }) => {
      const newStatus = kind === "reject" ? "rejected" : "expired";
      const { error } = await supabase.from("subscriptions").update({ status: newStatus }).eq("id", sub.id);
      if (error) throw error;
      await supabase.from("admin_notices").insert({
        user_id: sub.user_id, kind: "warning",
        title: kind === "reject" ? "Subscription request declined" : "Subscription cancelled",
        message: reason ? `Reason: ${reason}` : (kind === "reject" ? "Your subscription payment request was declined." : "Your subscription has been cancelled."),
        created_by: user?.id ?? null,
      });
      await logAudit(user?.id, { action: kind === "reject" ? "decline" : "cancel", entity: "subscription", entity_id: sub.id, target_user_id: sub.user_id, reason });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-subs"] }); toast.success("Updated"); setReasonFor(null); setReason(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const all = data ?? [];
  const pending = all.filter((s: any) => s.status === "pending");
  const active = all.filter((s: any) => s.status === "active");
  const expired = all.filter((s: any) => s.status === "expired" || s.status === "rejected");
  const now = Date.now();
  const expiringSoon = active.filter((s: any) => s.expires_at &&
    new Date(s.expires_at).getTime() - now < 2 * 24 * 60 * 60 * 1000 &&
    new Date(s.expires_at).getTime() > now);

  const renderRow = (s: any) => (
    <tr key={s.id} className="border-t border-border">
      <td className="p-3">{s.profiles?.full_name ?? "—"}<div className="text-xs text-muted-foreground">{s.profiles?.phone}</div></td>
      <td className="p-3 capitalize">{s.plan.replaceAll("_"," ")}</td>
      <td className="p-3 font-semibold">{formatMWK(s.amount_mwk)}</td>
      <td className="p-3"><Badge>{s.status}</Badge></td>
      <td className="p-3 text-muted-foreground">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "—"}</td>
      <td className="p-3 space-x-2 whitespace-nowrap">
        {s.status === "pending" && <>
          <Button size="sm" className="bg-gradient-primary" onClick={() => approve.mutate(s)}>Approve</Button>
          <Button size="sm" variant="destructive" onClick={() => { setReasonFor({ sub: s, kind: "reject" }); setReason(""); }}>Deny</Button>
        </>}
        {s.status === "active" && <>
          <Button size="sm" className="bg-gradient-primary" onClick={() => renew.mutate(s)}>Renew</Button>
          <Button size="sm" variant="outline" onClick={() => remind.mutate(s)}>Remind</Button>
          <Button size="sm" variant="destructive" onClick={() => { setReasonFor({ sub: s, kind: "cancel" }); setReason(""); }}>Cancel</Button>
        </>}
        {(s.status === "expired" || s.status === "rejected") && <>
          <Button size="sm" className="bg-gradient-primary" onClick={() => renew.mutate(s)}>Renew</Button>
          <Button size="sm" variant="outline" onClick={() => remind.mutate(s)}>Remind</Button>
        </>}
      </td>
    </tr>
  );

  const Table = ({ rows, empty }: { rows: any[]; empty: string }) => (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wider"><tr>
          <th className="text-left p-3">User</th><th className="text-left p-3">Plan</th><th className="text-left p-3">Amount</th>
          <th className="text-left p-3">Status</th><th className="text-left p-3">Expires</th><th className="text-left p-3">Action</th>
        </tr></thead>
        <tbody>{rows.length ? rows.map(renderRow) : <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{empty}</td></tr>}</tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Subscriptions</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/5 p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Pending payments</div>
          <div className="font-display text-2xl font-bold">{pending.length}</div>
        </div>
        <div className="rounded-xl border border-green-500/40 bg-green-500/5 p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Paid & active</div>
          <div className="font-display text-2xl font-bold">{active.length}</div>
        </div>
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Expiring within 2 days</div>
          <div className="font-display text-2xl font-bold">{expiringSoon.length}</div>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending payments ({pending.length})</TabsTrigger>
          <TabsTrigger value="active">Paid & active ({active.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired / rejected ({expired.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending"><Table rows={pending} empty="No pending payment requests." /></TabsContent>
        <TabsContent value="active"><Table rows={active} empty="No active subscriptions." /></TabsContent>
        <TabsContent value="expired"><Table rows={expired} empty="No expired or rejected subscriptions." /></TabsContent>
      </Tabs>

      <Dialog open={!!reasonFor} onOpenChange={(o) => !o && setReasonFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reasonFor?.kind === "reject" ? "Deny payment request" : "Cancel subscription"}</DialogTitle>
            <DialogDescription>Provide a reason. The user will be notified.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Payment not received, incorrect reference…" rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonFor(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!reason.trim()} onClick={() => reasonFor && decide.mutate({ sub: reasonFor.sub, kind: reasonFor.kind, reason: reason.trim() })}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
