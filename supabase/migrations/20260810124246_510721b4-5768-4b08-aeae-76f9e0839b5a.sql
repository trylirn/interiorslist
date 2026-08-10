CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.account_type IS DISTINCT FROM OLD.account_type THEN
    IF auth.uid() IS NOT NULL
       AND NOT public.has_role(auth.uid(), 'admin')
       AND NOT public.has_role(auth.uid(), 'super_admin') THEN
      -- non-admins may only choose between the two non-privileged self-service values
      IF NEW.account_type NOT IN ('consumer', 'personal') THEN
        RAISE EXCEPTION 'account_type cannot be changed by the account owner';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();