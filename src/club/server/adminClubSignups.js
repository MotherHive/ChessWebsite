import { allRows, firstRow } from "@/shared/server/database"
import { jsonResponse } from "@/shared/server/http"

const clubSignupColumns = [
  "id",
  "created_at",
  "first_name",
  "last_name",
  "email",
  "source",
  "welcome_email_sent_at",
].join(", ")

// The copy/export path pulls every address in one request, so it needs a
// ceiling that keeps a Worker response from growing without bound.
const exportLimit = 5000

const buildClubSignupFilter = (searchParams) => {
  const query = (searchParams.get("q") || "").trim().slice(0, 100)
  const searchTerm = query.replace(/[\\%_]/g, "\\$&").replace(/\s+/g, " ").trim()

  if (!searchTerm) {
    return { bindings: [], where: "" }
  }

  const pattern = `%${searchTerm}%`

  return {
    bindings: [pattern, pattern, pattern],
    where: ` WHERE (
      first_name LIKE ? ESCAPE '\\' COLLATE NOCASE OR
      last_name LIKE ? ESCAPE '\\' COLLATE NOCASE OR
      email LIKE ? ESCAPE '\\' COLLATE NOCASE
    )`,
  }
}

export const listClubSignups = async (db, searchParams) => {
  const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10)
  const requestedPageSize = Number.parseInt(searchParams.get("pageSize") || "25", 10)
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(100, Math.max(10, requestedPageSize))
    : 25
  const offset = (page - 1) * pageSize
  const filter = buildClubSignupFilter(searchParams)

  try {
    const [rows, countRow] = await Promise.all([
      allRows(db.prepare(`
        SELECT ${clubSignupColumns}
        FROM club_signups${filter.where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...filter.bindings, pageSize, offset)),
      firstRow(db.prepare(`
        SELECT COUNT(*) AS total
        FROM club_signups${filter.where}
      `).bind(...filter.bindings)),
    ])
    const total = Number(countRow?.total || 0)

    return jsonResponse(200, {
      signups: rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    })
  } catch {
    return jsonResponse(500, { error: "Could not load the mailing list." })
  }
}

export const exportClubSignups = async (db, searchParams) => {
  const filter = buildClubSignupFilter(searchParams)

  try {
    const [rows, countRow] = await Promise.all([
      allRows(db.prepare(`
        SELECT ${clubSignupColumns}
        FROM club_signups${filter.where}
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(...filter.bindings, exportLimit)),
      firstRow(db.prepare(`
        SELECT COUNT(*) AS total
        FROM club_signups${filter.where}
      `).bind(...filter.bindings)),
    ])
    const total = Number(countRow?.total || 0)

    return jsonResponse(200, {
      signups: rows,
      total,
      truncated: total > rows.length,
    })
  } catch {
    return jsonResponse(500, { error: "Could not export the mailing list." })
  }
}
