import assert from "node:assert/strict"
import test from "node:test"
import { isStripeSandboxKey } from "./stripe.js"

test("Stripe sandbox keys are recognized", () => {
  assert.equal(isStripeSandboxKey("sk_test_example"), true)
  assert.equal(isStripeSandboxKey("rk_test_example"), true)
})

test("Stripe live and malformed keys are not treated as sandbox keys", () => {
  assert.equal(isStripeSandboxKey("sk_live_example"), false)
  assert.equal(isStripeSandboxKey("rk_live_example"), false)
  assert.equal(isStripeSandboxKey(""), false)
})
