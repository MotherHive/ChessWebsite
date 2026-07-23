import { jsonResponse } from "@/shared/server/http"
import {
  formatTournamentSchemaError,
  publishedTournamentSchema,
  tournamentDraftSchema,
} from "@/tournaments/schema"

const slugify = (value) => (
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
)

export const listTournaments = async (supabase) => {
  const { data, error } = await supabase
    .from("tournaments")
    .select("id, status, data, created_at, updated_at")
    .order("created_at", { ascending: false })

  if (error) {
    return jsonResponse(500, { error: "Could not load tournaments." })
  }

  return jsonResponse(200, { tournaments: data })
}

export const saveTournament = async (supabase, body) => {
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

export const runTournamentAction = async (supabase, id, action) => {
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
