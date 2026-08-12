import {
  detailsFromRegistration,
  trySendClubWelcomeEmail,
  trySendRegistrationEmail,
} from "@/shared/server/email"
import {
  getSiteUrl,
  jsonResponse,
  parseJsonRequest,
} from "@/shared/server/http"
import {
  fingerprintPayload,
  isValidIdempotencyKey,
} from "@/shared/server/idempotency"
import { getStripe } from "@/shared/server/stripe"
import { enforcePublicFormRateLimit } from "@/shared/server/rateLimit"
import { verifyTurnstile } from "@/shared/server/turnstile"
import { getDatabase } from "@/shared/server/cloudflare"
import {
  executeInsert,
  executeUpdate,
  firstRow,
  isUniqueConstraintError,
} from "@/shared/server/database"
import { getPublishedTournament } from "@/tournaments/server/repository"
import {
  buildTournamentRegistration,
  isStripePaymentMethod,
} from "@/tournaments/registration/buildRegistration"
import { fromRegistrationRow, toRegistrationRow } from "./databaseRows.js"

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

const loadRegistrationByIdempotencyKey = async (db, idempotencyKey) => fromRegistrationRow(
  await firstRow(db.prepare(`
    SELECT *
    FROM tournament_registrations
    WHERE idempotency_key = ?
  `).bind(idempotencyKey)),
)

const trySendFirstRegistrationWelcomeEmail = async (db, registrationRow) => {
  let existing

  try {
    existing = await firstRow(db.prepare(`
      SELECT id
      FROM tournament_registrations
      WHERE email = ? AND id != ?
      LIMIT 1
    `).bind(registrationRow.email, registrationRow.id))
  } catch {
    return
  }

  if (existing) {
    return
  }

  await trySendClubWelcomeEmail(
    {
      firstName: registrationRow.player_name?.split(" ")[0] || "Player",
      email: registrationRow.email,
    },
    { idempotencyKey: `registration-${registrationRow.id}-welcome` },
  )
}

const registrationResponse = (registration) => jsonResponse(200, {
  registrationId: registration.id,
  ...(registration.stripe_checkout_url ? { checkoutUrl: registration.stripe_checkout_url } : {}),
  paymentStatus: registration.payment_status,
  registrationStatus: registration.registration_status,
})

const continueStripeCheckout = async ({
  db,
  idempotencyKey,
  registration,
  stripe,
}) => {
  if (registration.payment_status === "paid" || registration.stripe_checkout_url) {
    return registrationResponse(registration)
  }

  const siteUrl = getSiteUrl()

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
    try {
      await executeUpdate(
        db,
        "tournament_registrations",
        registration.id,
        {
          payment_status: "checkout_failed",
          registration_status: "pending_payment",
        },
        " AND payment_status != 'paid'",
      )
    } catch {
      // The checkout failure is still the actionable error for the client.
    }

    return jsonResponse(500, { error: "Could not create Stripe checkout." })
  }

  let updated

  try {
    updated = await executeUpdate(
      db,
      "tournament_registrations",
      registration.id,
      {
        stripe_checkout_session_id: session.id,
        stripe_checkout_url: session.url,
        payment_status: "checkout_pending",
        registration_status: "pending_payment",
      },
      " AND payment_status != 'paid'",
    )
  } catch {
    return jsonResponse(500, { error: "Could not attach Stripe checkout to the registration." })
  }

  if (!updated) {
    try {
      const current = fromRegistrationRow(await firstRow(
        db.prepare("SELECT * FROM tournament_registrations WHERE id = ?").bind(registration.id),
      ))

      return registrationResponse(current)
    } catch {
      return jsonResponse(500, { error: "Could not load the completed registration." })
    }
  }

  return registrationResponse(fromRegistrationRow(updated))
}

export async function registerTournament(request) {
  const rateLimitResponse = await enforcePublicFormRateLimit(
    request,
    "tournament-registration",
  )

  if (rateLimitResponse) {
    return rateLimitResponse
  }

  let db

  try {
    db = getDatabase()
  } catch {
    return jsonResponse(500, { error: "The tournament database is not configured." })
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
  delete registrationPayload.turnstileToken
  const requestFingerprint = fingerprintPayload(registrationPayload)
  let existing

  try {
    existing = await loadRegistrationByIdempotencyKey(db, idempotencyKey)
  } catch {
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
      db,
      idempotencyKey,
      registration: existing,
      stripe,
    })
  }

  if (!await verifyTurnstile(request, body?.turnstileToken, "tournament_registration")) {
    return jsonResponse(400, { error: "Please complete the anti-spam check and try again." })
  }

  const requestedTournamentId = String(
    registrationPayload.tournamentId || registrationPayload.form?.tournamentId || "",
  )
  let publishedTournament

  try {
    publishedTournament = await getPublishedTournament(db, requestedTournamentId)
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
      publishedTournament,
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

  let data

  try {
    const now = new Date().toISOString()
    const databaseRegistration = toRegistrationRow(toDatabaseRegistration(
      registration,
      initialStatus,
      {
        key: idempotencyKey,
        fingerprint: requestFingerprint,
      },
    ))
    const inserted = await executeInsert(db, "tournament_registrations", {
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      ...databaseRegistration,
    })
    data = fromRegistrationRow(inserted)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      let racedRegistration

      try {
        racedRegistration = await loadRegistrationByIdempotencyKey(db, idempotencyKey)
      } catch {
        racedRegistration = null
      }

      if (racedRegistration?.request_fingerprint === requestFingerprint) {
        return usesStripe
          ? continueStripeCheckout({
            db,
            idempotencyKey,
            registration: racedRegistration,
            stripe,
          })
          : registrationResponse(racedRegistration)
      }

      if (racedRegistration) {
        return jsonResponse(409, {
          error: "This registration attempt was already used with different details.",
        })
      }
    }

    return jsonResponse(500, { error: "Could not save the registration." })
  }

  await trySendFirstRegistrationWelcomeEmail(db, data)

  if (!usesStripe) {
    await trySendRegistrationEmail(detailsFromRegistration(registration, { paid: false }), {
      idempotencyKey: `registration-${data.id}-received`,
    })

    return registrationResponse(data)
  }

  return continueStripeCheckout({
    db,
    idempotencyKey,
    registration: data,
    stripe,
  })
}
