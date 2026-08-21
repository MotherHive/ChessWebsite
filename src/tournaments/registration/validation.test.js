import assert from "node:assert/strict"
import test from "node:test"
import {
  formatMailingAddress,
  formatPhoneNumber,
  formatUscfId,
  formatZipCode,
  hasCompleteAddress,
  isValidPhoneNumber,
  isValidStateCode,
  isValidUscfId,
  isValidZipCode,
  resolveStateCode,
} from "./validation.js"

test("formats and validates eight-digit USCF IDs", () => {
  assert.equal(formatUscfId("1234 56ab78"), "12345678")
  assert.equal(formatUscfId("123456789"), "12345678")
  assert.equal(isValidUscfId("12345678"), true)
  assert.equal(isValidUscfId("1234567"), false)
  assert.equal(isValidUscfId("1234A678"), false)
})

test("formats and validates US phone numbers", () => {
  assert.equal(formatPhoneNumber("570"), "570")
  assert.equal(formatPhoneNumber("570604"), "(570) 604")
  assert.equal(formatPhoneNumber("5706042461"), "(570) 604-2461")
  assert.equal(formatPhoneNumber("+1 570-604-2461"), "(570) 604-2461")
  assert.equal(isValidPhoneNumber("(570) 604-2461"), true)
  assert.equal(isValidPhoneNumber("+1 570-604-2461"), true)
  assert.equal(isValidPhoneNumber("570-604-246"), false)
})

test("state entries resolve from either the code or the full name", () => {
  assert.equal(resolveStateCode("pa"), "PA")
  assert.equal(resolveStateCode("Pennsylvania"), "PA")
  assert.equal(resolveStateCode("  new york "), "NY")
  assert.equal(resolveStateCode("Penn"), "")
  assert.equal(isValidStateCode("Pennsylvania"), true)
  assert.equal(isValidStateCode("ZZ"), false)
})

test("ZIP codes keep five digits or the hyphenated plus-four form", () => {
  assert.equal(formatZipCode("18509"), "18509")
  assert.equal(formatZipCode("185091234"), "18509-1234")
  assert.equal(formatZipCode("abc18509xyz"), "18509")
  assert.equal(isValidZipCode("18509"), true)
  assert.equal(isValidZipCode("18509-1234"), true)
  assert.equal(isValidZipCode("185"), false)
})

test("membership addresses are joined into one mailing line", () => {
  assert.equal(
    formatMailingAddress({ street: "1 Main St", unit: "Apt 2", city: "Scranton", state: "PA", zip: "18509" }),
    "1 Main St Apt 2, Scranton, PA 18509",
  )
  assert.equal(
    formatMailingAddress({ street: "1 Main St", city: "Scranton", state: "PA", zip: "18509" }),
    "1 Main St, Scranton, PA 18509",
  )
  assert.equal(hasCompleteAddress({ street: "1 Main St", city: "Scranton", state: "PA", zip: "" }), false)
})
