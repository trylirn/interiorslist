CREATE TABLE IF NOT EXISTS public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'admin',
  invited_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, role)
);

GRANT SELECT ON public.admin_invites TO authenticated;
GRANT ALL ON public.admin_invites TO service_role;

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view invites" ON public.admin_invites;
CREATE POLICY "Admins can view invites" ON public.admin_invites
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP TRIGGER IF EXISTS update_admin_invites_updated_at ON public.admin_invites;
CREATE TRIGGER update_admin_invites_updated_at BEFORE UPDATE ON public.admin_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the site owner as super admin (and admin) if the account already exists
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, r.role
FROM auth.users u
CROSS JOIN (VALUES ('admin'::public.app_role), ('super_admin'::public.app_role)) AS r(role)
WHERE lower(u.email) = 'nokunato@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;

  IF lower(NEW.email) = 'nokunato@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin') ON CONFLICT DO NOTHING;
  END IF;

  -- Apply any pending admin invites for this email
  INSERT INTO public.user_roles (user_id, role)
  SELECT NEW.id, i.role FROM public.admin_invites i
  WHERE lower(i.email) = lower(NEW.email)
  ON CONFLICT DO NOTHING;

  UPDATE public.admin_invites SET accepted_at = now()
  WHERE lower(email) = lower(NEW.email) AND accepted_at IS NULL;

  RETURN NEW;
END;
$function$;