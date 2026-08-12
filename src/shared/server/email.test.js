import assert from "node:assert/strict"
import test from "node:test"
import { buildWelcomeHtml, buildWelcomeText } from "./email.js"

test("club welcome email directs questions to the club address", () => {
  const html = buildWelcomeHtml("Cian")
  const text = buildWelcomeText("Cian")

  assert.match(html, /mailto:scrantonchess@gmail\.com/)
  assert.match(text, /Email scrantonchess@gmail\.com/)
  assert.doesNotMatch(html, /Reply to this email/)
  assert.doesNotMatch(text, /Reply to this email/)
})
