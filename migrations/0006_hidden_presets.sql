-- Venue and director presets are derived from the tournaments already saved, so
-- a preset is retired by recording it here instead of by editing past events.
-- Saving a tournament that uses the same venue or director clears its row again.
CREATE TABLE IF NOT EXISTS hidden_presets (
  preset_type TEXT NOT NULL CHECK (preset_type IN ('location', 'director')),
  preset_key TEXT NOT NULL,
  hidden_at TEXT NOT NULL,
  PRIMARY KEY (preset_type, preset_key)
);
