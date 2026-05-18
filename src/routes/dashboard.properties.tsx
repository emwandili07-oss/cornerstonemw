import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, AlertCircle } from "lucide-react";
import { formatMWK } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/properties")({ component: MyProperties });

function MyProperties() {
  const { user, isApprovedLandlord, hasActiveLandlordSub } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: props } = useQuery({
    queryKey: ["my-props", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Property deleted"); qc.invalidateQueries({ queryKey: ["my-props"] }); },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "draft" }) => {
      const { error } = await supabase.from("properties").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-props"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const canPublish = isApprovedLandlord && hasActiveLandlordSub;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">My properties</h1>
          <p className="text-muted-foreground">Manage your listings.</p>
        </div>
        <Button className="bg-gradient-primary" onClick={() => navigate({ to: "/dashboard/properties/new" })}>
          <Plus className="h-4 w-4 mr-2" /> Add property
        </Button>
      </div>

      {!canPublish && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
          <div className="text-sm">
            <strong>Your listings are saved as drafts.</strong> They become public after admin approval and an active subscription. <Link className="text-primary font-semibold" to="/dashboard/subscription">Manage subscription →</Link>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {(props ?? []).map((p: any) => (
          <div key={p.id} className="flex flex-col sm:flex-row gap-4 rounded-2xl bg-card border border-border p-4 shadow-card">
            <div className="w-full sm:w-44 aspect-[4/3] rounded-xl overflow-hidden bg-muted flex-shrink-0">
              {(p.cover_image || p.images?.[0]) ? (
                <img src={p.cover_image || p.images[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-muted-foreground text-xs">No image</div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-lg">{p.title}</h3>
                    <Badge variant={p.status === "active" ? "default" : p.status === "draft" ? "secondary" : "destructive"}>{p.status}</Badge>
                    {p.featured && <Badge className="bg-gradient-primary">Featured</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{p.location}, {p.district}</div>
                  <div className="font-bold text-primary mt-2">{formatMWK(p.price_mwk)} <span className="text-xs text-muted-foreground font-normal">for {p.purpose}</span></div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Eye className="h-3 w-3" /> {p.views_count ?? 0} views</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild><Link to="/properties/$id" params={{ id: p.id }}>View</Link></Button>
                <Button size="sm" variant="outline" onClick={() => navigate({ to: "/dashboard/properties/$id/edit", params: { id: p.id } as any })}>
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
                {p.status === "draft" && canPublish && (
                  <Button size="sm" className="bg-gradient-primary" onClick={() => togglePublish.mutate({ id: p.id, status: "active" })}>Publish</Button>
                )}
                {p.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => togglePublish.mutate({ id: p.id, status: "draft" })}>Unpublish</Button>
                )}
                <Button size="sm" variant="ghost" className="text-destructive ml-auto" onClick={() => confirm("Delete this property?") && del.mutate(p.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
        {props && props.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No properties yet.</p>
            <Button className="mt-4 bg-gradient-primary" onClick={() => navigate({ to: "/dashboard/properties/new" })}>Add your first property</Button>
          </div>
        )}
      </div>
    </div>
  );
}
