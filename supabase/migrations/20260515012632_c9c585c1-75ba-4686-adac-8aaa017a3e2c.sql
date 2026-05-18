
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approval_notes text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_approval_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_approval_status_check
  CHECK (approval_status IN ('pending','approved','suspended'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, approval_status)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.raw_user_meta_data->>'phone', 'pending');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'seeker');
  IF (NEW.raw_user_meta_data->>'role') = 'landlord' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'landlord');
    INSERT INTO public.landlord_applications (user_id, business_name)
      VALUES (NEW.id, NEW.raw_user_meta_data->>'business_name');
  END IF;
  RETURN NEW;
END;
$function$;

UPDATE public.profiles
   SET approval_status = 'approved', approved_at = COALESCE(approved_at, now())
 WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');
