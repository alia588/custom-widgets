-- Migration: public storage bucket for widget images (before/after sliders etc.)
-- Uploads go through the API with the service role key (bypasses storage RLS);
-- the bucket is public so embeds on external sites can load the images.

BEGIN;

INSERT INTO storage.buckets (id, name, public)
VALUES ('widget-images', 'widget-images', true)
ON CONFLICT (id) DO NOTHING;

COMMIT;
