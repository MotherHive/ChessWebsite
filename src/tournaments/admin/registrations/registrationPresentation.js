export const paymentStatusLabels = {
  paid: "Paid",
  checkout_pending: "Checkout pending",
  checkout_expired: "Checkout expired",
  checkout_failed: "Checkout failed",
  manual_pending: "Unpaid",
}

export const paymentMethodLabels = {
  stripe_checkout: "Card",
  pay_at_event: "Cash at event",
}

// The status names the state and the method only qualifies it, so they are
// joined once here. Views that printed both on their own repeated themselves
// whenever a label carried the method inside the status.
export const getPaymentLabel = (row) => {
  const status = paymentStatusLabels[row.payment_status] || row.payment_status
  const method = paymentMethodLabels[row.payment_method]

  return method ? `${status} · ${method}` : status
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

// US Chess membership dues are collected on the club's behalf and passed
// straight through to US Chess, so they are not club earnings. Stripe still
// charges its fee on the full charge, which is why the club net is the settled
// net minus dues rather than the entry fees on their own.
export const getMembershipDuesCents = (row) => (
  isPaid(row) ? row.membership_amount_cents || 0 : null
)

export const getClubNetCents = (row) => {
  const { netCents } = getSettlementCents(row)

  return Number.isFinite(netCents) ? netCents - (row.membership_amount_cents || 0) : null
}

const formatSettlement = (cents) => (Number.isFinite(cents) ? formatCents(cents) : "")

// The third entry of a column is its total accessor. Columns without one are
// left blank in the totals rows.
export const csvColumns = [
  ["Registered", (row) => formatDate(row.created_at)],
  ["Player", (row) => row.player_name],
  ["Email", (row) => row.email],
  ["Phone", (row) => row.phone],
  ["Tournament", (row) => row.tournament_title],
  ["Section", (row) => row.section],
  ["US Chess ID", (row) => row.uscf_id],
  ["Active membership", (row) => row.active_membership_status],
  ["Needs membership", (row) => (row.needs_membership ? "yes" : "no")],
  ["Team", (row) => (row.entered_with_team ? "yes" : "no")],
  ["School", (row) => row.school],
  ["Student entry", (row) => (row.is_student ? "yes" : "no")],
  [
    "Student discount",
    (row) => formatCents(row.student_discount_cents),
    (row) => row.student_discount_cents || 0,
  ],
  ["Byes", (row) => (row.byes || []).map((bye) => bye.round).join("; ")],
  ["Payment method", (row) => paymentMethodLabels[row.payment_method] || row.payment_method],
  ["Payment status", (row) => paymentStatusLabels[row.payment_status] || row.payment_status],
  [
    "Total",
    (row) => formatCents(row.total_amount_cents),
    (row) => row.total_amount_cents || 0,
  ],
  [
    "Processor fee",
    (row) => formatSettlement(getSettlementCents(row).feeCents),
    (row) => getSettlementCents(row).feeCents,
  ],
  [
    "Net received",
    (row) => formatSettlement(getSettlementCents(row).netCents),
    (row) => getSettlementCents(row).netCents,
  ],
  [
    "US Chess membership dues",
    (row) => formatSettlement(getMembershipDuesCents(row)),
    getMembershipDuesCents,
  ],
  [
    "Club net",
    (row) => formatSettlement(getClubNetCents(row)),
    getClubNetCents,
  ],
  ["Paid at", (row) => formatDate(row.paid_at)],
]

const sumCents = (rows, getTotalCents) => rows.reduce((running, row) => {
  const cents = getTotalCents(row)

  return Number.isFinite(cents) ? running + cents : running
}, 0)

// Paid rows only, so every tallied number is money that actually changed hands.
// That makes the Total column's tally smaller than the literal sum of the cells
// above it whenever the export includes unpaid orders.
export const buildCsvTotalRow = (rows) => {
  const paidRows = rows.filter(isPaid)

  return csvColumns.map(([, , getTotalCents], index) => {
    if (index === 0) {
      return `Totals (paid) — ${paidRows.length} registration${paidRows.length === 1 ? "" : "s"}`
    }

    return getTotalCents ? formatCents(sumCents(paidRows, getTotalCents)) : ""
  })
}
