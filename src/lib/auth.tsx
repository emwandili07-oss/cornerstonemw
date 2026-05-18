import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "landlord" | "seeker";
export interface Profile {
  id: string; full_name: string; phone: string | null; avatar_url: string | null;
  approval_status?: "pending" | "approved" | "suspended";
}
export interface ActiveSub {
  plan: "landlord_monthly" | "seeker_weekly" | "seeker_monthly";
  expires_at: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: Role[];
  subscriptions: ActiveSub[];
  landlordStatus: "pending" | "approved" | "suspended" | null;
  loading: boolean;
  isAdmin: boolean;
  isLandlord: boolean;
  isApprovedLandlord: boolean;
  isApproved: boolean;
  approvalStatus: "pending" | "approved" | "suspended";
  expiringSub: ActiveSub | null;
  hasActiveLandlordSub: boolean;
  hasActiveSeekerSub: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [subscriptions, setSubs] = useState<ActiveSub[]>([]);
  const [landlordStatus, setLS] = useState<AuthState["landlordStatus"]>(null);
  const [loading, setLoading] = useState(true);

  const loadAux = async (uid: string) => {
    const [{ data: p }, { data: r }, { data: s }, { data: la }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,phone,avatar_url,approval_status").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("subscriptions").select("plan,expires_at,status").eq("user_id", uid).eq("status","active"),
      supabase.from("landlord_applications").select("status").eq("user_id", uid).maybeSingle(),
    ]);
    setProfile(p as Profile | null);
    setRoles((r ?? []).map((x: any) => x.role));
    setSubs((s ?? []).map((x: any) => ({ plan: x.plan, expires_at: x.expires_at })));
    setLS((la as any)?.status ?? null);
  };

  const refresh = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
    if (data.session?.user) await loadAux(data.session.user.id);
    else { setProfile(null); setRoles([]); setSubs([]); setLS(null); }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => { loadAux(sess.user.id); }, 0);
      } else {
        setProfile(null); setRoles([]); setSubs([]); setLS(null);
      }
    });
    refresh().finally(() => setLoading(false));
    return () => sub.subscription.unsubscribe();
  }, []);

  const isAdmin = roles.includes("admin");
  const isLandlord = roles.includes("landlord");
  const isApprovedLandlord = isLandlord && landlordStatus === "approved";
  const now = Date.now();
  const hasActiveLandlordSub = subscriptions.some(
    (s) => s.plan === "landlord_monthly" && (!s.expires_at || new Date(s.expires_at).getTime() > now)
  );
  const hasActiveSeekerSub = subscriptions.some(
    (s) => (s.plan === "seeker_weekly" || s.plan === "seeker_monthly") &&
           (!s.expires_at || new Date(s.expires_at).getTime() > now)
  );
  const approvalStatus = (profile as any)?.approval_status ?? "pending";
  const isApproved = isAdmin || approvalStatus === "approved";
  const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
  const expiringSub = subscriptions.find(
    (s) => s.expires_at && new Date(s.expires_at).getTime() - now < TWO_DAYS && new Date(s.expires_at).getTime() > now
  ) ?? null;

  return (
    <Ctx.Provider value={{
      user, session, profile, roles, subscriptions, landlordStatus, loading,
      isAdmin, isLandlord, isApprovedLandlord, isApproved, approvalStatus, expiringSub,
      hasActiveLandlordSub, hasActiveSeekerSub,
      refresh, signOut: async () => { await supabase.auth.signOut(); },
    }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
