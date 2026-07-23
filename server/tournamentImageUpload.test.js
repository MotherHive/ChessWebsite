import assert from "node:assert/strict"
import test from "node:test"
import { validateTournamentImage } from "./tournamentImageUpload.js"

const image = (overrides = {}) => ({
  arrayBuffer: async () => new ArrayBuffer(1),
  size: 1024,
  type: "image/webp",
  ...overrides,
})

test("tournament image uploads accept safe image formats", () => {
  assert.equal(validateTournamentImage(image()), "")
  assert.equal(validateTournamentImage(image({ type: "image/jpeg" })), "")
})

test("tournament image uploads reject unsupported or oversized files", () => {
  assert.match(validateTournamentImage(image({ type: "image/svg+xml" })), /JPG/)
  assert.match(validateTournamentImage(image({ size: 5 * 1024 * 1024 })), /4 MB/)
  assert.match(validateTournamentImage(null), /Choose/)
})
