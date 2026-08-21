import { allRows, runStatement } from "../../shared/server/database.js"

// Stripe takes its cut before the payout, so the order total is what the player
// paid and the balance transaction is what the club actually receives. It is
// only available once a charge exists, so a pending session reports nothing.
export const loadSettlement = async (stripe, paymentIntentId) => {
  if (!paymentIntentId) {
    return { feeCents: null, netCents: null }
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge.balance_transaction"],
    })
    const balanceTransaction = paymentIntent?.latest_charge?.balance_transaction

    if (!balanceTransaction) {
      // A charge whose balance transaction has not been cut yet is normal and
      // temporary. Say so, because the alternative reading of a blank fee
      // column is that the Stripe call itself is broken.
      console.error(
        `Stripe settlement is not available yet for payment intent ${paymentIntentId}.`,
      )

      return { feeCents: null, netCents: null }
    }

    return readBalanceTransaction(balanceTransaction)
  } catch (error) {
    // Settlement figures are reporting detail. Failing to read them must never
    // stop a paid registration from being confirmed, but it must be visible:
    // a silent failure here leaves the club's books quietly wrong.
    console.error(
      `Could not read the Stripe settlement for payment intent ${paymentIntentId}.`,
      error,
    )

    return { feeCents: null, netCents: null }
  }
}

export const readBalanceTransaction = (balanceTransaction) => ({
  feeCents: Number.isFinite(balanceTransaction?.fee) ? balanceTransaction.fee : null,
  netCents: Number.isFinite(balanceTransaction?.net) ? balanceTransaction.net : null,
})

export const hasSettlement = (settlement) => (
  Number.isFinite(settlement?.feeCents) && Number.isFinite(settlement?.netCents)
)

// Deliberately not guarded on `payment_status != 'paid'` the way the payment
// columns are. Settlement arrives after the money does, so the only rows that
// ever need it are already paid, and re-reading Stripe is the one way to repair
// a registration whose figures were missing when the webhook first ran.
export const recordSettlement = async (db, paymentIntentId, settlement) => {
  if (!paymentIntentId || !hasSettlement(settlement)) {
    return false
  }

  const result = await runStatement(db.prepare(`
    UPDATE tournament_registrations
    SET
      stripe_fee_cents = ?,
      stripe_net_cents = ?,
      updated_at = ?
    WHERE stripe_payment_intent_id = ?
  `).bind(
    settlement.feeCents,
    settlement.netCents,
    new Date().toISOString(),
    paymentIntentId,
  ))

  return Number(result?.meta?.changes || 0) > 0
}

export const findUnsettledRegistrations = async (db, limit = 100) => allRows(db.prepare(`
  SELECT id, stripe_payment_intent_id
  FROM tournament_registrations
  WHERE payment_status = 'paid'
    AND payment_method = 'stripe_checkout'
    AND stripe_payment_intent_id IS NOT NULL
    AND (stripe_fee_cents IS NULL OR stripe_net_cents IS NULL)
  ORDER BY created_at DESC
  LIMIT ?
`).bind(limit))

// Repairs every paid card registration whose settlement figures never landed,
// whichever way they were lost: a Stripe outage during the webhook, a balance
// transaction that had not been cut yet, or a registration that predates the
// columns existing at all.
export const backfillSettlements = async (db, stripe, limit = 100) => {
  const rows = await findUnsettledRegistrations(db, limit)
  const results = { failed: [], pending: [], settled: [] }

  for (const row of rows) {
    const settlement = await loadSettlement(stripe, row.stripe_payment_intent_id)

    if (!hasSettlement(settlement)) {
      results.pending.push(row.id)
      continue
    }

    try {
      const updated = await recordSettlement(db, row.stripe_payment_intent_id, settlement)
      results[updated ? "settled" : "failed"].push(row.id)
    } catch (error) {
      console.error(`Could not store the Stripe settlement for registration ${row.id}.`, error)
      results.failed.push(row.id)
    }
  }

  return { ...results, examined: rows.length }
}
