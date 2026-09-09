ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS google_place_id text;
CREATE INDEX IF NOT EXISTS providers_google_place_id_idx ON public.providers (google_place_id);