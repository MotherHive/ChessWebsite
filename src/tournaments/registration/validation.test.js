import assert from "node:assert/strict"
import test from "node:test"
import {
  formatPhoneNumber,
  formatUscfId,
  isValidPhoneNumber,
  isValidUscfId,
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
