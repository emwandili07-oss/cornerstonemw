import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/applications")({ component: Apps });
function Apps() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["admin-apps"],
    queryFn: async () => {
      const { data: apps, error } = await supabase
        .from("landlord_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((apps ?? []).map((a: any) => a.user_id)));
      let profilesById: Record<string, { full_name: string | null; phone: string | null }> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", ids);
        profilesById = Object.fromEntries((profs ?? []).map((p: any) => [p.id, { full_name: p.full_name, phone: p.phone }]));
      }
      return (apps ?? []).map((a: any) => ({ ...a, profiles: profilesById[a.user_id] ?? null }));
    },
  });
  useEffect(() => {
    const ch = supabase
      .channel("admin-apps-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "landlord_applications" }, (payload) => {
        qc.invalidateQueries({ queryKey: ["admin-apps"] });
        if (payload.eventType === "INSERT") toast.info("New landlord application received");
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
  const review = useMutation({
    mutationFn: async ({ user_id, status }: { user_id: string; status: "approved" | "suspended" }) => {
      const now = new Date().toISOString();
      const { data: appRow, error } = await supabase.from("landlord_applications").update({ status, reviewed_at: now, reviewed_by: user?.id ?? null }).eq("user_id", user_id).select("user_id").maybeSingle();
      if (error) throw error;
      // Mirror the decision onto the user's profile so dashboards reflect access immediately
      await supabase.from("profiles").update({
        approval_status: status === "approved" ? "approved" : "suspended",
        approved_at: status === "approved" ? now : null,
        approved_by: status === "approved" ? user?.id ?? null : null,
      }).eq("id", user_id);
      if (user?.id) {
        await supabase.from("admin_audit_log").insert({
          admin_id: user.id,
          action: status === "approved" ? "approve" : "decline",
          entity: "landlord_application",
          target_user_id: user_id,
        });
      }
      void appRow;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-apps"] }); toast.success("Updated"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Landlord applications</h1>
      <div className="space-y-3">
        {(data ?? []).map((a: any) => (
          <div key={a.user_id} className="rounded-xl bg-card border border-border p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">{a.profiles?.full_name || "—"} <Badge className="ml-2">{a.status}</Badge></div>
              <div className="text-sm text-muted-foreground">{a.business_name ?? "Individual"} · {a.profiles?.phone}</div>
              <div className="text-xs text-muted-foreground">Applied {new Date(a.created_at).toLocaleDateString()}</div>
            </div>
            <div className="flex gap-2">
              {a.status !== "approved" && <Button size="sm" className="bg-gradient-primary" onClick={() => review.mutate({ user_id: a.user_id, status: "approved" })}>Approve</Button>}
              {a.status !== "suspended" && <Button size="sm" variant="outline" onClick={() => review.mutate({ user_id: a.user_id, status: "suspended" })}>Suspend</Button>}
            </div>
          </div>
        ))}
        {data?.length === 0 && <p className="text-muted-foreground">No applications.</p>}
      </div>
    </div>
  );
}
