
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  target_user_id uuid,
  reason text,
  notes text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_admin_select" ON public.admin_audit_log
  FOR SELECT USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "audit_admin_insert" ON public.admin_audit_log
  FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin') AND admin_id = auth.uid());

CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_entity_idx ON public.admin_audit_log (entity, entity_id);
