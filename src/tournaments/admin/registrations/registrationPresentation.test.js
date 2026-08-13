import assert from "node:assert/strict"
import test from "node:test"
import { csvColumns, getSettlementCents } from "./registrationPresentation.js"

const paidByCard = {
  payment_method: "stripe_checkout",
  payment_status: "paid",
  stripe_fee_cents: 59,
  stripe_net_cents: 941,
  total_amount_cents: 1000,
}

test("card payments report Stripe's own fee and net", () => {
  assert.deepEqual(getSettlementCents(paidByCard), { feeCents: 59, netCents: 941 })
})

test("cash taken at the event nets the full total", () => {
  assert.deepEqual(
    getSettlementCents({
      payment_method: "pay_at_event",
      payment_status: "paid",
      total_amount_cents: 2500,
    }),
    { feeCents: 0, netCents: 2500 },
  )
})

test("unpaid registrations report no settlement", () => {
  for (const paymentStatus of ["checkout_pending", "manual_pending", "checkout_expired"]) {
    assert.deepEqual(
      getSettlementCents({ ...paidByCard, payment_status: paymentStatus }),
      { feeCents: null, netCents: null },
      `${paymentStatus} must not report cash`,
    )
  }
})

test("a card payment with no recorded settlement stays blank rather than estimating", () => {
  assert.deepEqual(
    getSettlementCents({ ...paidByCard, stripe_fee_cents: null, stripe_net_cents: null }),
    { feeCents: null, netCents: null },
  )
})

test("the CSV renders settlement columns as currency and blanks", () => {
  const render = (label, row) => csvColumns.find(([name]) => name === label)[1](row)

  assert.equal(render("Net received", paidByCard), "$9.41")
  assert.equal(render("Processor fee", paidByCard), "$0.59")
  assert.equal(render("Processor fee", { ...paidByCard, payment_status: "manual_pending" }), "")
})
