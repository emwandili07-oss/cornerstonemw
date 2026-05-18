import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/audit")({ component: Audit });

function Audit() {
  const { data, refetch } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      const ids = Array.from(new Set((rows ?? []).flatMap((r: any) => [r.admin_id, r.target_user_id].filter(Boolean))));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id,full_name").in("id", ids)
        : { data: [] as any[] };
      const nameMap: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => { nameMap[p.id] = p.full_name || "—"; });
      return (rows ?? []).map((r: any) => ({ ...r, admin_name: nameMap[r.admin_id] ?? "Admin", target_name: r.target_user_id ? (nameMap[r.target_user_id] ?? "—") : "—" }));
    },
  });

  useEffect(() => {
    const ch = supabase.channel("admin-audit-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_audit_log" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const color = (a: string) =>
    a === "approve" ? "bg-green-500/10 text-green-700 border-green-500/30"
    : a === "decline" || a === "cancel" ? "bg-red-500/10 text-red-700 border-red-500/30"
    : a === "renew" ? "bg-primary/10 text-primary border-primary/30"
    : "bg-muted text-muted-foreground border-border";

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Admin audit log</h1>
      <p className="text-sm text-muted-foreground">Every approve, decline, renew and cancel decision is recorded here.</p>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider"><tr>
            <th className="text-left p-3">When</th>
            <th className="text-left p-3">Admin</th>
            <th className="text-left p-3">Action</th>
            <th className="text-left p-3">Entity</th>
            <th className="text-left p-3">Target user</th>
            <th className="text-left p-3">Reason / notes</th>
          </tr></thead>
          <tbody>
            {(data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-border align-top">
                <td className="p-3 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3">{r.admin_name}</td>
                <td className="p-3"><span className={`inline-block rounded-md border px-2 py-0.5 text-xs capitalize ${color(r.action)}`}>{r.action}</span></td>
                <td className="p-3"><Badge variant="outline" className="capitalize">{r.entity.replaceAll("_"," ")}</Badge></td>
                <td className="p-3">{r.target_name}</td>
                <td className="p-3 text-muted-foreground">{r.reason || r.notes || "—"}</td>
              </tr>
            ))}
            {data?.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No audit entries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}