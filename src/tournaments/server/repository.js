import {
  formatTournamentSchemaError,
  parsePublishedTournamentRow,
} from "../schema.js"
import { allRows, firstRow } from "@/shared/server/database"
import { fromTournamentRow } from "./databaseRows.js"

const parsePublishedRow = (row) => {
  const result = parsePublishedTournamentRow(row)

  if (!result.success) {
    throw new Error(
      `Published tournament ${row?.id || "(unknown)"} is invalid: ${formatTournamentSchemaError(result.error)}`,
    )
  }

  return result.data
}

export const listPublishedTournaments = async (db) => {
  const rows = await allRows(db.prepare(`
    SELECT id, data
    FROM tournaments
    WHERE status = 'published'
    ORDER BY created_at DESC
  `))

  return rows.map((row) => parsePublishedRow(fromTournamentRow(row)))
}

export const getPublishedTournament = async (db, tournamentId) => {
  const row = await firstRow(db.prepare(`
    SELECT id, data
    FROM tournaments
    WHERE id = ? AND status = 'published'
  `).bind(tournamentId))

  return row ? parsePublishedRow(fromTournamentRow(row)) : null
}
