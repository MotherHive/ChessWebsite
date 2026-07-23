-- The earlyEntryDeadlineLabel field is unused (discountEndsAt replaced it) and
-- was removed from the tournament schema. Strip it from stored rows so the
-- strict schema keeps accepting them.
update public.tournaments
set data = data - 'earlyEntryDeadlineLabel'
where data ? 'earlyEntryDeadlineLabel';
