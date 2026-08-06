-- 1. Hide reviewer email from public/authenticated Data API reads
REVOKE SELECT ON public.reviews FROM anon, authenticated;

GRANT SELECT (
  id, provider_place_id, author_name, author_photo, rating, text, relative_time,
  published_at, created_at, client_type, is_current_client, start_year, end_year,
  decision_factors, rating_communication, rating_results, rating_cleanliness,
  rating_value, relationship_disclosure, benefit_disclosure
) ON public.reviews TO anon, authenticated;

GRANT INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

-- 2. Restrict the SECURITY DEFINER role check so signed-in users can only
--    ask about themselves (RLS policies always pass auth.uid()).
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN current_user IN ('service_role', 'postgres', 'supabase_admin')
      OR _user_id = auth.uid()
    THEN EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
    )
    ELSE false
  END
$function$;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- 3. Trigger-only SECURITY DEFINER functions must not be API-callable
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;