CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  data TEXT NOT NULL DEFAULT '{}'
    CHECK (json_valid(data))
);

CREATE INDEX IF NOT EXISTS tournaments_status_idx
  ON tournaments (status);

CREATE TABLE IF NOT EXISTS tournament_registrations (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  paid_at TEXT,

  tournament_id TEXT NOT NULL,
  tournament_title TEXT NOT NULL,
  tournament_type TEXT,
  tournament_rating TEXT,
  tournament_date_range TEXT,
  tournament_location TEXT,
  tournament_address TEXT,
  section TEXT NOT NULL,
  possible_byes INTEGER NOT NULL DEFAULT 0,

  player_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  birth_date TEXT,
  uscf_id TEXT,
  active_membership_status TEXT NOT NULL
    CHECK (active_membership_status IN ('yes', 'no')),
  needs_membership INTEGER NOT NULL DEFAULT 0
    CHECK (needs_membership IN (0, 1)),
  is_expired_member INTEGER NOT NULL DEFAULT 0
    CHECK (is_expired_member IN (0, 1)),
  entered_with_team INTEGER NOT NULL DEFAULT 0
    CHECK (entered_with_team IN (0, 1)),
  school TEXT,
  membership_tier_label TEXT,

  byes TEXT NOT NULL DEFAULT '[]'
    CHECK (json_valid(byes)),
  line_items TEXT NOT NULL DEFAULT '[]'
    CHECK (json_valid(line_items)),
  entry_amount_cents INTEGER NOT NULL DEFAULT 0,
  bye_amount_cents INTEGER NOT NULL DEFAULT 0,
  membership_amount_cents INTEGER NOT NULL DEFAULT 0,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  payment_method TEXT NOT NULL
    CHECK (payment_method IN ('stripe_checkout', 'pay_at_event')),
  payment_status TEXT NOT NULL,
  registration_status TEXT NOT NULL,

  stripe_checkout_session_id TEXT UNIQUE,
  stripe_checkout_url TEXT,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  stripe_payment_status TEXT,
  stripe_event_id TEXT,
  idempotency_key TEXT,
  request_fingerprint TEXT,

  CHECK (
    idempotency_key IS NULL OR (
      length(idempotency_key) BETWEEN 16 AND 128
      AND idempotency_key NOT GLOB '*[^A-Za-z0-9_-]*'
    )
  ),
  CHECK (
    request_fingerprint IS NULL OR (
      length(request_fingerprint) = 64
      AND request_fingerprint NOT GLOB '*[^a-f0-9]*'
    )
  )
);

CREATE INDEX IF NOT EXISTS tournament_registrations_email_idx
  ON tournament_registrations (email);

CREATE INDEX IF NOT EXISTS tournament_registrations_tournament_id_idx
  ON tournament_registrations (tournament_id);

CREATE INDEX IF NOT EXISTS tournament_registrations_payment_status_idx
  ON tournament_registrations (payment_status);

CREATE UNIQUE INDEX IF NOT EXISTS tournament_registrations_idempotency_key_idx
  ON tournament_registrations (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS club_signups (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  source TEXT NOT NULL DEFAULT 'join_menu'
);

CREATE INDEX IF NOT EXISTS club_signups_created_at_idx
  ON club_signups (created_at DESC);
