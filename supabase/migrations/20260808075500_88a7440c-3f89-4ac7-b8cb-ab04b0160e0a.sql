-- 1) Remove blanket public read on reviews (exposes author email) and providers (exposes internal notes).
DROP POLICY IF EXISTS "Reviews public read" ON public.reviews;
DROP POLICY IF EXISTS "Providers public read operational" ON public.providers;

-- Owners keep read access to their own claimed listings (needed for UPDATE targeting).
DROP POLICY IF EXISTS "Owners read claimed listings" ON public.providers;
CREATE POLICY "Owners read claimed listings"
ON public.providers FOR SELECT TO authenticated
USING (auth.uid() = claimed_by);

-- 2) Lock down SECURITY DEFINER functions: no execute for anonymous visitors or PUBLIC.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
