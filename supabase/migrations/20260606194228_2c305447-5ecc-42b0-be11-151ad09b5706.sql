
-- Public read for provider-photos (private bucket, so we use a policy)
CREATE POLICY "Public read provider photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'provider-photos');

-- Owners can write to {placeId}/* if they own that listing
CREATE POLICY "Owner uploads provider photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'provider-photos'
    AND EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.place_id = (storage.foldername(name))[1]
        AND p.claimed_by = auth.uid()
    )
  );

CREATE POLICY "Owner deletes provider photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'provider-photos'
    AND EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.place_id = (storage.foldername(name))[1]
        AND p.claimed_by = auth.uid()
    )
  );

CREATE POLICY "Admins manage provider photos"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'provider-photos' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'provider-photos' AND public.has_role(auth.uid(), 'admin'));
