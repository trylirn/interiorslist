CREATE OR REPLACE FUNCTION public.prevent_profile_account_type_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_type IS DISTINCT FROM OLD.account_type THEN
    NEW.account_type := OLD.account_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_lock_account_type ON public.profiles;
CREATE TRIGGER profiles_lock_account_type
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_account_type_change();