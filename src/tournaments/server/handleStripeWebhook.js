import { Buffer } from "node:buffer"
import { getDatabase } from "@/shared/server/cloudflare"
import { firstRow, runStatement } from "@/shared/server/database"
import {
  detailsFromDatabaseRow,
  trySendRegistrationEmail,
} from "@/shared/server/email"
import { jsonResponse } from "@/shared/server/http"
import { getStripe, getStripeWebhookSecret } from "@/shared/server/stripe"
import { fromRegistrationRow } from "./databaseRows.js"
import {
  hasSettlement,
  loadSettlement,
  loadSettlementForCharge,
  recordSettlement,
} from "./settlement.js"

const getStripeId = (value) => {
  if (!value) {
    return null
  }

  return typeof value === "string" ? value : value.id
}

const getRegistrationLookup = (session) => {
  const registrationId = session.metadata?.registration_id || session.client_reference_id

  return registrationId
    ? { column: "id", value: registrationId }
    : { column: "stripe_checkout_session_id", value: session.id }
}

const updateRegistrationFromSession = async (db, session, eventId, status) => {
  const lookup = getRegistrationLookup(session)
  const paidAt = status.paidAt || null
  const row = await firstRow(db.prepare(`
    UPDATE tournament_registrations
    SET
      payment_status = ?,
      registration_status = ?,
      stripe_checkout_session_id = ?,
      stripe_payment_intent_id = ?,
      stripe_customer_id = ?,
      stripe_payment_status = ?,
      stripe_event_id = ?,
      stripe_fee_cents = COALESCE(?, stripe_fee_cents),
      stripe_net_cents = COALESCE(?, stripe_net_cents),
      paid_at = COALESCE(?, paid_at),
      updated_at = ?
    WHERE ${lookup.column} = ? AND payment_status != 'paid'
    RETURNING *
  `).bind(
    status.paymentStatus,
    status.registrationStatus,
    session.id,
    getStripeId(session.payment_intent),
    getStripeId(session.customer),
    session.payment_status || null,
    eventId,
    status.feeCents ?? null,
    status.netCents ?? null,
    paidAt,
    new Date().toISOString(),
    lookup.value,
  ))

  return fromRegistrationRow(row)
}

const loadRegistrationFromSession = async (db, session) => {
  const lookup = getRegistrationLookup(session)
  const row = await firstRow(
    db.prepare(`SELECT * FROM tournament_registrations WHERE ${lookup.column} = ?`)
      .bind(lookup.value),
  )

  return fromRegistrationRow(row)
}

export const isSettledSession = (session) => session?.payment_status === "paid"

export const isFullyPaidSession = (session, registration) => {
  const expected = Number(registration?.total_amount_cents)
  const paid = Number(session?.amount_total)

  if (!Number.isFinite(expected) || !Number.isFinite(paid)) {
    return false
  }

  return paid >= expected
}

const hasProcessedEvent = async (db, eventId) => firstRow(
  db.prepare("SELECT id FROM stripe_webhook_events WHERE id = ?").bind(eventId),
)

const recordProcessedEvent = async (db, event) => runStatement(db.prepare(`
  INSERT OR IGNORE INTO stripe_webhook_events (id, event_type, processed_at)
  VALUES (?, ?, ?)
`).bind(event.id, event.type, new Date().toISOString()))

export async function handleStripeWebhook(request) {
  const signature = request.headers.get("stripe-signature")
  const webhookSecret = getStripeWebhookSecret()

  if (!signature || !webhookSecret) {
    return jsonResponse(400, { error: "Missing Stripe webhook signature configuration." })
  }

  let stripe

  try {
    stripe = getStripe()
  } catch {
    return jsonResponse(500, { error: "Stripe is not configured." })
  }

  const rawBody = Buffer.from(await request.arrayBuffer())
  let event

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    )
  } catch {
    return jsonResponse(400, { error: "Invalid Stripe webhook signature." })
  }

  let db

  try {
    db = getDatabase()
  } catch {
    return jsonResponse(500, { error: "The tournament database is not configured." })
  }

  let processedEvent

  try {
    processedEvent = await hasProcessedEvent(db, event.id)
  } catch {
    return jsonResponse(500, { error: "Could not check the Stripe event status." })
  }

  if (processedEvent) {
    return jsonResponse(200, { received: true, duplicate: true })
  }

  const settledEventTypes = [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
  ]

  if (settledEventTypes.includes(event.type)) {
    const session = event.data.object

    // Stripe completes a Checkout Session for delayed-notification methods
    // while the money is still in flight, so only `payment_status: paid`
    // confirms a registration. Anything else stays pending until the money
    // actually clears through `checkout.session.async_payment_succeeded`.
    if (!isSettledSession(session)) {
      try {
        await updateRegistrationFromSession(db, session, event.id, {
          paymentStatus: "checkout_pending",
          registrationStatus: "pending_payment",
        })
        await recordProcessedEvent(db, event)
      } catch {
        return jsonResponse(500, { error: "Could not record the pending Stripe payment." })
      }

      return jsonResponse(200, { received: true, pending: true })
    }

    let registration

    try {
      const pending = await loadRegistrationFromSession(db, session)

      // The amount is checked before anything is marked paid, so a session that
      // settled for less than the order total never confirms a registration.
      if (pending && !isFullyPaidSession(session, pending)) {
        return jsonResponse(400, { error: "The Stripe session underpaid the registration." })
      }

      const settlement = await loadSettlement(stripe, getStripeId(session.payment_intent))

      registration = await updateRegistrationFromSession(db, session, event.id, {
        feeCents: settlement.feeCents,
        netCents: settlement.netCents,
        paymentStatus: "paid",
        registrationStatus: "confirmed",
        paidAt: new Date(event.created * 1000).toISOString(),
      })

      if (!registration) {
        registration = pending
      }
    } catch {
      return jsonResponse(500, { error: "Could not confirm the registration." })
    }

    if (registration) {
      const emailSent = await trySendRegistrationEmail(
        detailsFromDatabaseRow(registration, { paid: true }),
        { idempotencyKey: `registration-${registration.id}-paid` },
      )

      if (!emailSent) {
        // Payment state is authoritative and must not be rolled back or retried
        // merely because the optional confirmation email provider is unavailable.
        console.error("Payment was recorded, but the registration confirmation email failed.")
      }
    }
  }

  // Stripe cuts the balance transaction moments after the charge, which can be
  // after `checkout.session.completed` has already confirmed the registration.
  // The charge events are the second chance to record what the club actually
  // banked, and they are what repairs a row the first pass left blank.
  const settlementEventTypes = ["charge.succeeded", "charge.updated"]

  if (settlementEventTypes.includes(event.type)) {
    const charge = event.data.object
    const paymentIntentId = getStripeId(charge.payment_intent)

    try {
      const settlement = await loadSettlementForCharge(stripe, getStripeId(charge))

      if (hasSettlement(settlement)) {
        await recordSettlement(db, paymentIntentId, settlement)
      }
    } catch {
      return jsonResponse(500, { error: "Could not record the Stripe settlement." })
    }
  }

  const failedEventTypes = [
    "checkout.session.expired",
    "checkout.session.async_payment_failed",
  ]

  if (failedEventTypes.includes(event.type)) {
    try {
      await updateRegistrationFromSession(db, event.data.object, event.id, {
        paymentStatus: event.type === "checkout.session.expired"
          ? "checkout_expired"
          : "checkout_failed",
        registrationStatus: "pending_payment",
      })
    } catch {
      return jsonResponse(500, { error: "Could not expire the registration checkout." })
    }
  }

  try {
    await recordProcessedEvent(db, event)
  } catch {
    return jsonResponse(500, { error: "Could not record the processed Stripe event." })
  }

  return jsonResponse(200, { received: true })
}
