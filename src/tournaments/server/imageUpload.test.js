import assert from "node:assert/strict"
import test from "node:test"
import { sniffTournamentImageType, validateTournamentImage } from "./imageUpload.js"

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

test("tournament image bytes are identified independently of the declared type", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00])
  const webp = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00,
    0x57, 0x45, 0x42, 0x50,
  ])
  const html = new TextEncoder().encode("<html><script>alert(1)</script>")

  assert.equal(sniffTournamentImageType(png), "image/png")
  assert.equal(sniffTournamentImageType(jpeg), "image/jpeg")
  assert.equal(sniffTournamentImageType(webp), "image/webp")
  assert.equal(sniffTournamentImageType(html), "")
})
