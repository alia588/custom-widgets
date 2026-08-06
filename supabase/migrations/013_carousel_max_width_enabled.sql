-- Opt-in max-width for carousel widgets. Off by default so embeds fill the parent.
ALTER TABLE widgets
  ADD COLUMN IF NOT EXISTS carousel_max_width_enabled BOOLEAN NOT NULL DEFAULT false;
