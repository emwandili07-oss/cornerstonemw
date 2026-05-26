import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PropertyCard, type PropertyLite } from "@/components/property/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShieldCheck, Sparkles, Home as HomeIcon, KeyRound, MapPin, TrendingUp } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { DISTRICTS } from "@/lib/format";

export const Route = createFileRoute("/")({ component: IndexPage });

function IndexPage() {
  const navigate = useNavigate();
  const [purpose, setPurpose] = useState<"rent" | "sale">("rent");
  const [district, setDistrict] = useState<string>("");
  const [q, setQ] = useState("");

  const { data: featured } = useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id,title,cover_image,images,location,district,price_mwk,purpose,property_type,bedrooms,bathrooms,sqft,featured")
        .eq("status", "active")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);
      return (data ?? []) as PropertyLite[];
    },
  });

  const handleSearch = () => {
    const search: any = { purpose };
    if (district) search.district = district;
    if (q) search.q = q;
    navigate({ to: "/browse", search });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0">
          <img src={hero} alt="Luxury home in Malawi" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/75 to-secondary/30" />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-36 text-secondary-foreground">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 px-4 py-1.5 text-xs uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Malawi's Premium Marketplace
            </span>
            <h1 className="mt-6 font-display text-5xl md:text-7xl font-bold leading-[1.05] text-balance">
              Find your next <span className="bg-gradient-primary bg-clip-text text-transparent">nyumba</span>.
              Trusted, verified, beautiful.
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-xl leading-relaxed">
              Discover homes from approved landlords across Malawi — from Lilongwe penthouses to Blantyre family villas and Mzuzu plots.
            </p>
          </div>

          {/* SEARCH PANEL */}
          <div className="relative mt-10 max-w-4xl rounded-2xl bg-card text-card-foreground shadow-elegant p-2">
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_auto] gap-2">
              <div className="flex rounded-xl bg-muted p-1">
                <button onClick={() => setPurpose("rent")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${purpose==="rent"?"bg-card text-primary shadow-sm":"text-muted-foreground"}`}>Rent</button>
                <button onClick={() => setPurpose("sale")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${purpose==="sale"?"bg-card text-primary shadow-sm":"text-muted-foreground"}`}>Sale</button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search location, title, keyword…" value={q} onChange={(e) => setQ(e.target.value)}
                  className="pl-9 border-0 bg-muted h-11" onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
              </div>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger className="h-11 border-0 bg-muted"><SelectValue placeholder="District" /></SelectTrigger>
                <SelectContent>
                  {DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="lg" onClick={handleSearch} className="bg-gradient-primary shadow-glow h-11 px-6">
                Search
              </Button>
            </div>
          </div>

          {/* STATS */}
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl">
            {[
              { n: "500+", l: "Verified listings" },
              { n: "28", l: "Districts covered" },
              { n: "100%", l: "Approved landlords" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-3xl md:text-4xl font-bold text-primary">{s.n}</div>
                <div className="text-xs uppercase tracking-wider text-white/70 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">Handpicked</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">Featured properties</h2>
          </div>
          <Link to="/browse" search={{}} className="text-sm font-semibold text-primary hover:underline">
            View all →
          </Link>
        </div>
        {featured && featured.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center">
            <HomeIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-display text-xl font-semibold">Listings coming soon</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Approved landlords are publishing properties now. Be the first to list yours.
            </p>
            <Button className="mt-6 bg-gradient-primary" onClick={() => navigate({ to: "/list-property" })}>
              List a property
            </Button>
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-muted/40 border-y border-border py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">How Nyumba Online works</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">Two paths. One trusted marketplace.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-card p-8 shadow-card">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground"><KeyRound className="h-6 w-6" /></div>
              <h3 className="font-display text-2xl font-bold mt-5">For seekers</h3>
              <p className="text-muted-foreground mt-2">Browse free. Subscribe to unlock contact details, request viewings and message landlords directly.</p>
              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex items-center justify-between border-b border-border pb-2"><span>Weekly access</span><strong className="text-primary">MWK 5,000</strong></li>
                <li className="flex items-center justify-between"><span>Monthly access</span><strong className="text-primary">MWK 15,000</strong></li>
              </ul>
              <Button className="mt-6 w-full bg-secondary text-secondary-foreground" onClick={() => navigate({ to: "/auth", search: { mode: "signup", role: "seeker" }})}>
                Create seeker account
              </Button>
            </div>
            <div className="rounded-2xl bg-gradient-hero text-secondary-foreground p-8 shadow-elegant">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground"><HomeIcon className="h-6 w-6" /></div>
              <h3 className="font-display text-2xl font-bold mt-5">For landlords & owners</h3>
              <p className="text-white/75 mt-2">Apply to become a verified landlord. After admin approval and payment, list unlimited properties and manage leads.</p>
              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex items-center justify-between border-b border-white/20 pb-2"><span>Subscription</span><strong className="text-primary">MWK 20,000 / month</strong></li>
                <li className="flex items-center justify-between"><span>Listings</span><strong>Unlimited</strong></li>
              </ul>
              <Button className="mt-6 w-full bg-gradient-primary shadow-glow" onClick={() => navigate({ to: "/auth", search: { mode: "signup", role: "landlord" }})}>
                Apply as landlord
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="container mx-auto px-4 py-20 grid gap-10 md:grid-cols-3">
        {[
          { i: ShieldCheck, t: "Verified landlords", d: "Every landlord is reviewed and approved by our team before they can publish." },
          { i: TrendingUp, t: "Premium analytics", d: "Track views and leads. Promote your listings to reach more seekers." },
          { i: MapPin, t: "Coverage across Malawi", d: "Listings from all 28 districts across Malawi — from Lilongwe to Zomba, Blantyre to Mzuzu and beyond." },
        ].map((f) => (
          <div key={f.t} className="rounded-2xl bg-card p-6 shadow-card">
            <div className="h-11 w-11 rounded-lg bg-accent text-primary grid place-items-center"><f.i className="h-5 w-5" /></div>
            <h3 className="font-display text-lg font-semibold mt-4">{f.t}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
}
