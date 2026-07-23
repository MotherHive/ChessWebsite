import assert from "node:assert/strict"
import test from "node:test"
import { fingerprintPayload, isValidIdempotencyKey } from "./idempotency.js"

test("accepts browser-generated UUID idempotency keys", () => {
  assert.equal(isValidIdempotencyKey("70c1d443-8f53-47ac-8190-b1dc2584d810"), true)
})

test("rejects missing, short, or unsafe idempotency keys", () => {
  assert.equal(isValidIdempotencyKey(undefined), false)
  assert.equal(isValidIdempotencyKey("too-short"), false)
  assert.equal(isValidIdempotencyKey("valid-length has-spaces"), false)
})

test("fingerprints equivalent objects consistently", () => {
  const first = { tournamentId: "open", form: { email: "player@example.com", byes: [1, 2] } }
  const second = { form: { byes: [1, 2], email: "player@example.com" }, tournamentId: "open" }

  assert.equal(fingerprintPayload(first), fingerprintPayload(second))
  assert.notEqual(
    fingerprintPayload(first),
    fingerprintPayload({ ...second, tournamentId: "championship" }),
  )
})
