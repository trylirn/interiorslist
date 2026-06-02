-- 1. Schema additions for premium features
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS skin_types text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS recovery_tags text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS personality jsonb;

-- 2. Testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author text NOT NULL,
  location text,
  treatment text,
  quote text NOT NULL,
  rating integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  photo_url text,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT ALL ON public.testimonials TO service_role;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Featured testimonials are public" ON public.testimonials;
CREATE POLICY "Featured testimonials are public" ON public.testimonials FOR SELECT USING (featured = true);

DROP POLICY IF EXISTS "Admins manage testimonials" ON public.testimonials;
CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL USING (has_role(auth.uid(),'admin'));

-- 3. Seed 6 starter testimonials (only if table is empty)
INSERT INTO public.testimonials (author, location, treatment, quote, rating, featured)
SELECT * FROM (VALUES
  ('Sarah M.', 'Houston', 'Botox', 'Booked a consult through the directory and felt informed before I even walked in. Loved that I could see credentials upfront.', 5, true),
  ('Jasmine R.', 'Dallas', 'Lip Filler', 'Found three options near me and picked the one whose vibe matched mine. No pressure, no upsell — exactly what I wanted.', 5, true),
  ('Maria G.', 'Austin', 'HydraFacial', 'The credentials filter is a game changer. Easy to compare nurse injectors vs MDs without calling six places.', 5, true),
  ('Lauren T.', 'San Antonio', 'Microneedling', 'Reached out via the contact form on a Sunday and had a reply Monday morning. Booking was simple after that.', 5, true),
  ('Priya K.', 'Fort Worth', 'Morpheus8', 'I appreciated that listings showed real specialties — not just every service under the sun. Helped me trust my pick.', 5, true),
  ('Alyssa C.', 'Plano', 'CoolSculpting', 'No paid placements means I trust the rankings. Got two estimates and chose the provider with better reviews.', 5, true)
) AS s(author, location, treatment, quote, rating, featured)
WHERE NOT EXISTS (SELECT 1 FROM public.testimonials);

-- 4. Scrub any historical emails from providers (user policy: no emails stored)
UPDATE public.providers SET email = NULL WHERE email IS NOT NULL;

-- 5. Default recovery_tags by service mix (so filter has data)
UPDATE public.providers SET recovery_tags = ARRAY['no-downtime']::text[]
  WHERE recovery_tags IS NULL OR array_length(recovery_tags,1) IS NULL;
UPDATE public.providers SET recovery_tags = array_append(recovery_tags, '3-7-days')
  WHERE NOT ('3-7-days' = ANY(recovery_tags)) AND (services && ARRAY['morpheus8','laser-resurfacing','halo-laser','bbl','chemical-peels']::text[]);
UPDATE public.providers SET recovery_tags = array_append(recovery_tags, '1-2-days')
  WHERE NOT ('1-2-days' = ANY(recovery_tags)) AND (services && ARRAY['microneedling','prp','prp-hair']::text[]);