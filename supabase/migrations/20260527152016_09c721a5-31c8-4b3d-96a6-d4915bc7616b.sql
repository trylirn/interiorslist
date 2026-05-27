
-- Clear existing data sourced from Google
TRUNCATE TABLE public.reviews;
TRUNCATE TABLE public.favorites;
TRUNCATE TABLE public.claims;
DELETE FROM public.providers;

-- Brands (parent companies for multi-branch franchises)
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  hero_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.brands TO anon;
GRANT SELECT ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands public read"
  ON public.brands FOR SELECT
  USING (true);

CREATE POLICY "Admins manage brands"
  ON public.brands FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Extend providers
ALTER TABLE public.providers
  ADD COLUMN email TEXT,
  ADD COLUMN specialists TEXT,
  ADD COLUMN notes TEXT,
  ADD COLUMN brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN branch_label TEXT,
  ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN badges TEXT[] NOT NULL DEFAULT ARRAY[]::text[];

CREATE INDEX idx_providers_brand_id ON public.providers(brand_id);
CREATE INDEX idx_providers_city_slug ON public.providers(city_slug);
