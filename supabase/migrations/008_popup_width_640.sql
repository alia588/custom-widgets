-- Migration: set Google Reviews Badge popup width to 640px
-- Corrects the previous 900px width (007) to match the desired UI (~640px).

BEGIN;

ALTER TABLE widgets
  ALTER COLUMN drawer_width SET DEFAULT 640;

UPDATE widgets
SET drawer_width = 640
WHERE widget_type = 'google_reviews';

COMMIT;
