-- Student entries (Marywood student or K-12) take a per-tournament amount off
-- the section entry fee. The discount is folded into the entry line item, so
-- these columns record what was granted for later reporting.
ALTER TABLE tournament_registrations
  ADD COLUMN is_student INTEGER NOT NULL DEFAULT 0;

ALTER TABLE tournament_registrations
  ADD COLUMN student_discount_cents INTEGER NOT NULL DEFAULT 0;
