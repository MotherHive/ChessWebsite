import assert from "node:assert/strict"
import test from "node:test"
import {
  createPurchaseForm,
  createPurchaseState,
  derivePurchase,
  purchaseReducer,
} from "./model.js"

const tournament = {
  id: "summer-open",
  title: "Summer Open",
  type: "Swiss",
  rating: "USCF",
  dateRange: "August 1, 2026",
  location: "Chess Club",
  address: "1 Main Street",
  maxByes: 2,
  entryFees: [
    { section: "Open", price: 30 },
    { section: "U1600", price: 20 },
  ],
}

test("creates a purchase form from the tournament and saved contact information", () => {
  const form = createPurchaseForm(tournament, {
    name: "Ada Lovelace",
    email: "ada@example.com",
  })

  assert.equal(form.name, "Ada Lovelace")
  assert.equal(form.email, "ada@example.com")
  assert.equal(form.section, "Open")
  assert.equal(form.paymentMethod, "stripe_checkout")
  assert.deepEqual(form.byes, [])
})

test("derives checkout totals and step validity from one form snapshot", () => {
  const form = {
    ...createPurchaseForm(tournament),
    activeMembershipStatus: "yes",
    name: "Ada Lovelace",
    email: "ada@example.com",
    uscfId: "12345678",
    byes: [{ id: "bye-1", round: "Round 2" }],
  }

  const purchase = derivePurchase(tournament, form)

  assert.equal(purchase.entryPrice, 30)
  assert.equal(purchase.byeTotal, 5)
  assert.equal(purchase.membershipPrice, 0)
  assert.equal(purchase.purchaseTotal, 35)
  assert.equal(purchase.entryStepError, "")
  assert.equal(purchase.infoStepError, "")
  assert.deepEqual(purchase.selectedByeRounds, ["Round 2"])
})

test("reports duplicate byes and missing active membership ID", () => {
  const form = {
    ...createPurchaseForm(tournament),
    activeMembershipStatus: "yes",
    name: "Ada Lovelace",
    email: "ada@example.com",
    byes: [
      { id: "bye-1", round: "Round 1" },
      { id: "bye-2", round: "Round 1" },
    ],
  }

  const purchase = derivePurchase(tournament, form)

  assert.equal(purchase.entryStepError, "Choose each bye round only once.")
  assert.equal(purchase.infoStepError, "Enter the active USCF ID.")
})

test("opening another tournament atomically resets workflow and reconciles its form", () => {
  const initialState = {
    ...createPurchaseState(tournament, {}),
    purchaseStep: "review",
    purchaseStatus: "error",
    purchaseMessage: "Try again",
    purchaseResult: { registrationId: "old" },
    purchaseForm: {
      ...createPurchaseForm(tournament),
      section: "U1600",
      byes: [
        { id: "bye-1", round: "Round 1" },
        { id: "bye-2", round: "Round 2" },
      ],
    },
  }
  const scholasticTournament = {
    ...tournament,
    id: "scholastic-open",
    maxByes: 1,
    entryFees: [{ section: "K-8", price: 15 }],
  }

  const nextState = purchaseReducer(initialState, {
    type: "open",
    savedInfo: { name: "Ada Lovelace", email: "ada@example.com" },
    tournament: scholasticTournament,
  })

  assert.equal(nextState.isPurchaseDrawerOpen, true)
  assert.equal(nextState.selectedTournamentId, "scholastic-open")
  assert.equal(nextState.purchaseStep, "entry")
  assert.equal(nextState.purchaseStatus, "idle")
  assert.equal(nextState.purchaseMessage, "")
  assert.equal(nextState.purchaseResult, null)
  assert.equal(nextState.purchaseForm.section, "K-8")
  assert.equal(nextState.purchaseForm.name, "Ada Lovelace")
  assert.equal(nextState.purchaseForm.email, "ada@example.com")
  assert.deepEqual(nextState.purchaseForm.byes, [{ id: "bye-1", round: "Round 1" }])
})

test("opening restores saved entry choices before reconciling tournament limits", () => {
  const initialState = createPurchaseState(tournament, {})
  const nextState = purchaseReducer(initialState, {
    type: "open",
    tournament,
    savedEntry: {
      activeMembershipStatus: "yes",
      section: "U1600",
      byes: [
        { id: "bye-1", round: "Round 1" },
        { id: "bye-2", round: "Round 2" },
        { id: "bye-3", round: "Round 3" },
      ],
    },
  })

  assert.equal(nextState.purchaseForm.activeMembershipStatus, "yes")
  assert.equal(nextState.purchaseForm.section, "U1600")
  assert.deepEqual(nextState.purchaseForm.byes, [
    { id: "bye-1", round: "Round 1" },
    { id: "bye-2", round: "Round 2" },
  ])
})

test("form reducer actions clear stale submission feedback", () => {
  const initialState = {
    ...createPurchaseState(tournament, {}),
    purchaseStatus: "error",
    purchaseMessage: "Try again",
  }
  const updatedState = purchaseReducer(initialState, {
    type: "update-field",
    field: "name",
    value: "Grace Hopper",
  })
  const submittedState = purchaseReducer(updatedState, {
    type: "submit-succeeded",
    result: { registrationId: "registration-1" },
  })

  assert.equal(updatedState.purchaseForm.name, "Grace Hopper")
  assert.equal(updatedState.purchaseStatus, "idle")
  assert.equal(updatedState.purchaseMessage, "")
  assert.equal(submittedState.purchaseStep, "thanks")
  assert.equal(submittedState.purchaseStatus, "success")
  assert.deepEqual(submittedState.purchaseResult, { registrationId: "registration-1" })
})
