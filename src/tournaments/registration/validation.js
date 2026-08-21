import { usStates } from "./constants.js"

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const formatUscfId = (value) => String(value ?? "").replace(/\D/g, "").slice(0, 8)

export const isValidUscfId = (value) => /^\d{8}$/.test(String(value ?? "").trim())

const getPhoneDigits = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "")

  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits
}

export const formatPhoneNumber = (value) => {
  const digits = getPhoneDigits(value).slice(0, 10)

  if (digits.length <= 3) {
    return digits
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export const isValidPhoneNumber = (value) => getPhoneDigits(value).length === 10

export const formatZipCode = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 9)

  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

export const isValidZipCode = (value) => /^\d{5}(-\d{4})?$/.test(String(value ?? "").trim())

// The field accepts either the code or the full name while typing, so it holds
// whatever was typed until a match resolves it back to the two-letter code.
export const formatStateInput = (value) => String(value ?? "")
  .replace(/[^A-Za-z. ]/g, "")
  .slice(0, 24)

export const resolveStateCode = (value) => {
  const typed = String(value ?? "").trim().toLowerCase()
  const match = usStates.find((state) => (
    state.code.toLowerCase() === typed || state.name.toLowerCase() === typed
  ))

  return match ? match.code : ""
}

export const isValidStateCode = (value) => Boolean(resolveStateCode(value))

const trimValue = (value) => String(value ?? "").trim()

// The membership fields are collected apart so autofill and validation can work
// on each one, but US Chess wants a single mailing line, so they are joined the
// way an envelope reads: street, city, state ZIP.
export const formatMailingAddress = ({ street, unit, city, state, zip } = {}) => {
  const streetLine = [trimValue(street), trimValue(unit)].filter(Boolean).join(" ")
  const cityLine = [trimValue(city), trimValue(state)].filter(Boolean).join(", ")

  return [streetLine, [cityLine, trimValue(zip)].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ")
}

export const hasCompleteAddress = ({ street, city, state, zip } = {}) => (
  Boolean(trimValue(street) && trimValue(city) && trimValue(state) && trimValue(zip))
)

// Shared between the purchase-step hints (model.js) and the final registration
// gate (buildRegistration.js) so the two can't drift apart.
export const registrationMessages = {
  nameAndEmail: "Enter the player name and email.",
  invalidEmail: "Use a valid email address, like name@example.com.",
  activeUscfId: "Enter the active US Chess ID.",
  invalidUscfId: "US Chess ID must be exactly 8 digits.",
  membershipStatus: "Select an active US Chess membership status.",
  membershipContact: "Enter the mailing address, phone, and birth date for the membership.",
  invalidZip: "Enter a valid ZIP code, like 18509 or 18509-1234.",
  invalidState: "Choose a state for the mailing address.",
  invalidPhone: "Enter a valid 10-digit US phone number.",
  invalidBirthDate: "Enter a valid birth date.",
  teamSchool: "Enter the school for the team entry.",
  duplicateByes: "Choose each bye round only once.",
}

export const getPlayerSearchUrl = (name) => {
  const trimmedName = name.trim()
  const searchParams = new URLSearchParams({ fuzzy: trimmedName || "FIRST LAST" })

  return `https://ratings.uschess.org/?${searchParams.toString()}`
}
