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

// Shared between the purchase-step hints (model.js) and the final registration
// gate (buildRegistration.js) so the two can't drift apart.
export const registrationMessages = {
  nameAndEmail: "Enter the player name and email.",
  invalidEmail: "Use a valid email address, like name@example.com.",
  activeUscfId: "Enter the active USCF ID.",
  invalidUscfId: "USCF ID must be exactly 8 digits.",
  membershipStatus: "Select an active USCF membership status.",
  membershipContact: "Enter address, phone, and birth date for the membership.",
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
