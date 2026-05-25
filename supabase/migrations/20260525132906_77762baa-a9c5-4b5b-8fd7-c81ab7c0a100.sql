UPDATE auth.users
SET encrypted_password = crypt('44bulldown', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = 'nyumbaonline26@nyumba.admin';