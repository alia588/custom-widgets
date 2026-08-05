-- Migration: Google Reviews Carousel widget
-- Carousel widgets live in the existing `widgets` table with
-- widget_type = 'google_reviews_carousel' and reuse the shared content/style
-- columns; this adds only the carousel-specific layout columns and seeds a
-- first carousel widget for GARYS AUTO COLLISION CENTER.

BEGIN;

ALTER TABLE widgets
  ADD COLUMN IF NOT EXISTS carousel_width_type TEXT NOT NULL DEFAULT 'percentage', -- percentage | fixed
  ADD COLUMN IF NOT EXISTS carousel_width_value INT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS carousel_reviews_per_slide INT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS carousel_max_width INT NOT NULL DEFAULT 1200,
  ADD COLUMN IF NOT EXISTS carousel_card_padding INT NOT NULL DEFAULT 16,
  ADD COLUMN IF NOT EXISTS carousel_card_gap INT NOT NULL DEFAULT 16,
  ADD COLUMN IF NOT EXISTS carousel_text_max_height INT NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS carousel_autoplay BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS carousel_show_overall_rating BOOLEAN NOT NULL DEFAULT true;

-- Seed: carousel for Gary's Auto Collision Center
INSERT INTO widgets (id, business_id, widget_type, name, star_color, drawer_card_border_color)
SELECT '7f3a9c2e-4b1d-4e8f-9a6c-2d5e8f1a3b7c', id, 'google_reviews_carousel',
       'GARYS AUTO COLLISION CENTER — Google Reviews Carousel', '#3694FF', '#3694FF'
FROM businesses WHERE place_id = 'ChIJcUMQcWSGwoARvkzrWYmBXB0'
ON CONFLICT (id) DO NOTHING;

COMMIT;
