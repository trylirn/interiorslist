CREATE OR REPLACE FUNCTION public.sync_provider_verified()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.is_verified := NEW.claimed_by IS NOT NULL;
  IF NEW.claimed_by IS NOT NULL THEN
    NEW.published := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS providers_sync_verified ON public.providers;
CREATE TRIGGER providers_sync_verified
BEFORE INSERT OR UPDATE ON public.providers
FOR EACH ROW EXECUTE FUNCTION public.sync_provider_verified();

UPDATE public.providers
SET is_verified = (claimed_by IS NOT NULL),
    published = CASE WHEN claimed_by IS NOT NULL THEN true ELSE published END
WHERE is_verified IS DISTINCT FROM (claimed_by IS NOT NULL)
   OR (claimed_by IS NOT NULL AND published = false);