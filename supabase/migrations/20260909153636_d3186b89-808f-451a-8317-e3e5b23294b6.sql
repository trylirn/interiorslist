DROP POLICY IF EXISTS "Public read review responses" ON public.review_responses;

CREATE POLICY "Public read responses of published studios"
ON public.review_responses
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.reviews r
    JOIN public.providers p ON p.place_id = r.provider_place_id
    WHERE r.id = review_responses.review_id
      AND p.published = true
  )
);

CREATE POLICY "Owners read their studio review responses"
ON public.review_responses
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.reviews r
    JOIN public.providers p ON p.place_id = r.provider_place_id
    WHERE r.id = review_responses.review_id
      AND p.claimed_by = auth.uid()
  )
);
