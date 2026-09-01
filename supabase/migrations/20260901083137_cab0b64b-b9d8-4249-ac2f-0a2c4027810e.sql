DROP POLICY IF EXISTS "Owners read provider photos" ON storage.objects;
CREATE POLICY "Owners read provider photos" ON storage.objects FOR SELECT
USING (
  bucket_id = 'provider-photos' AND (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.place_id = (storage.foldername(objects.name))[1]
        AND p.claimed_by = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);