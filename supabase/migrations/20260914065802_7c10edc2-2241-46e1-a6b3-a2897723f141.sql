DROP POLICY "Authenticated users submit" ON public.submissions;
CREATE POLICY "Authenticated users submit" ON public.submissions
FOR INSERT TO authenticated
WITH CHECK (
  length(business_name) >= 2 AND length(business_name) <= 200
  AND length(city) >= 2 AND length(city) <= 100
  AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND length(contact_email) <= 255
  AND submitted_by = auth.uid()
  AND status = 'pending'
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND resulting_place_id IS NULL
);