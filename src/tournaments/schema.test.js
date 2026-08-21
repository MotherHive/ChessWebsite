import assert from "node:assert/strict"
import test from "node:test"
import { publishedTournamentFixture } from "./testFixtures/publishedTournament.js"
import {
  publishedTournamentSchema,
  tournamentDraftSchema,
} from "./schema.js"

const validPublishedTournament = publishedTournamentFixture

test("a complete tournament fixture satisfies the published contract", () => {
  assert.equal(publishedTournamentSchema.safeParse(validPublishedTournament).success, true)
})

test("drafts can be saved before publishing details are complete", () => {
  const result = tournamentDraftSchema.safeParse({
    title: "Autumn Open",
    entryFees: [{ section: "Open", price: 25 }],
  })

  assert.equal(result.success, true)
  assert.equal(result.data.maxByes, 0)
  assert.equal(result.data.studentDiscount, 5)
  assert.deepEqual(result.data.days, [])
})

test("published tournaments require operational checkout details", () => {
  const result = publishedTournamentSchema.safeParse({
    title: "Incomplete Open",
    entryFees: [],
  })

  assert.equal(result.success, false)
  assert.ok(result.error.issues.some((issue) => issue.path[0] === "startsAt"))
  assert.ok(result.error.issues.some((issue) => issue.path[0] === "entryFees"))
})

test("published tournaments reject duplicate sections and backwards dates", () => {
  const result = publishedTournamentSchema.safeParse({
    ...validPublishedTournament,
    entryFees: [
      { section: "Open", price: 20 },
      { section: "open", price: 15 },
    ],
    startsAt: "2026-10-10T12:00:00-04:00",
    endsAt: "2026-10-10T11:00:00-04:00",
  })

  assert.equal(result.success, false)
  assert.ok(result.error.issues.some((issue) => issue.path.join(".") === "entryFees.1.section"))
  assert.ok(result.error.issues.some((issue) => issue.path[0] === "endsAt"))
})

test("unknown fields and malformed URLs are rejected", () => {
  const unknownField = tournamentDraftSchema.safeParse({ title: "Open", surprise: true })
  const invalidUrl = tournamentDraftSchema.safeParse({ title: "Open", rulesUrl: "not a URL" })

  assert.equal(unknownField.success, false)
  assert.equal(invalidUrl.success, false)
})

test("only http and https links are accepted for rendered URLs", () => {
  const parseUrl = (field, value) => tournamentDraftSchema.safeParse({ title: "Open", [field]: value })

  assert.equal(parseUrl("rulesUrl", "javascript:alert(1)").success, false)
  assert.equal(parseUrl("mapUrl", "JaVaScRiPt:alert(1)").success, false)
  assert.equal(parseUrl("flyerUrl", "data:text/html,<script>alert(1)</script>").success, false)
  assert.equal(parseUrl("uscfUrl", "vbscript:msgbox(1)").success, false)
  assert.equal(parseUrl("imageUrl", "https://example.com/flyer.png").success, true)
  assert.equal(parseUrl("imageUrl", "").success, true)
})
