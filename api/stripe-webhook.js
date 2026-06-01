import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js"
import { getStripe } from "./_lib/stripe.js"
import { sendJson } from "./_lib/http.js"
import {
  detailsFromDatabaseRow,
  trySendRegistrationEmail,
} from "./_lib/email.js"

export const config = {
  api: {
    bodyParser: false,
  },
}

const readRawBody = (req) => new Promise((resolve, reject) => {
  if (Buffer.isBuffer(req.body)) {
    resolve(req.body)
    return
  }

  if (typeof req.body === "string") {
    resolve(Buffer.from(req.body))
    return
  }

  if (req.body && typeof req.body === "object") {
    resolve(Buffer.from(JSON.stringify(req.body)))
    return
  }

  const chunks = []

  req.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
  req.on("end", () => resolve(Buffer.concat(chunks)))
  req.on("error", reject)
})

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

  if (registrationId) {
    return query.eq("id", registrationId).select("*").maybeSingle()
  }

  return query.eq("stripe_checkout_session_id", session.id).select("*").maybeSingle()
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    sendJson(res, 405, { error: "Method not allowed." })
    return
  }

  const signature = req.headers["stripe-signature"]

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    sendJson(res, 400, { error: "Missing Stripe webhook signature configuration." })
    return
  }

  let stripe

  try {
    stripe = getStripe()
  } catch {
    sendJson(res, 500, { error: "Stripe is not configured." })
    return
  }

  const rawBody = await readRawBody(req)
  let event

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch {
    sendJson(res, 400, { error: "Invalid Stripe webhook signature." })
    return
  }

  let supabase

  try {
    supabase = getSupabaseAdmin()
  } catch {
    sendJson(res, 500, { error: "Supabase admin is not configured." })
    return
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    const { data, error } = await updateRegistrationFromSession(supabase, session, event.id, {
      paymentStatus: "paid",
      registrationStatus: "confirmed",
      paidAt: new Date().toISOString(),
    })

    if (error) {
      sendJson(res, 500, { error: "Could not confirm the registration." })
      return
    }

    if (data) {
      await trySendRegistrationEmail(detailsFromDatabaseRow(data, { paid: true }))
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object
    const { error } = await updateRegistrationFromSession(supabase, session, event.id, {
      paymentStatus: "checkout_expired",
      registrationStatus: "pending_payment",
    })

    if (error) {
      sendJson(res, 500, { error: "Could not expire the registration checkout." })
      return
    }
  }

  sendJson(res, 200, { received: true })
}
