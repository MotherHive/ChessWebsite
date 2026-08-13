export const formatDate = (value) => (
  value ? new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }) : "—"
)

export const csvEscape = (value) => {
  const text = value === null || value === undefined ? "" : String(value)

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const csvColumns = [
  ["First name", (row) => row.first_name],
  ["Last name", (row) => row.last_name],
  ["Email", (row) => row.email],
  ["Joined", (row) => formatDate(row.created_at)],
  ["Source", (row) => row.source],
  ["Welcome email sent", (row) => formatDate(row.welcome_email_sent_at)],
]

export const buildCsv = (rows) => {
  const header = csvColumns.map(([label]) => label).join(",")
  const lines = (rows || []).map((row) => (
    csvColumns.map(([, getValue]) => csvEscape(getValue(row))).join(",")
  ))

  return [header, ...lines].join("\n")
}

// Mail clients accept a comma separated address list, so this is what an admin
// pastes straight into a Bcc field.
export const buildEmailList = (rows) => (
  (rows || [])
    .map((row) => String(row.email || "").trim())
    .filter(Boolean)
    .join(", ")
)

export const buildNamedEmailList = (rows) => (
  (rows || [])
    .map((row) => {
      const email = String(row.email || "").trim()

      if (!email) {
        return ""
      }

      const name = `${row.first_name || ""} ${row.last_name || ""}`.trim()

      // A display name containing a comma or quote would split the address list
      // in a mail client unless it is quoted.
      if (!name) {
        return email
      }

      const displayName = /[",<>@]/.test(name) ? `"${name.replace(/"/g, '\\"')}"` : name

      return `${displayName} <${email}>`
    })
    .filter(Boolean)
    .join(", ")
)
