import {
  byePrice,
  paymentMethods,
  paymentOptions,
  tournamentRounds,
} from "./constants.js"
import {
  getMembershipPrice,
  getMembershipTier,
} from "./pricing.js"
import {
  isValidEmail,
  isValidPhoneNumber,
  isValidUscfId,
  registrationMessages,
} from "./validation.js"

const dollarsToCents = (amount) => Math.round(amount * 100)

const trimString = (value) => (typeof value === "string" ? value.trim() : "")

export const getTournamentEntryFees = (tournament) => (
  tournament.entryFees?.length ? tournament.entryFees : [{ section: "Championship", price: 0 }]
)

export const hasActiveEarlyEntry = (tournament, now = Date.now()) => {
  const deadline = new Date(tournament.discountEndsAt).getTime()

  return Number.isFinite(deadline) && deadline > now
}

export const getEntryFeePrice = (fee, tournament, now = Date.now()) => {
  if (hasActiveEarlyEntry(tournament, now) && Number.isFinite(fee.earlyPrice)) {
    return fee.earlyPrice
  }

  return fee.price
}

const getPaymentMethodLabel = (paymentMethod) => (
  paymentOptions.find((option) => option.id === paymentMethod)?.label || paymentMethod
)

export const buildTournamentRegistration = (payload, now = Date.now(), tournament = null) => {
  const form = payload?.form || {}
  const tournamentId = trimString(payload?.tournamentId || form.tournamentId)
  const selectedTournament = tournament?.id === tournamentId ? tournament : null

  if (!selectedTournament) {
    throw new Error("Choose a valid tournament.")
  }

  const paymentMethod = trimString(form.paymentMethod || payload?.paymentMethod)
  const validPaymentMethods = paymentOptions.map((option) => option.id)

  if (!validPaymentMethods.includes(paymentMethod)) {
    throw new Error("Choose a valid payment option.")
  }

  const section = trimString(form.section)
  const entryFees = getTournamentEntryFees(selectedTournament)
  const selectedEntryFee = entryFees.find((fee) => fee.section === section)

  if (!selectedEntryFee) {
    throw new Error("Choose a valid tournament section.")
  }

  const activeMembershipStatus = trimString(form.activeMembershipStatus)

  if (!["yes", "no"].includes(activeMembershipStatus)) {
    throw new Error(registrationMessages.membershipStatus)
  }

  const name = trimString(form.name)
  const email = trimString(form.email).toLowerCase()

  if (!name || !email) {
    throw new Error(registrationMessages.nameAndEmail)
  }

  if (!isValidEmail(email)) {
    throw new Error(registrationMessages.invalidEmail)
  }

  const hasActiveMembership = activeMembershipStatus === "yes"
  const needsMembership = activeMembershipStatus === "no"
  const isExpiredMember = Boolean(form.isExpiredMember)
  const uscfId = trimString(form.uscfId)

  if (hasActiveMembership && !uscfId) {
    throw new Error(registrationMessages.activeUscfId)
  }

  if ((hasActiveMembership || isExpiredMember) && uscfId && !isValidUscfId(uscfId)) {
    throw new Error(registrationMessages.invalidUscfId)
  }

  const byes = Array.isArray(form.byes)
    ? form.byes.map((bye) => ({ round: trimString(bye?.round) })).filter((bye) => bye.round)
    : []
  const maxByeCount = selectedTournament.maxByes ?? tournamentRounds.length

  if (byes.length > maxByeCount) {
    throw new Error("Too many byes were selected.")
  }

  if (byes.some((bye) => !tournamentRounds.includes(bye.round))) {
    throw new Error("Choose valid bye rounds.")
  }

  const selectedByeRounds = byes.map((bye) => bye.round)

  if (new Set(selectedByeRounds).size !== selectedByeRounds.length) {
    throw new Error(registrationMessages.duplicateByes)
  }

  const enteredWithTeam = Boolean(form.enteredWithTeam)
  const birthDate = trimString(form.birthDate)
  const address = trimString(form.address)
  const phone = trimString(form.phone)
  const school = trimString(form.school)
  const membershipTier = needsMembership ? getMembershipTier(birthDate) : null

  if (needsMembership && (!address || !phone || !birthDate)) {
    throw new Error(registrationMessages.membershipContact)
  }

  if (needsMembership && !isValidPhoneNumber(phone)) {
    throw new Error(registrationMessages.invalidPhone)
  }

  if (needsMembership && !membershipTier) {
    throw new Error(registrationMessages.invalidBirthDate)
  }

  if (enteredWithTeam && !school) {
    throw new Error(registrationMessages.teamSchool)
  }

  const entryPrice = getEntryFeePrice(selectedEntryFee, selectedTournament, now)
  const membershipPrice = getMembershipPrice({
    needsMembership,
    membershipTier,
    isExpiredMember,
  })
  const byeTotal = byes.length * byePrice
  const total = entryPrice + byeTotal + membershipPrice

  const lineItems = [
    {
      key: "entry",
      label: `Tournament entry - ${section}`,
      amount_cents: dollarsToCents(entryPrice),
      quantity: 1,
    },
    ...byes.map((bye) => ({
      key: "bye",
      label: `Bye - ${bye.round}`,
      amount_cents: dollarsToCents(byePrice),
      quantity: 1,
    })),
  ]

  if (needsMembership && membershipPrice > 0) {
    lineItems.push({
      key: "membership",
      label: `${membershipTier.label}${isExpiredMember ? " with expired member discount" : ""}`,
      amount_cents: dollarsToCents(membershipPrice),
      quantity: 1,
    })
  }

  return {
    tournament: {
      id: selectedTournament.id,
      title: selectedTournament.title,
      type: selectedTournament.type,
      rating: selectedTournament.rating,
      dateRange: selectedTournament.dateRange,
      location: selectedTournament.location,
      address: selectedTournament.address,
      section,
      possibleByes: maxByeCount,
    },
    player: {
      name,
      email,
      phone,
      address,
      birthDate,
      school,
      uscfId,
      activeMembershipStatus,
      hasActiveMembership,
      needsMembership,
      isExpiredMember,
      enteredWithTeam,
      membershipTier,
    },
    order: {
      byes,
      lineItems,
      currency: "usd",
      paymentMethod,
      paymentMethodLabel: getPaymentMethodLabel(paymentMethod),
      entryAmountCents: dollarsToCents(entryPrice),
      byeAmountCents: dollarsToCents(byeTotal),
      membershipAmountCents: dollarsToCents(membershipPrice),
      totalAmountCents: dollarsToCents(total),
    },
  }
}

export const isStripePaymentMethod = (paymentMethod) => (
  paymentMethod === paymentMethods.stripeCheckout
)
