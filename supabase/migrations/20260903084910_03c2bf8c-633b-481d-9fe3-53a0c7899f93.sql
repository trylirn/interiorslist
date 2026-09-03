ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'site',
  ADD COLUMN IF NOT EXISTS external_id text;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_external_unique
  ON public.reviews (provider_place_id, source, external_id)
  WHERE external_id IS NOT NULL;