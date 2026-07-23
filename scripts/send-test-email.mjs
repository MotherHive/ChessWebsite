import { readFileSync } from "node:fs"
import {
  trySendClubWelcomeEmail,
  trySendRegistrationEmail,
} from "../src/shared/server/email.js"

// Load .env.local into process.env (simple parser, no dep).
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
  if (match) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "")
  }
}

const registrationEmailSent = await trySendRegistrationEmail({
  playerName: "Cian Wescott",
  email: "cianwknight@gmail.com",
  tournamentTitle: "Scranton Chess Club Test Event",
  section: "Championship",
  dateRange: "Test confirmation",
  location: "Scranton, PA",
  paymentMethodLabel: "Test",
  lineItems: [{ label: "Tournament entry - Championship", amount_cents: 2500, quantity: 1 }],
  totalAmountCents: 2500,
  paid: true,
})

const welcomeEmailSent = await trySendClubWelcomeEmail({
  firstName: "Cian",
  email: "cianwknight@gmail.com",
})

console.log("Delivery Status:", JSON.stringify({ registrationEmailSent, welcomeEmailSent }, null, 2))
