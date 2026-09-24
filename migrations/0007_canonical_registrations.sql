-- A registration is the player's entry in a tournament, not an individual
-- attempt to reach Stripe. Keep one canonical row for that identity and reuse
-- it for payment retries.
ALTER TABLE tournament_registrations
  ADD COLUMN registration_identity_key TEXT;

ALTER TABLE tournament_registrations
  ADD COLUMN superseded_by_registration_id TEXT;

ALTER TABLE tournament_registrations
  ADD COLUMN checkout_request_key TEXT;

-- Match the server identity rule. US Chess ID is strongest; unrated players
-- use email plus player name so one parent can register multiple children.
UPDATE tournament_registrations
SET registration_identity_key =
  lower(trim(tournament_id)) || char(31) ||
  CASE
    WHEN length(trim(COALESCE(uscf_id, ''))) > 0
      THEN 'uscf:' || lower(trim(uscf_id))
    ELSE
      'email-name:' || lower(trim(email)) || char(31) || lower(trim(player_name))
  END,
  checkout_request_key = idempotency_key;

-- Prefer an already-paid row as canonical, otherwise the newest attempt. The
-- superseded rows stay temporarily so late Stripe webhooks can still resolve;
-- unpaid ones are omitted from administration, while an actually paid
-- duplicate remains visible for reconciliation.
UPDATE tournament_registrations AS duplicate
SET superseded_by_registration_id = (
  SELECT canonical.id
  FROM tournament_registrations AS canonical
  WHERE canonical.registration_identity_key = duplicate.registration_identity_key
  ORDER BY
    CASE WHEN canonical.payment_status = 'paid' THEN 0 ELSE 1 END,
    canonical.created_at DESC,
    canonical.id DESC
  LIMIT 1
)
WHERE duplicate.id != (
  SELECT canonical.id
  FROM tournament_registrations AS canonical
  WHERE canonical.registration_identity_key = duplicate.registration_identity_key
  ORDER BY
    CASE WHEN canonical.payment_status = 'paid' THEN 0 ELSE 1 END,
    canonical.created_at DESC,
    canonical.id DESC
  LIMIT 1
);

-- Terminal unpaid attempts and duplicate cash reservations have no remaining
-- payment to reconcile. Open/pending Stripe rows stay until their final webhook
-- so a late payment can still be promoted safely.
DELETE FROM tournament_registrations
WHERE superseded_by_registration_id IS NOT NULL
  AND payment_status IN ('checkout_expired', 'checkout_failed', 'manual_pending');

UPDATE tournament_registrations
SET registration_identity_key = NULL
WHERE superseded_by_registration_id IS NOT NULL;

CREATE UNIQUE INDEX tournament_registrations_identity_idx
  ON tournament_registrations (registration_identity_key)
  WHERE registration_identity_key IS NOT NULL;

CREATE INDEX tournament_registrations_superseded_idx
  ON tournament_registrations (superseded_by_registration_id)
  WHERE superseded_by_registration_id IS NOT NULL;
