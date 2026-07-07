
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
  id uuid PRIMARY KEY,
  visitor_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  entry_path text,
  referrer text,
  user_agent text,
  is_mobile boolean NOT NULL DEFAULT false,
  entry_method text NOT NULL DEFAULT 'direct',
  city_slug text
);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_visitor ON public.analytics_sessions (visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started ON public.analytics_sessions (started_at DESC);
GRANT SELECT ON public.analytics_sessions TO authenticated;
GRANT ALL ON public.analytics_sessions TO service_role;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read sessions" ON public.analytics_sessions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id bigserial PRIMARY KEY,
  session_id uuid NOT NULL,
  visitor_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('page_view','search','impression','listing_click','lead_action')),
  lead_type text CHECK (lead_type IN ('phone','website','directions')),
  provider_place_id text,
  city_slug text,
  query text,
  path text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ae_created ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_type_created ON public.analytics_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_provider ON public.analytics_events (provider_place_id, event_type);
CREATE INDEX IF NOT EXISTS idx_ae_city ON public.analytics_events (city_slug, event_type);
CREATE INDEX IF NOT EXISTS idx_ae_session ON public.analytics_events (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ae_visitor ON public.analytics_events (visitor_id, created_at);
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_events_id_seq TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read events" ON public.analytics_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
