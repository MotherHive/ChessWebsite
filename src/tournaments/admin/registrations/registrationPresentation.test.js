import assert from "node:assert/strict"
import test from "node:test"
import {
  buildCsvTotalRow,
  csvColumns,
  getClubNetCents,
  getSettlementCents,
} from "./registrationPresentation.js"

const paidByCard = {
  membership_amount_cents: 0,
  payment_method: "stripe_checkout",
  payment_status: "paid",
  stripe_fee_cents: 59,
  stripe_net_cents: 941,
  total_amount_cents: 1000,
}

const cellAt = (row, label) => {
  const index = csvColumns.findIndex(([name]) => name === label)

  return row[index]
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

test("USCF membership dues come out of the club's net, Stripe's fee does not", () => {
  const withMembership = {
    ...paidByCard,
    membership_amount_cents: 2400,
    stripe_fee_cents: 130,
    stripe_net_cents: 3870,
    total_amount_cents: 4000,
  }

  assert.equal(getClubNetCents(withMembership), 1470)
})

test("unpaid registrations report no club net", () => {
  assert.equal(getClubNetCents({ ...paidByCard, payment_status: "checkout_pending" }), null)
})

test("the totals row tallies paid registrations only", () => {
  const cashWithMembership = {
    membership_amount_cents: 2400,
    payment_method: "pay_at_event",
    payment_status: "paid",
    total_amount_cents: 4000,
  }
  const unpaid = { ...paidByCard, payment_status: "checkout_pending", total_amount_cents: 5000 }
  const totals = buildCsvTotalRow([paidByCard, cashWithMembership, unpaid])

  assert.equal(cellAt(totals, "Registered"), "Totals (paid) — 2 registrations")
  assert.equal(cellAt(totals, "Total"), "$50.00")
  assert.equal(cellAt(totals, "Processor fee"), "$0.59")
  assert.equal(cellAt(totals, "Net received"), "$49.41")
  assert.equal(cellAt(totals, "USCF membership dues"), "$24.00")
  assert.equal(cellAt(totals, "Club net"), "$25.41")
  assert.equal(cellAt(totals, "Paid at"), "")
})
