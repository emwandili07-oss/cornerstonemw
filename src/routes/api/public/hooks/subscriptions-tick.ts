import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/hooks/subscriptions-tick")({
  server: {
    handlers: {
      POST: async () => {
        const nowIso = new Date().toISOString();
        const in2Days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

        // 1) Auto-expire active subs past expires_at
        const { data: expired, error: expErr } = await supabaseAdmin
          .from("subscriptions")
          .update({ status: "expired" })
          .lt("expires_at", nowIso)
          .eq("status", "active")
          .select("id,user_id,plan");
        if (expErr) return new Response(JSON.stringify({ error: expErr.message }), { status: 500 });

        // Notify expired users
        if (expired && expired.length) {
          await supabaseAdmin.from("admin_notices").insert(
            expired.map((s: any) => ({
              user_id: s.user_id,
              kind: "warning",
              title: "Subscription expired",
              message: `Your ${String(s.plan).replaceAll("_", " ")} subscription has expired. Renew to continue using the platform.`,
            })),
          );
        }

        // 2) Send 2-day reminders for active subs expiring soon
        const { data: expiring } = await supabaseAdmin
          .from("subscriptions")
          .select("id,user_id,plan,expires_at")
          .eq("status", "active")
          .gt("expires_at", nowIso)
          .lt("expires_at", in2Days);

        let reminded = 0;
        for (const s of expiring ?? []) {
          // skip if a reminder was sent in the last 24h
          const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { count } = await supabaseAdmin
            .from("admin_notices")
            .select("id", { count: "exact", head: true })
            .eq("user_id", s.user_id)
            .eq("kind", "reminder")
            .gt("created_at", since);
          if ((count ?? 0) > 0) continue;
          await supabaseAdmin.from("admin_notices").insert({
            user_id: s.user_id,
            kind: "reminder",
            title: "Subscription expiring soon",
            message: `Your ${String(s.plan).replaceAll("_", " ")} subscription expires on ${new Date(s.expires_at!).toLocaleDateString()}. Please renew within 2 days to avoid disruption.`,
          });
          reminded++;
        }

        return new Response(
          JSON.stringify({ expired: expired?.length ?? 0, reminded }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});