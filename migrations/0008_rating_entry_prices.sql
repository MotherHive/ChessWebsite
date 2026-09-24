-- Players can self-select a configured under-rating entry price. Store the
-- selected threshold so tournament staff can verify eligibility if needed.
ALTER TABLE tournament_registrations
  ADD COLUMN rating_price_under INTEGER
  CHECK (rating_price_under IS NULL OR rating_price_under BETWEEN 1 AND 9999);
