
-- Create admin auth user (idempotent)
DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'nyumbaonline26@nyumba.admin';
  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'nyumbaonline26@nyumba.admin', crypt('44bulldown', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Nyumba Online Admin"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', 'nyumbaonline26@nyumba.admin', 'email_verified', true),
      'email', v_uid::text, now(), now(), now());
  ELSE
    UPDATE auth.users
      SET encrypted_password = crypt('44bulldown', gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
      WHERE id = v_uid;
  END IF;

  -- Ensure profile
  INSERT INTO public.profiles (id, full_name, approval_status, approved_at)
  VALUES (v_uid, 'Nyumba Online Admin', 'approved', now())
  ON CONFLICT (id) DO UPDATE SET approval_status = 'approved', approved_at = COALESCE(public.profiles.approved_at, now());

  -- Ensure admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
