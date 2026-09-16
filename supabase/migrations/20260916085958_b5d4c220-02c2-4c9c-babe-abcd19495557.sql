CREATE POLICY "Submitters can view own submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (submitted_by = auth.uid());