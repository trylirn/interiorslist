DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for accounts created while the trigger was missing
INSERT INTO public.profiles (id, email, display_name)
SELECT u.id, u.email,
       COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL AND u.email IS NOT NULL;

-- Base role for every account
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role FROM auth.users u
ON CONFLICT DO NOTHING;

-- Record the invite for isaac@intearior.com so it shows in the admin team list
INSERT INTO public.admin_invites (email, role)
SELECT 'isaac@intearior.com', r::app_role
FROM unnest(ARRAY['admin','super_admin']) AS r
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_invites i
  WHERE lower(i.email) = 'isaac@intearior.com' AND i.role = r::app_role
);

-- Apply pending invites to accounts that already exist
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, i.role
FROM public.admin_invites i
JOIN auth.users u ON lower(u.email) = lower(i.email)
WHERE i.accepted_at IS NULL
ON CONFLICT DO NOTHING;

-- Hardcoded super admins
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, r::app_role
FROM auth.users u, unnest(ARRAY['admin','super_admin']) AS r
WHERE lower(u.email) IN ('nokunato@gmail.com','isaac@intearior.com')
ON CONFLICT DO NOTHING;

UPDATE public.admin_invites i
SET accepted_at = now()
WHERE i.accepted_at IS NULL
  AND EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(i.email));
