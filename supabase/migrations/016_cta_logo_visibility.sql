-- Toggle visibility of the Google logo in the badge CTA
BEGIN;

ALTER TABLE widgets
  ADD COLUMN IF NOT EXISTS cta_show_google_logo BOOLEAN NOT NULL DEFAULT true;

COMMIT;
