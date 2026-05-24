
-- App role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'user');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Services catalog
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services public read" ON public.services FOR SELECT USING (true);
CREATE POLICY "Admins manage services" ON public.services FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.services (name, slug, description) VALUES
  ('Botox', 'botox', 'Neurotoxin injections for wrinkles'),
  ('Dermal Fillers', 'fillers', 'Hyaluronic acid and other dermal fillers'),
  ('Lip Filler', 'lip-filler', 'Lip augmentation with HA fillers'),
  ('Sculptra', 'sculptra', 'Poly-L-lactic acid collagen stimulator'),
  ('Kybella', 'kybella', 'Submental fat reduction'),
  ('PRP / PRF', 'prp', 'Platelet-rich plasma/fibrin treatments'),
  ('Microneedling', 'microneedling', 'Collagen induction therapy'),
  ('Chemical Peels', 'chemical-peels', 'Skin resurfacing peels'),
  ('IV Therapy', 'iv-therapy', 'Vitamin and hydration IV drips');

-- Providers
CREATE TABLE public.providers (
  place_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  city_slug TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'TX',
  address TEXT,
  postal_code TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  website TEXT,
  rating NUMERIC(2,1),
  review_count INTEGER DEFAULT 0,
  price_level INTEGER,
  hours_json JSONB,
  photos_json JSONB,
  services TEXT[] DEFAULT ARRAY[]::TEXT[],
  hero_photo_url TEXT,
  google_maps_url TEXT,
  business_status TEXT NOT NULL DEFAULT 'OPERATIONAL',
  claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_providers_city ON public.providers(city_slug);
CREATE INDEX idx_providers_rating ON public.providers(rating DESC NULLS LAST);
CREATE INDEX idx_providers_services ON public.providers USING GIN(services);
CREATE INDEX idx_providers_status ON public.providers(business_status);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers public read operational" ON public.providers FOR SELECT
  USING (business_status = 'OPERATIONAL');
CREATE POLICY "Owners update claimed listings" ON public.providers FOR UPDATE
  USING (auth.uid() = claimed_by);
CREATE POLICY "Admins manage providers" ON public.providers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_place_id TEXT NOT NULL REFERENCES public.providers(place_id) ON DELETE CASCADE,
  author_name TEXT,
  author_photo TEXT,
  rating INTEGER,
  text TEXT,
  relative_time TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_provider ON public.reviews(provider_place_id);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Favorites
CREATE TABLE public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_place_id TEXT NOT NULL REFERENCES public.providers(place_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, provider_place_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own favorites" ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users add own favorites" ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own favorites" ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Claims
CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_place_id TEXT NOT NULL REFERENCES public.providers(place_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  business_role TEXT,
  proof_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own claims" ON public.claims FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users submit claims" ON public.claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage claims" ON public.claims FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Submissions
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  website TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Submitter views own" ON public.submissions FOR SELECT
  USING (auth.uid() = submitted_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage submissions" ON public.submissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + assign default 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
