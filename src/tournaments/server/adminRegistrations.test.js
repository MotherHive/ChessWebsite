import assert from "node:assert/strict"
import test from "node:test"
import {
  buildRegistrationFilter,
  getRegistrationFilters,
} from "./adminRegistrationFilters.js"

test("the default registration roster omits card checkout attempts", () => {
  const filter = buildRegistrationFilter(getRegistrationFilters(new URLSearchParams()))

  assert.match(filter.where, /payment_status IN \('paid', 'manual_pending'\)/)
  assert.match(filter.where, /superseded_by_registration_id IS NULL OR payment_status = 'paid'/)
  assert.deepEqual(filter.bindings, [])
})

test("an explicit status filter can still diagnose hidden checkout state", () => {
  const filter = buildRegistrationFilter(getRegistrationFilters(
    new URLSearchParams({ payment: "checkout_expired" }),
  ))

  assert.doesNotMatch(filter.where, /payment_status IN \('paid', 'manual_pending'\)/)
  assert.match(filter.where, /payment_status = \?/)
  assert.deepEqual(filter.bindings, ["checkout_expired"])
})
