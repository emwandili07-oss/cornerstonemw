import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Search, User, LogOut, LayoutDashboard, Heart } from "lucide-react";
import logo from "@/assets/logo.png";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Cornerstone — Nyumba Online" className="h-11 w-11 object-contain rounded-full" />
          <div className="block leading-tight">
            <div className="font-display text-lg font-bold text-secondary">Cornerstone</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground -mt-0.5">Nyumba Online</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/browse" search={{ purpose: "rent" }} className="hover:text-primary transition" activeProps={{ className: "text-primary" }}>
            For Rent
          </Link>
          <Link to="/browse" search={{ purpose: "sale" }} className="hover:text-primary transition" activeProps={{ className: "text-primary" }}>
            For Sale
          </Link>
          <Link to="/list-property" className="hover:text-primary transition">List Property</Link>
          <Link to="/about" className="hover:text-primary transition">About</Link>
          <Link to="/contact" className="hover:text-primary transition">Contact</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/browse", search: {} })} aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-xs font-bold">
                    {(profile?.full_name || user.email || "U").slice(0,1).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {profile?.full_name || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/favorites" })}>
                  <Heart className="mr-2 h-4 w-4" /> Favorites
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <User className="mr-2 h-4 w-4" /> Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/auth", search: { mode: "login" } })}>Sign in</Button>
              <Button size="sm" className="bg-gradient-primary shadow-glow" onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}>
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
