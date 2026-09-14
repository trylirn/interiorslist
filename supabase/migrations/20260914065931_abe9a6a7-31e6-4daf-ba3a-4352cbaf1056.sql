REVOKE SELECT ON public.reviews FROM anon, authenticated;

GRANT SELECT (
  id, provider_place_id, author_name, author_photo, rating, text, relative_time,
  published_at, created_at, client_type, is_current_client, start_year, end_year,
  decision_factors, rating_communication, rating_results, rating_cleanliness,
  rating_value, relationship_disclosure, benefit_disclosure, source, external_id
) ON public.reviews TO anon, authenticated;

GRANT ALL ON public.reviews TO service_role;