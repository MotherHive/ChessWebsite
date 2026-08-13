-- Stripe deducts its fee before the payout, so the order total is what the
-- player paid, not what the club received. The settled amounts come from the
-- charge's balance transaction and are recorded when the payment confirms.
ALTER TABLE tournament_registrations
  ADD COLUMN stripe_fee_cents INTEGER;

ALTER TABLE tournament_registrations
  ADD COLUMN stripe_net_cents INTEGER;
