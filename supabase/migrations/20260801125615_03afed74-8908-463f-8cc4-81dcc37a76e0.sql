ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS founded_year integer,
  ADD COLUMN IF NOT EXISTS years_in_business integer,
  ADD COLUMN IF NOT EXISTS service_area text,
  ADD COLUMN IF NOT EXISTS service_area_note text,
  ADD COLUMN IF NOT EXISTS team_size text,
  ADD COLUMN IF NOT EXISTS client_types text,
  ADD COLUMN IF NOT EXISTS not_a_fit text;

GRANT SELECT (founded_year, years_in_business, service_area, service_area_note, team_size, client_types, not_a_fit) ON public.providers TO anon, authenticated;
GRANT UPDATE (founded_year, years_in_business, service_area, service_area_note, team_size, client_types, not_a_fit) ON public.providers TO authenticated;