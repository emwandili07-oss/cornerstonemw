import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Bed, Bath, Maximize, MapPin, Heart, Phone, Mail, Calendar, Check, ArrowLeft, Star } from "lucide-react";
import { formatMWK, CONTACT } from "@/lib/format";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/properties/$id")({ component: PropertyDetail });

function PropertyDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, hasActiveSeekerSub, isApprovedLandlord } = useAuth();
  const qc = useQueryClient();
  const [active, setActive] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const { data: p, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
      if (data) {
        await supabase.from("properties").update({ views_count: (data.views_count ?? 0) + 1 }).eq("id", id);
      }
      return data;
    },
  });

  const { data: owner } = useQuery({
    queryKey: ["owner", p?.owner_id],
    enabled: !!p?.owner_id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name,phone,avatar_url").eq("id", p!.owner_id).maybeSingle();
      return data;
    },
  });

  const { data: similar } = useQuery({
    queryKey: ["similar", p?.district, p?.purpose],
    enabled: !!p,
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id,title,cover_image,images,price_mwk,location,district")
        .eq("status","active").eq("district", p!.district).eq("purpose", p!.purpose).neq("id", id).limit(4);
      return data ?? [];
    },
  });

  const { data: isFav } = useQuery({
    queryKey: ["fav", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("id").eq("user_id", user!.id).eq("property_id", id).maybeSingle();
      return !!data;
    },
  });

  const toggleFav = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      if (isFav) await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", id);
      else await supabase.from("favorites").insert({ user_id: user.id, property_id: id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fav"] }),
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  if (!p) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 grid place-items-center">
        <div className="text-center">
          <h1 className="font-display text-3xl">Property not found</h1>
          <Link to="/browse" search={{}} className="text-primary hover:underline mt-4 inline-block">Browse all properties</Link>
        </div>
      </main>
      <Footer />
    </div>
  );

  const allImages: string[] = [
    ...(p.cover_image ? [p.cover_image] : []),
    ...((p.images ?? []).filter((i: string) => i !== p.cover_image)),
  ];
  const hero = allImages[active] || "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80";

  const canContact = !!user && (hasActiveSeekerSub || isApprovedLandlord);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <button onClick={() => navigate({ to: "/browse", search: {} })} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to browse
          </button>
        </div>

        {/* Gallery */}
        <div className="container mx-auto px-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_120px]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
              <img src={hero} alt={p.title} className="h-full w-full object-cover" />
              {p.featured && (
                <span className="absolute top-4 left-4 inline-flex items-center gap-1 rounded-full bg-gradient-primary text-primary-foreground text-xs uppercase tracking-wider px-3 py-1.5 font-semibold">
                  <Star className="h-3 w-3 fill-current" /> Featured
                </span>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:max-h-[500px] lg:overflow-y-auto">
                {allImages.map((img, i) => (
                  <button key={img+i} onClick={() => setActive(i)}
                    className={`flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden border-2 ${i===active?"border-primary":"border-transparent"}`}>
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-secondary text-secondary-foreground text-xs uppercase tracking-wider px-3 py-1 font-semibold">For {p.purpose}</span>
                <h1 className="font-display text-3xl md:text-4xl font-bold mt-3">{p.title}</h1>
                <p className="text-muted-foreground mt-2 flex items-center gap-1"><MapPin className="h-4 w-4" /> {p.location}, {p.district}</p>
              </div>
              <Button variant="outline" size="icon" onClick={() => user ? toggleFav.mutate() : navigate({ to: "/auth", search: { mode: "login" } })}>
                <Heart className={`h-5 w-5 ${isFav ? "fill-primary text-primary" : ""}`} />
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { i: Bed, l: "Bedrooms", v: p.bedrooms },
                { i: Bath, l: "Bathrooms", v: p.bathrooms },
                { i: Maximize, l: "Area", v: p.sqft ? `${p.sqft} ft²` : "—" },
                { i: MapPin, l: "Type", v: p.property_type },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-card border border-border p-4">
                  <s.i className="h-4 w-4 text-primary" />
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-2">{s.l}</div>
                  <div className="font-display font-semibold capitalize mt-1">{s.v}</div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <h2 className="font-display text-2xl font-bold">About this property</h2>
              <p className="text-muted-foreground mt-3 leading-relaxed whitespace-pre-line">{p.description || "No description provided."}</p>
            </div>

            {p.amenities?.length > 0 && (
              <div className="mt-10">
                <h2 className="font-display text-2xl font-bold">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                  {p.amenities.map((a: string) => (
                    <div key={a} className="flex items-center gap-2 text-sm rounded-lg bg-muted/50 px-3 py-2">
                      <Check className="h-4 w-4 text-success" /> {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {p.latitude && p.longitude && (
              <div className="mt-10">
                <h2 className="font-display text-2xl font-bold">Location</h2>
                <div className="mt-4 aspect-[16/9] rounded-2xl overflow-hidden border border-border">
                  <iframe
                    title="map"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${p.longitude-0.01}%2C${p.latitude-0.01}%2C${p.longitude+0.01}%2C${p.latitude+0.01}&layer=mapnik&marker=${p.latitude}%2C${p.longitude}`}
                    className="w-full h-full" loading="lazy"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sticky panel */}
          <aside className="lg:sticky lg:top-20 self-start">
            <div className="rounded-2xl bg-card shadow-elegant border border-border p-6">
              <div className="text-3xl font-display font-bold text-primary">{formatMWK(p.price_mwk)}
                <span className="text-sm text-muted-foreground font-normal">{p.purpose === "rent" ? " /month" : ""}</span>
              </div>
              {owner && (
                <div className="mt-5 flex items-center gap-3 pb-5 border-b border-border">
                  <div className="h-12 w-12 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center font-bold">
                    {(owner.full_name || "L").slice(0,1).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold">{owner.full_name || "Verified landlord"}</div>
                    <div className="text-xs text-muted-foreground">Verified landlord</div>
                  </div>
                </div>
              )}
              <div className="mt-5 space-y-2">
                <Button className="w-full bg-gradient-primary shadow-glow" onClick={() => {
                  if (!user) return navigate({ to: "/auth", search: { mode: "signup", role: "seeker" } });
                  if (!canContact) return navigate({ to: "/dashboard/subscription" });
                  setViewOpen(true);
                }}>
                  <Calendar className="h-4 w-4 mr-2" /> Request viewing
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  if (!user) return navigate({ to: "/auth", search: { mode: "signup", role: "seeker" } });
                  if (!canContact) return navigate({ to: "/dashboard/subscription" });
                  setContactOpen(true);
                }}>
                  Contact owner
                </Button>
                {!user && (
                  <p className="text-xs text-muted-foreground text-center pt-2">Sign up free to save & contact</p>
                )}
                {user && !canContact && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    A subscription is required to contact owners. <Link to="/dashboard/subscription" className="text-primary font-semibold">Subscribe →</Link>
                  </p>
                )}
              </div>
              <div className="mt-6 pt-5 border-t border-border space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 text-primary" /> Marketplace support: {CONTACT.phone1}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4 text-primary" /> {CONTACT.email}</div>
              </div>
            </div>
          </aside>
        </div>

        {/* Similar */}
        {similar && similar.length > 0 && (
          <section className="container mx-auto px-4 py-16">
            <h2 className="font-display text-2xl font-bold mb-6">Similar in {p.district}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((s: any) => (
                <Link key={s.id} to="/properties/$id" params={{ id: s.id }} className="group block rounded-2xl overflow-hidden bg-card shadow-card hover:shadow-elegant transition">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={s.cover_image || s.images?.[0]} alt={s.title} className="h-full w-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <div className="p-4">
                    <div className="font-display font-semibold line-clamp-1">{s.title}</div>
                    <div className="text-primary font-bold mt-1">{formatMWK(s.price_mwk)}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Contact dialog */}
        <Dialog open={contactOpen} onOpenChange={setContactOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Message owner</DialogTitle>
              <DialogDescription>Your message goes directly to the property owner.</DialogDescription>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const { error } = await supabase.from("messages").insert({
                from_user: user!.id, to_user: p.owner_id, property_id: p.id, body: String(fd.get("body")),
              });
              if (error) toast.error(error.message);
              else { toast.success("Message sent!"); setContactOpen(false); }
            }} className="space-y-3">
              <Textarea name="body" required minLength={5} placeholder="Hi, I'm interested in this property…" rows={5} />
              <Button type="submit" className="w-full bg-gradient-primary">Send message</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Viewing dialog */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request a viewing</DialogTitle>
              <DialogDescription>The owner will confirm a date with you.</DialogDescription>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const { error } = await supabase.from("viewing_requests").insert({
                property_id: p.id, owner_id: p.owner_id, seeker_id: user!.id,
                preferred_date: String(fd.get("date")), message: String(fd.get("note") ?? ""),
              });
              if (error) toast.error(error.message);
              else { toast.success("Viewing request sent!"); setViewOpen(false); }
            }} className="space-y-3">
              <div><label className="text-sm font-medium">Preferred date</label><Input name="date" type="date" required /></div>
              <Textarea name="note" placeholder="Any notes for the owner…" rows={3} />
              <Button type="submit" className="w-full bg-gradient-primary">Request viewing</Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
