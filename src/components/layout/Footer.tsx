import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Mail, Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { CONTACT } from "@/lib/format";

export function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="mt-24 border-t border-border bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-14 grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Cornerstone — Nyumba Online" className="h-12 w-12 bg-white rounded-full p-1 object-contain" />
            <div>
              <div className="font-display text-xl font-bold">Cornerstone</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-secondary-foreground/60">Nyumba Online</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-secondary-foreground/70 leading-relaxed">
            Cornerstone — Nyumba Online. Malawi's premium real estate marketplace connecting seekers with verified landlords and property owners.
          </p>
        </div>
        <div>
          <div className="font-display font-semibold mb-3">Explore</div>
          <ul className="space-y-2 text-sm text-secondary-foreground/80">
            <li><Link to="/browse" search={{ purpose: "rent" }} className="hover:text-primary">Properties for rent</Link></li>
            <li><Link to="/browse" search={{ purpose: "sale" }} className="hover:text-primary">Properties for sale</Link></li>
            <li><Link to="/list-property" className="hover:text-primary">List your property</Link></li>
            <li><Link to="/about" className="hover:text-primary">About us</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-display font-semibold mb-3">Contact</div>
          <ul className="space-y-2 text-sm text-secondary-foreground/80">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><a href={`mailto:${CONTACT.email}`} className="hover:text-primary">{CONTACT.email}</a></li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><a href={`tel:${CONTACT.phone1}`} className="hover:text-primary">{CONTACT.phone1}</a></li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><a href={`tel:${CONTACT.phone2}`} className="hover:text-primary">{CONTACT.phone2}</a></li>
          </ul>
        </div>
        <div>
          <div className="font-display font-semibold mb-3">Subscriptions</div>
          <ul className="space-y-2 text-sm text-secondary-foreground/80">
            <li>Landlords — MWK 20,000 / month</li>
            <li>Seekers Weekly — MWK 5,000</li>
            <li>Seekers Monthly — MWK 15,000</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary-foreground/60">
          <span>© {new Date().getFullYear()} Nyumba Online. All rights reserved.</span>
          <span className="font-medium tracking-wide text-secondary-foreground/80">
            Powered by <span className="text-primary font-semibold">Kwacha Globe Malawi</span>
          </span>
          <button
            onClick={() => navigate({ to: "/admin-portal" })}
            aria-label="Staff access"
            title=""
            className="opacity-30 hover:opacity-100 transition p-2 rounded-full hover:bg-white/5"
          >
            <Home className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
