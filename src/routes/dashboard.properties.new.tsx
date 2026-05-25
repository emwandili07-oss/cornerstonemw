import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PropertyForm } from "@/components/property/PropertyForm";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/properties/new")({ component: NewProperty });

function NewProperty() {
  const navigate = useNavigate();
  const { isLandlord, isApprovedLandlord, hasActiveLandlordSub, loading } = useAuth();
  useEffect(() => { if (!loading && !isLandlord) navigate({ to: "/dashboard" }); }, [isLandlord, loading]);

  const canUpload = isApprovedLandlord && hasActiveLandlordSub;

  if (!loading && isLandlord && !canUpload) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold">New property</h1>
        <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center max-w-2xl">
          <div className="h-14 w-14 rounded-full bg-accent text-primary grid place-items-center mx-auto">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="font-display text-2xl font-semibold mt-4">Subscription required</h2>
          <p className="text-muted-foreground mt-2">
            {!isApprovedLandlord
              ? "Your landlord account is awaiting admin approval. Once approved and your subscription is active, you can start uploading properties."
              : "You need an active landlord subscription to upload properties. Request activation and an admin will approve your payment shortly."}
          </p>
          <Button asChild className="mt-6 bg-gradient-primary">
            <Link to="/dashboard/subscription"><CreditCard className="h-4 w-4 mr-2" />Go to subscription</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">New property</h1>
        <p className="text-muted-foreground">Fill in details and publish your listing.</p>
      </div>
      <PropertyForm onDone={() => navigate({ to: "/dashboard/properties" })} />
    </div>
  );
}
