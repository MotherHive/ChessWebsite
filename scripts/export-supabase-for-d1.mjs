import fs from "node:fs/promises"

const envPath = process.argv[2] || ".env.local"
const outputPath = process.argv[3] || "/tmp/chess-website-supabase-import.sql"

const parseEnv = (source) => Object.fromEntries(
  source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=")
      const key = line.slice(0, separator).trim()
      let value = line.slice(separator + 1).trim()

      if ((value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      return [key, value]
    }),
)

const env = parseEnv(await fs.readFile(envPath, "utf8"))
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("The Supabase URL and service-role key are required.")
}

const loadTable = async (table) => {
  const rows = []
  const pageSize = 1000

  for (let offset = 0; ; offset += pageSize) {
    const url = new URL(`/rest/v1/${table}`, supabaseUrl)
    url.searchParams.set("select", "*")
    url.searchParams.set("offset", String(offset))
    url.searchParams.set("limit", String(pageSize))
    const response = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const code = data?.code
      const message = data?.message || `HTTP ${response.status}`

      if (table === "club_signups" && ["42P01", "42501"].includes(code)) {
        console.warn(`Skipping ${table}: ${message}`)
        return []
      }

      throw new Error(`Could not export ${table}: ${message}`)
    }

    rows.push(...(Array.isArray(data) ? data : []))

    if (!Array.isArray(data) || data.length < pageSize) {
      return rows
    }
  }
}

const allowedColumns = {
  tournaments: ["id", "created_at", "updated_at", "status", "data"],
  tournament_registrations: [
    "id", "created_at", "updated_at", "paid_at", "tournament_id", "tournament_title",
    "tournament_type", "tournament_rating", "tournament_date_range", "tournament_location",
    "tournament_address", "section", "possible_byes", "player_name", "email", "phone",
    "address", "birth_date", "uscf_id", "active_membership_status", "needs_membership",
    "is_expired_member", "entered_with_team", "school", "membership_tier_label", "byes",
    "line_items", "entry_amount_cents", "bye_amount_cents", "membership_amount_cents",
    "total_amount_cents", "currency", "payment_method", "payment_status",
    "registration_status", "stripe_checkout_session_id", "stripe_checkout_url",
    "stripe_payment_intent_id", "stripe_customer_id", "stripe_payment_status",
    "stripe_event_id", "idempotency_key", "request_fingerprint",
  ],
  stripe_webhook_events: ["id", "event_type", "processed_at"],
  club_signups: ["id", "created_at", "first_name", "last_name", "email", "source"],
}

const sqlValue = (value) => {
  if (value === null || value === undefined) {
    return "NULL"
  }

  if (typeof value === "boolean") {
    return value ? "1" : "0"
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL"
  }

  const text = typeof value === "object" ? JSON.stringify(value) : String(value)
  return `'${text.replaceAll("'", "''")}'`
}

const tableNames = Object.keys(allowedColumns)
const exportedTables = Object.fromEntries(
  await Promise.all(tableNames.map(async (table) => [table, await loadTable(table)])),
)
const statements = []

for (const table of tableNames) {
  const columns = allowedColumns[table]

  for (const exportedRow of exportedTables[table]) {
    const row = { ...exportedRow }

    if (table === "tournaments" && row.data && typeof row.data === "object") {
      row.data = { ...row.data }
      delete row.data.earlyEntryDeadlineLabel
    }

    const presentColumns = columns.filter((column) => row[column] !== undefined)
    const values = presentColumns.map((column) => sqlValue(row[column]))
    statements.push(
      `INSERT OR REPLACE INTO ${table} (${presentColumns.join(", ")}) VALUES (${values.join(", ")});`,
    )
  }
}

statements.push("")
await fs.writeFile(outputPath, statements.join("\n"), { mode: 0o600 })

for (const table of tableNames) {
  console.log(`${table}: ${exportedTables[table].length} row(s)`)
}

console.log(`D1 import written to ${outputPath}`)
