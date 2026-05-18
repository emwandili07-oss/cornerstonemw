import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });
function AdminSettings() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await supabase.from("platform_settings").select("*")).data ?? [],
  });
  const [prices, setPrices] = useState({ landlord_monthly: 20000, seeker_weekly: 5000, seeker_monthly: 15000 });
  useEffect(() => {
    const p = data?.find((s: any) => s.key === "subscription_prices")?.value as any;
    if (p && typeof p === "object") setPrices({
      landlord_monthly: Number(p.landlord_monthly) || 20000,
      seeker_weekly: Number(p.seeker_weekly) || 5000,
      seeker_monthly: Number(p.seeker_monthly) || 15000,
    });
  }, [data]);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("platform_settings").update({ value: prices }).eq("key", "subscription_prices");
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Saved"); },
  });
  return (
    <div className="space-y-6 max-w-md">
      <h1 className="font-display text-3xl font-bold">Platform settings</h1>
      <div className="space-y-3">
        <div><Label>Landlord monthly (MWK)</Label><Input type="number" value={prices.landlord_monthly} onChange={(e) => setPrices({...prices, landlord_monthly: Number(e.target.value)})} /></div>
        <div><Label>Seeker weekly (MWK)</Label><Input type="number" value={prices.seeker_weekly} onChange={(e) => setPrices({...prices, seeker_weekly: Number(e.target.value)})} /></div>
        <div><Label>Seeker monthly (MWK)</Label><Input type="number" value={prices.seeker_monthly} onChange={(e) => setPrices({...prices, seeker_monthly: Number(e.target.value)})} /></div>
        <Button className="bg-gradient-primary" onClick={() => save.mutate()}>Save</Button>
      </div>
    </div>
  );
}
