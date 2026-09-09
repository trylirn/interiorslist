CREATE INDEX IF NOT EXISTS providers_published_city_slug_idx ON public.providers (city_slug) WHERE published;
CREATE INDEX IF NOT EXISTS providers_published_state_idx ON public.providers (state) WHERE published;
CREATE INDEX IF NOT EXISTS providers_published_rank_idx ON public.providers (featured DESC, is_verified DESC, rating DESC NULLS LAST, review_count DESC NULLS LAST, name) WHERE published;
CREATE INDEX IF NOT EXISTS providers_services_gin_idx ON public.providers USING GIN (services);
CREATE INDEX IF NOT EXISTS providers_styles_gin_idx ON public.providers USING GIN (styles);