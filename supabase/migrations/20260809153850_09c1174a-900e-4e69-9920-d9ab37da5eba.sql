-- Backfill profiles for any auth account missing one
INSERT INTO public.profiles (id, email, display_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL AND u.email IS NOT NULL;

-- Give every account at least the base user role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role FROM auth.users u
ON CONFLICT DO NOTHING;

-- Apply any pending admin invites to accounts that already exist
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, i.role
FROM public.admin_invites i
JOIN auth.users u ON lower(u.email) = lower(i.email)
WHERE i.accepted_at IS NULL
ON CONFLICT DO NOTHING;

-- Super admins also carry the everyday admin role
INSERT INTO public.user_roles (user_id, role)
SELECT r.user_id, 'admin'::app_role
FROM public.user_roles r
WHERE r.role = 'super_admin'
ON CONFLICT DO NOTHING;

UPDATE public.admin_invites i
SET accepted_at = now()
WHERE i.accepted_at IS NULL
  AND EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(i.email));