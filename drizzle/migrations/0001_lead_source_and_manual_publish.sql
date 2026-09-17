ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS source text;

CREATE OR REPLACE FUNCTION public.sync_provider_verified()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.is_verified := NEW.claimed_by IS NOT NULL;
  -- Publish automatically only when ownership is first granted; after that an
  -- admin may unpublish/disable a studio manually and it must stay that way.
  IF NEW.claimed_by IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.claimed_by IS DISTINCT FROM NEW.claimed_by) THEN
    NEW.published := true;
  END IF;
  RETURN NEW;
END;
$function$;