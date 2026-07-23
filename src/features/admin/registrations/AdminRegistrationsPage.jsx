"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  const detailRequestRef = useRef(0)
  const [registrations, setRegistrations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [paymentActionState, setPaymentActionState] = useState("idle")
  const [paymentActionMessage, setPaymentActionMessage] = useState("")
  const [message, setMessage] = useState("")
  const [tournamentFilter, setTournamentFilter] = useState("")
  const [sectionFilter, setSectionFilter] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("")
  const [teamFilter, setTeamFilter] = useState("")
  const [searchText, setSearchText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [openRegistrationId, setOpenRegistrationId] = useState("")
  const [openRegistration, setOpenRegistration] = useState(null)
  const [tournamentOptions, setTournamentOptions] = useState([])
  const [sectionOptions, setSectionOptions] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
  })

  const registrationQuery = useMemo(() => ({
    page: pagination.page,
    pageSize: pagination.pageSize,
    payment: paymentFilter,
    q: searchQuery,
    section: sectionFilter,
    team: teamFilter,
    tournament: tournamentFilter,
  }), [
    pagination.page,
    pagination.pageSize,
    paymentFilter,
    searchQuery,
    sectionFilter,
    teamFilter,
    tournamentFilter,
  ])

  useEffect(() => {
    const nextSearchQuery = searchText.trim()

    if (nextSearchQuery === searchQuery) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      detailRequestRef.current += 1
      setIsLoading(true)
      setSearchQuery(nextSearchQuery)
      setPagination((current) => ({ ...current, page: 1 }))
      setOpenRegistrationId("")
      setOpenRegistration(null)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchQuery, searchText])

  useEffect(() => {
    const controller = new AbortController()

    adminRequest("registrations", {
      query: registrationQuery,
      signal: controller.signal,
    })
      .then((result) => {
        setRegistrations(result.registrations || [])
        setPagination(result.pagination || {
          page: 1,
          pageSize: 25,
          total: 0,
          totalPages: 1,
        })
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setMessage(error.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [registrationQuery])

  useEffect(() => {
    let isActive = true

    adminRequest("registration-options")
      .then((result) => {
        if (isActive) {
          setTournamentOptions(result.tournaments || [])
          setSectionOptions(result.sections || [])
        }
      })
      .catch((error) => {
        if (isActive) {
          setMessage(error.message)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  const updateFilter = (setter, value) => {
    detailRequestRef.current += 1
    setIsLoading(true)
    setter(value)
    setPagination((current) => ({ ...current, page: 1 }))
    setOpenRegistrationId("")
    setOpenRegistration(null)
  }

  const changePage = (page) => {
    detailRequestRef.current += 1
    setIsLoading(true)
    setPagination((current) => ({ ...current, page }))
    setOpenRegistrationId("")
    setOpenRegistration(null)
  }

  const paymentOptions = Object.keys(paymentStatusLabels)

  const pageTotals = useMemo(() => {
    let collectedCents = 0
    let outstandingCents = 0
    let paidCount = 0

    registrations.forEach((row) => {
      if (row.payment_status === "paid") {
        paidCount += 1
        collectedCents += row.total_amount_cents || 0
      } else {
        outstandingCents += row.total_amount_cents || 0
      }
    })

    return { collectedCents, outstandingCents, paidCount }
  }, [registrations])

  const toggleRegistration = async (row) => {
    if (openRegistrationId === row.id) {
      detailRequestRef.current += 1
      setOpenRegistrationId("")
      setOpenRegistration(null)
      return
    }

    const requestId = detailRequestRef.current + 1
    detailRequestRef.current = requestId
    setOpenRegistrationId(row.id)
    setOpenRegistration(null)
    setIsDetailLoading(true)
    setPaymentActionState("idle")
    setPaymentActionMessage("")

    try {
      const result = await adminRequest("registration", { query: { id: row.id } })
      if (detailRequestRef.current === requestId) {
        setOpenRegistration(result.registration || null)
      }
    } catch (error) {
      if (detailRequestRef.current === requestId) {
        setMessage(error.message)
        setOpenRegistrationId("")
      }
    } finally {
      if (detailRequestRef.current === requestId) {
        setIsDetailLoading(false)
      }
    }
  }

  const markPaidInPerson = async () => {
    if (!openRegistration || !window.confirm(
      `Record ${formatCents(openRegistration.total_amount_cents)} received in person from ${openRegistration.player_name}?`,
    )) {
      return
    }

    setPaymentActionState("saving")
    setPaymentActionMessage("")

    try {
      const result = await adminRequest("registration-payment", {
        method: "POST",
        body: { id: openRegistration.id },
      })
      const updatedRegistration = result.registration

      setOpenRegistration(updatedRegistration)
      setRegistrations((current) => current.map((row) => (
        row.id === updatedRegistration.id ? { ...row, ...updatedRegistration } : row
      )))
      setPaymentActionState("saved")
      setPaymentActionMessage("In-person payment recorded.")
    } catch (error) {
      setPaymentActionState("error")
      setPaymentActionMessage(error.message)
    }
  }

  const exportCsv = async () => {
    setIsExporting(true)
    setMessage("")

    let result

    try {
      result = await adminRequest("registration-export", {
        query: {
          ...registrationQuery,
          page: undefined,
          pageSize: undefined,
        },
      })
    } catch (error) {
      setMessage(error.message)
      setIsExporting(false)
      return
    }

    const exportRows = result.registrations || []
    const header = csvColumns.map(([label]) => label).join(",")
    const lines = exportRows.map((row) => (
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
    setIsExporting(false)

    if (result.truncated) {
      setMessage(`The export was limited to ${exportRows.length} of ${result.total} registrations.`)
    }
  }

  return (
    <section className="admin-section" aria-label="Registrations">
      <div className="admin-section-header">
        <h2>Registrations</h2>
        <button
          className="button admin-export-button"
          disabled={!pagination.total || isExporting}
          onClick={exportCsv}
          type="button"
        >
          {isExporting ? "Preparing export..." : `Export CSV (${pagination.total})`}
        </button>
      </div>

      {message && <p className="admin-error" role="alert">{message}</p>}

      <div className="admin-stats" aria-label="Registration totals">
        <div className="admin-stat">
          <span className="admin-stat-value">{pagination.total}</span>
          <span className="admin-stat-label">Matching registrations</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{formatCents(pageTotals.collectedCents)}</span>
          <span className="admin-stat-label">This page collected ({pageTotals.paidCount} paid)</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{formatCents(pageTotals.outstandingCents)}</span>
          <span className="admin-stat-label">
            This page outstanding ({registrations.length - pageTotals.paidCount} unpaid)
          </span>
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
          <select
            onChange={(event) => updateFilter(setTournamentFilter, event.target.value)}
            value={tournamentFilter}
          >
            <option value="">All tournaments</option>
            {tournamentOptions.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>{tournament.title}</option>
            ))}
          </select>
        </label>
        <label>
          Section
          <select
            onChange={(event) => updateFilter(setSectionFilter, event.target.value)}
            value={sectionFilter}
          >
            <option value="">All sections</option>
            {sectionOptions.map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </label>
        <label>
          Payment status
          <select
            onChange={(event) => updateFilter(setPaymentFilter, event.target.value)}
            value={paymentFilter}
          >
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
          <select
            onChange={(event) => updateFilter(setTeamFilter, event.target.value)}
            value={teamFilter}
          >
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
              {registrations.map((row) => (
                <tr
                  className={`admin-clickable-row${openRegistrationId === row.id ? " admin-row-open" : ""}`}
                  key={row.id}
                  onClick={() => toggleRegistration(row)}
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
              {!registrations.length && (
                <tr>
                  <td colSpan={6} className="admin-muted">No registrations match the filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && pagination.total > 0 && (
        <nav className="admin-pagination" aria-label="Registration pages">
          <span>
            Showing {(pagination.page - 1) * pagination.pageSize + 1}–{Math.min(
              pagination.page * pagination.pageSize,
              pagination.total,
            )} of {pagination.total}
          </span>
          <div>
            <button
              className="admin-link-button"
              disabled={pagination.page <= 1}
              onClick={() => changePage(Math.max(1, pagination.page - 1))}
              type="button"
            >
              Previous
            </button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button
              className="admin-link-button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => changePage(Math.min(pagination.totalPages, pagination.page + 1))}
              type="button"
            >
              Next
            </button>
          </div>
        </nav>
      )}

      {isDetailLoading && (
        <p className="admin-muted admin-detail-loading" role="status">
          Loading registration details...
        </p>
      )}

      {openRegistration && (
        <aside className="admin-detail" aria-label={`Registration for ${openRegistration.player_name}`}>
          <div className="admin-detail-header">
            <h3>{openRegistration.player_name}</h3>
            <button
              className="admin-link-button"
              onClick={() => {
                detailRequestRef.current += 1
                setOpenRegistrationId("")
                setOpenRegistration(null)
              }}
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
                {openRegistration.payment_method === "stripe_checkout"
                  ? "Stripe checkout"
                  : openRegistration.payment_status === "paid" ? "Paid in person" : "Pay at event"}
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
          {openRegistration.payment_status !== "paid" && (
            <div className="admin-payment-action">
              <button
                className="button"
                disabled={paymentActionState === "saving"}
                onClick={markPaidInPerson}
                type="button"
              >
                {paymentActionState === "saving" ? "Recording payment..." : "Mark paid in person"}
              </button>
              <span className="admin-muted">
                Use this after receiving cash, check, or another payment at the event.
              </span>
            </div>
          )}
          {paymentActionMessage && (
            <p
              className={paymentActionState === "error" ? "admin-error" : "admin-success"}
              role="status"
            >
              {paymentActionMessage}
            </p>
          )}
        </aside>
      )}
    </section>
  )
}
