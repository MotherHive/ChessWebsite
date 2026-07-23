import { jsonResponse } from "@/shared/server/http"

const registrationSummaryColumns = [
  "id",
  "created_at",
  "player_name",
  "email",
  "tournament_id",
  "tournament_title",
  "section",
  "total_amount_cents",
  "payment_status",
  "entered_with_team",
].join(",")

const registrationDetailColumns = [
  registrationSummaryColumns,
  "phone",
  "address",
  "birth_date",
  "uscf_id",
  "active_membership_status",
  "needs_membership",
  "membership_tier_label",
  "is_expired_member",
  "school",
  "byes",
  "line_items",
  "payment_method",
  "paid_at",
  "stripe_payment_intent_id",
  "stripe_checkout_session_id",
  "stripe_payment_status",
].join(",")

const registrationExportColumns = [
  "created_at",
  "player_name",
  "email",
  "phone",
  "tournament_id",
  "tournament_title",
  "section",
  "uscf_id",
  "active_membership_status",
  "needs_membership",
  "entered_with_team",
  "school",
  "byes",
  "payment_method",
  "payment_status",
  "total_amount_cents",
  "paid_at",
].join(",")

const getRegistrationFilters = (searchParams) => ({
  paymentStatus: searchParams.get("payment") || "",
  query: (searchParams.get("q") || "").trim().slice(0, 100),
  section: searchParams.get("section") || "",
  team: searchParams.get("team") || "",
  tournamentId: searchParams.get("tournament") || "",
})

const applyRegistrationFilters = (query, filters) => {
  let filteredQuery = query

  if (filters.tournamentId) {
    filteredQuery = filteredQuery.eq("tournament_id", filters.tournamentId)
  }

  if (filters.section) {
    filteredQuery = filteredQuery.eq("section", filters.section)
  }

  if (filters.paymentStatus) {
    filteredQuery = filteredQuery.eq("payment_status", filters.paymentStatus)
  }

  if (filters.team === "team" || filters.team === "individual") {
    filteredQuery = filteredQuery.eq("entered_with_team", filters.team === "team")
  }

  const searchTerm = filters.query.replace(/[,*%_()]/g, " ").replace(/\s+/g, " ").trim()

  if (searchTerm) {
    const pattern = `*${searchTerm}*`
    filteredQuery = filteredQuery.or([
      `player_name.ilike.${pattern}`,
      `email.ilike.${pattern}`,
      `uscf_id.ilike.${pattern}`,
      `school.ilike.${pattern}`,
    ].join(","))
  }

  return filteredQuery
}

export const listRegistrations = async (supabase, searchParams) => {
  const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10)
  const requestedPageSize = Number.parseInt(searchParams.get("pageSize") || "25", 10)
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(100, Math.max(10, requestedPageSize))
    : 25
  const offset = (page - 1) * pageSize
  const filters = getRegistrationFilters(searchParams)
  const query = supabase
    .from("tournament_registrations")
    .select(registrationSummaryColumns, { count: "exact" })
  const { data, error, count } = await applyRegistrationFilters(query, filters)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    return jsonResponse(500, { error: "Could not load registrations." })
  }

  const total = count || 0

  return jsonResponse(200, {
    registrations: data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  })
}

export const loadRegistration = async (supabase, id) => {
  if (!id) {
    return jsonResponse(400, { error: "Provide the registration id." })
  }

  const { data, error } = await supabase
    .from("tournament_registrations")
    .select(registrationDetailColumns)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    return jsonResponse(500, { error: "Could not load the registration." })
  }

  return data
    ? jsonResponse(200, { registration: data })
    : jsonResponse(404, { error: "Registration not found." })
}

export const markRegistrationPaidInPerson = async (supabase, id) => {
  if (!id) {
    return jsonResponse(400, { error: "Provide the registration id." })
  }

  const { data, error } = await supabase
    .from("tournament_registrations")
    .update({
      paid_at: new Date().toISOString(),
      payment_method: "pay_at_event",
      payment_status: "paid",
      registration_status: "confirmed",
    })
    .eq("id", id)
    .neq("payment_status", "paid")
    .select(registrationDetailColumns)
    .maybeSingle()

  if (error) {
    return jsonResponse(500, { error: "Could not record the in-person payment." })
  }

  if (data) {
    return jsonResponse(200, { registration: data })
  }

  const { data: current, error: loadError } = await supabase
    .from("tournament_registrations")
    .select(registrationDetailColumns)
    .eq("id", id)
    .maybeSingle()

  if (loadError) {
    return jsonResponse(500, { error: "Could not verify the registration payment." })
  }

  if (!current) {
    return jsonResponse(404, { error: "Registration not found." })
  }

  return jsonResponse(409, { error: "This registration is already marked paid." })
}

export const listRegistrationOptions = async (supabase) => {
  const { data, error } = await supabase
    .from("tournaments")
    .select("id, data")
    .order("created_at", { ascending: false })

  if (error) {
    return jsonResponse(500, { error: "Could not load registration filters." })
  }

  const tournaments = (data || []).map((row) => ({
    id: row.id,
    title: row.data?.title || row.id,
  }))
  const sections = [...new Set((data || []).flatMap((row) => (
    (row.data?.entryFees || []).map((fee) => fee.section).filter(Boolean)
  )))].sort()

  return jsonResponse(200, { sections, tournaments })
}

export const exportRegistrations = async (supabase, searchParams) => {
  const filters = getRegistrationFilters(searchParams)
  const query = supabase
    .from("tournament_registrations")
    .select(registrationExportColumns, { count: "exact" })
  const { data, error, count } = await applyRegistrationFilters(query, filters)
    .order("created_at", { ascending: false })
    .limit(5000)

  if (error) {
    return jsonResponse(500, { error: "Could not export registrations." })
  }

  return jsonResponse(200, {
    registrations: data,
    total: count || 0,
    truncated: (count || 0) > data.length,
  })
}
