import {
  detailsFromRegistration,
  trySendRegistrationEmail,
} from "../../../server/email.js"
import {
  getSiteUrl,
  jsonResponse,
  parseJsonRequest,
} from "../../../server/http.js"
import {
  fingerprintPayload,
  isValidIdempotencyKey,
} from "../../../server/idempotency.js"
import { getStripe } from "../../../server/stripe.js"
import { getSupabaseAdmin } from "../../../server/supabaseAdmin.js"
import { getPublishedTournament } from "../../../server/tournamentRepository.js"
import {
  buildTournamentRegistration,
  isStripePaymentMethod,
} from "../../../src/utils/tournamentCheckout.js"

export const runtime = "nodejs"

const toDatabaseRegistration = (registration, status, idempotency) => ({
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
  idempotency_key: idempotency.key,
  request_fingerprint: idempotency.fingerprint,
})

const createStripeLineItems = (registration) => (
  registration.line_items.map((lineItem) => ({
    quantity: lineItem.quantity,
    price_data: {
      currency: registration.currency,
      unit_amount: lineItem.amount_cents,
      product_data: {
        name: lineItem.label,
        metadata: {
          key: lineItem.key,
          tournament_id: registration.tournament_id,
        },
      },
    },
  }))
)

const loadPublishedCatalog = async (supabase, tournamentId) => {
  const tournament = await getPublishedTournament(supabase, tournamentId)

  return tournament ? [tournament] : []
}

const loadRegistrationByIdempotencyKey = async (supabase, idempotencyKey) => (
  supabase
    .from("tournament_registrations")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle()
)

const registrationResponse = (registration) => jsonResponse(200, {
  registrationId: registration.id,
  ...(registration.stripe_checkout_url ? { checkoutUrl: registration.stripe_checkout_url } : {}),
  paymentStatus: registration.payment_status,
  registrationStatus: registration.registration_status,
})

const continueStripeCheckout = async ({
  idempotencyKey,
  registration,
  siteUrl,
  stripe,
  supabase,
}) => {
  if (registration.payment_status === "paid" || registration.stripe_checkout_url) {
    return registrationResponse(registration)
  }

  let session

  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: registration.email,
      client_reference_id: registration.id,
      line_items: createStripeLineItems(registration),
      success_url: `${siteUrl}/tournaments?checkout=success&registration_id=${registration.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/tournaments?checkout=cancelled&registration_id=${registration.id}`,
      metadata: {
        registration_id: registration.id,
        tournament_id: registration.tournament_id,
        player_email: registration.email,
      },
    }, { idempotencyKey: `registration-${idempotencyKey}` })
  } catch {
    await supabase
      .from("tournament_registrations")
      .update({
        payment_status: "checkout_failed",
        registration_status: "pending_payment",
      })
      .eq("id", registration.id)
      .neq("payment_status", "paid")

    return jsonResponse(500, { error: "Could not create Stripe checkout." })
  }

  const { data, error } = await supabase
    .from("tournament_registrations")
    .update({
      stripe_checkout_session_id: session.id,
      stripe_checkout_url: session.url,
      payment_status: "checkout_pending",
      registration_status: "pending_payment",
    })
    .eq("id", registration.id)
    .neq("payment_status", "paid")
    .select("*")
    .maybeSingle()

  if (error) {
    return jsonResponse(500, { error: "Could not attach Stripe checkout to the registration." })
  }

  if (!data) {
    const { data: current, error: loadError } = await supabase
      .from("tournament_registrations")
      .select("*")
      .eq("id", registration.id)
      .single()

    return loadError
      ? jsonResponse(500, { error: "Could not load the completed registration." })
      : registrationResponse(current)
  }

  return registrationResponse(data)
}

export async function POST(request) {
  let supabase

  try {
    supabase = getSupabaseAdmin()
  } catch {
    return jsonResponse(500, { error: "Supabase admin is not configured." })
  }

  let body

  try {
    body = await parseJsonRequest(request)
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." })
  }

  const idempotencyKey = body?.idempotencyKey

  if (!isValidIdempotencyKey(idempotencyKey)) {
    return jsonResponse(400, { error: "A valid registration idempotency key is required." })
  }

  const registrationPayload = { ...body }
  delete registrationPayload.idempotencyKey
  const requestFingerprint = fingerprintPayload(registrationPayload)
  const { data: existing, error: existingError } = await loadRegistrationByIdempotencyKey(
    supabase,
    idempotencyKey,
  )

  if (existingError) {
    return jsonResponse(500, { error: "Could not check the registration request." })
  }

  if (existing && existing.request_fingerprint !== requestFingerprint) {
    return jsonResponse(409, {
      error: "This registration attempt was already used with different details.",
    })
  }

  if (existing) {
    if (!isStripePaymentMethod(existing.payment_method)) {
      return registrationResponse(existing)
    }

    if (existing.payment_status === "paid" || existing.stripe_checkout_url) {
      return registrationResponse(existing)
    }

    let stripe

    try {
      stripe = getStripe()
    } catch {
      return jsonResponse(500, { error: "Stripe is not configured." })
    }

    return continueStripeCheckout({
      idempotencyKey,
      registration: existing,
      siteUrl: getSiteUrl(),
      stripe,
      supabase,
    })
  }

  const requestedTournamentId = String(
    registrationPayload.tournamentId || registrationPayload.form?.tournamentId || "",
  )
  let publishedCatalog

  try {
    publishedCatalog = await loadPublishedCatalog(supabase, requestedTournamentId)
  } catch {
    return jsonResponse(500, {
      error: "Could not validate the published tournament configuration.",
    })
  }

  let registration

  try {
    registration = buildTournamentRegistration(
      registrationPayload,
      Date.now(),
      publishedCatalog,
    )
  } catch (error) {
    return jsonResponse(400, { error: error.message || "Invalid registration." })
  }

  const usesStripe = isStripePaymentMethod(registration.order.paymentMethod)
  const initialStatus = usesStripe
    ? { paymentStatus: "checkout_pending", registrationStatus: "pending_payment" }
    : { paymentStatus: "manual_pending", registrationStatus: "manual_pending" }
  let stripe

  if (usesStripe) {
    if (registration.order.totalAmountCents <= 0) {
      return jsonResponse(400, { error: "Stripe checkout requires a positive order total." })
    }

    try {
      stripe = getStripe()
    } catch {
      return jsonResponse(500, { error: "Stripe is not configured." })
    }
  }

  const { data, error } = await supabase
    .from("tournament_registrations")
    .insert(toDatabaseRegistration(registration, initialStatus, {
      key: idempotencyKey,
      fingerprint: requestFingerprint,
    }))
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") {
      const { data: racedRegistration, error: racedError } = await loadRegistrationByIdempotencyKey(
        supabase,
        idempotencyKey,
      )

      if (!racedError && racedRegistration?.request_fingerprint === requestFingerprint) {
        return usesStripe
          ? continueStripeCheckout({
            idempotencyKey,
            registration: racedRegistration,
            siteUrl: getSiteUrl(),
            stripe,
            supabase,
          })
          : registrationResponse(racedRegistration)
      }

      if (!racedError && racedRegistration) {
        return jsonResponse(409, {
          error: "This registration attempt was already used with different details.",
        })
      }
    }

    return jsonResponse(500, { error: "Could not save the registration." })
  }

  if (!usesStripe) {
    await trySendRegistrationEmail(detailsFromRegistration(registration, { paid: false }), {
      idempotencyKey: `registration-${data.id}-received`,
    })

    return registrationResponse(data)
  }

  return continueStripeCheckout({
    idempotencyKey,
    registration: data,
    siteUrl: getSiteUrl(),
    stripe,
    supabase,
  })
}
