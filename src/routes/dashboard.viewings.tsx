import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/viewings")({ component: Viewings });
function Viewings() {
  const { user, isLandlord } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["viewings", user?.id, isLandlord], enabled: !!user,
    queryFn: async () => {
      const col = isLandlord ? "owner_id" : "seeker_id";
      const { data } = await supabase.from("viewing_requests")
        .select("*, properties(title,location,district)").eq(col, user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("viewing_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["viewings"] }); toast.success("Updated"); },
  });
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Viewing requests</h1>
      <div className="space-y-3">
        {(data ?? []).map((v: any) => (
          <div key={v.id} className="rounded-xl bg-card border border-border p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">{v.properties?.title}</div>
              <div className="text-sm text-muted-foreground">{v.properties?.location}, {v.properties?.district} · Preferred {v.preferred_date ?? "TBD"}</div>
              {v.message && <div className="text-sm mt-1">"{v.message}"</div>}
            </div>
            <div className="flex items-center gap-2">
              <Badge>{v.status}</Badge>
              {isLandlord && v.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => update.mutate({ id: v.id, status: "accepted" })}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => update.mutate({ id: v.id, status: "declined" })}>Decline</Button>
                </>
              )}
            </div>
          </div>
        ))}
        {data?.length === 0 && <p className="text-muted-foreground">No viewing requests.</p>}
      </div>
    </div>
  );
}
