import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [notice, setNotice] = useState<{ id: string; name: string; kind: "reminder" | "warning" } | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,full_name,phone,approval_status,approved_at,created_at")
        .order("created_at", { ascending: false });
      const { data: roles } = await supabase.from("user_roles").select("user_id,role");
      const rmap: Record<string, string[]> = {};
      (roles ?? []).forEach((r: any) => { (rmap[r.user_id] ||= []).push(r.role); });
      return (profs ?? []).map((p: any) => ({ ...p, roles: rmap[p.id] ?? [] }));
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "pending" | "suspended" }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ approval_status: status, approved_at: status === "approved" ? new Date().toISOString() : null, approved_by: status === "approved" ? user?.id : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const sendNotice = useMutation({
    mutationFn: async () => {
      if (!notice) return;
      const { error } = await supabase.from("admin_notices").insert({
        user_id: notice.id, kind: notice.kind, title, message, created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notice sent");
      setNotice(null); setTitle(""); setMessage("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("admin_delete_user", { _user_id: id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Account deleted"); setConfirmDelete(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const openNotice = (u: any, kind: "reminder" | "warning") => {
    setNotice({ id: u.id, name: u.full_name || "user", kind });
    if (kind === "reminder") {
      setTitle("Subscription payment reminder");
      setMessage("This is a friendly reminder to complete your subscription payment so your account stays active. Pay 5,000 MWK weekly or 15,000 MWK monthly (seekers) or 20,000 MWK monthly (landlords).");
    } else {
      setTitle("Account warning");
      setMessage("Please review our platform terms. Continued violation may result in your account being suspended.");
    }
  };

  const filtered = (data ?? []).filter((u: any) =>
    !q || (u.full_name ?? "").toLowerCase().includes(q.toLowerCase()) || (u.phone ?? "").includes(q)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">User approvals</h1>
          <p className="text-sm text-muted-foreground">Approve seekers and landlords after confirming their subscription payment, or suspend accounts that need to be disconnected.</p>
        </div>
        <Input className="max-w-xs" placeholder="Search name or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Joined</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u: any) => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3">
                  <div className="font-medium">{u.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.phone}</div>
                </td>
                <td className="p-3 capitalize">{u.roles.filter((r: string) => r !== "seeker").concat(u.roles.includes("landlord") ? [] : ["seeker"]).join(", ")}</td>
                <td className="p-3">
                  <Badge variant={u.approval_status === "approved" ? "default" : u.approval_status === "pending" ? "secondary" : "destructive"} className="capitalize">
                    {u.approval_status}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="p-3 space-x-2">
                  {u.approval_status !== "approved" && (
                    <Button size="sm" className="bg-gradient-primary" onClick={() => setStatus.mutate({ id: u.id, status: "approved" })}>
                      {u.approval_status === "suspended" ? "Reconnect" : "Approve"}
                    </Button>
                  )}
                  {u.approval_status !== "suspended" && !u.roles.includes("admin") && (
                    <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: u.id, status: "suspended" })}>
                      Disconnect
                    </Button>
                  )}
                  {!u.roles.includes("admin") && <>
                    <Button size="sm" variant="outline" onClick={() => openNotice(u, "reminder")}>Reminder</Button>
                    <Button size="sm" variant="outline" onClick={() => openNotice(u, "warning")}>Warn</Button>
                    <Button size="sm" variant="destructive" onClick={() => setConfirmDelete({ id: u.id, name: u.full_name || "this user" })}>Delete</Button>
                  </>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No users.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!notice} onOpenChange={(o) => !o && setNotice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send {notice?.kind} to {notice?.name}</DialogTitle>
            <DialogDescription>The user will see this in their dashboard.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" rows={5} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotice(null)}>Cancel</Button>
            <Button className="bg-gradient-primary" disabled={!title || !message || sendNotice.isPending} onClick={() => sendNotice.mutate()}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the account and all of their properties, subscriptions, messages and viewing requests. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => confirmDelete && deleteUser.mutate(confirmDelete.id)}>Delete account</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
