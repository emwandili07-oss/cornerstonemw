import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LayoutDashboard, Home, Heart, Calendar, MessageSquare, CreditCard, Settings, Shield } from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: DashboardLayout });

function DashboardLayout() {
  const { user, loading, isLandlord, isAdmin } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  useEffect(() => { if (!loading && !user) navigate({ to: "/auth", search: { mode: "login" } }); }, [user, loading]);

  const links = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    ...(isLandlord ? [
      { to: "/dashboard/properties", label: "My Properties", icon: Home },
    ] : []),
    { to: "/dashboard/favorites", label: "Favorites", icon: Heart },
    { to: "/dashboard/viewings", label: "Viewings", icon: Calendar },
    { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { to: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
    { to: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          <aside>
            <nav className="space-y-1 sticky top-24">
              {links.map((l) => {
                const isActive = loc.pathname === l.to;
                return (
                  <Link key={l.to} to={l.to as any}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? "bg-primary text-primary-foreground shadow-glow" : "hover:bg-muted text-foreground"}`}>
                    <l.icon className="h-4 w-4" /> {l.label}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-3 px-3 py-2 mt-4 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:opacity-90">
                  <Shield className="h-4 w-4" /> Admin Panel
                </Link>
              )}
            </nav>
          </aside>
          <section><Outlet /></section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
