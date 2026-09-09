DROP INDEX IF EXISTS public.reviews_external_unique;
CREATE UNIQUE INDEX reviews_external_unique ON public.reviews (provider_place_id, source, external_id);