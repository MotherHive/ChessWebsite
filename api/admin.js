import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js"
import { parseJsonBody, sendJson } from "./_lib/http.js"

const getAdminEmails = () => (
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
)

const getBearerToken = (req) => {
  const authorization = req.headers.authorization || ""

  return authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : ""
}

const requireAdmin = async (req, res, supabase) => {
  const adminEmails = getAdminEmails()

  if (!adminEmails.length) {
    sendJson(res, 500, { error: "ADMIN_EMAILS is not configured." })
    return null
  }

  const token = getBearerToken(req)

  if (!token) {
    sendJson(res, 401, { error: "Sign in to use the admin area." })
    return null
  }

  const { data, error } = await supabase.auth.getUser(token)
  const email = data?.user?.email?.toLowerCase()

  if (error || !email) {
    sendJson(res, 401, { error: "The session is invalid or expired. Sign in again." })
    return null
  }

  if (!adminEmails.includes(email)) {
    sendJson(res, 403, { error: "This account does not have admin access." })
    return null
  }

  return data.user
}

const slugify = (value) => (
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
)

const listTournaments = async (res, supabase) => {
  const { data, error } = await supabase
    .from("tournaments")
    .select("id, status, data, created_at, updated_at")
    .order("created_at", { ascending: false })

  if (error) {
    sendJson(res, 500, { error: "Could not load tournaments." })
    return
  }

  sendJson(res, 200, { tournaments: data })
}

const saveTournament = async (res, supabase, body) => {
  const tournamentData = body?.data

  if (!tournamentData || typeof tournamentData !== "object" || Array.isArray(tournamentData)) {
    sendJson(res, 400, { error: "Provide the tournament data." })
    return
  }

  if (!String(tournamentData.title || "").trim()) {
    sendJson(res, 400, { error: "Enter a tournament title." })
    return
  }

  const id = slugify(body.id) || slugify(tournamentData.id) || slugify(tournamentData.title)

  if (!id) {
    sendJson(res, 400, { error: "The tournament needs a valid id." })
    return
  }

  const status = ["draft", "published", "archived"].includes(body.status) ? body.status : undefined
  const row = {
    id,
    data: { ...tournamentData, id },
    ...(status ? { status } : {}),
  }

  const { data, error } = await supabase
    .from("tournaments")
    .upsert(row, { onConflict: "id" })
    .select("id, status, data, created_at, updated_at")
    .single()

  if (error) {
    sendJson(res, 500, { error: "Could not save the tournament." })
    return
  }

  sendJson(res, 200, { tournament: data })
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

const runTournamentAction = async (res, supabase, body) => {
  const id = String(body?.id || "")
  const action = String(body?.action || "")

  if (!id) {
    sendJson(res, 400, { error: "Provide the tournament id." })
    return
  }

  if (action === "delete") {
    const { error } = await supabase.from("tournaments").delete().eq("id", id)

    if (error) {
      sendJson(res, 500, { error: "Could not delete the tournament." })
      return
    }

    sendJson(res, 200, { deleted: id })
    return
  }

  const { data: existing, error: loadError } = await supabase
    .from("tournaments")
    .select("id, status, data")
    .eq("id", id)
    .single()

  if (loadError || !existing) {
    sendJson(res, 404, { error: "Tournament not found." })
    return
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

    if (error) {
      sendJson(res, 500, { error: "Could not duplicate the tournament." })
      return
    }

    sendJson(res, 200, { tournament: data })
    return
  }

  const statusByAction = {
    publish: "published",
    unpublish: "draft",
    archive: "archived",
    restore: "draft",
  }
  const nextStatus = statusByAction[action]

  if (!nextStatus) {
    sendJson(res, 400, { error: "Unknown tournament action." })
    return
  }

  const { data, error } = await supabase
    .from("tournaments")
    .update({ status: nextStatus })
    .eq("id", id)
    .select("id, status, data, created_at, updated_at")
    .single()

  if (error) {
    sendJson(res, 500, { error: "Could not update the tournament status." })
    return
  }

  sendJson(res, 200, { tournament: data })
}

const listRegistrations = async (res, supabase) => {
  const { data, error } = await supabase
    .from("tournament_registrations")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    sendJson(res, 500, { error: "Could not load registrations." })
    return
  }

  sendJson(res, 200, { registrations: data })
}

export default async function handler(req, res) {
  let supabase

  try {
    supabase = getSupabaseAdmin()
  } catch {
    sendJson(res, 500, { error: "Supabase admin is not configured." })
    return
  }

  const adminUser = await requireAdmin(req, res, supabase)

  if (!adminUser) {
    return
  }

  const resource = String(req.query?.resource || "")

  if (req.method === "GET" && resource === "tournaments") {
    await listTournaments(res, supabase)
    return
  }

  if (req.method === "GET" && resource === "registrations") {
    await listRegistrations(res, supabase)
    return
  }

  if (req.method === "POST") {
    let body

    try {
      body = parseJsonBody(req)
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body." })
      return
    }

    if (resource === "tournaments") {
      await saveTournament(res, supabase, body)
      return
    }

    if (resource === "tournament-action") {
      await runTournamentAction(res, supabase, body)
      return
    }
  }

  res.setHeader("Allow", "GET, POST")
  sendJson(res, 405, { error: "Unsupported admin request." })
}
