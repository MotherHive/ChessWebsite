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

const isPaid = (row) => row.payment_status === "paid"

// Cash taken at the door has no processor fee, so its net is the full total.
// A card payment's net comes from Stripe's balance transaction. Anything paid
// by card before that was recorded stays blank rather than guessing a rate,
// because a wrong number in an accounting column is worse than a missing one.
export const getSettlementCents = (row) => {
  if (!isPaid(row)) {
    return { feeCents: null, netCents: null }
  }

  if (row.payment_method !== "stripe_checkout") {
    return { feeCents: 0, netCents: row.total_amount_cents || 0 }
  }

  if (!Number.isFinite(row.stripe_net_cents)) {
    return { feeCents: null, netCents: null }
  }

  return { feeCents: row.stripe_fee_cents ?? null, netCents: row.stripe_net_cents }
}

const formatSettlement = (cents) => (Number.isFinite(cents) ? formatCents(cents) : "")

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
  ["Processor fee", (row) => formatSettlement(getSettlementCents(row).feeCents)],
  ["Net received", (row) => formatSettlement(getSettlementCents(row).netCents)],
  ["Paid at", (row) => formatDate(row.paid_at)],
]
