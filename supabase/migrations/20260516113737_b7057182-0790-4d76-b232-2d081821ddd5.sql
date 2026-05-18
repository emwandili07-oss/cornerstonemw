
-- Notices from admin to users (reminders, warnings)
CREATE TABLE IF NOT EXISTS public.admin_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('reminder','warning','info')),
  title text NOT NULL,
  message text NOT NULL,
  created_by uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY notices_admin_all ON public.admin_notices
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY notices_select_own ON public.admin_notices
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY notices_update_own ON public.admin_notices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS admin_notices_user_idx ON public.admin_notices(user_id, created_at DESC);

-- Admin-only: delete a user fully
CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF public.has_role(_user_id, 'admin') THEN
    RAISE EXCEPTION 'Cannot delete an admin account';
  END IF;
  DELETE FROM public.favorites WHERE user_id = _user_id;
  DELETE FROM public.viewing_requests WHERE seeker_id = _user_id OR owner_id = _user_id;
  DELETE FROM public.messages WHERE from_user = _user_id OR to_user = _user_id;
  DELETE FROM public.properties WHERE owner_id = _user_id;
  DELETE FROM public.subscriptions WHERE user_id = _user_id;
  DELETE FROM public.landlord_applications WHERE user_id = _user_id;
  DELETE FROM public.admin_notices WHERE user_id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notices;
