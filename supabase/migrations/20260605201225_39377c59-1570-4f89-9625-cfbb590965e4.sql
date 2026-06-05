
-- 1. Auto-grant admin role on signup for nokunato@gmail.com, and backfill if user exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  IF lower(NEW.email) = 'nokunato@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'nokunato@gmail.com'
ON CONFLICT DO NOTHING;

-- 2. Provider profile expansions
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS hours jsonb,
  ADD COLUMN IF NOT EXISTS social_links jsonb,
  ADD COLUMN IF NOT EXISTS price_ranges jsonb,
  ADD COLUMN IF NOT EXISTS before_after_urls text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS team jsonb,
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- 3. Profiles: account type + license info
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'consumer',
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS business_role text,
  ADD COLUMN IF NOT EXISTS phone text;

-- 4. Submissions: license fields
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS license_type text,
  ADD COLUMN IF NOT EXISTS license_doc_path text,
  ADD COLUMN IF NOT EXISTS npi text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resulting_place_id text;

-- 5. Review responses
CREATE TABLE IF NOT EXISTS public.review_responses (
  review_id uuid PRIMARY KEY REFERENCES public.reviews(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.review_responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_responses TO authenticated;
GRANT ALL ON public.review_responses TO service_role;
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read review responses" ON public.review_responses FOR SELECT USING (true);
CREATE POLICY "Owner inserts response" ON public.review_responses FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.reviews r
      JOIN public.providers p ON p.place_id = r.provider_place_id
      WHERE r.id = review_id AND p.claimed_by = auth.uid()
    )
  );
CREATE POLICY "Owner updates response" ON public.review_responses FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner deletes response" ON public.review_responses FOR DELETE TO authenticated
  USING (owner_id = auth.uid());
CREATE POLICY "Admins manage review responses" ON public.review_responses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_review_responses_updated_at BEFORE UPDATE ON public.review_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Provider FAQs
CREATE TABLE IF NOT EXISTS public.provider_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_place_id text NOT NULL REFERENCES public.providers(place_id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.provider_faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_faqs TO authenticated;
GRANT ALL ON public.provider_faqs TO service_role;
ALTER TABLE public.provider_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read provider faqs" ON public.provider_faqs FOR SELECT USING (true);
CREATE POLICY "Owner manages faqs" ON public.provider_faqs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.place_id = provider_place_id AND p.claimed_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.place_id = provider_place_id AND p.claimed_by = auth.uid()));
CREATE POLICY "Admins manage faqs" ON public.provider_faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_provider_faqs_place ON public.provider_faqs(provider_place_id);
CREATE TRIGGER update_provider_faqs_updated_at BEFORE UPDATE ON public.provider_faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Provider views (anonymous counter)
CREATE TABLE IF NOT EXISTS public.provider_views (
  id bigserial PRIMARY KEY,
  provider_place_id text NOT NULL REFERENCES public.providers(place_id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  referrer text
);
GRANT INSERT ON public.provider_views TO anon, authenticated;
GRANT SELECT ON public.provider_views TO authenticated;
GRANT ALL ON public.provider_views TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.provider_views_id_seq TO anon, authenticated;
ALTER TABLE public.provider_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone records view" ON public.provider_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner reads views" ON public.provider_views FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.place_id = provider_place_id AND p.claimed_by = auth.uid()));
CREATE POLICY "Admins read views" ON public.provider_views FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_provider_views_place_time ON public.provider_views(provider_place_id, viewed_at DESC);

-- 8. Provider update requests
CREATE TABLE IF NOT EXISTS public.provider_update_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_place_id text NOT NULL REFERENCES public.providers(place_id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patch jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.provider_update_requests TO authenticated;
GRANT UPDATE, DELETE ON public.provider_update_requests TO authenticated;
GRANT ALL ON public.provider_update_requests TO service_role;
ALTER TABLE public.provider_update_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner submits update req" ON public.provider_update_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.providers p WHERE p.place_id = provider_place_id AND p.claimed_by = auth.uid()
  ));
CREATE POLICY "Owner views own update req" ON public.provider_update_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid());
CREATE POLICY "Admins manage update requests" ON public.provider_update_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
