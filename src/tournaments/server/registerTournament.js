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
import {
  getCanonicalRegistrationAction,
  getRegistrationIdentityKey,
} from "./registrationIdentity.js"

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
  is_student: registration.player.isStudent,
  membership_tier_label: registration.player.membershipTier?.label || null,
  byes: registration.order.byes,
  line_items: registration.order.lineItems,
  entry_amount_cents: registration.order.entryAmountCents,
  student_discount_cents: registration.order.studentDiscountAmountCents,
  bye_amount_cents: registration.order.byeAmountCents,
  membership_amount_cents: registration.order.membershipAmountCents,
  total_amount_cents: registration.order.totalAmountCents,
  currency: registration.order.currency,
  payment_method: registration.order.paymentMethod,
  payment_status: status.paymentStatus,
  registration_status: status.registrationStatus,
  idempotency_key: idempotency.key,
  request_fingerprint: idempotency.fingerprint,
  registration_identity_key: idempotency.identityKey,
  checkout_request_key: idempotency.checkoutRequestKey || null,
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

const loadRegistrationByIdentityKey = async (db, identityKey) => fromRegistrationRow(
  await firstRow(db.prepare(`
    SELECT *
    FROM tournament_registrations
    WHERE registration_identity_key = ?
  `).bind(identityKey)),
)

const loadRegistrationById = async (db, id) => fromRegistrationRow(
  await firstRow(db.prepare(`
    SELECT *
    FROM tournament_registrations
    WHERE id = ?
  `).bind(id)),
)

const resolveCanonicalRegistration = async (db, registration) => (
  registration?.superseded_by_registration_id
    ? loadRegistrationById(db, registration.superseded_by_registration_id)
    : registration
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

const registrationResponse = (registration, { checkoutUrl = registration.stripe_checkout_url } = {}) => jsonResponse(200, {
  registrationId: registration.id,
  ...(checkoutUrl ? { checkoutUrl } : {}),
  paymentStatus: registration.payment_status,
  registrationStatus: registration.registration_status,
})

const loadCurrentRegistration = async (db, registrationId) => {
  try {
    return await loadRegistrationById(db, registrationId)
  } catch {
    return null
  }
}

const claimCheckoutCreation = async (db, registration, checkoutRequestKey) => {
  if (registration.payment_status === "checkout_creating") {
    return registration
  }

  return fromRegistrationRow(await firstRow(db.prepare(`
    UPDATE tournament_registrations
    SET
      payment_status = 'checkout_creating',
      registration_status = 'pending_payment',
      checkout_request_key = ?,
      stripe_checkout_session_id = NULL,
      stripe_checkout_url = NULL,
      stripe_payment_intent_id = NULL,
      stripe_customer_id = NULL,
      stripe_payment_status = NULL,
      stripe_event_id = NULL,
      updated_at = ?
    WHERE id = ?
      AND payment_status != 'paid'
      AND payment_status != 'checkout_creating'
    RETURNING *
  `).bind(
    checkoutRequestKey,
    new Date().toISOString(),
    registration.id,
  )))
}

const createAndAttachStripeCheckout = async ({ db, registration, stripe }) => {
  const siteUrl = getSiteUrl()
  const checkoutRequestKey = registration.checkout_request_key

  if (!checkoutRequestKey) {
    return jsonResponse(500, { error: "Could not identify the Stripe checkout request." })
  }

  let session

  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: registration.email,
      client_reference_id: registration.id,
      line_items: createStripeLineItems(registration),
      success_url: `${siteUrl}/tournaments`,
      cancel_url: `${siteUrl}/tournaments`,
      metadata: {
        registration_id: registration.id,
        tournament_id: registration.tournament_id,
        player_email: registration.email,
      },
    }, { idempotencyKey: `registration-${checkoutRequestKey}` })
  } catch (error) {
    console.error("Stripe Checkout session creation failed:", error)

    try {
      await firstRow(db.prepare(`
        UPDATE tournament_registrations
        SET
          payment_status = 'checkout_failed',
          registration_status = 'pending_payment',
          updated_at = ?
        WHERE id = ?
          AND checkout_request_key = ?
          AND payment_status = 'checkout_creating'
        RETURNING id
      `).bind(new Date().toISOString(), registration.id, checkoutRequestKey))
    } catch {
      // The checkout failure is still the actionable error for the client.
    }

    return jsonResponse(500, { error: "Could not create Stripe checkout." })
  }

  let updated

  try {
    updated = fromRegistrationRow(await firstRow(db.prepare(`
      UPDATE tournament_registrations
      SET
        stripe_checkout_session_id = ?,
        stripe_checkout_url = ?,
        payment_status = 'checkout_pending',
        registration_status = 'pending_payment',
        updated_at = ?
      WHERE id = ?
        AND checkout_request_key = ?
        AND payment_status = 'checkout_creating'
      RETURNING *
    `).bind(
      session.id,
      session.url,
      new Date().toISOString(),
      registration.id,
      checkoutRequestKey,
    )))
  } catch {
    return jsonResponse(500, { error: "Could not attach Stripe checkout to the registration." })
  }

  if (!updated) {
    const current = await loadCurrentRegistration(db, registration.id)

    return current
      ? registrationResponse(current)
      : jsonResponse(500, { error: "Could not load the completed registration." })
  }

  return registrationResponse(updated)
}

const continueStripeCheckout = async ({
  db,
  idempotencyKey,
  registration,
  stripe,
}) => {
  if (registration.payment_status === "paid") {
    return registrationResponse(registration)
  }

  if (registration.payment_status === "checkout_creating") {
    return createAndAttachStripeCheckout({ db, registration, stripe })
  }

  if (
    ["checkout_expired", "checkout_failed"].includes(registration.payment_status)
    && registration.checkout_request_key === idempotencyKey
  ) {
    return jsonResponse(409, {
      error: "That checkout can no longer be used. Submit once more to start a fresh payment.",
    })
  }

  if (registration.stripe_checkout_session_id && registration.payment_status === "checkout_pending") {
    let session

    try {
      session = await stripe.checkout.sessions.retrieve(registration.stripe_checkout_session_id)
    } catch (error) {
      console.error("Stripe Checkout session lookup failed:", error)
      return jsonResponse(502, { error: "Could not verify the existing Stripe checkout." })
    }

    if (session.status === "open") {
      return registrationResponse(registration, {
        checkoutUrl: session.url || registration.stripe_checkout_url,
      })
    }

    if (session.status === "complete") {
      return registrationResponse(registration, { checkoutUrl: null })
    }
  }

  const claimed = await claimCheckoutCreation(db, registration, idempotencyKey)

  if (!claimed) {
    const current = await loadCurrentRegistration(db, registration.id)

    if (!current) {
      return jsonResponse(500, { error: "Could not prepare the Stripe checkout." })
    }

    if (current.payment_status === "checkout_creating") {
      return createAndAttachStripeCheckout({ db, registration: current, stripe })
    }

    return registrationResponse(current)
  }

  return createAndAttachStripeCheckout({ db, registration: claimed, stripe })
}

const retireExistingCheckout = async (registration, stripe) => {
  if (!registration.stripe_checkout_session_id) {
    return { retired: true }
  }

  let session

  try {
    session = await stripe.checkout.sessions.retrieve(registration.stripe_checkout_session_id)
  } catch (error) {
    console.error("Stripe Checkout session lookup failed:", error)
    return { error: "Could not verify the existing Stripe checkout." }
  }

  if (session.status === "complete") {
    if (registration.payment_status === "checkout_failed" && session.payment_status !== "paid") {
      return { retired: true }
    }

    return {
      error: session.payment_status === "paid"
        ? "This player has already paid. The registration is being confirmed."
        : "This player's payment is still processing.",
    }
  }

  if (session.status === "open") {
    try {
      await stripe.checkout.sessions.expire(session.id)
    } catch (error) {
      console.error("Stripe Checkout session expiration failed:", error)
      return { error: "Could not close the previous Stripe checkout." }
    }
  }

  return { retired: true }
}

const replaceUnpaidRegistration = async ({
  db,
  existing,
  idempotencyKey,
  registration,
  requestFingerprint,
  stripe,
}) => {
  if (existing.payment_status === "checkout_creating") {
    return jsonResponse(409, {
      error: "A checkout is already being prepared for this player. Try again in a moment.",
    })
  }

  if (existing.payment_method === "stripe_checkout" && existing.stripe_checkout_session_id) {
    const retirement = await retireExistingCheckout(existing, stripe)

    if (!retirement.retired) {
      return jsonResponse(409, { error: retirement.error })
    }
  }

  const usesStripe = isStripePaymentMethod(registration.order.paymentMethod)
  const status = usesStripe
    ? { paymentStatus: "checkout_creating", registrationStatus: "pending_payment" }
    : { paymentStatus: "manual_pending", registrationStatus: "manual_pending" }
  const replacement = toRegistrationRow(toDatabaseRegistration(
    registration,
    status,
    {
      checkoutRequestKey: usesStripe ? idempotencyKey : null,
      fingerprint: requestFingerprint,
      identityKey: existing.registration_identity_key,
      key: existing.idempotency_key,
    },
  ))

  Object.assign(replacement, {
    paid_at: null,
    stripe_checkout_session_id: null,
    stripe_checkout_url: null,
    stripe_customer_id: null,
    stripe_event_id: null,
    stripe_fee_cents: null,
    stripe_net_cents: null,
    stripe_payment_intent_id: null,
    stripe_payment_status: null,
  })

  let updated

  try {
    updated = await executeUpdate(
      db,
      "tournament_registrations",
      existing.id,
      replacement,
      " AND payment_status != 'paid'",
    )
  } catch {
    return jsonResponse(500, { error: "Could not update the unpaid registration." })
  }

  if (!updated) {
    return jsonResponse(409, { error: "This player is already registered and paid." })
  }

  const row = fromRegistrationRow(updated)

  if (usesStripe) {
    return continueStripeCheckout({ db, idempotencyKey, registration: row, stripe })
  }

  await trySendRegistrationEmail(detailsFromRegistration(registration, { paid: false }), {
    idempotencyKey: `registration-${row.id}-received`,
  })

  return registrationResponse(row)
}

const handleCanonicalRegistration = async ({
  db,
  existing,
  idempotencyKey,
  registration,
  requestFingerprint,
  stripe,
}) => {
  const action = getCanonicalRegistrationAction(existing, requestFingerprint)

  if (action === "block-paid") {
    return jsonResponse(409, { error: "This player is already registered and paid for this tournament." })
  }

  if (action === "replace-unpaid") {
    return replaceUnpaidRegistration({
      db,
      existing,
      idempotencyKey,
      registration,
      requestFingerprint,
      stripe,
    })
  }

  return isStripePaymentMethod(existing.payment_method)
    ? continueStripeCheckout({ db, idempotencyKey, registration: existing, stripe })
    : registrationResponse(existing)
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
    try {
      existing = await resolveCanonicalRegistration(db, existing)
    } catch {
      return jsonResponse(500, { error: "Could not load the canonical registration." })
    }

    if (!existing) {
      return jsonResponse(500, { error: "Could not load the canonical registration." })
    }

    if (!isStripePaymentMethod(existing.payment_method)) {
      return registrationResponse(existing)
    }

    if (existing.payment_status === "paid") {
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
  const identityKey = getRegistrationIdentityKey(registration)
  const initialStatus = usesStripe
    ? { paymentStatus: "checkout_creating", registrationStatus: "pending_payment" }
    : { paymentStatus: "manual_pending", registrationStatus: "manual_pending" }
  let canonicalRegistration

  try {
    canonicalRegistration = await loadRegistrationByIdentityKey(db, identityKey)
  } catch {
    return jsonResponse(500, { error: "Could not check for an existing player registration." })
  }

  if (canonicalRegistration?.payment_status === "paid") {
    return jsonResponse(409, {
      error: "This player is already registered and paid for this tournament.",
    })
  }

  let stripe

  if (usesStripe || isStripePaymentMethod(canonicalRegistration?.payment_method)) {
    if (usesStripe && registration.order.totalAmountCents <= 0) {
      return jsonResponse(400, { error: "Stripe checkout requires a positive order total." })
    }

    try {
      stripe = getStripe()
    } catch {
      return jsonResponse(500, { error: "Stripe is not configured." })
    }
  }

  if (canonicalRegistration) {
    return handleCanonicalRegistration({
      db,
      existing: canonicalRegistration,
      idempotencyKey,
      registration,
      requestFingerprint,
      stripe,
    })
  }

  let data

  try {
    const now = new Date().toISOString()
    const databaseRegistration = toRegistrationRow(toDatabaseRegistration(
      registration,
      initialStatus,
      {
        checkoutRequestKey: usesStripe ? idempotencyKey : null,
        key: idempotencyKey,
        fingerprint: requestFingerprint,
        identityKey,
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
          || await loadRegistrationByIdentityKey(db, identityKey)
      } catch {
        racedRegistration = null
      }

      if (racedRegistration) {
        return handleCanonicalRegistration({
          db,
          existing: racedRegistration,
          idempotencyKey,
          registration,
          requestFingerprint,
          stripe,
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
