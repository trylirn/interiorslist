
CREATE POLICY "Owners read provider-files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'provider-files' AND (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.place_id = split_part(name, '/', 1) AND p.claimed_by = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);
CREATE POLICY "Owners upload provider-files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'provider-files' AND (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.place_id = split_part(name, '/', 1) AND p.claimed_by = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);
CREATE POLICY "Owners update provider-files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'provider-files' AND (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.place_id = split_part(name, '/', 1) AND p.claimed_by = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);
CREATE POLICY "Owners delete provider-files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'provider-files' AND (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.place_id = split_part(name, '/', 1) AND p.claimed_by = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);
