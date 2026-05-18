import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Smartphone } from "lucide-react";
import { formatMWK, SUBSCRIPTION_PRICES, CONTACT } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/subscription")({ component: SubscriptionPage });

function SubscriptionPage() {
  const { user, isLandlord } = useAuth();
  const qc = useQueryClient();
  const { data: subs } = useQuery({
    queryKey: ["my-subs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("my-subs-rt-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` }, (payload) => {
        qc.invalidateQueries({ queryKey: ["my-subs", user.id] });
        const ns = (payload.new as any)?.status;
        const os = (payload.old as any)?.status;
        if (ns && ns !== os) {
          if (ns === "active") toast.success("Your subscription has been activated!");
          else if (ns === "rejected") toast.error("Your subscription request was rejected.");
          else if (ns === "expired") toast.warning("Your subscription has expired. Please renew.");
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const requestSub = useMutation({
    mutationFn: async (plan: "landlord_monthly" | "seeker_weekly" | "seeker_monthly") => {
      const { error } = await supabase.from("subscriptions").insert({
        user_id: user!.id, plan, amount_mwk: SUBSCRIPTION_PRICES[plan], status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Subscription request submitted! Pay using the details below; admin will activate after confirmation.");
      qc.invalidateQueries({ queryKey: ["my-subs"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const plans = isLandlord
    ? [{ key: "landlord_monthly" as const, name: "Landlord — Monthly", price: 20000, features: ["Unlimited listings","Lead analytics","Featured boost option","Priority support"] }]
    : [
        { key: "seeker_weekly" as const, name: "Seeker — Weekly", price: 5000, features: ["Contact owners","Request viewings","Save favorites","Direct messaging"] },
        { key: "seeker_monthly" as const, name: "Seeker — Monthly", price: 15000, features: ["Everything in weekly","Saved searches & alerts","Priority responses","Best value"] },
      ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">Choose a plan and follow the payment instructions.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((p) => (
          <Card key={p.key} className="border-2 hover:border-primary transition">
            <CardHeader>
              <CardTitle className="font-display">{p.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-display font-bold text-primary">{formatMWK(p.price)}</span>
                <span className="text-muted-foreground"> / {p.key.includes("weekly") ? "week" : "month"}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-success" /> {f}</li>)}
              </ul>
              <Button className="w-full mt-6 bg-gradient-primary" onClick={() => requestSub.mutate(p.key)} disabled={requestSub.isPending}>
                Request activation
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-secondary text-secondary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display"><CreditCard className="h-5 w-5 text-primary" /> Payment instructions</CardTitle>
          <CardDescription className="text-secondary-foreground/70">Send your payment, then notify admin via WhatsApp/email with your reference.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-xl bg-white/5 p-4">
            <div className="flex items-center gap-2 font-semibold"><Smartphone className="h-4 w-4 text-primary" /> Mobile Money / Bank Transfer</div>
            <p className="text-secondary-foreground/80 mt-2">Send the exact subscription amount via Airtel Money / TNM Mpamba / bank transfer to one of the numbers below, then send proof of payment to admin.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wider text-secondary-foreground/60">WhatsApp / Call</div>
              <a href={`tel:${CONTACT.phone1}`} className="block font-semibold text-primary mt-1">{CONTACT.phone1}</a>
              <a href={`tel:${CONTACT.phone2}`} className="block font-semibold text-primary">{CONTACT.phone2}</a>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wider text-secondary-foreground/60">Email</div>
              <a href={`mailto:${CONTACT.email}`} className="font-semibold text-primary">{CONTACT.email}</a>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wider text-secondary-foreground/60">Currency</div>
              <div className="font-semibold">Malawi Kwacha (MWK)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-display text-xl font-bold mb-4">Subscription history</h2>
        <Card>
          <CardContent className="p-0">
            {subs && subs.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="text-left p-3">Plan</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th><th className="text-left p-3">Expires</th><th className="text-left p-3">Created</th></tr>
                </thead>
                <tbody>
                  {subs.map((s: any) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="p-3 capitalize">{s.plan.replaceAll("_"," ")}</td>
                      <td className="p-3 font-semibold">{formatMWK(s.amount_mwk)}</td>
                      <td className="p-3"><Badge variant={s.status==="active"?"default":s.status==="pending"?"secondary":"destructive"}>{s.status}</Badge></td>
                      <td className="p-3 text-muted-foreground">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "—"}</td>
                      <td className="p-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-muted-foreground">No subscriptions yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
