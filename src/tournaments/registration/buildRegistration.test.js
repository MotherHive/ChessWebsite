import assert from "node:assert/strict"
import test from "node:test"
import { buildTournamentRegistration } from "./buildRegistration.js"

test("builds registrations from a database-provided tournament", () => {
  const tournament = {
    id: "admin-created-open",
    title: "Admin Created Open",
    type: "Swiss",
    rating: "USCF",
    dateRange: "August 1, 2026",
    location: "Chess Club",
    address: "1 Main Street",
    maxByes: 1,
    entryFees: [{ section: "Open", price: 30 }],
  }
  const registration = buildTournamentRegistration({
    tournamentId: tournament.id,
    form: {
      activeMembershipStatus: "yes",
      byes: [],
      email: "player@example.com",
      name: "Player Name",
      paymentMethod: "pay_at_event",
      section: "Open",
      uscfId: "12345678",
    },
  }, Date.now(), tournament)

  assert.equal(registration.tournament.id, tournament.id)
  assert.equal(registration.order.totalAmountCents, 3000)
})
