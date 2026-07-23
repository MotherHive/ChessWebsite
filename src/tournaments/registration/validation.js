export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// Shared between the purchase-step hints (model.js) and the final registration
// gate (buildRegistration.js) so the two can't drift apart.
export const registrationMessages = {
  nameAndEmail: "Enter the player name and email.",
  invalidEmail: "Use a valid email address, like name@example.com.",
  activeUscfId: "Enter the active USCF ID.",
  membershipStatus: "Select an active USCF membership status.",
  membershipContact: "Enter address, phone, and birth date for the membership.",
  invalidBirthDate: "Enter a valid birth date.",
  teamSchool: "Enter the school for the team entry.",
  duplicateByes: "Choose each bye round only once.",
}

export const getPlayerSearchUrl = (name) => {
  const trimmedName = name.trim()
  const searchParams = new URLSearchParams({ fuzzy: trimmedName || "FIRST LAST" })

  return `https://ratings.uschess.org/?${searchParams.toString()}`
}
