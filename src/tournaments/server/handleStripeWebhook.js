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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    let registration

    try {
      registration = await updateRegistrationFromSession(db, session, event.id, {
        paymentStatus: "paid",
        registrationStatus: "confirmed",
        paidAt: new Date(event.created * 1000).toISOString(),
      })

      if (!registration) {
        registration = await loadRegistrationFromSession(db, session)
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
        return jsonResponse(500, { error: "Could not send the registration confirmation." })
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    try {
      await updateRegistrationFromSession(db, event.data.object, event.id, {
        paymentStatus: "checkout_expired",
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
