
DROP POLICY IF EXISTS "Anyone records view" ON public.provider_views;
CREATE POLICY "Anyone records view" ON public.provider_views FOR INSERT
  WITH CHECK (length(provider_place_id) > 0 AND length(provider_place_id) < 200);
