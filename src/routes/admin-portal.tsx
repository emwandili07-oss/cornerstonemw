import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, User, Lock } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/admin-portal")({ component: AdminPortal });
function AdminPortal() {
  const navigate = useNavigate();
  const { user, isAdmin, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user && isAdmin) navigate({ to: "/admin" }); }, [user, isAdmin]);
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-secondary via-secondary to-background p-4">
      <Card className="w-full max-w-sm shadow-elegant border-primary/20">
        <CardHeader className="text-center">
          <img src={logo} alt="Nyumba Online" className="h-16 w-16 mx-auto rounded-xl bg-white p-1.5" />
          <CardTitle className="font-display flex items-center justify-center gap-2 mt-3 text-xl"><Shield className="h-5 w-5 text-primary" /> Administrator Portal</CardTitle>
          <CardDescription>Authorized personnel only.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setBusy(true);
            let identifier = String(fd.get("identifier")).trim().replace(/^@/, "");
            const password = String(fd.get("password"));
            // If username form, map to synthetic admin email
            const email = identifier.includes("@") ? identifier : `${identifier}@nyumba.admin`;
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            setBusy(false);
            if (error) return toast.error("Invalid credentials");
            await refresh();
            const { data: roles } = await supabase.from("user_roles").select("role");
            if ((roles ?? []).some((r: any) => r.role === "admin")) {
              toast.success("Welcome back, admin"); navigate({ to: "/admin" });
            } else {
              toast.error("This account is not an administrator.");
              await supabase.auth.signOut();
            }
          }}>
            <div>
              <Label>Username or Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input name="identifier" required placeholder="@nyumbaonline26" className="pl-9" autoComplete="username" />
              </div>
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input name="password" type="password" required className="pl-9" autoComplete="current-password" />
              </div>
            </div>
            <Button type="submit" disabled={busy} className="w-full bg-gradient-primary h-11">{busy ? "Signing in..." : "Sign in to Dashboard"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
