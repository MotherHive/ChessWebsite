import assert from "node:assert/strict"
import test from "node:test"
import {
  jsonResponse,
  parseJsonRequest,
} from "./http.js"

test("creates native JSON responses with status and headers", async () => {
  const response = jsonResponse(
    202,
    { accepted: true },
    { "Cache-Control": "no-store" },
  )

  assert.equal(response.status, 202)
  assert.equal(response.headers.get("content-type"), "application/json")
  assert.equal(response.headers.get("cache-control"), "no-store")
  assert.deepEqual(await response.json(), { accepted: true })
})

test("parses JSON requests and treats an empty body as an empty object", async () => {
  const request = new Request("https://example.com/api", {
    method: "POST",
    body: JSON.stringify({ tournamentId: "summer-open" }),
  })
  const emptyRequest = new Request("https://example.com/api", { method: "POST" })

  assert.deepEqual(await parseJsonRequest(request), { tournamentId: "summer-open" })
  assert.deepEqual(await parseJsonRequest(emptyRequest), {})
})

test("rejects malformed JSON requests", async () => {
  const request = new Request("https://example.com/api", {
    method: "POST",
    body: "not-json",
  })

  await assert.rejects(parseJsonRequest(request), SyntaxError)
})
