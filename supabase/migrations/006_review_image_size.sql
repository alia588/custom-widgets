-- Migration: customizable review photo size for the Google Reviews Badge popup
-- Adds `review_image_size` so review photos can be sized independently of the
-- author avatar size (`thumbnail_size`).

BEGIN;

ALTER TABLE widgets
  ADD COLUMN IF NOT EXISTS review_image_size TEXT NOT NULL DEFAULT 'medium'; -- small | medium | large

COMMIT;
