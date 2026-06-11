
CREATE TABLE IF NOT EXISTS public._seed_providers_staging (
  id serial PRIMARY KEY,
  data jsonb NOT NULL
);
GRANT INSERT, SELECT, DELETE ON public._seed_providers_staging TO authenticated;
GRANT ALL ON public._seed_providers_staging TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public._seed_providers_staging_id_seq TO authenticated;
ALTER TABLE public._seed_providers_staging ENABLE ROW LEVEL SECURITY;
