
-- Create admin user with fixed credentials
DO $$
DECLARE
  admin_uid uuid;
  admin_email text := 'nyumbaonline26@nyumba.admin';
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = admin_email;

  IF admin_uid IS NULL THEN
    admin_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_uid, 'authenticated', 'authenticated',
      admin_email, crypt('44Bulldown', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Nyumba Online Admin","username":"nyumbaonline26"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), admin_uid, jsonb_build_object('sub', admin_uid::text, 'email', admin_email), 'email', admin_uid::text, now(), now(), now());
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('44Bulldown', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = admin_uid;
  END IF;

  -- Ensure profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (admin_uid, 'Nyumba Online Admin')
  ON CONFLICT (id) DO NOTHING;

  -- Ensure admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- Ensure default platform settings exist
INSERT INTO public.platform_settings (key, value)
VALUES ('subscription_prices', '{"landlord_monthly":20000,"seeker_weekly":5000,"seeker_monthly":15000}'::jsonb)
ON CONFLICT (key) DO NOTHING;
