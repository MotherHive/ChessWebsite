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

test("official Turnstile test credentials accept a dummy response without an action", async () => {
  const previousSecret = process.env.TURNSTILE_SECRET_KEY
  const previousFetch = globalThis.fetch
  process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA"
  globalThis.fetch = async () => Response.json({ success: true })

  try {
    const request = new Request("https://staging.example.com/api/tournament-registration")
    assert.equal(
      await verifyTurnstile(request, "XXXX.DUMMY.TOKEN.XXXX", "tournament_registration"),
      true,
    )
  } finally {
    globalThis.fetch = previousFetch
    if (previousSecret === undefined) {
      delete process.env.TURNSTILE_SECRET_KEY
    } else {
      process.env.TURNSTILE_SECRET_KEY = previousSecret
    }
  }
})
