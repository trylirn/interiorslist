
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS about_description text,
  ADD COLUMN IF NOT EXISTS video_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certificate_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS document_urls text[] NOT NULL DEFAULT '{}';
