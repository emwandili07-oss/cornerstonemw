import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PropertyCard } from "@/components/property/PropertyCard";

export const Route = createFileRoute("/dashboard/favorites")({ component: Favs });
function Favs() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["favs", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("property_id, properties(*)").eq("user_id", user!.id);
      return (data ?? []).map((r: any) => r.properties).filter(Boolean);
    },
  });
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Favorites</h1>
      {data && data.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.map((p: any) => <PropertyCard key={p.id} p={p} />)}</div>
      ) : <p className="text-muted-foreground">No favorites yet. Browse properties and tap the heart.</p>}
    </div>
  );
}
