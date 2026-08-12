import { allRows, firstRow, runStatement } from "@/shared/server/database"
import { jsonResponse } from "@/shared/server/http"
import {
  formatTournamentSchemaError,
  publishedTournamentSchema,
  tournamentDraftSchema,
} from "@/tournaments/schema"
import { fromTournamentRow } from "./databaseRows.js"

const tournamentColumns = "id, status, data, created_at, updated_at"

const slugify = (value) => (
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
)

export const listTournaments = async (db) => {
  try {
    const rows = await allRows(db.prepare(`
      SELECT ${tournamentColumns}
      FROM tournaments
      ORDER BY created_at DESC
    `))

    return jsonResponse(200, { tournaments: rows.map(fromTournamentRow) })
  } catch {
    return jsonResponse(500, { error: "Could not load tournaments." })
  }
}

export const saveTournament = async (db, body) => {
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

  try {
    if (!status) {
      const existing = await firstRow(
        db.prepare("SELECT status FROM tournaments WHERE id = ?").bind(id),
      )
      status = existing?.status || "draft"
    }

    const schema = status === "published" ? publishedTournamentSchema : tournamentDraftSchema
    const parsedTournament = schema.safeParse({ ...tournamentData, id })

    if (!parsedTournament.success) {
      return jsonResponse(400, { error: formatTournamentSchemaError(parsedTournament.error) })
    }

    const now = new Date().toISOString()
    const row = await firstRow(db.prepare(`
      INSERT INTO tournaments (id, status, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        data = excluded.data,
        updated_at = excluded.updated_at
      RETURNING ${tournamentColumns}
    `).bind(id, status, JSON.stringify(parsedTournament.data), now, now))

    return jsonResponse(200, { tournament: fromTournamentRow(row) })
  } catch {
    return jsonResponse(500, { error: "Could not save the tournament." })
  }
}

const findAvailableCopyId = async (db, baseId) => {
  const rows = await allRows(
    db.prepare("SELECT id FROM tournaments WHERE id LIKE ?").bind(`${baseId}-copy%`),
  )
  const takenIds = new Set(rows.map((row) => row.id))
  let candidate = `${baseId}-copy`
  let suffix = 2

  while (takenIds.has(candidate)) {
    candidate = `${baseId}-copy-${suffix}`
    suffix += 1
  }

  return candidate
}

export const runTournamentAction = async (db, id, action) => {
  if (!id) {
    return jsonResponse(400, { error: "Provide the tournament id." })
  }

  try {
    if (action === "delete") {
      await runStatement(db.prepare("DELETE FROM tournaments WHERE id = ?").bind(id))
      return jsonResponse(200, { deleted: id })
    }

    const loaded = await firstRow(
      db.prepare("SELECT id, status, data FROM tournaments WHERE id = ?").bind(id),
    )
    const existing = fromTournamentRow(loaded)

    if (!existing) {
      return jsonResponse(404, { error: "Tournament not found." })
    }

    if (action === "duplicate") {
      const copyId = await findAvailableCopyId(db, existing.id)
      const copyData = {
        ...existing.data,
        id: copyId,
        title: `${existing.data.title || existing.id} (Copy)`,
      }
      const now = new Date().toISOString()
      const row = await firstRow(db.prepare(`
        INSERT INTO tournaments (id, status, data, created_at, updated_at)
        VALUES (?, 'draft', ?, ?, ?)
        RETURNING ${tournamentColumns}
      `).bind(copyId, JSON.stringify(copyData), now, now))

      return jsonResponse(200, { tournament: fromTournamentRow(row) })
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

    const row = await firstRow(db.prepare(`
      UPDATE tournaments
      SET status = ?, updated_at = ?
      WHERE id = ?
      RETURNING ${tournamentColumns}
    `).bind(nextStatus, new Date().toISOString(), id))

    return jsonResponse(200, { tournament: fromTournamentRow(row) })
  } catch {
    return jsonResponse(500, { error: "Could not update the tournament." })
  }
}
