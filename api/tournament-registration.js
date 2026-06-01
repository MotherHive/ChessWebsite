import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js"
import { getStripe } from "./_lib/stripe.js"
import {
  getSiteUrl,
  parseJsonBody,
  sendJson,
} from "./_lib/http.js"
import {
  buildTournamentRegistration,
  isStripePaymentMethod,
} from "../src/utils/tournamentCheckout.js"
import {
  detailsFromRegistration,
  trySendRegistrationEmail,
} from "./_lib/email.js"

const toDatabaseRegistration = (registration, status) => ({
  tournament_id: registration.tournament.id,
  tournament_title: registration.tournament.title,
  tournament_type: registration.tournament.type,
  tournament_rating: registration.tournament.rating,
  tournament_date_range: registration.tournament.dateRange,
  tournament_location: registration.tournament.location,
  tournament_address: registration.tournament.address,
  section: registration.tournament.section,
  possible_byes: registration.tournament.possibleByes,
  player_name: registration.player.name,
  email: registration.player.email,
  phone: registration.player.phone || null,
  address: registration.player.address || null,
  birth_date: registration.player.birthDate || null,
  uscf_id: registration.player.uscfId || null,
  active_membership_status: registration.player.activeMembershipStatus,
  needs_membership: registration.player.needsMembership,
  is_expired_member: registration.player.isExpiredMember,
  entered_with_team: registration.player.enteredWithTeam,
  school: registration.player.school || null,
  membership_tier_label: registration.player.membershipTier?.label || null,
  byes: registration.order.byes,
  line_items: registration.order.lineItems,
  entry_amount_cents: registration.order.entryAmountCents,
  bye_amount_cents: registration.order.byeAmountCents,
  membership_amount_cents: registration.order.membershipAmountCents,
  total_amount_cents: registration.order.totalAmountCents,
  currency: registration.order.currency,
  payment_method: registration.order.paymentMethod,
  payment_status: status.paymentStatus,
  registration_status: status.registrationStatus,
})

const createStripeLineItems = (registration) => (
  registration.order.lineItems.map((lineItem) => ({
    quantity: lineItem.quantity,
    price_data: {
      currency: registration.order.currency,
      unit_amount: lineItem.amount_cents,
      product_data: {
        name: lineItem.label,
        metadata: {
          key: lineItem.key,
          tournament_id: registration.tournament.id,
        },
      },
    },
  }))
)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    sendJson(res, 405, { error: "Method not allowed." })
    return
  }

  let registration

  try {
    registration = buildTournamentRegistration(parseJsonBody(req))
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Invalid registration." })
    return
  }

  const usesStripe = isStripePaymentMethod(registration.order.paymentMethod)
  let supabase

  try {
    supabase = getSupabaseAdmin()
  } catch {
    sendJson(res, 500, { error: "Supabase admin is not configured." })
    return
  }
  const initialStatus = usesStripe
    ? { paymentStatus: "checkout_pending", registrationStatus: "pending_payment" }
    : { paymentStatus: "manual_pending", registrationStatus: "manual_pending" }

  const { data, error } = await supabase
    .from("tournament_registrations")
    .insert(toDatabaseRegistration(registration, initialStatus))
    .select("id")
    .single()

  if (error) {
    sendJson(res, 500, { error: "Could not save the registration." })
    return
  }

  if (!usesStripe) {
    await trySendRegistrationEmail(detailsFromRegistration(registration, { paid: false }))

    sendJson(res, 200, {
      registrationId: data.id,
      paymentStatus: "manual_pending",
      registrationStatus: "manual_pending",
    })
    return
  }

  if (registration.order.totalAmountCents <= 0) {
    sendJson(res, 400, { error: "Stripe checkout requires a positive order total." })
    return
  }

  let stripe

  try {
    stripe = getStripe()
  } catch {
    sendJson(res, 500, { error: "Stripe is not configured." })
    return
  }

  const siteUrl = getSiteUrl()
  let session

  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: registration.player.email,
      client_reference_id: data.id,
      line_items: createStripeLineItems(registration),
      success_url: `${siteUrl}/tournaments?checkout=success&registration_id=${data.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/tournaments?checkout=cancelled&registration_id=${data.id}`,
      metadata: {
        registration_id: data.id,
        tournament_id: registration.tournament.id,
        player_email: registration.player.email,
      },
    })
  } catch {
    await supabase
      .from("tournament_registrations")
      .update({
        payment_status: "checkout_failed",
        registration_status: "pending_payment",
      })
      .eq("id", data.id)

    sendJson(res, 500, { error: "Could not create Stripe checkout." })
    return
  }

  const { error: updateError } = await supabase
    .from("tournament_registrations")
    .update({
      stripe_checkout_session_id: session.id,
      stripe_checkout_url: session.url,
    })
    .eq("id", data.id)

  if (updateError) {
    sendJson(res, 500, { error: "Could not attach Stripe checkout to the registration." })
    return
  }

  sendJson(res, 200, {
    registrationId: data.id,
    checkoutUrl: session.url,
    paymentStatus: "checkout_pending",
    registrationStatus: "pending_payment",
  })
}
