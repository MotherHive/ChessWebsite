import { spawnSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { writeFileSync } from "node:fs"
import { parsePublishedTournamentRow, formatTournamentSchemaError } from "../src/tournaments/schema.js"

// Seeding writes fake people into a database and drives the real registration
// API. Pointing it at production would be unrecoverable, so the host is pinned
// here rather than taken from an argument or an environment variable.
const stagingOrigin = "https://staging.scrantonchess.org"
const stagingDatabase = "chess-website-staging-db"
const stagingConfig = "wrangler.staging.jsonc"
const dummyTurnstileToken = "XXXX.DUMMY.TOKEN.XXXX"
const tournamentId = "staging-seed-open"
const project = new URL("..", import.meta.url)

const entryCount = Number(process.argv.find((arg) => /^--count=\d+$/.test(arg))?.split("=")[1] || 40)
const shouldReset = process.argv.includes("--reset")

if (new URL(stagingOrigin).hostname !== "staging.scrantonchess.org") {
  throw new Error("Refusing to seed: the origin is not the staging host.")
}

const runSql = (sql) => {
  const result = spawnSync(
    "npx",
    ["wrangler", "d1", "execute", stagingDatabase, "--config", stagingConfig, "--remote", "--json", "--command", sql],
    { cwd: project, encoding: "utf8", shell: false },
  )

  if (result.status !== 0) {
    throw new Error(`wrangler d1 execute failed: ${result.stderr || result.stdout}`)
  }

  const payload = result.stdout.slice(result.stdout.indexOf("["))

  return JSON.parse(payload)[0]
}

const sqlText = (value) => `'${String(value).replaceAll("'", "''")}'`

const tournamentData = {
  title: "Staging Seed Open (fake data)",
  type: "Seeded Test Event",
  rating: "USCF",
  startsAt: "2026-11-07T09:00:00-05:00",
  endsAt: "2026-11-08T17:00:00-05:00",
  dateRange: "November 7-8, 2026",
  location: "Staging Hall, Nowhere",
  address: "1 Staging Way, Scranton, PA 18509",
  maxByes: 2,
  discountEndsAt: "2026-10-24T23:59:59-04:00",
  entryFees: [
    { section: "Championship", price: 40, earlyPrice: 30 },
    { section: "Reserve", price: 25, earlyPrice: 18 },
    { section: "Scholastic", price: 15, earlyPrice: 10 },
  ],
  days: [],
  prizes: [],
}

const schemaCheck = parsePublishedTournamentRow({ id: tournamentId, data: tournamentData })

if (!schemaCheck.success) {
  // listPublishedTournaments parses every published row, so an invalid seed
  // would break the public tournaments page, not just this script's own output.
  throw new Error(`Seed tournament is invalid: ${formatTournamentSchemaError(schemaCheck.error)}`)
}

const firstNames = [
  "Ada", "Boris", "Clara", "Dmitri", "Elena", "Farid", "Greta", "Hikaru", "Irina", "Jonas",
  "Kira", "Lev", "Magnus", "Nina", "Otto", "Petra", "Quinn", "Rosa", "Sven", "Tania",
]
const lastNames = [
  "Alvarez", "Bell", "Chen", "Doyle", "Egan", "Fischer", "Gomez", "Hall", "Ibarra", "Jensen",
  "Kaur", "Lopez", "Moss", "Nowak", "Ortiz", "Park", "Quiroga", "Reed", "Silva", "Tran",
]
const schools = ["Marywood Prep", "Scranton High", "Abington Heights", "Valley View"]
const rounds = ["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"]

const pick = (list, index) => list[index % list.length]

const buildEntry = (index) => {
  const first = pick(firstNames, index)
  const last = pick(lastNames, Math.floor(index / 3) + index)
  const section = pick(tournamentData.entryFees, index).section
  // Every third entry needs a membership, which forces the address, phone, and
  // birth date branch in buildRegistration to actually run.
  const needsMembership = index % 3 === 0
  const byeCount = index % 4 === 0 ? 1 : 0

  return {
    name: `${first} ${last}`,
    email: `seed-${index}-${first.toLowerCase()}@example.com`,
    section,
    paymentMethod: index % 5 === 0 ? "stripe_checkout" : "pay_at_event",
    activeMembershipStatus: needsMembership ? "no" : "yes",
    uscfId: needsMembership ? "" : String(12000000 + index * 137),
    isExpiredMember: needsMembership && index % 6 === 0,
    enteredWithTeam: section === "Scholastic" && index % 2 === 0,
    school: section === "Scholastic" ? pick(schools, index) : "",
    phone: needsMembership ? `570-555-${String(1000 + index).slice(-4)}` : "",
    address: needsMembership ? `${100 + index} Test Street, Scranton, PA 18509` : "",
    birthDate: needsMembership ? pick(["2010-04-12", "1988-09-30", "1954-01-05"], index) : "",
    byes: Array.from({ length: byeCount }, (_, byeIndex) => ({ round: rounds[byeIndex] })),
  }
}

const post = async (path, body) => {
  const response = await fetch(`${stagingOrigin}${path}`, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  })

  return { body: await response.json().catch(() => ({})), status: response.status }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

if (shouldReset) {
  runSql(`DELETE FROM tournament_registrations WHERE tournament_id = ${sqlText(tournamentId)}`)
  runSql(`DELETE FROM tournaments WHERE id = ${sqlText(tournamentId)}`)
  runSql("DELETE FROM club_signups WHERE email LIKE 'seed-%@example.com'")
  console.log("reset: removed previous seed rows")
}

const now = new Date().toISOString()

runSql(`
  INSERT INTO tournaments (id, created_at, updated_at, status, data)
  VALUES (${sqlText(tournamentId)}, ${sqlText(now)}, ${sqlText(now)}, 'published', ${sqlText(JSON.stringify(tournamentData))})
  ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, status = 'published'
`)
console.log(`tournament ready: ${tournamentId}`)

const results = { created: 0, failed: [], stripe: 0 }

for (let index = 0; index < entryCount; index += 1) {
  const form = buildEntry(index)
  const { body, status } = await post("/api/tournament-registration", {
    form,
    idempotencyKey: `seed-${tournamentId}-${index}-${randomUUID().replaceAll("-", "")}`.slice(0, 128),
    tournamentId,
    turnstileToken: dummyTurnstileToken,
  })

  if (status >= 400) {
    results.failed.push({ email: form.email, error: body.error, status })
  } else {
    results.created += 1

    if (form.paymentMethod === "stripe_checkout") {
      results.stripe += 1
    }
  }

  // The staging rate limiter allows 20 requests per 10 seconds per form.
  await sleep(700)
}

// A realistic list needs settled money in it, and paying dozens of sandbox
// checkouts by hand is not practical. Marking pay-at-event entries paid mirrors
// what the admin "mark paid in person" action does.
const paidUpdate = runSql(`
  UPDATE tournament_registrations
  SET payment_status = 'paid',
      registration_status = 'confirmed',
      paid_at = ${sqlText(new Date().toISOString())},
      updated_at = ${sqlText(new Date().toISOString())}
  WHERE tournament_id = ${sqlText(tournamentId)}
    AND payment_method = 'pay_at_event'
    AND rowid % 2 = 0
`)

const summary = runSql(`
  SELECT payment_method, payment_status, registration_status, COUNT(*) AS n, SUM(total_amount_cents) AS cents
  FROM tournament_registrations
  WHERE tournament_id = ${sqlText(tournamentId)}
  GROUP BY payment_method, payment_status, registration_status
`)

writeFileSync(new URL("../.seed-staging-report.json", import.meta.url), JSON.stringify({
  created: results.created,
  failed: results.failed,
  summary: summary.results,
}, null, 2))

console.log(JSON.stringify({
  created: results.created,
  failed: results.failed.length,
  markedPaid: paidUpdate.meta?.changes ?? 0,
  stripeCheckouts: results.stripe,
  summary: summary.results,
}, null, 2))

if (results.failed.length) {
  console.log("first failures:", JSON.stringify(results.failed.slice(0, 3), null, 2))
}
