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

test("rejects malformed US Chess IDs", () => {
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
  }, Date.now(), tournament), /US Chess ID must be exactly 8 digits/)
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
      birthDate: "2000-01-01",
      byes: [],
      city: "Scranton",
      email: "player@example.com",
      name: "Player Name",
      paymentMethod: "pay_at_event",
      phone: "570-555-012",
      section: "Open",
      state: "PA",
      street: "1 Main Street",
      zip: "18509",
    },
  }, Date.now(), tournament), /valid 10-digit US phone number/)
})

test("membership address fields are joined into one mailing line", () => {
  const tournament = {
    id: "membership-open",
    title: "Membership Open",
    entryFees: [{ section: "Open", price: 30 }],
  }
  const registration = buildTournamentRegistration({
    tournamentId: tournament.id,
    form: {
      activeMembershipStatus: "no",
      birthDate: "2000-01-01",
      byes: [],
      city: "Scranton",
      email: "player@example.com",
      name: "Player Name",
      paymentMethod: "pay_at_event",
      phone: "(570) 555-0123",
      section: "Open",
      state: "pa",
      street: "1 Main Street",
      unit: "Apt 2",
      zip: "18509",
    },
  }, Date.now(), tournament)

  assert.equal(registration.player.address, "1 Main Street Apt 2, Scranton, PA 18509")
  assert.equal(registration.player.state, "PA")
  assert.equal(registration.player.zip, "18509")
})

test("membership registrations need every mailing address field", () => {
  const tournament = {
    id: "membership-open",
    title: "Membership Open",
    entryFees: [{ section: "Open", price: 30 }],
  }
  const form = {
    activeMembershipStatus: "no",
    birthDate: "2000-01-01",
    byes: [],
    city: "Scranton",
    email: "player@example.com",
    name: "Player Name",
    paymentMethod: "pay_at_event",
    phone: "(570) 555-0123",
    section: "Open",
    state: "PA",
    street: "1 Main Street",
    zip: "18509",
  }

  assert.throws(() => buildTournamentRegistration({
    tournamentId: tournament.id,
    form: { ...form, city: "" },
  }, Date.now(), tournament), /mailing address/)

  assert.throws(() => buildTournamentRegistration({
    tournamentId: tournament.id,
    form: { ...form, state: "ZZ" },
  }, Date.now(), tournament), /Choose a state/)

  assert.throws(() => buildTournamentRegistration({
    tournamentId: tournament.id,
    form: { ...form, zip: "185" },
  }, Date.now(), tournament), /valid ZIP code/)
})

test("student entries are discounted by the tournament, not the submitted form", () => {
  const tournament = {
    id: "student-open",
    title: "Student Open",
    maxByes: 0,
    studentDiscount: 5,
    entryFees: [{ section: "Open", price: 30 }],
  }
  const registration = buildTournamentRegistration({
    tournamentId: tournament.id,
    form: {
      activeMembershipStatus: "yes",
      byes: [],
      email: "player@example.com",
      isStudent: true,
      name: "Player Name",
      paymentMethod: "pay_at_event",
      section: "Open",
      studentDiscount: 25,
      uscfId: "12345678",
    },
  }, Date.now(), tournament)

  assert.equal(registration.player.isStudent, true)
  assert.equal(registration.order.entryAmountCents, 2500)
  assert.equal(registration.order.studentDiscountAmountCents, 500)
  assert.equal(registration.order.totalAmountCents, 2500)
  assert.equal(
    registration.order.lineItems[0].label,
    "Tournament entry - Open (Marywood student or K-12)",
  )
  assert.equal(registration.order.lineItems.every((item) => item.amount_cents >= 0), true)
})

test("a tournament with no student discount charges the full entry", () => {
  const tournament = {
    id: "adult-open",
    title: "Adult Open",
    studentDiscount: 0,
    entryFees: [{ section: "Open", price: 30 }],
  }
  const registration = buildTournamentRegistration({
    tournamentId: tournament.id,
    form: {
      activeMembershipStatus: "yes",
      byes: [],
      email: "player@example.com",
      isStudent: true,
      name: "Player Name",
      paymentMethod: "pay_at_event",
      section: "Open",
      uscfId: "12345678",
    },
  }, Date.now(), tournament)

  assert.equal(registration.order.studentDiscountAmountCents, 0)
  assert.equal(registration.order.totalAmountCents, 3000)
  assert.equal(registration.order.lineItems[0].label, "Tournament entry - Open")
})
