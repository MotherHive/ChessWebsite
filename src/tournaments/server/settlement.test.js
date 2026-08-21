import assert from "node:assert/strict"
import test from "node:test"
import {
  backfillSettlements,
  findUnsettledRegistrations,
  hasSettlement,
  loadSettlement,
  loadSettlementForCharge,
  readBalanceTransaction,
  recordSettlement,
} from "./settlement.js"

// D1 statements are prepare/bind/run chains, so the fake records what each call
// was asked to do and replays a canned result.
const fakeDatabase = ({ changes = 1, rows = [] } = {}) => {
  const calls = []

  return {
    calls,
    prepare(sql) {
      const call = { bindings: [], sql }

      return {
        all: async () => {
          calls.push({ ...call, kind: "all" })

          return { results: rows, success: true }
        },
        bind(...bindings) {
          call.bindings = bindings

          return this
        },
        run: async () => {
          calls.push({ ...call, kind: "run" })

          return { meta: { changes }, success: true }
        },
      }
    },
  }
}

// Mirrors the real API on version 2026-05-27.dahlia: the payment intent names
// its charge, and the balance transaction is reachable only by source lookup.
const fakeStripe = ({ charges = {}, retrieve } = {}) => ({
  balanceTransactions: {
    list: async ({ source }) => ({ data: charges[source] ? [charges[source]] : [] }),
  },
  paymentIntents: {
    retrieve: retrieve || (async (id) => ({ latest_charge: { id: `ch_${id}` } })),
  },
})

const silenceErrors = (run) => async () => {
  const original = console.error
  console.error = () => {}

  try {
    await run()
  } finally {
    console.error = original
  }
}

test("a balance transaction reports the processor fee and the club's net", () => {
  assert.deepEqual(
    readBalanceTransaction({ fee: 89, net: 1911 }),
    { feeCents: 89, netCents: 1911 },
  )
  assert.deepEqual(readBalanceTransaction(null), { feeCents: null, netCents: null })
  assert.deepEqual(
    readBalanceTransaction({ fee: "89", net: undefined }),
    { feeCents: null, netCents: null },
  )
})

test("only a complete pair of figures counts as a settlement", () => {
  assert.equal(hasSettlement({ feeCents: 89, netCents: 1911 }), true)
  assert.equal(hasSettlement({ feeCents: 0, netCents: 0 }), true)
  assert.equal(hasSettlement({ feeCents: 89, netCents: null }), false)
  assert.equal(hasSettlement(null), false)
})

// The charge object's own `balance_transaction` field is always null on this
// API version, so the settlement has to come from a source lookup. A fake that
// expands the field instead would pass while production stayed blank.
test("settlement is read by looking the balance transaction up by charge", async () => {
  const stripe = fakeStripe({
    charges: { ch_live: { fee: 89, net: 1911, status: "pending" } },
    retrieve: async (id, options) => {
      assert.equal(id, "pi_live")
      assert.deepEqual(options, { expand: ["latest_charge"] })

      return { latest_charge: { balance_transaction: null, id: "ch_live" } }
    },
  })

  assert.deepEqual(
    await loadSettlement(stripe, "pi_live"),
    { feeCents: 89, netCents: 1911 },
  )
})

test("a charge event settles without resolving the payment intent again", async () => {
  const stripe = fakeStripe({
    charges: { ch_live: { fee: 89, net: 1911 } },
    retrieve: async () => {
      throw new Error("A charge event must not re-read the payment intent.")
    },
  })

  assert.deepEqual(
    await loadSettlementForCharge(stripe, "ch_live"),
    { feeCents: 89, netCents: 1911 },
  )
  assert.deepEqual(
    await loadSettlementForCharge(stripe, null),
    { feeCents: null, netCents: null },
  )
})

test("a pending balance transaction still reports final figures", async () => {
  const stripe = fakeStripe({ charges: { ch_live: { fee: 33, net: 67, status: "pending" } } })

  assert.deepEqual(
    await loadSettlementForCharge(stripe, "ch_live"),
    { feeCents: 33, netCents: 67 },
  )
})

test("a registration with no payment intent never calls Stripe", async () => {
  const stripe = fakeStripe({
    retrieve: async () => {
      throw new Error("Stripe must not be called without a payment intent.")
    },
  })

  assert.deepEqual(await loadSettlement(stripe, null), { feeCents: null, netCents: null })
})

test("a Stripe failure reports no settlement instead of throwing", silenceErrors(async () => {
  const stripe = fakeStripe({
    retrieve: async () => {
      throw new Error("Stripe is unavailable.")
    },
  })

  assert.deepEqual(await loadSettlement(stripe, "pi_live"), { feeCents: null, netCents: null })
}))

test("a charge without a balance transaction yet reports no settlement", silenceErrors(async () => {
  const stripe = fakeStripe({ charges: {} })

  assert.deepEqual(await loadSettlement(stripe, "pi_live"), { feeCents: null, netCents: null })
}))

test("a payment intent with no charge yet reports no settlement", silenceErrors(async () => {
  const stripe = fakeStripe({ retrieve: async () => ({ latest_charge: null }) })

  assert.deepEqual(await loadSettlement(stripe, "pi_live"), { feeCents: null, netCents: null })
}))

test("recording settlement writes both columns for the payment intent", async () => {
  const db = fakeDatabase()

  assert.equal(
    await recordSettlement(db, "pi_live", { feeCents: 89, netCents: 1911 }),
    true,
  )
  assert.equal(db.calls.length, 1)
  assert.match(db.calls[0].sql, /UPDATE tournament_registrations/)
  assert.deepEqual(db.calls[0].bindings.slice(0, 2), [89, 1911])
  assert.equal(db.calls[0].bindings.at(-1), "pi_live")
})

// The payment columns refuse to touch a row that is already paid. Settlement
// must do the opposite, because every row it repairs is a paid one.
test("recording settlement is not blocked by an already paid registration", async () => {
  const db = fakeDatabase()
  await recordSettlement(db, "pi_live", { feeCents: 89, netCents: 1911 })

  assert.doesNotMatch(db.calls[0].sql, /payment_status/)
})

test("an incomplete settlement is never written", async () => {
  const db = fakeDatabase()

  assert.equal(await recordSettlement(db, "pi_live", { feeCents: 89, netCents: null }), false)
  assert.equal(await recordSettlement(db, null, { feeCents: 89, netCents: 1911 }), false)
  assert.equal(db.calls.length, 0)
})

test("a write that matches no registration is not reported as settled", async () => {
  const db = fakeDatabase({ changes: 0 })

  assert.equal(await recordSettlement(db, "pi_missing", { feeCents: 89, netCents: 1911 }), false)
})

test("the backfill only looks at paid card registrations that are missing figures", async () => {
  const db = fakeDatabase({ rows: [] })
  await findUnsettledRegistrations(db, 25)

  const [query] = db.calls
  assert.match(query.sql, /payment_status = 'paid'/)
  assert.match(query.sql, /payment_method = 'stripe_checkout'/)
  assert.match(query.sql, /stripe_fee_cents IS NULL OR stripe_net_cents IS NULL/)
  assert.deepEqual(query.bindings, [25])
})

test("the backfill settles the rows Stripe can answer for", async () => {
  const db = fakeDatabase({
    rows: [
      { id: "reg_settled", stripe_payment_intent_id: "pi_settled" },
      { id: "reg_pending", stripe_payment_intent_id: "pi_pending" },
    ],
  })
  const stripe = fakeStripe({
    charges: { ch_settled: { fee: 89, net: 1911 } },
    retrieve: async (id) => (
      id === "pi_settled"
        ? { latest_charge: { id: "ch_settled" } }
        : { latest_charge: { id: "ch_pending" } }
    ),
  })

  const original = console.error
  console.error = () => {}

  try {
    assert.deepEqual(await backfillSettlements(db, stripe), {
      examined: 2,
      failed: [],
      pending: ["reg_pending"],
      settled: ["reg_settled"],
    })
  } finally {
    console.error = original
  }

  const writes = db.calls.filter((call) => call.kind === "run")
  assert.equal(writes.length, 1)
  assert.equal(writes[0].bindings.at(-1), "pi_settled")
})
