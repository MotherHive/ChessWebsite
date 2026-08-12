export const allRows = async (statement) => {
  const result = await statement.all()

  if (!result.success) {
    throw new Error("The database query failed.")
  }

  return result.results || []
}

export const firstRow = async (statement) => statement.first()

export const runStatement = async (statement) => {
  const result = await statement.run()

  if (!result.success) {
    throw new Error("The database statement failed.")
  }

  return result
}

export const executeInsert = async (db, table, row) => {
  const columns = Object.keys(row)
  const placeholders = columns.map(() => "?").join(", ")
  const statement = db.prepare(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`,
  )

  return firstRow(statement.bind(...Object.values(row)))
}

export const executeUpdate = async (db, table, id, changes, condition = "") => {
  const entries = Object.entries(changes)
  const assignments = entries.map(([column]) => `${column} = ?`).join(", ")
  const statement = db.prepare(
    `UPDATE ${table} SET ${assignments}, updated_at = ? WHERE id = ?${condition} RETURNING *`,
  )

  return firstRow(statement.bind(
    ...entries.map(([, value]) => value),
    new Date().toISOString(),
    id,
  ))
}

export const isUniqueConstraintError = (error) => (
  error instanceof Error && /unique constraint/i.test(error.message)
)
