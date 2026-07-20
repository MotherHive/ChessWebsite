import { Buffer } from "node:buffer"
import {
  detailsFromDatabaseRow,
  trySendRegistrationEmail,
} from "../../../server/email.js"
import { jsonResponse } from "../../../server/http.js"
import { getStripe } from "../../../server/stripe.js"
import { getSupabaseAdmin } from "../../../server/supabaseAdmin.js"

export const runtime = "nodejs"

const getStripeId = (value) => {
  if (!value) {
    return null
  }

  return typeof value === "string" ? value : value.id
}

const updateRegistrationFromSession = async (supabase, session, eventId, status) => {
  const registrationId = session.metadata?.registration_id || session.client_reference_id
  const update = {
    payment_status: status.paymentStatus,
    registration_status: status.registrationStatus,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: getStripeId(session.payment_intent),
    stripe_customer_id: getStripeId(session.customer),
    stripe_payment_status: session.payment_status || null,
    stripe_event_id: eventId,
  }

  if (status.paidAt) {
    update.paid_at = status.paidAt
  }

  const query = supabase
    .from("tournament_registrations")
    .update(update)
    .neq("payment_status", "paid")

  if (registrationId) {
    return query.eq("id", registrationId).select("*").maybeSingle()
  }

  return query.eq("stripe_checkout_session_id", session.id).select("*").maybeSingle()
}

const loadRegistrationFromSession = async (supabase, session) => {
  const registrationId = session.metadata?.registration_id || session.client_reference_id

  if (registrationId) {
    return supabase
      .from("tournament_registrations")
      .select("*")
      .eq("id", registrationId)
      .maybeSingle()
  }

  return supabase
    .from("tournament_registrations")
    .select("*")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle()
}

const hasProcessedEvent = async (supabase, eventId) => (
  supabase
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle()
)

const recordProcessedEvent = async (supabase, event) => (
  supabase
    .from("stripe_webhook_events")
    .upsert(
      { id: event.id, event_type: event.type },
      { onConflict: "id", ignoreDuplicates: true },
    )
)

export async function POST(request) {
  const signature = request.headers.get("stripe-signature")

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
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
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch {
    return jsonResponse(400, { error: "Invalid Stripe webhook signature." })
  }

  let supabase

  try {
    supabase = getSupabaseAdmin()
  } catch {
    return jsonResponse(500, { error: "Supabase admin is not configured." })
  }

  const { data: processedEvent, error: processedEventError } = await hasProcessedEvent(
    supabase,
    event.id,
  )

  if (processedEventError) {
    return jsonResponse(500, { error: "Could not check the Stripe event status." })
  }

  if (processedEvent) {
    return jsonResponse(200, { received: true, duplicate: true })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    const { data: updatedRegistration, error } = await updateRegistrationFromSession(
      supabase,
      session,
      event.id,
      {
        paymentStatus: "paid",
        registrationStatus: "confirmed",
        paidAt: new Date(event.created * 1000).toISOString(),
      },
    )

    if (error) {
      return jsonResponse(500, { error: "Could not confirm the registration." })
    }

    let registration = updatedRegistration

    if (!registration) {
      const { data, error: loadError } = await loadRegistrationFromSession(supabase, session)

      if (loadError) {
        return jsonResponse(500, { error: "Could not load the confirmed registration." })
      }

      registration = data
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
    const session = event.data.object
    const { error } = await updateRegistrationFromSession(supabase, session, event.id, {
      paymentStatus: "checkout_expired",
      registrationStatus: "pending_payment",
    })

    if (error) {
      return jsonResponse(500, { error: "Could not expire the registration checkout." })
    }
  }

  const { error: recordEventError } = await recordProcessedEvent(supabase, event)

  if (recordEventError) {
    return jsonResponse(500, { error: "Could not record the processed Stripe event." })
  }

  return jsonResponse(200, { received: true })
}
