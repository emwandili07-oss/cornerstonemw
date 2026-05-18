import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Check, Crown, Zap, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/list-property")({ component: ListProperty });
function ListProperty() {
  const navigate = useNavigate();
  const { user, isLandlord } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-hero text-secondary-foreground py-20">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <Crown className="h-12 w-12 text-primary mx-auto" />
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-4">Become a verified landlord</h1>
            <p className="text-lg text-white/80 mt-4">List unlimited properties on Malawi's premium real estate marketplace for just MWK 20,000 / month.</p>
            <Button size="lg" className="mt-8 bg-gradient-primary shadow-glow" onClick={() => {
              if (!user) navigate({ to: "/auth", search: { mode: "signup", role: "landlord" } });
              else if (isLandlord) navigate({ to: "/dashboard/properties" });
              else navigate({ to: "/dashboard/subscription" });
            }}>{user ? (isLandlord ? "Go to my properties" : "Activate landlord access") : "Apply now"}</Button>
          </div>
        </section>
        <section className="container mx-auto px-4 py-16 grid gap-6 md:grid-cols-3">
          {[
            { i: ShieldCheck, t: "Verified status", d: "Stand out as an approved landlord. Seekers trust verified profiles." },
            { i: Zap, t: "Reach more seekers", d: "Featured boost option, full search visibility and lead analytics." },
            { i: Check, t: "Easy to manage", d: "HD photo uploads, drafts, and full control over availability." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl bg-card p-6 shadow-card">
              <div className="h-11 w-11 rounded-lg bg-accent text-primary grid place-items-center"><f.i className="h-5 w-5" /></div>
              <h3 className="font-display text-lg font-semibold mt-4">{f.t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
