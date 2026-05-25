export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const getPlayerSearchUrl = (name) => {
  const trimmedName = name.trim()
  const searchParams = new URLSearchParams({ fuzzy: trimmedName || "FIRST LAST" })

  return `https://ratings.uschess.org/?${searchParams.toString()}`
}
