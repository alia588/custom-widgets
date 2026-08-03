-- Migration: Google Reviews widget schema
-- Covers managed businesses, per-client widget configs (content/style/layout/settings), and reviews.

BEGIN;

-- ---------------------------------------------------------------------------
-- Managed businesses (one per Google Business Profile we manage)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  place_id TEXT UNIQUE NOT NULL,
  address TEXT,
  total_reviews INT DEFAULT 0,
  average_rating NUMERIC(2,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Widgets — one row per client widget, with full content/style/layout/settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Google Reviews Badge',

  -- Content / filtering
  sort_by TEXT NOT NULL DEFAULT 'highest_rating',          -- highest_rating | lowest_rating | newest | oldest | most_relevant
  min_rating INT NOT NULL DEFAULT 5,                       -- 1..5
  image_filtering TEXT NOT NULL DEFAULT 'images_first',    -- images_first | images_only | no_images | off
  max_reviews INT NOT NULL DEFAULT 40,
  excluded_review_ids TEXT[] NOT NULL DEFAULT '{}',
  custom_business_name_enabled BOOLEAN NOT NULL DEFAULT false,
  custom_business_name TEXT,

  -- Style — badge
  use_site_theme BOOLEAN NOT NULL DEFAULT false,
  badge_background_type TEXT NOT NULL DEFAULT 'transparent', -- transparent | solid
  badge_background_color TEXT NOT NULL DEFAULT '#FFFFFF',
  badge_border_color TEXT NOT NULL DEFAULT '#E5E7EB',
  star_color TEXT NOT NULL DEFAULT '#DC2626',
  text_color TEXT NOT NULL DEFAULT '#1F2937',
  font_family TEXT NOT NULL DEFAULT 'Poppins',
  border_radius INT NOT NULL DEFAULT 15,
  padding INT NOT NULL DEFAULT 12,
  star_size INT NOT NULL DEFAULT 24,
  google_icon_size INT NOT NULL DEFAULT 24,

  -- Style — call to action
  cta_background_color TEXT NOT NULL DEFAULT '#FFFFFF',
  cta_text_color TEXT NOT NULL DEFAULT '#1F2937',

  -- Style — drawer
  drawer_background_color TEXT NOT NULL DEFAULT '#FFFFFF',
  drawer_text_color TEXT NOT NULL DEFAULT '#1F2937',
  drawer_card_background_color TEXT NOT NULL DEFAULT '#FFFFFF',
  drawer_card_border_color TEXT NOT NULL DEFAULT '#E5E7EB',
  drawer_card_radius INT NOT NULL DEFAULT 8,

  -- Layout
  layout TEXT NOT NULL DEFAULT 'centered',   -- centered | horizontal
  position TEXT NOT NULL DEFAULT 'inline',   -- inline | fixed | absolute
  alignment TEXT NOT NULL DEFAULT 'center',  -- center | left | right
  full_width BOOLEAN NOT NULL DEFAULT false,
  cta_enabled BOOLEAN NOT NULL DEFAULT true,
  cta_text TEXT NOT NULL DEFAULT 'Click to read our reviews!',

  -- Settings — badge display
  badge_show_business_name BOOLEAN NOT NULL DEFAULT true,
  badge_show_review_count BOOLEAN NOT NULL DEFAULT true,
  badge_compact_mode BOOLEAN NOT NULL DEFAULT false,

  -- Settings — drawer display
  drawer_show_business_info BOOLEAN NOT NULL DEFAULT true,
  drawer_show_star_ratings BOOLEAN NOT NULL DEFAULT true,
  drawer_show_dates BOOLEAN NOT NULL DEFAULT true,
  drawer_show_author_photos BOOLEAN NOT NULL DEFAULT true,
  drawer_show_review_images BOOLEAN NOT NULL DEFAULT true,
  thumbnail_size TEXT NOT NULL DEFAULT 'medium',  -- small (40x40) | medium (60x60) | large (80x80)

  -- Settings — drawer behavior
  drawer_reviews_per_page INT NOT NULL DEFAULT 10,
  drawer_width INT NOT NULL DEFAULT 400,
  drawer_mobile_mode TEXT NOT NULL DEFAULT 'peek', -- peek | fullscreen

  -- Cached review payload for embed rendering
  cached_reviews JSONB NOT NULL DEFAULT '[]',
  last_synced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Reviews — normalized storage per business
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  google_review_id TEXT UNIQUE,
  author_name TEXT,
  author_photo_url TEXT,
  rating INT NOT NULL,
  text TEXT,
  relative_time TEXT,
  images JSONB NOT NULL DEFAULT '[]',
  is_excluded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_widgets_business_id ON widgets(business_id);

-- ---------------------------------------------------------------------------
-- Row level security — public read (embed scripts), service-role write
-- ---------------------------------------------------------------------------
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read businesses" ON businesses;
CREATE POLICY "Public read businesses" ON businesses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read widgets" ON widgets;
CREATE POLICY "Public read widgets" ON widgets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read reviews" ON reviews;
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- Seed: SSR Diesel Repairs + its default widget
-- ---------------------------------------------------------------------------
INSERT INTO businesses (name, place_id, address, total_reviews, average_rating)
VALUES ('SSR Diesel Repairs', 'ChIJyYrhJFa62YgReXR5oFJzTq8', '1553 W 40th St, Hialeah, FL 33012, USA', 126, 4.0)
ON CONFLICT (place_id) DO NOTHING;

INSERT INTO widgets (business_id, name, star_color, min_rating)
SELECT id, 'SSR Diesel Repairs — Google Reviews Badge', '#DC2626', 5
FROM businesses WHERE place_id = 'ChIJyYrhJFa62YgReXR5oFJzTq8'
ON CONFLICT DO NOTHING;

COMMIT;
