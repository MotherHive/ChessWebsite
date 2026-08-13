import assert from "node:assert/strict"
import test from "node:test"
import {
  createRegistrationAttemptKey,
  readSavedJoinInfo,
  readSavedPurchaseEntry,
  savePurchaseEntry,
  savePurchaseReceipt,
  submitTournamentRegistration,
} from "./client.js"

test("reads saved join contact details without leaking unrelated fields", () => {
  const storage = {
    getItem: () => JSON.stringify({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      notes: "not part of checkout",
    }),
  }

  assert.deepEqual(readSavedJoinInfo(storage), {
    name: "Ada Lovelace",
    email: "ada@example.com",
  })
})

test("treats unavailable or invalid browser storage as empty", () => {
  const unavailableStorage = {
    getItem: () => {
      throw new Error("Storage denied")
    },
  }
  const invalidStorage = { getItem: () => "not-json" }

  assert.deepEqual(readSavedJoinInfo(unavailableStorage), { name: "", email: "" })
  assert.deepEqual(readSavedJoinInfo(invalidStorage), { name: "", email: "" })
})

test("saves and restores first-step entry choices per tournament", () => {
  const values = new Map()
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }

  savePurchaseEntry("summer-open", {
    activeMembershipStatus: "yes",
    section: "Open",
    byes: [{ id: "bye-1", round: "Round 2" }],
    name: "not cached",
    email: "not-cached@example.com",
  }, storage)
  savePurchaseEntry("fall-open", {
    activeMembershipStatus: "no",
    section: "U1600",
    byes: [],
  }, storage)

  assert.deepEqual(readSavedPurchaseEntry("summer-open", storage), {
    activeMembershipStatus: "yes",
    section: "Open",
    byes: [{ id: "bye-1", round: "Round 2" }],
  })
  assert.deepEqual(readSavedPurchaseEntry("fall-open", storage), {
    activeMembershipStatus: "no",
    section: "U1600",
    byes: [],
  })
  assert.deepEqual(readSavedPurchaseEntry("unknown", storage), {})
})

test("ignores invalid saved first-step entry data", () => {
  const storage = {
    getItem: () => JSON.stringify({
      "summer-open": {
        activeMembershipStatus: "maybe",
        section: 123,
        byes: [{ round: "Round 1" }, null, { round: 2 }],
      },
    }),
  }

  assert.deepEqual(readSavedPurchaseEntry("summer-open", storage), {
    activeMembershipStatus: "",
    section: "",
    byes: [{ id: "saved-bye-0", round: "Round 1" }],
  })
})

test("prefers browser UUIDs for registration attempt keys", () => {
  assert.equal(
    createRegistrationAttemptKey({ randomUUID: () => "attempt-uuid" }),
    "attempt-uuid",
  )
})

test("submits registration payloads and normalizes API errors", async () => {
  const payload = { idempotencyKey: "attempt-1", tournamentId: "summer-open", form: {} }
  let capturedRequest
  const success = await submitTournamentRegistration(payload, async (...request) => {
    capturedRequest = request
    return {
      ok: true,
      json: async () => ({ registrationId: "registration-1" }),
    }
  })

  assert.equal(capturedRequest[0], "/api/tournament-registration")
  assert.equal(capturedRequest[1].method, "POST")
  assert.deepEqual(JSON.parse(capturedRequest[1].body), payload)
  assert.deepEqual(success, { registrationId: "registration-1" })

  await assert.rejects(
    submitTournamentRegistration(payload, async () => ({
      ok: false,
      json: async () => ({ error: "Tournament closed" }),
    })),
    /Tournament closed/,
  )
})

test("does not fail a completed registration when receipt storage is blocked", () => {
  const blockedStorage = {
    setItem: () => {
      throw new Error("Storage denied")
    },
  }

  assert.doesNotThrow(() => savePurchaseReceipt({ registrationId: "registration-1" }, blockedStorage))
})
