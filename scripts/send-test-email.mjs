import { readFileSync } from "node:fs"
// 1. Import the combined runner function
import { trySendRegistrationAndWelcomeEmail } from "../src/shared/server/email.js"

// Load .env.local into process.env (simple parser, no dep).
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
  if (match) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "")
  }
}

// 2. Pass the full registration object.
// The function will automatically extract the first name for the welcome email.
const result = await trySendRegistrationAndWelcomeEmail({
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

// 3. This will log a clean object showing the success status of both emails
console.log("Delivery Status:", JSON.stringify(result, null, 2))
