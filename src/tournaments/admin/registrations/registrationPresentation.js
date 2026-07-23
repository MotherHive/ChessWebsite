export const paymentStatusLabels = {
  paid: "Paid",
  checkout_pending: "Checkout pending",
  checkout_expired: "Checkout expired",
  checkout_failed: "Checkout failed",
  manual_pending: "Pay at event",
}

export const formatCents = (cents) => `$${((cents || 0) / 100).toFixed(2)}`

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
  ["Registered", (row) => formatDate(row.created_at)],
  ["Player", (row) => row.player_name],
  ["Email", (row) => row.email],
  ["Phone", (row) => row.phone],
  ["Tournament", (row) => row.tournament_title],
  ["Section", (row) => row.section],
  ["USCF ID", (row) => row.uscf_id],
  ["Active membership", (row) => row.active_membership_status],
  ["Needs membership", (row) => (row.needs_membership ? "yes" : "no")],
  ["Team", (row) => (row.entered_with_team ? "yes" : "no")],
  ["School", (row) => row.school],
  ["Byes", (row) => (row.byes || []).map((bye) => bye.round).join("; ")],
  ["Payment method", (row) => row.payment_method],
  ["Payment status", (row) => paymentStatusLabels[row.payment_status] || row.payment_status],
  ["Total", (row) => formatCents(row.total_amount_cents)],
  ["Paid at", (row) => formatDate(row.paid_at)],
]
