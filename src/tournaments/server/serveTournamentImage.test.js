import assert from "node:assert/strict"
import test from "node:test"
import { serveTournamentImage } from "./serveTournamentImage.js"

const request = new Request(
  "https://scrantonchess.org/api/tournament-images/2026/123e4567-e89b-12d3-a456-426614174000.webp",
)
const key = "2026/123e4567-e89b-12d3-a456-426614174000.webp"

test("tournament image delivery rejects keys outside the upload format", async () => {
  const response = await serveTournamentImage({
    bucket: { get: () => assert.fail("R2 should not be queried") },
    cache: null,
    key: "../private.txt",
    request,
    waitUntil: () => {},
  })

  assert.equal(response.status, 404)
})

test("tournament image delivery uses the edge cache before R2", async () => {
  const cachedResponse = new Response("cached")
  const response = await serveTournamentImage({
    bucket: { get: () => assert.fail("R2 should not be queried") },
    cache: { match: async () => cachedResponse },
    key,
    request,
    waitUntil: () => {},
  })

  assert.equal(response, cachedResponse)
})

test("tournament image delivery caches immutable R2 responses", async () => {
  let cachedResponse
  let cacheWrite
  const response = await serveTournamentImage({
    bucket: {
      get: async () => ({
        body: "image bytes",
        httpEtag: '"image-etag"',
        writeHttpMetadata: (headers) => headers.set("Content-Type", "image/webp"),
      }),
    },
    cache: {
      match: async () => undefined,
      put: async (_request, value) => {
        cachedResponse = value
      },
    },
    key,
    request,
    waitUntil: (promise) => {
      cacheWrite = promise
    },
  })

  await cacheWrite
  assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable")
  assert.equal(response.headers.get("x-content-type-options"), "nosniff")
  assert.equal(await cachedResponse.text(), "image bytes")
})
