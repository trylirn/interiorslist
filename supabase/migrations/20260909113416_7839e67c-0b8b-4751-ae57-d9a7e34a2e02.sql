CREATE TABLE public.tool_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool text NOT NULL,
  room_type text,
  scope text,
  state_code text,
  style_slug text,
  budget_band text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tool_usage_tool_created_idx ON public.tool_usage (tool, created_at DESC);
CREATE INDEX tool_usage_combo_idx ON public.tool_usage (state_code, room_type, scope);

GRANT SELECT ON public.tool_usage TO authenticated;
GRANT ALL ON public.tool_usage TO service_role;

ALTER TABLE public.tool_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read tool usage"
ON public.tool_usage FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));