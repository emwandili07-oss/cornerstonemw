
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin','landlord','seeker');
CREATE TYPE public.landlord_status AS ENUM ('pending','approved','suspended');
CREATE TYPE public.subscription_plan AS ENUM ('landlord_monthly','seeker_weekly','seeker_monthly');
CREATE TYPE public.subscription_status AS ENUM ('pending','active','expired','rejected');
CREATE TYPE public.property_type AS ENUM ('apartment','house','villa','land','commercial','office');
CREATE TYPE public.property_purpose AS ENUM ('rent','sale');
CREATE TYPE public.property_status AS ENUM ('draft','active','suspended');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  id_document_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles (separate to prevent escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Landlord application status
CREATE TABLE public.landlord_applications (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.landlord_status NOT NULL DEFAULT 'pending',
  business_name TEXT,
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.landlord_applications ENABLE ROW LEVEL SECURITY;

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL,
  amount_mwk INTEGER NOT NULL,
  status public.subscription_status NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  payment_method TEXT,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id, status);

-- Properties
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  property_type public.property_type NOT NULL,
  purpose public.property_purpose NOT NULL,
  price_mwk BIGINT NOT NULL,
  location TEXT NOT NULL,
  district TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  sqft INTEGER,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  cover_image TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  status public.property_status NOT NULL DEFAULT 'draft',
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_owner ON public.properties(owner_id);
CREATE INDEX idx_properties_filters ON public.properties(purpose, property_type, district);

-- Favorites
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Viewing requests
CREATE TABLE public.viewing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  preferred_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.viewing_requests ENABLE ROW LEVEL SECURITY;

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Platform settings
CREATE TABLE public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.platform_settings (key, value) VALUES
  ('subscription_prices', '{"landlord_monthly":20000,"seeker_weekly":5000,"seeker_monthly":15000}'::jsonb),
  ('contact', '{"email":"nyumbaonlinemw@gmail.com","phone1":"+265886396813","phone2":"+265990091744"}'::jsonb);

-- ===== RLS POLICIES =====

-- profiles
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- user_roles
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- landlord_applications
CREATE POLICY "la_select_own" ON public.landlord_applications FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "la_insert_own" ON public.landlord_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "la_update_own" ON public.landlord_applications FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "la_admin_all" ON public.landlord_applications FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- subscriptions
CREATE POLICY "subs_select_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "subs_insert_own" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subs_admin_manage" ON public.subscriptions FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- properties
CREATE POLICY "properties_public_active" ON public.properties FOR SELECT USING (status = 'active' OR auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "properties_owner_insert" ON public.properties FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "properties_owner_update" ON public.properties FOR UPDATE USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "properties_owner_delete" ON public.properties FOR DELETE USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

-- favorites
CREATE POLICY "favs_own" ON public.favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- viewing_requests
CREATE POLICY "vr_seeker_insert" ON public.viewing_requests FOR INSERT WITH CHECK (auth.uid() = seeker_id);
CREATE POLICY "vr_select_involved" ON public.viewing_requests FOR SELECT USING (auth.uid() = seeker_id OR auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "vr_owner_update" ON public.viewing_requests FOR UPDATE USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

-- messages
CREATE POLICY "msg_select_involved" ON public.messages FOR SELECT USING (auth.uid() = from_user OR auth.uid() = to_user);
CREATE POLICY "msg_insert_own" ON public.messages FOR INSERT WITH CHECK (auth.uid() = from_user);
CREATE POLICY "msg_update_recipient" ON public.messages FOR UPDATE USING (auth.uid() = to_user);

-- platform_settings
CREATE POLICY "ps_select_all" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "ps_admin_manage" ON public.platform_settings FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- ===== Triggers =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.raw_user_meta_data->>'phone');
  -- Default role seeker
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'seeker');
  -- If signup metadata says landlord, also add landlord role + pending application
  IF (NEW.raw_user_meta_data->>'role') = 'landlord' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'landlord');
    INSERT INTO public.landlord_applications (user_id, business_name)
      VALUES (NEW.id, NEW.raw_user_meta_data->>'business_name');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_properties_updated BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage bucket for property media
INSERT INTO storage.buckets (id, name, public) VALUES ('property-media','property-media', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "property_media_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'property-media');
CREATE POLICY "property_media_owner_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "property_media_owner_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'property-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "property_media_owner_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'property-media' AND auth.uid()::text = (storage.foldername(name))[1]);
