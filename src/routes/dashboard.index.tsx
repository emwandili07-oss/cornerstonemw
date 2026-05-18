import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Eye, Users, AlertCircle, CheckCircle2, Clock, ShieldAlert, BellRing, Megaphone, X } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard/")({ component: DashboardHome });

function DashboardHome() {
  const { user, profile, isLandlord, isApprovedLandlord, hasActiveLandlordSub, hasActiveSeekerSub, landlordStatus, approvalStatus, isApproved, expiringSub } = useAuth();
  const qc = useQueryClient();

  const { data: notices } = useQuery({
    queryKey: ["my-notices", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("admin_notices").select("*").eq("user_id", user!.id).is("read_at", null).order("created_at",{ascending:false})).data ?? [],
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("notices-"+user.id)
      .on("postgres_changes",{ event:"INSERT", schema:"public", table:"admin_notices", filter:`user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey:["my-notices", user.id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const dismiss = useMutation({
    mutationFn: async (id: string) => { await supabase.from("admin_notices").update({ read_at: new Date().toISOString() }).eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey:["my-notices", user?.id] }),
  });

  const { data: stats } = useQuery({
    queryKey: ["dash-stats", user?.id, isLandlord],
    enabled: !!user,
    queryFn: async () => {
      if (isLandlord) {
        const { data: props } = await supabase.from("properties").select("id,views_count,status").eq("owner_id", user!.id);
        const { count: leads } = await supabase.from("viewing_requests").select("*", { count: "exact", head: true }).eq("owner_id", user!.id);
        return {
          properties: props?.length ?? 0,
          active: props?.filter((p: any) => p.status === "active").length ?? 0,
          views: props?.reduce((a: number, b: any) => a + (b.views_count ?? 0), 0) ?? 0,
          leads: leads ?? 0,
        };
      } else {
        const { count: favs } = await supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
        const { count: views } = await supabase.from("viewing_requests").select("*", { count: "exact", head: true }).eq("seeker_id", user!.id);
        return { favorites: favs ?? 0, viewings: views ?? 0 };
      }
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Welcome back, {profile?.full_name?.split(" ")[0] || "there"}</h1>
        <p className="text-muted-foreground">Here's an overview of your activity.</p>
      </div>

      {(notices ?? []).map((n: any) => (
        <Card key={n.id} className={n.kind === "warning" ? "border-destructive/50 bg-destructive/10" : "border-primary/40 bg-primary/5"}>
          <CardContent className="p-5 flex items-start gap-4">
            <Megaphone className={`h-6 w-6 mt-0.5 ${n.kind === "warning" ? "text-destructive" : "text-primary"}`} />
            <div className="flex-1">
              <h3 className="font-semibold">{n.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-2">From admin · {new Date(n.created_at).toLocaleString()}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => dismiss.mutate(n.id)} aria-label="Dismiss"><X className="h-4 w-4" /></Button>
          </CardContent>
        </Card>
      ))}

      {!isApproved && (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="p-5 flex items-start gap-4">
            <ShieldAlert className="h-6 w-6 text-warning mt-0.5" />
            <div>
              <h3 className="font-semibold">Account pending admin approval</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your account is {approvalStatus === "suspended" ? "currently suspended" : "awaiting review by an admin"}.
                You also need to complete the subscription payment to proceed. Once payment is confirmed and the admin
                approves your account, you'll be able to {isLandlord ? "publish properties" : "contact owners and request viewings"}.
              </p>
              <Button asChild size="sm" className="mt-3 bg-gradient-primary"><Link to="/dashboard/subscription">Make a payment</Link></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {expiringSub && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-5 flex items-start gap-4">
            <BellRing className="h-6 w-6 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">Subscription expiring soon</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your {expiringSub.plan.replaceAll("_"," ")} plan expires on {new Date(expiringSub.expires_at!).toLocaleDateString()}.
                Renew now to avoid being disconnected.
              </p>
              <Button asChild size="sm" className="mt-3 bg-gradient-primary"><Link to="/dashboard/subscription">Renew</Link></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLandlord && landlordStatus === "pending" && (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="p-5 flex items-start gap-4">
            <Clock className="h-6 w-6 text-warning mt-0.5" />
            <div>
              <h3 className="font-semibold">Application pending</h3>
              <p className="text-sm text-muted-foreground mt-1">Your landlord application is under review. Once approved by admin and your subscription payment is confirmed, you'll be able to publish properties.</p>
            </div>
          </CardContent>
        </Card>
      )}
      {isLandlord && isApprovedLandlord && !hasActiveLandlordSub && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-destructive mt-0.5" />
              <div>
                <h3 className="font-semibold">Subscription required</h3>
                <p className="text-sm text-muted-foreground mt-1">Activate your monthly landlord subscription (MWK 20,000) to publish properties.</p>
              </div>
            </div>
            <Button asChild className="bg-gradient-primary"><Link to="/dashboard/subscription">Subscribe</Link></Button>
          </CardContent>
        </Card>
      )}
      {isLandlord && hasActiveLandlordSub && (
        <Card className="border-success/50 bg-success/10">
          <CardContent className="p-5 flex items-center gap-4">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <div>
              <h3 className="font-semibold">You're active!</h3>
              <p className="text-sm text-muted-foreground">Your landlord subscription is active. Publish away.</p>
            </div>
          </CardContent>
        </Card>
      )}
      {!isLandlord && !hasActiveSeekerSub && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold">Unlock seeker access</h3>
              <p className="text-sm text-muted-foreground mt-1">Subscribe to contact owners and request viewings — MWK 5,000/week or MWK 15,000/month.</p>
            </div>
            <Button asChild className="bg-gradient-primary"><Link to="/dashboard/subscription">Subscribe</Link></Button>
          </CardContent>
        </Card>
      )}

      {isLandlord ? (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard icon={Home} label="Listings" value={stats?.properties ?? 0} />
          <StatCard icon={CheckCircle2} label="Active" value={stats?.active ?? 0} />
          <StatCard icon={Eye} label="Total views" value={stats?.views ?? 0} />
          <StatCard icon={Users} label="Leads" value={stats?.leads ?? 0} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard icon={Home} label="Saved properties" value={stats?.favorites ?? 0} />
          <StatCard icon={Users} label="Viewings requested" value={stats?.viewings ?? 0} />
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {label}</CardTitle></CardHeader>
      <CardContent><div className="font-display text-3xl font-bold">{value}</div></CardContent>
    </Card>
  );
}
