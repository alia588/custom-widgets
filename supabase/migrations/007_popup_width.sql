-- Migration: widen Google Reviews Badge popups to match the reference design
-- The popup is now a fixed-height (85vh) centered modal ~900px wide; update
-- existing badge widgets that still have the old 400px drawer width.

BEGIN;

ALTER TABLE widgets
  ALTER COLUMN drawer_width SET DEFAULT 900;

UPDATE widgets
SET drawer_width = 900
WHERE widget_type = 'google_reviews' AND drawer_width = 400;

COMMIT;
