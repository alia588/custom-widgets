-- Animation duration (in seconds) for the before/after auto-slide cycle.
-- Each leg of the 25% <-> 75% round trip takes this many seconds.
ALTER TABLE before_after_widgets
ADD COLUMN IF NOT EXISTS animation_duration INT NOT NULL DEFAULT 3;
