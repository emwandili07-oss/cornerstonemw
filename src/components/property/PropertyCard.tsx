import { Link } from "@tanstack/react-router";
import { Bed, Bath, Maximize, MapPin, Star } from "lucide-react";
import { formatMWK } from "@/lib/format";

export interface PropertyLite {
  id: string;
  title: string;
  cover_image: string | null;
  images: string[];
  location: string;
  district: string;
  price_mwk: number;
  purpose: "rent" | "sale";
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  featured: boolean;
}

const FALLBACK = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80";

export function PropertyCard({ p }: { p: PropertyLite }) {
  const img = p.cover_image || p.images?.[0] || FALLBACK;
  return (
    <Link to="/properties/$id" params={{ id: p.id }} className="group block overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={img} alt={p.title} loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="rounded-full bg-secondary text-secondary-foreground text-[10px] uppercase tracking-wider px-3 py-1 font-semibold">
            For {p.purpose}
          </span>
          {p.featured && (
            <span className="rounded-full bg-gradient-primary text-primary-foreground text-[10px] uppercase tracking-wider px-3 py-1 font-semibold flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" /> Featured
            </span>
          )}
        </div>
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
          <div className="text-primary-foreground font-display text-xl font-bold">
            {formatMWK(p.price_mwk)}<span className="text-xs text-white/70 font-normal">{p.purpose === "rent" ? " /month" : ""}</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-base line-clamp-1 group-hover:text-primary transition">{p.title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="h-3 w-3" /> {p.location}, {p.district}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {p.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {p.bathrooms}</span>
          {p.sqft && <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" /> {p.sqft} ft²</span>}
          <span className="ml-auto capitalize">{p.property_type}</span>
        </div>
      </div>
    </Link>
  );
}
