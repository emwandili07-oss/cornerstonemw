import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PropertyCard, type PropertyLite } from "@/components/property/PropertyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal, Lock, CreditCard, ShieldCheck } from "lucide-react";
import { DISTRICTS } from "@/lib/format";
import { useAuth } from "@/lib/auth";

const searchSchema = z.object({
  purpose: z.enum(["rent","sale"]).optional(),
  district: z.string().optional(),
  q: z.string().optional(),
  type: z.string().optional(),
  beds: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  sort: z.enum(["new","price_asc","price_desc"]).optional(),
});

export const Route = createFileRoute("/browse")({
  validateSearch: (s) => searchSchema.parse(s),
  component: BrowsePage,
});

function BrowsePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [maxPrice, setMaxPrice] = useState<number>(search.max ?? 50_000_000);

  const update = (patch: Partial<typeof search>) => navigate({ to: "/browse", search: { ...search, ...patch } as any });

  const { data, isLoading } = useQuery({
    queryKey: ["browse", search, maxPrice],
    queryFn: async () => {
      let q = supabase
        .from("properties")
        .select("id,title,cover_image,images,location,district,price_mwk,purpose,property_type,bedrooms,bathrooms,sqft,featured")
        .eq("status", "active");
      if (search.purpose) q = q.eq("purpose", search.purpose);
      if (search.district) q = q.eq("district", search.district);
      if (search.type) q = q.eq("property_type", search.type as any);
      if (search.beds) q = q.gte("bedrooms", search.beds);
      if (maxPrice) q = q.lte("price_mwk", maxPrice);
      if (search.q) q = q.or(`title.ilike.%${search.q}%,location.ilike.%${search.q}%,description.ilike.%${search.q}%`);
      if (search.sort === "price_asc") q = q.order("price_mwk", { ascending: true });
      else if (search.sort === "price_desc") q = q.order("price_mwk", { ascending: false });
      else q = q.order("featured",{ascending:false}).order("created_at", { ascending: false });
      const { data } = await q.limit(60);
      return (data ?? []) as PropertyLite[];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold">Browse properties</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.length ?? 0} listings found</p>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-card shadow-card p-4 mb-8">
          <div className="grid gap-3 md:grid-cols-[auto_1fr_auto_auto_auto_auto]">
            <div className="flex rounded-lg bg-muted p-1">
              <button onClick={() => update({ purpose: undefined })} className={`px-3 py-1.5 text-sm rounded-md ${!search.purpose?"bg-card shadow text-primary font-semibold":""}`}>All</button>
              <button onClick={() => update({ purpose: "rent" })} className={`px-3 py-1.5 text-sm rounded-md ${search.purpose==="rent"?"bg-card shadow text-primary font-semibold":""}`}>Rent</button>
              <button onClick={() => update({ purpose: "sale" })} className={`px-3 py-1.5 text-sm rounded-md ${search.purpose==="sale"?"bg-card shadow text-primary font-semibold":""}`}>Sale</button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search keyword…" defaultValue={search.q ?? ""} className="pl-9"
                onKeyDown={(e) => e.key === "Enter" && update({ q: (e.target as HTMLInputElement).value || undefined })} />
            </div>
            <Select value={search.district ?? "_all"} onValueChange={(v) => update({ district: v === "_all" ? undefined : v })}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="District" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All districts</SelectItem>
                {DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={search.type ?? "_all"} onValueChange={(v) => update({ type: v === "_all" ? undefined : v })}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All types</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="office">Office</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(search.beds ?? "_any")} onValueChange={(v) => update({ beds: v === "_any" ? undefined : Number(v) })}>
              <SelectTrigger className="w-[110px]"><SelectValue placeholder="Beds" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_any">Any beds</SelectItem>
                {[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n}+ beds</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={search.sort ?? "new"} onValueChange={(v: any) => update({ sort: v })}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Newest</SelectItem>
                <SelectItem value="price_asc">Price ↑</SelectItem>
                <SelectItem value="price_desc">Price ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Max price</span>
            <Slider value={[maxPrice]} onValueChange={(v) => setMaxPrice(v[0])} onValueCommit={(v) => update({ max: v[0] })}
              max={100_000_000} step={500_000} className="flex-1 max-w-md" />
            <span className="text-sm font-semibold tabular-nums">MWK {maxPrice.toLocaleString()}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading listings…</div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="font-display text-xl font-semibold">No listings match your filters</h3>
            <p className="text-muted-foreground mt-2">Try widening your search.</p>
            <Button className="mt-6" variant="outline" onClick={() => navigate({ to: "/browse", search: {} })}>Reset filters</Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
