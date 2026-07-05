
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS email text;

GRANT INSERT (provider_place_id, author_name, rating, text, relative_time, published_at, email)
  ON public.reviews TO anon;

DROP POLICY IF EXISTS "Anonymous can submit reviews" ON public.reviews;
CREATE POLICY "Anonymous can submit reviews"
  ON public.reviews
  FOR INSERT
  TO anon
  WITH CHECK (
    rating BETWEEN 1 AND 5
    AND (text IS NULL OR length(text) <= 4000)
    AND length(coalesce(author_name, '')) BETWEEN 1 AND 120
    AND length(coalesce(email, '')) <= 255
  );

ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS articles jsonb NOT NULL DEFAULT '[]'::jsonb;
