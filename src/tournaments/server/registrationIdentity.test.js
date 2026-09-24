import assert from "node:assert/strict"
import test from "node:test"
import {
  getCanonicalRegistrationAction,
  getRegistrationIdentityKey,
} from "./registrationIdentity.js"

test("uses a US Chess ID to identify the same player in one tournament", () => {
  const first = getRegistrationIdentityKey({
    tournament: { id: "Fall-Open" },
    player: { email: "first@example.com", name: "First Name", uscfId: "12345678" },
  })
  const retry = getRegistrationIdentityKey({
    tournament: { id: "fall-open" },
    player: { email: "new@example.com", name: "Changed Name", uscfId: "12345678" },
  })

  assert.equal(first, retry)
})

test("allows one email to register different players", () => {
  const first = getRegistrationIdentityKey({
    tournament: { id: "fall-open" },
    player: { email: "parent@example.com", name: "First Child" },
  })
  const second = getRegistrationIdentityKey({
    tournament: { id: "fall-open" },
    player: { email: "parent@example.com", name: "Second Child" },
  })

  assert.notEqual(first, second)
})

test("allows the same player to enter different tournaments", () => {
  const player = { email: "player@example.com", name: "Player Name", uscfId: "12345678" }

  assert.notEqual(
    getRegistrationIdentityKey({ tournament: { id: "spring-open" }, player }),
    getRegistrationIdentityKey({ tournament: { id: "fall-open" }, player }),
  )
})

test("normalizes case and surrounding whitespace for unrated players", () => {
  assert.equal(
    getRegistrationIdentityKey({
      tournament_id: "fall-open",
      email: "parent@example.com",
      player_name: "player name",
    }),
    getRegistrationIdentityKey({
      tournament: { id: " FALL-OPEN " },
      player: { email: " Parent@Example.com ", name: " Player Name " },
    }),
  )
})

test("only paid registrations block a duplicate submission", () => {
  assert.equal(
    getCanonicalRegistrationAction({ payment_status: "paid" }, "new-request"),
    "block-paid",
  )
  assert.equal(
    getCanonicalRegistrationAction({
      payment_status: "checkout_expired",
      request_fingerprint: "old-request",
    }, "new-request"),
    "replace-unpaid",
  )
  assert.equal(
    getCanonicalRegistrationAction({
      payment_status: "manual_pending",
      request_fingerprint: "same-request",
    }, "same-request"),
    "reuse-unpaid",
  )
})
