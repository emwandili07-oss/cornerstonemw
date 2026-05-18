import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Shield, Users, CreditCard, Home, Settings as SettingsIcon, UserCheck, ScrollText } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminLayout });
function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    if (!loading) {
      if (!user) navigate({ to: "/admin-portal" });
      else if (!isAdmin) navigate({ to: "/dashboard" });
    }
  }, [user, isAdmin, loading]);

  const links = [
    { to: "/admin", label: "Overview", icon: Shield },
    { to: "/admin/users", label: "User approvals", icon: UserCheck },
    { to: "/admin/applications", label: "Applications", icon: Users },
    { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
    { to: "/admin/properties", label: "Properties", icon: Home },
    { to: "/admin/audit", label: "Audit log", icon: ScrollText },
    { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
  ];

  if (!isAdmin) return null;
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          <aside>
            <div className="rounded-xl bg-secondary text-secondary-foreground p-4 mb-4">
              <div className="text-xs uppercase tracking-wider text-secondary-foreground/60">Admin Panel</div>
              <div className="font-display font-bold">Nyumba Online</div>
            </div>
            <nav className="space-y-1 sticky top-24">
              {links.map((l) => {
                const isActive = loc.pathname === l.to;
                return <Link key={l.to} to={l.to as any} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  <l.icon className="h-4 w-4" />{l.label}
                </Link>;
              })}
            </nav>
          </aside>
          <section><Outlet /></section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
