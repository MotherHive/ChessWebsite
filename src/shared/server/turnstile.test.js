import assert from "node:assert/strict"
import test from "node:test"
import { verifyTurnstile } from "./turnstile.js"

const withoutTurnstileSecret = async (callback) => {
  const previousSecret = process.env.TURNSTILE_SECRET_KEY
  delete process.env.TURNSTILE_SECRET_KEY

  try {
    await callback()
  } finally {
    if (previousSecret === undefined) {
      delete process.env.TURNSTILE_SECRET_KEY
    } else {
      process.env.TURNSTILE_SECRET_KEY = previousSecret
    }
  }
}

test("Turnstile may be omitted during localhost development", async () => {
  await withoutTurnstileSecret(async () => {
    const request = new Request("http://localhost:3000/api/club-signups")
    assert.equal(await verifyTurnstile(request, "", "club_signup"), true)
  })
})

test("Turnstile fails closed on deployed hosts when its secret is missing", async () => {
  await withoutTurnstileSecret(async () => {
    const request = new Request("https://scrantonchess.org/api/club-signups")
    assert.equal(await verifyTurnstile(request, "", "club_signup"), false)
  })
})
