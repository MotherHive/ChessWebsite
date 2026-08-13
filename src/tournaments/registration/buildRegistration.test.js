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

test("rejects malformed USCF IDs", () => {
  const tournament = {
    id: "member-id-open",
    title: "Member ID Open",
    entryFees: [{ section: "Open", price: 30 }],
  }

  assert.throws(() => buildTournamentRegistration({
    tournamentId: tournament.id,
    form: {
      activeMembershipStatus: "yes",
      byes: [],
      email: "player@example.com",
      name: "Player Name",
      paymentMethod: "pay_at_event",
      section: "Open",
      uscfId: "1234A678",
    },
  }, Date.now(), tournament), /USCF ID must be exactly 8 digits/)
})

test("rejects malformed membership phone numbers", () => {
  const tournament = {
    id: "membership-open",
    title: "Membership Open",
    entryFees: [{ section: "Open", price: 30 }],
  }

  assert.throws(() => buildTournamentRegistration({
    tournamentId: tournament.id,
    form: {
      activeMembershipStatus: "no",
      address: "1 Main Street",
      birthDate: "2000-01-01",
      byes: [],
      email: "player@example.com",
      name: "Player Name",
      paymentMethod: "pay_at_event",
      phone: "570-555-012",
      section: "Open",
    },
  }, Date.now(), tournament), /valid 10-digit US phone number/)
})
