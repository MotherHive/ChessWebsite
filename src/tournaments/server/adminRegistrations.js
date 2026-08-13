import { allRows, firstRow } from "@/shared/server/database"
import { jsonResponse } from "@/shared/server/http"
import { fromRegistrationRow, fromTournamentRow } from "./databaseRows.js"

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
].join(", ")

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
].join(", ")

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
  "stripe_fee_cents",
  "stripe_net_cents",
  "paid_at",
].join(", ")

const getRegistrationFilters = (searchParams) => ({
  paymentStatus: searchParams.get("payment") || "",
  query: (searchParams.get("q") || "").trim().slice(0, 100),
  section: searchParams.get("section") || "",
  team: searchParams.get("team") || "",
  tournamentId: searchParams.get("tournament") || "",
})

const buildRegistrationFilter = (filters) => {
  const clauses = []
  const bindings = []

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

export const listRegistrations = async (db, searchParams) => {
  const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10)
  const requestedPageSize = Number.parseInt(searchParams.get("pageSize") || "25", 10)
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(100, Math.max(10, requestedPageSize))
    : 25
  const offset = (page - 1) * pageSize
  const filter = buildRegistrationFilter(getRegistrationFilters(searchParams))

  try {
    const [rows, countRow] = await Promise.all([
      allRows(db.prepare(`
        SELECT ${registrationSummaryColumns}
        FROM tournament_registrations${filter.where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...filter.bindings, pageSize, offset)),
      firstRow(db.prepare(`
        SELECT COUNT(*) AS total
        FROM tournament_registrations${filter.where}
      `).bind(...filter.bindings)),
    ])
    const total = Number(countRow?.total || 0)

    return jsonResponse(200, {
      registrations: rows.map(fromRegistrationRow),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    })
  } catch {
    return jsonResponse(500, { error: "Could not load registrations." })
  }
}

export const loadRegistration = async (db, id) => {
  if (!id) {
    return jsonResponse(400, { error: "Provide the registration id." })
  }

  try {
    const row = await firstRow(db.prepare(`
      SELECT ${registrationDetailColumns}
      FROM tournament_registrations
      WHERE id = ?
    `).bind(id))

    return row
      ? jsonResponse(200, { registration: fromRegistrationRow(row) })
      : jsonResponse(404, { error: "Registration not found." })
  } catch {
    return jsonResponse(500, { error: "Could not load the registration." })
  }
}

export const markRegistrationPaidInPerson = async (db, id) => {
  if (!id) {
    return jsonResponse(400, { error: "Provide the registration id." })
  }

  try {
    const now = new Date().toISOString()
    const updated = await firstRow(db.prepare(`
      UPDATE tournament_registrations
      SET
        paid_at = ?,
        payment_method = 'pay_at_event',
        payment_status = 'paid',
        registration_status = 'confirmed',
        updated_at = ?
      WHERE id = ? AND payment_status != 'paid'
      RETURNING ${registrationDetailColumns}
    `).bind(now, now, id))

    if (updated) {
      return jsonResponse(200, { registration: fromRegistrationRow(updated) })
    }

    const current = await firstRow(db.prepare(`
      SELECT ${registrationDetailColumns}
      FROM tournament_registrations
      WHERE id = ?
    `).bind(id))

    if (!current) {
      return jsonResponse(404, { error: "Registration not found." })
    }

    return jsonResponse(409, { error: "This registration is already marked paid." })
  } catch {
    return jsonResponse(500, { error: "Could not record the in-person payment." })
  }
}

export const listRegistrationOptions = async (db) => {
  try {
    const rows = await allRows(db.prepare(`
      SELECT id, data
      FROM tournaments
      ORDER BY created_at DESC
    `))
    const parsedRows = rows.map(fromTournamentRow)
    const tournaments = parsedRows.map((row) => ({
      id: row.id,
      title: row.data?.title || row.id,
    }))
    const sections = [...new Set(parsedRows.flatMap((row) => (
      (row.data?.entryFees || []).map((fee) => fee.section).filter(Boolean)
    )))].sort()

    return jsonResponse(200, { sections, tournaments })
  } catch {
    return jsonResponse(500, { error: "Could not load registration filters." })
  }
}

export const exportRegistrations = async (db, searchParams) => {
  const filter = buildRegistrationFilter(getRegistrationFilters(searchParams))

  try {
    const [rows, countRow] = await Promise.all([
      allRows(db.prepare(`
        SELECT ${registrationExportColumns}
        FROM tournament_registrations${filter.where}
        ORDER BY created_at DESC
        LIMIT 5000
      `).bind(...filter.bindings)),
      firstRow(db.prepare(`
        SELECT COUNT(*) AS total
        FROM tournament_registrations${filter.where}
      `).bind(...filter.bindings)),
    ])
    const total = Number(countRow?.total || 0)

    return jsonResponse(200, {
      registrations: rows.map(fromRegistrationRow),
      total,
      truncated: total > rows.length,
    })
  } catch {
    return jsonResponse(500, { error: "Could not export registrations." })
  }
}
