import {
  expiredMembershipDiscount,
  membershipAgeTiers,
} from "../data/tournamentCatalog.js"

export const formatPrice = (amount) => `$${amount}`

export const formatPrizePlace = (row) => {
  const hasMultipleBrackets = row.brackets.length > 1 || row.brackets.some((bracket) => bracket.includes("/"))

  if (row.place === "Top" && hasMultipleBrackets) {
    return "Top Each"
  }

  return row.place
}

export const formatCountdown = (endsAt, now) => {
  const remainingMs = new Date(endsAt).getTime() - now

  if (remainingMs <= 0) {
    return "Expired"
  }

  const totalSeconds = Math.floor(remainingMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const padTime = (value) => String(value).padStart(2, "0")

  return `${hours}h ${padTime(minutes)}m ${padTime(seconds)}s`
}

export const getTournamentStatus = (tournament, now) => {
  const startsAt = new Date(tournament.startsAt).getTime()
  const endsAt = new Date(tournament.endsAt).getTime()

  if (Number.isFinite(endsAt) && now > endsAt) {
    return "over"
  }

  if (Number.isFinite(startsAt) && now >= startsAt) {
    return "in-progress"
  }

  return "upcoming"
}

export const getAgeFromBirthDate = (birthDate) => {
  if (!birthDate) {
    return null
  }

  const today = new Date()
  const birth = new Date(`${birthDate}T00:00:00`)

  if (Number.isNaN(birth.getTime()) || birth > today) {
    return null
  }

  let age = today.getFullYear() - birth.getFullYear()
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth()
    || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())

  if (!hasHadBirthdayThisYear) {
    age -= 1
  }

  return age
}

export const getMembershipTier = (birthDate) => {
  const age = getAgeFromBirthDate(birthDate)

  if (age === null) {
    return null
  }

  return membershipAgeTiers.find((tier) => age <= tier.maxAge) || membershipAgeTiers.at(-1)
}

export const getMembershipPrice = ({ needsMembership, membershipTier, isExpiredMember }) => {
  if (!needsMembership) {
    return 0
  }

  return Math.max(0, (membershipTier?.price || 0) - (isExpiredMember ? expiredMembershipDiscount : 0))
}
