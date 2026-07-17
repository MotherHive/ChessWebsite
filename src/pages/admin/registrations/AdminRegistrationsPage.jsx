import { useEffect, useMemo, useState } from "react"
import { adminRequest } from "../../../lib/adminApi"

const paymentStatusLabels = {
  paid: "Paid",
  checkout_pending: "Checkout pending",
  checkout_expired: "Checkout expired",
  checkout_failed: "Checkout failed",
  manual_pending: "Pay at event",
}

const formatCents = (cents) => `$${((cents || 0) / 100).toFixed(2)}`

const formatDate = (value) => (
  value ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—"
)

const csvEscape = (value) => {
  const text = value === null || value === undefined ? "" : String(value)

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const csvColumns = [
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

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [tournamentFilter, setTournamentFilter] = useState("")
  const [sectionFilter, setSectionFilter] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("")
  const [teamFilter, setTeamFilter] = useState("")
  const [searchText, setSearchText] = useState("")
  const [openRegistrationId, setOpenRegistrationId] = useState("")

  useEffect(() => {
    let isActive = true

    adminRequest("registrations")
      .then((result) => {
        if (isActive) {
          setRegistrations(result.registrations || [])
        }
      })
      .catch((error) => {
        if (isActive) {
          setMessage(error.message)
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  const tournamentOptions = useMemo(() => {
    const byId = new Map()

    registrations.forEach((row) => {
      if (!byId.has(row.tournament_id)) {
        byId.set(row.tournament_id, row.tournament_title || row.tournament_id)
      }
    })

    return [...byId.entries()]
  }, [registrations])

  const sectionOptions = useMemo(() => (
    [...new Set(registrations.map((row) => row.section).filter(Boolean))].sort()
  ), [registrations])

  const paymentOptions = useMemo(() => (
    [...new Set(registrations.map((row) => row.payment_status).filter(Boolean))].sort()
  ), [registrations])

  const filteredRegistrations = useMemo(() => {
    const query = searchText.trim().toLowerCase()

    return registrations.filter((row) => {
      if (tournamentFilter && row.tournament_id !== tournamentFilter) {
        return false
      }

      if (sectionFilter && row.section !== sectionFilter) {
        return false
      }

      if (paymentFilter && row.payment_status !== paymentFilter) {
        return false
      }

      if (teamFilter === "team" && !row.entered_with_team) {
        return false
      }

      if (teamFilter === "individual" && row.entered_with_team) {
        return false
      }

      if (!query) {
        return true
      }

      return [row.player_name, row.email, row.uscf_id, row.school]
        .some((field) => field && field.toLowerCase().includes(query))
    })
  }, [registrations, tournamentFilter, sectionFilter, paymentFilter, teamFilter, searchText])

  const totals = useMemo(() => {
    let collectedCents = 0
    let outstandingCents = 0

    filteredRegistrations.forEach((row) => {
      if (row.payment_status === "paid") {
        collectedCents += row.total_amount_cents || 0
      } else {
        outstandingCents += row.total_amount_cents || 0
      }
    })

    return {
      count: filteredRegistrations.length,
      paidCount: filteredRegistrations.filter((row) => row.payment_status === "paid").length,
      collectedCents,
      outstandingCents,
    }
  }, [filteredRegistrations])

  const openRegistration = filteredRegistrations.find((row) => row.id === openRegistrationId)
    || registrations.find((row) => row.id === openRegistrationId)

  const exportCsv = () => {
    const header = csvColumns.map(([label]) => label).join(",")
    const lines = filteredRegistrations.map((row) => (
      csvColumns.map(([, getValue]) => csvEscape(getValue(row))).join(",")
    ))
    const csvContent = [header, ...lines].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="admin-section" aria-label="Registrations">
      <div className="admin-section-header">
        <h2>Registrations</h2>
        <button className="button admin-export-button" disabled={!filteredRegistrations.length} onClick={exportCsv} type="button">
          Export CSV ({filteredRegistrations.length})
        </button>
      </div>

      {message && <p className="admin-error" role="alert">{message}</p>}

      <div className="admin-stats" aria-label="Registration totals">
        <div className="admin-stat">
          <span className="admin-stat-value">{totals.count}</span>
          <span className="admin-stat-label">Registrations</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{formatCents(totals.collectedCents)}</span>
          <span className="admin-stat-label">Collected ({totals.paidCount} paid)</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{formatCents(totals.outstandingCents)}</span>
          <span className="admin-stat-label">Outstanding ({totals.count - totals.paidCount} unpaid)</span>
        </div>
      </div>

      <div className="admin-filters">
        <label>
          Search
          <input
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Name, email, USCF ID, school"
            type="search"
            value={searchText}
          />
        </label>
        <label>
          Tournament
          <select onChange={(event) => setTournamentFilter(event.target.value)} value={tournamentFilter}>
            <option value="">All tournaments</option>
            {tournamentOptions.map(([id, title]) => (
              <option key={id} value={id}>{title}</option>
            ))}
          </select>
        </label>
        <label>
          Section
          <select onChange={(event) => setSectionFilter(event.target.value)} value={sectionFilter}>
            <option value="">All sections</option>
            {sectionOptions.map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </label>
        <label>
          Payment status
          <select onChange={(event) => setPaymentFilter(event.target.value)} value={paymentFilter}>
            <option value="">All statuses</option>
            {paymentOptions.map((paymentStatus) => (
              <option key={paymentStatus} value={paymentStatus}>
                {paymentStatusLabels[paymentStatus] || paymentStatus}
              </option>
            ))}
          </select>
        </label>
        <label>
          Team entry
          <select onChange={(event) => setTeamFilter(event.target.value)} value={teamFilter}>
            <option value="">All entries</option>
            <option value="team">Team entries</option>
            <option value="individual">Individual entries</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <p className="admin-muted">Loading registrations...</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Registered</th>
                <th>Player</th>
                <th>Tournament</th>
                <th>Section</th>
                <th>Total</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((row) => (
                <tr
                  className={`admin-clickable-row${openRegistrationId === row.id ? " admin-row-open" : ""}`}
                  key={row.id}
                  onClick={() => setOpenRegistrationId(openRegistrationId === row.id ? "" : row.id)}
                >
                  <td>{formatDate(row.created_at)}</td>
                  <td>
                    <strong>{row.player_name}</strong>
                    <span className="admin-muted admin-table-sub">{row.email}</span>
                  </td>
                  <td>{row.tournament_title}</td>
                  <td>{row.section}</td>
                  <td>{formatCents(row.total_amount_cents)}</td>
                  <td>
                    <span className={`admin-status admin-status-payment-${row.payment_status}`}>
                      {paymentStatusLabels[row.payment_status] || row.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredRegistrations.length && (
                <tr>
                  <td colSpan={6} className="admin-muted">No registrations match the filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {openRegistration && (
        <aside className="admin-detail" aria-label={`Registration for ${openRegistration.player_name}`}>
          <div className="admin-detail-header">
            <h3>{openRegistration.player_name}</h3>
            <button
              className="admin-link-button"
              onClick={() => setOpenRegistrationId("")}
              type="button"
            >
              Close
            </button>
          </div>
          <dl className="admin-detail-grid">
            <div>
              <dt>Tournament</dt>
              <dd>{openRegistration.tournament_title} — {openRegistration.section}</dd>
            </div>
            <div>
              <dt>Registered</dt>
              <dd>{formatDate(openRegistration.created_at)}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd><a href={`mailto:${openRegistration.email}`}>{openRegistration.email}</a></dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{openRegistration.phone || "—"}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{openRegistration.address || "—"}</dd>
            </div>
            <div>
              <dt>Birth date</dt>
              <dd>{openRegistration.birth_date || "—"}</dd>
            </div>
            <div>
              <dt>USCF ID</dt>
              <dd>{openRegistration.uscf_id || "—"}</dd>
            </div>
            <div>
              <dt>Active USCF membership</dt>
              <dd>
                {openRegistration.active_membership_status}
                {openRegistration.needs_membership && ` — buying ${openRegistration.membership_tier_label || "membership"}`}
                {openRegistration.is_expired_member && " (expired member discount)"}
              </dd>
            </div>
            <div>
              <dt>Team entry</dt>
              <dd>{openRegistration.entered_with_team ? openRegistration.school || "yes" : "No"}</dd>
            </div>
            <div>
              <dt>Byes</dt>
              <dd>
                {(openRegistration.byes || []).length
                  ? openRegistration.byes.map((bye) => bye.round).join(", ")
                  : "None"}
              </dd>
            </div>
            <div>
              <dt>Order</dt>
              <dd>
                {(openRegistration.line_items || []).map((lineItem, lineItemIndex) => (
                  <span className="admin-line-item" key={lineItemIndex}>
                    {lineItem.label}: {formatCents(lineItem.amount_cents)}
                  </span>
                ))}
                <strong>Total: {formatCents(openRegistration.total_amount_cents)}</strong>
              </dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>
                {openRegistration.payment_method === "stripe_checkout" ? "Stripe checkout" : "Pay at event"}
                {" — "}
                {paymentStatusLabels[openRegistration.payment_status] || openRegistration.payment_status}
                {openRegistration.paid_at && ` (paid ${formatDate(openRegistration.paid_at)})`}
              </dd>
            </div>
            <div>
              <dt>Stripe</dt>
              <dd>
                {openRegistration.stripe_payment_intent_id ? (
                  <a
                    href={`https://dashboard.stripe.com/payments/${openRegistration.stripe_payment_intent_id}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    View payment in Stripe
                  </a>
                ) : (
                  openRegistration.stripe_checkout_session_id || "—"
                )}
                {openRegistration.stripe_payment_status && (
                  <span className="admin-muted admin-table-sub">
                    Stripe status: {openRegistration.stripe_payment_status}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </aside>
      )}
    </section>
  )
}
