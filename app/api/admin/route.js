import { randomUUID } from "node:crypto"
import {
  jsonResponse,
  parseJsonRequest,
} from "../../../server/http.js"
import { getSupabaseAdmin } from "../../../server/supabaseAdmin.js"
import {
  tournamentImageTypes,
  validateTournamentImage,
} from "../../../server/tournamentImageUpload.js"
import {
  formatTournamentSchemaError,
  publishedTournamentSchema,
  tournamentDraftSchema,
} from "../../../src/domain/tournaments/tournamentSchema.js"

export const dynamic = "force-dynamic"

const getAdminEmails = () => (
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
)

const getBearerToken = (request) => {
  const authorization = request.headers.get("authorization") || ""

  return authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : ""
}

const authenticateAdmin = async (request, supabase) => {
  const adminEmails = getAdminEmails()

  if (!adminEmails.length) {
    return { response: jsonResponse(500, { error: "ADMIN_EMAILS is not configured." }) }
  }

  const token = getBearerToken(request)

  if (!token) {
    return { response: jsonResponse(401, { error: "Sign in to use the admin area." }) }
  }

  const { data, error } = await supabase.auth.getUser(token)
  const email = data?.user?.email?.toLowerCase()

  if (error || !email) {
    return {
      response: jsonResponse(401, {
        error: "The session is invalid or expired. Sign in again.",
      }),
    }
  }

  if (!adminEmails.includes(email)) {
    return { response: jsonResponse(403, { error: "This account does not have admin access." }) }
  }

  return { user: data.user }
}

const slugify = (value) => (
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
)

const listTournaments = async (supabase) => {
  const { data, error } = await supabase
    .from("tournaments")
    .select("id, status, data, created_at, updated_at")
    .order("created_at", { ascending: false })

  if (error) {
    return jsonResponse(500, { error: "Could not load tournaments." })
  }

  return jsonResponse(200, { tournaments: data })
}

const saveTournament = async (supabase, body) => {
  const tournamentData = body?.data

  if (!tournamentData || typeof tournamentData !== "object" || Array.isArray(tournamentData)) {
    return jsonResponse(400, { error: "Provide the tournament data." })
  }

  const id = slugify(body.id) || slugify(tournamentData.id) || slugify(tournamentData.title)

  if (!id) {
    return jsonResponse(400, { error: "The tournament needs a valid id." })
  }

  const validStatuses = ["draft", "published", "archived"]

  if (body.status !== undefined && !validStatuses.includes(body.status)) {
    return jsonResponse(400, { error: "Choose a valid tournament status." })
  }

  let status = body.status

  if (!status) {
    const { data: existing, error: existingError } = await supabase
      .from("tournaments")
      .select("status")
      .eq("id", id)
      .maybeSingle()

    if (existingError) {
      return jsonResponse(500, { error: "Could not determine the tournament status." })
    }

    status = existing?.status || "draft"
  }

  const schema = status === "published" ? publishedTournamentSchema : tournamentDraftSchema
  const parsedTournament = schema.safeParse({ ...tournamentData, id })

  if (!parsedTournament.success) {
    return jsonResponse(400, { error: formatTournamentSchemaError(parsedTournament.error) })
  }

  const { data, error } = await supabase
    .from("tournaments")
    .upsert({ id, data: parsedTournament.data, status }, { onConflict: "id" })
    .select("id, status, data, created_at, updated_at")
    .single()

  if (error) {
    return jsonResponse(500, { error: "Could not save the tournament." })
  }

  return jsonResponse(200, { tournament: data })
}

const findAvailableCopyId = async (supabase, baseId) => {
  const { data } = await supabase
    .from("tournaments")
    .select("id")
    .like("id", `${baseId}-copy%`)

  const takenIds = new Set((data || []).map((row) => row.id))
  let candidate = `${baseId}-copy`
  let suffix = 2

  while (takenIds.has(candidate)) {
    candidate = `${baseId}-copy-${suffix}`
    suffix += 1
  }

  return candidate
}

const runTournamentAction = async (supabase, body) => {
  const id = String(body?.id || "")
  const action = String(body?.action || "")

  if (!id) {
    return jsonResponse(400, { error: "Provide the tournament id." })
  }

  if (action === "delete") {
    const { error } = await supabase.from("tournaments").delete().eq("id", id)

    return error
      ? jsonResponse(500, { error: "Could not delete the tournament." })
      : jsonResponse(200, { deleted: id })
  }

  const { data: existing, error: loadError } = await supabase
    .from("tournaments")
    .select("id, status, data")
    .eq("id", id)
    .single()

  if (loadError || !existing) {
    return jsonResponse(404, { error: "Tournament not found." })
  }

  if (action === "duplicate") {
    const copyId = await findAvailableCopyId(supabase, existing.id)
    const copyData = {
      ...existing.data,
      id: copyId,
      title: `${existing.data.title || existing.id} (Copy)`,
    }
    const { data, error } = await supabase
      .from("tournaments")
      .insert({ id: copyId, status: "draft", data: copyData })
      .select("id, status, data, created_at, updated_at")
      .single()

    return error
      ? jsonResponse(500, { error: "Could not duplicate the tournament." })
      : jsonResponse(200, { tournament: data })
  }

  if (action === "publish") {
    const parsedTournament = publishedTournamentSchema.safeParse({
      ...existing.data,
      id: existing.id,
    })

    if (!parsedTournament.success) {
      return jsonResponse(400, { error: formatTournamentSchemaError(parsedTournament.error) })
    }
  }

  const nextStatus = {
    publish: "published",
    unpublish: "draft",
    archive: "archived",
    restore: "draft",
  }[action]

  if (!nextStatus) {
    return jsonResponse(400, { error: "Unknown tournament action." })
  }

  const { data, error } = await supabase
    .from("tournaments")
    .update({ status: nextStatus })
    .eq("id", id)
    .select("id, status, data, created_at, updated_at")
    .single()

  return error
    ? jsonResponse(500, { error: "Could not update the tournament status." })
    : jsonResponse(200, { tournament: data })
}

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

const listRegistrations = async (supabase, searchParams) => {
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

const loadRegistration = async (supabase, searchParams) => {
  const id = searchParams.get("id") || ""

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

const markRegistrationPaidInPerson = async (supabase, body) => {
  const id = String(body?.id || "")

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

const uploadTournamentImage = async (supabase, request) => {
  let formData

  try {
    formData = await request.formData()
  } catch {
    return jsonResponse(400, { error: "Could not read the image upload." })
  }

  const file = formData.get("image")
  const validationError = validateTournamentImage(file)

  if (validationError) {
    return jsonResponse(400, { error: validationError })
  }

  const extension = tournamentImageTypes.get(file.type)
  const objectPath = `${new Date().getUTCFullYear()}/${randomUUID()}.${extension}`
  const fileBytes = new Uint8Array(await file.arrayBuffer())
  const { error } = await supabase.storage
    .from("tournament-images")
    .upload(objectPath, fileBytes, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return jsonResponse(500, { error: "Could not store the tournament image." })
  }

  const { data } = supabase.storage.from("tournament-images").getPublicUrl(objectPath)

  return jsonResponse(200, { imageUrl: data.publicUrl })
}

const listRegistrationOptions = async (supabase) => {
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

const exportRegistrations = async (supabase, searchParams) => {
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

const handleAdminRequest = async (request) => {
  let supabase

  try {
    supabase = getSupabaseAdmin()
  } catch {
    return jsonResponse(500, { error: "Supabase admin is not configured." })
  }

  const authentication = await authenticateAdmin(request, supabase)

  if (authentication.response) {
    return authentication.response
  }

  const searchParams = new URL(request.url).searchParams
  const resource = searchParams.get("resource") || ""

  if (request.method === "GET" && resource === "tournaments") {
    return listTournaments(supabase)
  }

  if (request.method === "GET" && resource === "registrations") {
    return listRegistrations(supabase, searchParams)
  }

  if (request.method === "GET" && resource === "registration") {
    return loadRegistration(supabase, searchParams)
  }

  if (request.method === "GET" && resource === "registration-options") {
    return listRegistrationOptions(supabase)
  }

  if (request.method === "GET" && resource === "registration-export") {
    return exportRegistrations(supabase, searchParams)
  }

  if (request.method === "POST") {
    if (resource === "tournament-image") {
      return uploadTournamentImage(supabase, request)
    }

    let body

    try {
      body = await parseJsonRequest(request)
    } catch {
      return jsonResponse(400, { error: "Invalid JSON body." })
    }

    if (resource === "tournaments") {
      return saveTournament(supabase, body)
    }

    if (resource === "tournament-action") {
      return runTournamentAction(supabase, body)
    }

    if (resource === "registration-payment") {
      return markRegistrationPaidInPerson(supabase, body)
    }
  }

  return jsonResponse(
    405,
    { error: "Unsupported admin request." },
    { Allow: "GET, POST" },
  )
}

export const GET = handleAdminRequest
export const POST = handleAdminRequest
