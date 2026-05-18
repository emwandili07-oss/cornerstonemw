import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/dashboard/settings")({ component: Settings });
function Settings() {
  const { user, profile, refresh } = useAuth();
  const [v, setV] = useState({ full_name: "", phone: "", bio: "" });
  useEffect(() => { if (profile) setV({ full_name: profile.full_name, phone: profile.phone ?? "", bio: (profile as any).bio ?? "" }); }, [profile]);
  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="font-display text-3xl font-bold">Profile settings</h1>
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        const { error } = await supabase.from("profiles").update(v).eq("id", user!.id);
        if (error) toast.error(error.message); else { toast.success("Saved"); refresh(); }
      }}>
        <div><Label>Full name</Label><Input value={v.full_name} onChange={(e) => setV({...v, full_name: e.target.value})} /></div>
        <div><Label>Phone</Label><Input value={v.phone} onChange={(e) => setV({...v, phone: e.target.value})} /></div>
        <div><Label>Bio</Label><Textarea rows={4} value={v.bio} onChange={(e) => setV({...v, bio: e.target.value})} /></div>
        <Button className="bg-gradient-primary">Save</Button>
      </form>
    </div>
  );
}
