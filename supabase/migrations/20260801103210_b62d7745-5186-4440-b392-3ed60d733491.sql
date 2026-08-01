REVOKE SELECT (email) ON public.reviews FROM anon, authenticated;
REVOKE ALL ON public.reviews FROM anon, authenticated;
GRANT SELECT (id, provider_place_id, author_name, author_photo, rating, text, relative_time, published_at, created_at) ON public.reviews TO anon, authenticated;
GRANT INSERT (id, provider_place_id, author_name, author_photo, rating, text, relative_time, published_at, email) ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;