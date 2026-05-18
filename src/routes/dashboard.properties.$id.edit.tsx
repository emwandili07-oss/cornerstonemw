import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PropertyForm } from "@/components/property/PropertyForm";

export const Route = createFileRoute("/dashboard/properties/$id/edit")({ component: EditProperty });

function EditProperty() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["edit-prop", id],
    queryFn: async () => (await supabase.from("properties").select("*").eq("id", id).maybeSingle()).data,
  });
  if (isLoading) return <div>Loading…</div>;
  if (!data) return <div>Not found</div>;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Edit property</h1>
      <PropertyForm initial={data as any} onDone={() => navigate({ to: "/dashboard/properties" })} />
    </div>
  );
}
