const separator = "\u001f"

const normalize = (value) => String(value || "").trim().toLowerCase()

// A parent may register multiple children with one email address, so email by
// itself is not a player identity. A US Chess ID is the strongest identifier;
// unrated players fall back to the normalized email and player name together.
export const getRegistrationIdentityKey = (registration) => {
  const tournamentId = normalize(registration?.tournament?.id || registration?.tournament_id)
  const uscfId = normalize(registration?.player?.uscfId || registration?.uscf_id)

  if (uscfId) {
    return `${tournamentId}${separator}uscf:${uscfId}`
  }

  const email = normalize(registration?.player?.email || registration?.email)
  const playerName = normalize(registration?.player?.name || registration?.player_name)

  return `${tournamentId}${separator}email-name:${email}${separator}${playerName}`
}

export const getCanonicalRegistrationAction = (existing, requestFingerprint) => {
  if (existing?.payment_status === "paid") {
    return "block-paid"
  }

  return existing?.request_fingerprint === requestFingerprint
    ? "reuse-unpaid"
    : "replace-unpaid"
}
