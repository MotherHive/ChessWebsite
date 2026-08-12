const parseJson = (value, fallback) => {
  if (typeof value !== "string") {
    return value ?? fallback
  }

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export const fromTournamentRow = (row) => (
  row
    ? { ...row, data: parseJson(row.data, {}) }
    : null
)

export const fromRegistrationRow = (row) => {
  if (!row) {
    return null
  }

  const parsed = { ...row }

  for (const column of ["byes", "line_items"]) {
    if (column in row) {
      parsed[column] = parseJson(row[column], [])
    }
  }

  for (const column of ["entered_with_team", "is_expired_member", "needs_membership"]) {
    if (column in row) {
      parsed[column] = Boolean(row[column])
    }
  }

  return parsed
}

export const toRegistrationRow = (row) => ({
  ...row,
  byes: JSON.stringify(row.byes || []),
  entered_with_team: Number(Boolean(row.entered_with_team)),
  is_expired_member: Number(Boolean(row.is_expired_member)),
  line_items: JSON.stringify(row.line_items || []),
  needs_membership: Number(Boolean(row.needs_membership)),
})
