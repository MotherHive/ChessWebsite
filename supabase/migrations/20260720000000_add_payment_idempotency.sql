alter table public.tournament_registrations
  add column if not exists idempotency_key text,
  add column if not exists request_fingerprint text;

alter table public.tournament_registrations
  add constraint tournament_registrations_idempotency_key_format_check
    check (
      idempotency_key is null
      or (
        char_length(idempotency_key) between 16 and 128
        and idempotency_key ~ '^[A-Za-z0-9_-]+$'
      )
    ),
  add constraint tournament_registrations_request_fingerprint_format_check
    check (request_fingerprint is null or request_fingerprint ~ '^[a-f0-9]{64}$');

create unique index if not exists tournament_registrations_idempotency_key_idx
  on public.tournament_registrations (idempotency_key)
  where idempotency_key is not null;

create table if not exists public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;

grant all on public.stripe_webhook_events to service_role;
