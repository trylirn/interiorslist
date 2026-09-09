ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

UPDATE public.providers SET plan = 'premium' WHERE featured = true AND plan = 'free';

CREATE OR REPLACE FUNCTION public.sync_provider_featured()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.featured := (NEW.plan = 'premium' AND (NEW.plan_expires_at IS NULL OR NEW.plan_expires_at > now()));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS providers_sync_featured ON public.providers;
CREATE TRIGGER providers_sync_featured
BEFORE INSERT OR UPDATE OF plan, plan_expires_at, featured ON public.providers
FOR EACH ROW EXECUTE FUNCTION public.sync_provider_featured();