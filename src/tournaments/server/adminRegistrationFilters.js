export const getRegistrationFilters = (searchParams) => ({
  paymentStatus: searchParams.get("payment") || "",
  query: (searchParams.get("q") || "").trim().slice(0, 100),
  section: searchParams.get("section") || "",
  team: searchParams.get("team") || "",
  tournamentId: searchParams.get("tournament") || "",
})

export const buildRegistrationFilter = (filters) => {
  const clauses = []
  const bindings = []

  clauses.push("(superseded_by_registration_id IS NULL OR payment_status = 'paid')")

  // Card checkout rows are operational state, not registrations or accounts
  // receivable. They enter the administrative roster only after payment.
  if (!filters.paymentStatus) {
    clauses.push("payment_status IN ('paid', 'manual_pending')")
  }

  if (filters.tournamentId) {
    clauses.push("tournament_id = ?")
    bindings.push(filters.tournamentId)
  }

  if (filters.section) {
    clauses.push("section = ?")
    bindings.push(filters.section)
  }

  if (filters.paymentStatus) {
    clauses.push("payment_status = ?")
    bindings.push(filters.paymentStatus)
  }

  if (filters.team === "team" || filters.team === "individual") {
    clauses.push("entered_with_team = ?")
    bindings.push(filters.team === "team" ? 1 : 0)
  }

  const searchTerm = filters.query.replace(/[\\%_]/g, "\\$&").replace(/\s+/g, " ").trim()

  if (searchTerm) {
    clauses.push(`(
      player_name LIKE ? ESCAPE '\\' COLLATE NOCASE OR
      email LIKE ? ESCAPE '\\' COLLATE NOCASE OR
      uscf_id LIKE ? ESCAPE '\\' COLLATE NOCASE OR
      school LIKE ? ESCAPE '\\' COLLATE NOCASE
    )`)
    const pattern = `%${searchTerm}%`
    bindings.push(pattern, pattern, pattern, pattern)
  }

  return {
    bindings,
    where: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "",
  }
}
