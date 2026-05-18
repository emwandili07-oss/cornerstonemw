import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatMWK } from "@/lib/format";

export const Route = createFileRoute("/admin/properties")({ component: AdminProps });
function AdminProps() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-props"],
    queryFn: async () => (await supabase.from("properties").select("*, profiles(full_name)").order("created_at", { ascending: false })).data ?? [],
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status, featured }: any) => {
      const patch: any = {};
      if (status) patch.status = status;
      if (featured !== undefined) patch.featured = featured;
      const { error } = await supabase.from("properties").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-props"] }); toast.success("Updated"); },
  });
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">All properties</h1>
      <div className="space-y-3">
        {(data ?? []).map((p: any) => (
          <div key={p.id} className="rounded-xl bg-card border border-border p-4 flex items-center justify-between gap-4">
            <div>
              <Link to="/properties/$id" params={{ id: p.id }} className="font-semibold hover:text-primary">{p.title}</Link>
              <div className="text-sm text-muted-foreground">{p.profiles?.full_name} · {p.location}, {p.district} · {formatMWK(p.price_mwk)}</div>
              <div className="mt-1 flex gap-2"><Badge>{p.status}</Badge>{p.featured && <Badge className="bg-gradient-primary">Featured</Badge>}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: p.id, featured: !p.featured })}>{p.featured ? "Unfeature" : "Feature"}</Button>
              {p.status !== "suspended"
                ? <Button size="sm" variant="destructive" onClick={() => setStatus.mutate({ id: p.id, status: "suspended" })}>Suspend</Button>
                : <Button size="sm" onClick={() => setStatus.mutate({ id: p.id, status: "active" })}>Restore</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
