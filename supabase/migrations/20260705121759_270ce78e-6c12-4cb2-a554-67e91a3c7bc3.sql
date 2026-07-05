
REVOKE SELECT (email_forward_to, email, document_urls) ON public.providers FROM anon;
REVOKE SELECT (email_forward_to, email, document_urls) ON public.providers FROM authenticated;

DROP POLICY IF EXISTS "Owner uploads provider photos" ON storage.objects;
CREATE POLICY "Owner uploads provider photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'provider-photos'
  AND EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.place_id = (storage.foldername(storage.objects.name))[1]
      AND p.claimed_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owner deletes provider photos" ON storage.objects;
CREATE POLICY "Owner deletes provider photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'provider-photos'
  AND EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.place_id = (storage.foldername(storage.objects.name))[1]
      AND p.claimed_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners read provider-files" ON storage.objects;
CREATE POLICY "Owners read provider-files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'provider-files'
  AND (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.place_id = split_part(storage.objects.name, '/', 1)
        AND p.claimed_by = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

DROP POLICY IF EXISTS "Owners upload provider-files" ON storage.objects;
CREATE POLICY "Owners upload provider-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'provider-files'
  AND (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.place_id = split_part(storage.objects.name, '/', 1)
        AND p.claimed_by = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

DROP POLICY IF EXISTS "Owners update provider-files" ON storage.objects;
CREATE POLICY "Owners update provider-files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'provider-files'
  AND (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.place_id = split_part(storage.objects.name, '/', 1)
        AND p.claimed_by = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

DROP POLICY IF EXISTS "Owners delete provider-files" ON storage.objects;
CREATE POLICY "Owners delete provider-files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'provider-files'
  AND (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.place_id = split_part(storage.objects.name, '/', 1)
        AND p.claimed_by = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);
