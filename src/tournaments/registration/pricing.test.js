import assert from "node:assert/strict"
import test from "node:test"
import { formatCountdown } from "./pricing.js"

test("does not format a countdown without a valid deadline", () => {
  assert.equal(formatCountdown("", Date.now()), "")
  assert.equal(formatCountdown("not-a-date", Date.now()), "")
})

test("formats active and expired countdowns", () => {
  const now = new Date("2026-08-01T12:00:00Z").getTime()

  assert.equal(formatCountdown("2026-08-01T13:02:03Z", now), "1h 02m 03s")
  assert.equal(formatCountdown("2026-08-01T11:59:59Z", now), "Expired")
})

test("formats countdowns longer than two days as a rounded-up day count", () => {
  const now = new Date("2026-08-01T12:00:00Z").getTime()

  assert.equal(formatCountdown("2026-08-03T12:00:00Z", now), "48h 00m 00s")
  assert.equal(formatCountdown("2026-08-03T12:00:01Z", now), "3 days")
  assert.equal(formatCountdown("2026-08-04T12:00:00Z", now), "3 days")
})
