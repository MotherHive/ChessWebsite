import {
  formatTournamentSchemaError,
  parsePublishedTournamentRow,
} from "../schema.js"

const parsePublishedRow = (row) => {
  const result = parsePublishedTournamentRow(row)

  if (!result.success) {
    throw new Error(
      `Published tournament ${row?.id || "(unknown)"} is invalid: ${formatTournamentSchemaError(result.error)}`,
    )
  }

  return result.data
}

export const listPublishedTournaments = async (supabase) => {
  const { data, error } = await supabase
    .from("tournaments")
    .select("id, data")
    .eq("status", "published")

  if (error) {
    throw new Error("Could not load published tournaments.")
  }

  return (data || []).map(parsePublishedRow)
}

export const getPublishedTournament = async (supabase, tournamentId) => {
  const { data, error } = await supabase
    .from("tournaments")
    .select("id, data")
    .eq("id", tournamentId)
    .eq("status", "published")
    .maybeSingle()

  if (error) {
    throw new Error("Could not load the published tournament.")
  }

  return data ? parsePublishedRow(data) : null
}
