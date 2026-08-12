import { readFileSync } from "node:fs"
import { sendClubWelcomeEmail } from "../src/shared/server/email.js"

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)

  if (match) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "")
  }
}

const email = process.argv[2]
const firstName = process.argv[3] || "Chess Player"

if (!email) {
  throw new Error("Usage: node scripts/send-test-email.mjs email@example.com [firstName]")
}

const result = await sendClubWelcomeEmail(
  { firstName, email },
  { idempotencyKey: `manual-club-welcome-${Date.now()}` },
)

if (result.error) {
  throw new Error(result.error.message || "Resend rejected the email.")
}

console.log(JSON.stringify({ emailId: result.data?.id || null, sent: true }))
