const joinStorageKey = "scranton-chess-club-join"
const purchaseStorageKey = "scranton-chess-tournament-purchase"
const purchaseEntryStorageKey = "scranton-chess-tournament-entry"

const sanitizePurchaseEntry = (entry) => {
  if (!entry || typeof entry !== "object") {
    return null
  }

  return {
    activeMembershipStatus: ["yes", "no"].includes(entry.activeMembershipStatus)
      ? entry.activeMembershipStatus
      : "",
    section: typeof entry.section === "string" ? entry.section : "",
  }
}

export const readSavedJoinInfo = (storage = globalThis.window?.localStorage) => {
  try {
    const savedJoinInfo = storage.getItem(joinStorageKey)

    if (!savedJoinInfo) {
      return { name: "", email: "" }
    }

    const parsedInfo = JSON.parse(savedJoinInfo)

    return {
      name: [parsedInfo.firstName, parsedInfo.lastName].filter(Boolean).join(" "),
      email: parsedInfo.email || "",
    }
  } catch {
    return { name: "", email: "" }
  }
}

export const readSavedPurchaseEntry = (
  tournamentId,
  storage = globalThis.window?.localStorage,
) => {
  if (!tournamentId) {
    return {}
  }

  try {
    const savedEntries = JSON.parse(storage.getItem(purchaseEntryStorageKey) || "{}")

    return sanitizePurchaseEntry(savedEntries[tournamentId]) || {}
  } catch {
    return {}
  }
}

export const savePurchaseEntry = (
  tournamentId,
  entry,
  storage = globalThis.window?.localStorage,
) => {
  if (!tournamentId) {
    return
  }

  try {
    const savedEntries = JSON.parse(storage.getItem(purchaseEntryStorageKey) || "{}")
    const sanitizedEntry = sanitizePurchaseEntry(entry)

    if (!savedEntries || typeof savedEntries !== "object" || Array.isArray(savedEntries)) {
      storage.setItem(purchaseEntryStorageKey, JSON.stringify({ [tournamentId]: sanitizedEntry }))
      return
    }

    storage.setItem(purchaseEntryStorageKey, JSON.stringify({
      ...savedEntries,
      [tournamentId]: sanitizedEntry,
    }))
  } catch {
    // Storage may be unavailable; in-memory form state still keeps the current entry intact.
  }
}

export const createRegistrationAttemptKey = (
  cryptoApi = globalThis.crypto,
  now = Date.now,
  random = Math.random,
) => (
  cryptoApi?.randomUUID?.()
  || `${now()}_${random().toString(36).slice(2)}_${random().toString(36).slice(2)}`
)

export const submitTournamentRegistration = async (payload, fetchRequest = fetch) => {
  const response = await fetchRequest("/api/tournament-registration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(result.error || "Could not submit the registration.")
  }

  return result
}

export const savePurchaseReceipt = (receipt, storage = globalThis.window?.localStorage) => {
  try {
    storage.setItem(purchaseStorageKey, JSON.stringify(receipt))
  } catch {
    // The server registration succeeded, so a blocked local cache should not fail the purchase.
  }
}
