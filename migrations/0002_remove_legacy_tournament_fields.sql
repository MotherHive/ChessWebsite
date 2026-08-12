UPDATE tournaments
SET
  data = json_remove(data, '$.earlyEntryDeadlineLabel'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE json_type(data, '$.earlyEntryDeadlineLabel') IS NOT NULL;
