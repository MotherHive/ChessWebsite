import assert from "node:assert/strict"
import test from "node:test"
import {
  buildClubSignupNotificationHtml,
  buildClubSignupNotificationText,
  buildWelcomeHtml,
  buildWelcomeText,
  clubSignupNotificationAddress,
} from "./email.js"

test("club signup notifications go to the club inbox", () => {
  assert.equal(clubSignupNotificationAddress, "scrantonchess@gmail.com")
})

test("club welcome email directs questions to the club address", () => {
  const html = buildWelcomeHtml("Cian")
  const text = buildWelcomeText("Cian")

  assert.match(html, /mailto:scrantonchess@gmail\.com/)
  assert.match(text, /Email scrantonchess@gmail\.com/)
  assert.doesNotMatch(html, /Reply to this email/)
  assert.doesNotMatch(text, /Reply to this email/)
})

test("club signup notification includes the new member details", () => {
  const details = {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    joinedAt: "2026-09-24T15:30:00.000Z",
  }
  const html = buildClubSignupNotificationHtml(details)
  const text = buildClubSignupNotificationText(details)

  for (const value of ["Ada Lovelace", "ada@example.com", "2026-09-24T15:30:00.000Z"]) {
    assert.match(html, new RegExp(value))
    assert.match(text, new RegExp(value))
  }
  assert.match(html, /mailto:ada@example\.com/)
})

test("club signup notification escapes member details in HTML", () => {
  const html = buildClubSignupNotificationHtml({
    firstName: "<Ada>",
    lastName: 'Lovelace & "Byron"',
    email: "ada@example.com",
    joinedAt: "2026-09-24T15:30:00.000Z",
  })

  assert.match(html, /&lt;Ada&gt;/)
  assert.match(html, /Lovelace &amp; &quot;Byron&quot;/)
  assert.doesNotMatch(html, /<Ada>/)
})
