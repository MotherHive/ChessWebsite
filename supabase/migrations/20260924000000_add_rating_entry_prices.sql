alter table public.tournament_registrations
  add column if not exists rating_price_under integer
  check (rating_price_under is null or rating_price_under between 1 and 9999);
