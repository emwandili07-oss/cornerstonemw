import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Home, Clock, CreditCard, TrendingUp, Eye, CheckCircle2, Activity } from "lucide-react";
import { formatMWK } from "@/lib/format";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

function AdminHome() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [apps, pendSubs, actSubs, props, users, allProps, allSubs, recentApps] = await Promise.all([
        supabase.from("landlord_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("subscriptions").select("amount_mwk,plan,created_at,status").eq("status", "active"),
        supabase.from("properties").select("status,purpose,property_type,views_count,created_at"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("subscriptions").select("amount_mwk,created_at,plan").order("created_at", { ascending: false }).limit(200),
        supabase.from("landlord_applications").select("user_id,business_name,status,created_at,profiles(full_name)").order("created_at", { ascending: false }).limit(5),
      ]);

      const revenue = (actSubs.data ?? []).reduce((s, r: any) => s + (r.amount_mwk ?? 0), 0);
      const totalViews = (props.data ?? []).reduce((s, r: any) => s + (r.views_count ?? 0), 0);

      // Last 7 days revenue
      const days: { day: string; revenue: number; subs: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const matches = (allSubs.data ?? []).filter((s: any) => (s.created_at ?? "").slice(0, 10) === key);
        days.push({
          day: d.toLocaleDateString("en", { weekday: "short" }),
          revenue: matches.reduce((sum: number, m: any) => sum + (m.amount_mwk ?? 0), 0),
          subs: matches.length,
        });
      }

      // Plan distribution
      const planMap: Record<string, number> = {};
      (allSubs.data ?? []).forEach((s: any) => { planMap[s.plan] = (planMap[s.plan] ?? 0) + 1; });
      const planData = Object.entries(planMap).map(([name, value]) => ({ name: name.replace("_", " "), value }));

      // Property type distribution
      const typeMap: Record<string, number> = {};
      (props.data ?? []).forEach((p: any) => { typeMap[p.property_type] = (typeMap[p.property_type] ?? 0) + 1; });
      const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

      return {
        pendingApps: apps.count ?? 0,
        pendingSubs: pendSubs.count ?? 0,
        activeProps: allProps.count ?? 0,
        users: users.count ?? 0,
        revenue,
        totalViews,
        days,
        planData,
        typeData,
        recentApps: recentApps.data ?? [],
      };
    },
  });

  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#94a3b8", "#fbbf24"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time platform analytics & insights</p>
        </div>
        <Badge variant="outline" className="gap-1.5"><Activity className="h-3 w-3 text-green-500" /> Live</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={TrendingUp} label="Active revenue" value={formatMWK(data?.revenue ?? 0)} accent />
        <Stat icon={Home} label="Active listings" value={data?.activeProps ?? 0} />
        <Stat icon={Users} label="Total users" value={data?.users ?? 0} />
        <Stat icon={Eye} label="Total views" value={data?.totalViews ?? 0} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/admin/applications" className="group">
          <Card className="hover:border-primary transition">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-500/10 grid place-items-center"><Clock className="h-5 w-5 text-yellow-600" /></div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Pending applications</div>
                  <div className="font-display text-2xl font-bold">{data?.pendingApps ?? 0}</div>
                </div>
              </div>
              <Badge variant="secondary">Review →</Badge>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/subscriptions" className="group">
          <Card className="hover:border-primary transition">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center"><CreditCard className="h-5 w-5 text-primary" /></div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Pending payments</div>
                  <div className="font-display text-2xl font-bold">{data?.pendingSubs ?? 0}</div>
                </div>
              </div>
              <Badge variant="secondary">Approve →</Badge>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Revenue — last 7 days</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.days ?? []} margin={{ left: -10, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v: any) => formatMWK(Number(v))} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Subscription mix</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            {(data?.planData ?? []).length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.planData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                    {(data?.planData ?? []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Property types</CardTitle></CardHeader>
          <CardContent className="h-[240px]">
            {(data?.typeData ?? []).length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">No properties yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.typeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8,8,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent applications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data?.recentApps ?? []).length === 0 && <p className="text-sm text-muted-foreground">No recent applications.</p>}
            {(data?.recentApps ?? []).map((a: any) => (
              <div key={a.user_id} className="flex items-center justify-between gap-2 border-b border-border last:border-0 pb-3 last:pb-0">
                <div className="min-w-0">
                  <div className="font-medium truncate">{a.profiles?.full_name || a.business_name || "Applicant"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                </div>
                <Badge variant={a.status === "approved" ? "default" : a.status === "pending" ? "secondary" : "destructive"} className="capitalize">
                  {a.status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}{a.status}
                </Badge>
              </div>
            ))}
            <Link to="/admin/applications" className="block text-center text-xs text-primary font-semibold pt-2 hover:underline">View all →</Link>
          </CardContent>
        </Card>
      </div>

      {isLoading && <p className="text-xs text-muted-foreground text-center">Loading analytics…</p>}
    </div>
  );
}

function Stat({ icon: I, label, value, accent }: any) {
  return (
    <Card className={accent ? "bg-gradient-to-br from-primary/10 to-transparent border-primary/30" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <I className="h-4 w-4 text-primary" />{label}
        </CardTitle>
      </CardHeader>
      <CardContent><div className={`font-display text-2xl md:text-3xl font-bold ${accent ? "text-primary" : ""}`}>{value}</div></CardContent>
    </Card>
  );
}
