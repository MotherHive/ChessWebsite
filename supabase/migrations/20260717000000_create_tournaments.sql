create table if not exists public.tournaments (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  data jsonb not null default '{}'::jsonb
);

create index if not exists tournaments_status_idx
  on public.tournaments (status);

create or replace function public.set_tournaments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tournaments_updated_at on public.tournaments;

create trigger set_tournaments_updated_at
before update on public.tournaments
for each row
execute function public.set_tournaments_updated_at();

alter table public.tournaments enable row level security;

grant select on public.tournaments to anon, authenticated;
grant all on public.tournaments to service_role;

drop policy if exists "Public can read published tournaments" on public.tournaments;

create policy "Public can read published tournaments"
  on public.tournaments
  for select
  to anon, authenticated
  using (status = 'published');

insert into public.tournaments (id, status, data)
values (
  'pa-amateur-championship',
  'published',
  '{
    "id": "pa-amateur-championship",
    "title": "2026 Pennsylvania State Amateur Championship",
    "type": "State Championship Event",
    "rating": "USCF",
    "entryFees": [
      { "section": "Championship", "price": 22, "earlyPrice": 17 },
      { "section": "Scholastic", "price": 17, "earlyPrice": 12 }
    ],
    "earlyEntryDeadlineLabel": "May 25",
    "discountEndsAt": "2026-05-25T23:59:59-04:00",
    "startsAt": "2026-05-30T08:30:00-04:00",
    "endsAt": "2026-05-31T17:00:00-04:00",
    "dateRange": "May 30-31, 2026",
    "location": "Latour Room, Nazareth Student Center, Marywood University",
    "address": "1300 University Ave., Scranton, PA 18509",
    "mapUrl": "https://www.google.com/maps/search/?api=1&query=1300%20University%20Ave%2C%20Scranton%2C%20PA%2018509",
    "maxByes": 1,
    "director": {
      "name": "Bernie Sporko",
      "email": "basp0529@gmail.com",
      "phone": "570-604-2461",
      "website": "https://www.pscfchess.org/clearinghouse/"
    },
    "rulesUrl": "https://www.pscfchess.org/clearinghouse/",
    "days": [
      {
        "date": "Sat, May 30",
        "sections": [
          {
            "name": "Championship",
            "control": "G/75 d5",
            "times": [
              { "label": "8:30 AM", "detail": "Registration start" },
              { "label": "9:30 AM", "detail": "Registration end" },
              { "label": "10:00", "detail": "Round 1" },
              { "label": "1:00", "detail": "Round 2" },
              { "label": "3:30", "detail": "Round 3" }
            ]
          },
          {
            "name": "Scholastic",
            "control": "G/40 d5",
            "times": [
              { "label": "8:30 AM", "detail": "Registration start" },
              { "label": "9:30 AM", "detail": "Registration end" },
              { "label": "10:00", "detail": "Round 1" },
              { "label": "11:30", "detail": "Round 2" },
              { "label": "1:00", "detail": "Round 3" },
              { "label": "2:30", "detail": "Round 4" }
            ]
          }
        ]
      },
      {
        "date": "Sun, May 31",
        "sections": [
          {
            "name": "Championship",
            "control": "G/90 d5",
            "times": [
              { "label": "9:30", "detail": "Round 4" },
              { "label": "1:00", "detail": "Round 5" }
            ]
          }
        ]
      }
    ],
    "prizes": [
      {
        "section": "Championship",
        "rows": [
          { "brackets": ["Overall"], "prize": "Trophies", "place": "1st-3rd" },
          { "brackets": ["U1800", "U1600", "U1400", "U1200/Unrated", "School Team"], "prize": "Trophy", "place": "Top" },
          { "brackets": ["Overall"], "prize": "2027 PA entry", "place": "1st & 2nd" },
          { "brackets": ["PA Resident"], "prize": "Title", "place": "Top" }
        ]
      },
      {
        "section": "Scholastic",
        "rows": [
          { "brackets": ["Overall"], "prize": "Trophies", "place": "1st-2nd" },
          { "brackets": ["U1000", "U800/Unrated", "School Team"], "prize": "Trophy", "place": "Top" }
        ]
      }
    ]
  }'::jsonb
)
on conflict (id) do nothing;
