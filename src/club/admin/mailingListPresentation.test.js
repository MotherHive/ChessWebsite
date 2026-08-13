import assert from "node:assert/strict"
import test from "node:test"
import { buildCsv, buildEmailList, buildNamedEmailList, csvEscape } from "./mailingListPresentation.js"

const rows = [
  {
    created_at: "2026-01-02T15:04:05.000Z",
    email: "ada@example.com",
    first_name: "Ada",
    last_name: "Lovelace",
    source: "join_menu",
    welcome_email_sent_at: null,
  },
  {
    created_at: "2026-01-01T15:04:05.000Z",
    email: "grace@example.com",
    first_name: "Grace",
    last_name: "Hopper, Jr",
    source: "join_menu",
    welcome_email_sent_at: "2026-01-01T15:05:05.000Z",
  },
]

test("the email list is a mail client ready address list", () => {
  assert.equal(buildEmailList(rows), "ada@example.com, grace@example.com")
})

test("rows without an email are skipped", () => {
  assert.equal(buildEmailList([{ email: "  " }, { email: "ada@example.com" }]), "ada@example.com")
})

test("named addresses quote a display name that would split the list", () => {
  assert.equal(
    buildNamedEmailList(rows),
    'Ada Lovelace <ada@example.com>, "Grace Hopper, Jr" <grace@example.com>',
  )
})

test("named addresses fall back to the bare address when there is no name", () => {
  assert.equal(buildNamedEmailList([{ email: "ada@example.com" }]), "ada@example.com")
})

test("the CSV keeps a header row and one line per signup", () => {
  const lines = buildCsv(rows).split("\n")

  assert.equal(lines.length, 3)
  assert.equal(lines[0], "First name,Last name,Email,Joined,Source,Welcome email sent")
  assert.match(lines[1], /^Ada,Lovelace,ada@example\.com,/)
  assert.match(lines[2], /^Grace,"Hopper, Jr",grace@example\.com,/)
})

test("an empty mailing list still exports its header", () => {
  assert.equal(buildCsv([]), "First name,Last name,Email,Joined,Source,Welcome email sent")
})

test("CSV values with quotes are doubled", () => {
  assert.equal(csvEscape('a "quoted" name'), '"a ""quoted"" name"')
})
