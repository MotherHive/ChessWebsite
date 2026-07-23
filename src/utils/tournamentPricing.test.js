import assert from "node:assert/strict"
import test from "node:test"
import { formatCountdown } from "./tournamentPricing.js"

test("does not format a countdown without a valid deadline", () => {
  assert.equal(formatCountdown("", Date.now()), "")
  assert.equal(formatCountdown("not-a-date", Date.now()), "")
})

test("formats active and expired countdowns", () => {
  const now = new Date("2026-08-01T12:00:00Z").getTime()

  assert.equal(formatCountdown("2026-08-01T13:02:03Z", now), "1h 02m 03s")
  assert.equal(formatCountdown("2026-08-01T11:59:59Z", now), "Expired")
})
