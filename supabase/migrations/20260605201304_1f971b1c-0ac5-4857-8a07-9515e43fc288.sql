
CREATE POLICY "Business uploads own license" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Business reads own license" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'business-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins read all licenses" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'business-docs' AND public.has_role(auth.uid(),'admin'));
