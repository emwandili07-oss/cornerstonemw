import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const searchSchema = z.object({
  mode: z.enum(["login","signup"]).optional(),
  role: z.enum(["seeker","landlord"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [tab, setTab] = useState<"login"|"signup">(search.mode ?? "login");
  const [role, setRole] = useState<"seeker"|"landlord">(search.role ?? "seeker");
  const [loginRole, setLoginRole] = useState<"seeker"|"landlord">(search.role ?? "seeker");
  const [busy, setBusy] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/dashboard" }); }, [user]);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password"));
    const confirmPassword = String(fd.get("confirm_password"));

    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordMismatch(true);
      toast.error("Passwords do not match");
      return;
    }
    setPasswordMismatch(false);

    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: String(fd.get("full_name") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          role,
          business_name: role === "landlord" ? String(fd.get("business_name") ?? "") : undefined,
        },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — your account is now pending admin approval. You'll also need to complete the subscription payment to proceed.");
    await refresh();
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 grid place-items-center py-16 px-4 bg-muted/30">
        <Card className="w-full max-w-md shadow-elegant border-border">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Welcome to Nyumba Online</CardTitle>
            <CardDescription>Sign in or create an account to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <div className="flex rounded-lg bg-muted p-1 mt-4">
                  <button type="button" onClick={() => setLoginRole("seeker")} className={`flex-1 py-2 rounded-md text-sm font-semibold ${loginRole==="seeker"?"bg-card shadow-sm text-primary":"text-muted-foreground"}`}>Home Seeker</button>
                  <button type="button" onClick={() => setLoginRole("landlord")} className={`flex-1 py-2 rounded-md text-sm font-semibold ${loginRole==="landlord"?"bg-card shadow-sm text-primary":"text-muted-foreground"}`}>Landlord</button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  You are signing in as a <span className="font-semibold text-primary">{loginRole === "seeker" ? "Home Seeker" : "Landlord"}</span>.
                </p>
                <form className="space-y-4 mt-4" onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  setBusy(true);
                  const { error } = await supabase.auth.signInWithPassword({
                    email: String(fd.get("email")),
                    password: String(fd.get("password")),
                  });
                  setBusy(false);
                  if (error) return toast.error(error.message);
                  toast.success(`Welcome back! Signed in as ${loginRole === "seeker" ? "Home Seeker" : "Landlord"}.`);
                  await refresh();
                  navigate({ to: "/dashboard" });
                }}>
                  <div><Label>Email</Label><Input name="email" type="email" required /></div>
                  <div><Label>Password</Label><Input name="password" type="password" required minLength={6} /></div>
                  <Button disabled={busy} className="w-full bg-gradient-primary">Sign in</Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <div className="flex rounded-lg bg-muted p-1 mt-4">
                  <button type="button" onClick={() => setRole("seeker")} className={`flex-1 py-2 rounded-md text-sm font-semibold ${role==="seeker"?"bg-card shadow-sm text-primary":"text-muted-foreground"}`}>Home Seeker</button>
                  <button type="button" onClick={() => setRole("landlord")} className={`flex-1 py-2 rounded-md text-sm font-semibold ${role==="landlord"?"bg-card shadow-sm text-primary":"text-muted-foreground"}`}>Landlord</button>
                </div>
                <form className="space-y-4 mt-4" onSubmit={handleSignup}>
                  <div><Label>Full name</Label><Input name="full_name" required /></div>
                  <div><Label>Phone</Label><Input name="phone" required placeholder="+265…" /></div>
                  {role === "landlord" && (
                    <div><Label>Business / Agency name (optional)</Label><Input name="business_name" /></div>
                  )}
                  <div><Label>Email</Label><Input name="email" type="email" required /></div>
                  <div><Label>Password</Label><Input name="password" type="password" required minLength={6} /></div>
                  <div>
                    <Label>Confirm Password</Label>
                    <Input 
                      name="confirm_password" 
                      type="password" 
                      required 
                      minLength={6}
                      className={passwordMismatch ? "border-red-500" : ""}
                    />
                    {passwordMismatch && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                  </div>
                  <Button disabled={busy} className="w-full bg-gradient-primary">
                    {role === "landlord" ? "Apply as landlord" : "Create account"}
                  </Button>
                  {role === "landlord" && (
                    <p className="text-xs text-muted-foreground">
                      After signup, an admin will review your application and issue a payment invoice for MWK 20,000/month before you can publish properties.
                    </p>
                  )}
                </form>
              </TabsContent>
            </Tabs>
            <p className="text-xs text-muted-foreground text-center mt-6">
              By continuing you agree to Nyumba Online's terms and acceptable use.
            </p>
            <p className="text-xs text-center mt-2">
              <Link to="/" className="text-primary hover:underline">← Back to home</Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
