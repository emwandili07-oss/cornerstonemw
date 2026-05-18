import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/messages")({ component: Msgs });
function Msgs() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["msgs", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*, properties(title)")
        .or(`from_user.eq.${user!.id},to_user.eq.${user!.id}`).order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Messages</h1>
      <div className="space-y-2">
        {(data ?? []).map((m: any) => (
          <div key={m.id} className="rounded-xl bg-card border border-border p-4">
            <div className="text-xs text-muted-foreground">{m.properties?.title ?? "—"} · {new Date(m.created_at).toLocaleString()} · {m.from_user === user!.id ? "Sent" : "Received"}</div>
            <div className="mt-1">{m.body}</div>
          </div>
        ))}
        {data?.length === 0 && <p className="text-muted-foreground">No messages yet.</p>}
      </div>
    </div>
  );
}
