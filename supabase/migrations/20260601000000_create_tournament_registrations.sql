create table if not exists public.tournament_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,

  tournament_id text not null,
  tournament_title text not null,
  tournament_type text,
  tournament_rating text,
  tournament_date_range text,
  tournament_location text,
  tournament_address text,
  section text not null,
  possible_byes integer not null default 0,

  player_name text not null,
  email text not null,
  phone text,
  address text,
  birth_date date,
  uscf_id text,
  active_membership_status text not null check (active_membership_status in ('yes', 'no')),
  needs_membership boolean not null default false,
  is_expired_member boolean not null default false,
  entered_with_team boolean not null default false,
  school text,
  membership_tier_label text,

  byes jsonb not null default '[]'::jsonb,
  line_items jsonb not null default '[]'::jsonb,
  entry_amount_cents integer not null default 0,
  bye_amount_cents integer not null default 0,
  membership_amount_cents integer not null default 0,
  total_amount_cents integer not null default 0,
  currency text not null default 'usd',
  payment_method text not null check (payment_method in ('stripe_checkout', 'pay_at_event')),
  payment_status text not null,
  registration_status text not null,

  stripe_checkout_session_id text unique,
  stripe_checkout_url text,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  stripe_payment_status text,
  stripe_event_id text
);

create index if not exists tournament_registrations_email_idx
  on public.tournament_registrations (email);

create index if not exists tournament_registrations_tournament_id_idx
  on public.tournament_registrations (tournament_id);

create index if not exists tournament_registrations_payment_status_idx
  on public.tournament_registrations (payment_status);

create or replace function public.set_tournament_registrations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tournament_registrations_updated_at on public.tournament_registrations;

create trigger set_tournament_registrations_updated_at
before update on public.tournament_registrations
for each row
execute function public.set_tournament_registrations_updated_at();

alter table public.tournament_registrations enable row level security;
