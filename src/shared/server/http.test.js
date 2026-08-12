import assert from "node:assert/strict"
import test from "node:test"
import {
  isCrossSiteRequest,
  jsonResponse,
  parseJsonRequest,
  withNoStore,
} from "./http.js"

const jsonRequest = (body, headers = { "Content-Type": "application/json" }) => (
  new Request("https://example.com/api", { method: "POST", body, headers })
)

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
  const request = jsonRequest(JSON.stringify({ tournamentId: "summer-open" }))
  const emptyRequest = new Request("https://example.com/api", { method: "POST" })

  assert.deepEqual(await parseJsonRequest(request), { tournamentId: "summer-open" })
  assert.deepEqual(await parseJsonRequest(emptyRequest), {})
})

test("rejects malformed JSON requests", async () => {
  await assert.rejects(parseJsonRequest(jsonRequest("not-json")), SyntaxError)
})

test("rejects bodies a cross-site form could have sent", async () => {
  const formEncoded = jsonRequest(
    JSON.stringify({ status: "published" }),
    { "Content-Type": "text/plain;charset=UTF-8" },
  )
  const multipart = jsonRequest(
    JSON.stringify({ status: "published" }),
    { "Content-Type": "multipart/form-data; boundary=x" },
  )

  await assert.rejects(parseJsonRequest(formEncoded), SyntaxError)
  await assert.rejects(parseJsonRequest(multipart), SyntaxError)
})

test("treats only same-origin browser writes as first party", () => {
  const write = (headers) => new Request("https://example.com/api/admin/tournaments", {
    method: "POST",
    headers,
  })

  assert.equal(isCrossSiteRequest(write({ "Sec-Fetch-Site": "same-origin" })), false)
  assert.equal(isCrossSiteRequest(write({ "Sec-Fetch-Site": "cross-site" })), true)
  assert.equal(isCrossSiteRequest(write({ "Sec-Fetch-Site": "same-site" })), true)
  assert.equal(isCrossSiteRequest(write({ Origin: "https://evil.example" })), true)
  assert.equal(isCrossSiteRequest(write({ Origin: "https://example.com" })), false)
  assert.equal(isCrossSiteRequest(write({})), false)
})

test("reads are never treated as cross-site writes", () => {
  const read = new Request("https://example.com/api/admin/registrations", {
    headers: { "Sec-Fetch-Site": "cross-site" },
  })

  assert.equal(isCrossSiteRequest(read), false)
})

test("admin responses are marked uncacheable without losing their body", async () => {
  const response = withNoStore(jsonResponse(200, { registrations: [] }))

  assert.equal(response.status, 200)
  assert.equal(response.headers.get("cache-control"), "no-store")
  assert.deepEqual(await response.json(), { registrations: [] })
})
