import assert from "node:assert/strict"
import test from "node:test"
import { enforcePublicFormRateLimit } from "./rateLimit.js"

test("public forms use a separate per-IP counter for each form", async () => {
  let receivedKey
  const limiter = {
    limit: async ({ key }) => {
      receivedKey = key
      return { success: true }
    },
  }
  const request = new Request("https://scrantonchess.org/api/club-signups", {
    headers: { "cf-connecting-ip": "192.0.2.10" },
  })

  assert.equal(await enforcePublicFormRateLimit(request, "club-signup", limiter), null)
  assert.equal(receivedKey, "club-signup:192.0.2.10")
})

test("public forms return 429 after the Worker rate limit is exceeded", async () => {
  const limiter = { limit: async () => ({ success: false }) }
  const request = new Request("https://scrantonchess.org/api/club-signups", {
    headers: { "cf-connecting-ip": "192.0.2.10" },
  })
  const response = await enforcePublicFormRateLimit(request, "club-signup", limiter)

  assert.equal(response.status, 429)
  assert.equal(response.headers.get("retry-after"), "10")
})

test("public forms fail closed when a deployed rate limiter is missing", async () => {
  const remoteRequest = new Request("https://scrantonchess.org/api/club-signups")
  const localRequest = new Request("http://localhost:3000/api/club-signups")

  assert.equal((await enforcePublicFormRateLimit(remoteRequest, "club-signup", null)).status, 503)
  assert.equal(await enforcePublicFormRateLimit(localRequest, "club-signup", null), null)
})
