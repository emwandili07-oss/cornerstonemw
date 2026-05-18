import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PropertyForm } from "@/components/property/PropertyForm";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard/properties/new")({ component: NewProperty });

function NewProperty() {
  const navigate = useNavigate();
  const { isLandlord, loading } = useAuth();
  useEffect(() => { if (!loading && !isLandlord) navigate({ to: "/dashboard" }); }, [isLandlord, loading]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">New property</h1>
        <p className="text-muted-foreground">Fill in details. Save as draft or publish.</p>
      </div>
      <PropertyForm onDone={() => navigate({ to: "/dashboard/properties" })} />
    </div>
  );
}
