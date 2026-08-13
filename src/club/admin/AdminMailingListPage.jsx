"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { adminRequest } from "@/tournaments/admin/client"
import {
  buildCsv,
  buildEmailList,
  buildNamedEmailList,
  formatDate,
} from "./mailingListPresentation"

const emptyPagination = { page: 1, pageSize: 25, total: 0, totalPages: 1 }

const copyText = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    return false
  }

  return false
}

export default function AdminMailingListPage() {
  const fallbackRef = useRef(null)
  const [signups, setSignups] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyAction, setBusyAction] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [fallbackText, setFallbackText] = useState("")
  const [searchText, setSearchText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState(emptyPagination)

  const signupQuery = useMemo(() => ({
    page: pagination.page,
    pageSize: pagination.pageSize,
    q: searchQuery,
  }), [pagination.page, pagination.pageSize, searchQuery])

  useEffect(() => {
    const nextSearchQuery = searchText.trim()

    if (nextSearchQuery === searchQuery) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setSearchQuery(nextSearchQuery)
      setIsLoading(true)
      setPagination((current) => ({ ...current, page: 1 }))
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchQuery, searchText])

  useEffect(() => {
    const controller = new AbortController()

    adminRequest("club-signups", { query: signupQuery, signal: controller.signal })
      .then((result) => {
        setSignups(result.signups || [])
        setPagination(result.pagination || emptyPagination)
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message)
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
  }, [signupQuery])

  useEffect(() => {
    if (fallbackText && fallbackRef.current) {
      fallbackRef.current.focus()
      fallbackRef.current.select()
    }
  }, [fallbackText])

  const changePage = (page) => {
    setIsLoading(true)
    setPagination((current) => ({ ...current, page }))
  }

  // Every action works on the whole filtered list, not the page on screen, so
  // the copied list always matches the count on the button.
  const loadExport = async () => (
    adminRequest("club-signups/export", { query: { q: searchQuery } })
  )

  const runAction = async (action, run) => {
    setBusyAction(action)
    setError("")
    setMessage("")
    setFallbackText("")

    try {
      const result = await loadExport()
      const rows = result.signups || []

      if (!rows.length) {
        setMessage("There is nobody on the mailing list to copy.")
        return
      }

      await run(rows)

      if (result.truncated) {
        setMessage(`Only the newest ${rows.length} of ${result.total} signups were included.`)
      }
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setBusyAction("")
    }
  }

  const copyList = (action, build, label) => runAction(action, async (rows) => {
    const text = build(rows)

    if (await copyText(text)) {
      setMessage(`Copied ${rows.length} ${label}.`)
      return
    }

    setFallbackText(text)
    setMessage("This browser blocked the clipboard. The list below is selected — copy it manually.")
  })

  const copyEmails = () => copyList("emails", buildEmailList, "email addresses")

  const copyNamedEmails = () => copyList(
    "named",
    buildNamedEmailList,
    "addresses with names",
  )

  const copyCsv = () => copyList("csv", buildCsv, "rows as CSV")

  const downloadCsv = () => runAction("download", async (rows) => {
    const blob = new Blob([buildCsv(rows)], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `mailing-list-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setMessage(`Downloaded ${rows.length} signups.`)
  })

  const isBusy = Boolean(busyAction)
  const hasSignups = pagination.total > 0

  return (
    <section className="admin-section" aria-label="Mailing list">
      <div className="admin-section-header">
        <h2>Mailing list</h2>
        <div className="admin-mailing-actions">
          <button
            className="button admin-export-button"
            disabled={!hasSignups || isBusy}
            onClick={copyEmails}
            type="button"
          >
            {busyAction === "emails" ? "Copying..." : `Copy emails (${pagination.total})`}
          </button>
          <button
            className="admin-link-button"
            disabled={!hasSignups || isBusy}
            onClick={copyNamedEmails}
            type="button"
          >
            {busyAction === "named" ? "Copying..." : "Copy name + email"}
          </button>
          <button
            className="admin-link-button"
            disabled={!hasSignups || isBusy}
            onClick={copyCsv}
            type="button"
          >
            {busyAction === "csv" ? "Copying..." : "Copy CSV"}
          </button>
          <button
            className="admin-link-button"
            disabled={!hasSignups || isBusy}
            onClick={downloadCsv}
            type="button"
          >
            {busyAction === "download" ? "Preparing..." : "Download CSV"}
          </button>
        </div>
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}
      {message && <p className="admin-muted" role="status">{message}</p>}

      {fallbackText && (
        <textarea
          className="admin-copy-fallback"
          readOnly
          ref={fallbackRef}
          rows={6}
          value={fallbackText}
        />
      )}

      <div className="admin-stats" aria-label="Mailing list totals">
        <div className="admin-stat">
          <span className="admin-stat-value">{pagination.total}</span>
          <span className="admin-stat-label">
            {searchQuery ? "Matching signups" : "People on the list"}
          </span>
        </div>
      </div>

      <div className="admin-filters">
        <label>
          Search
          <input
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Name or email"
            type="search"
            value={searchText}
          />
        </label>
      </div>

      {isLoading ? (
        <p className="admin-muted">Loading the mailing list...</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Joined</th>
                <th>Name</th>
                <th>Email</th>
                <th>Source</th>
                <th>Welcome email</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.created_at)}</td>
                  <td>{`${row.first_name} ${row.last_name}`.trim()}</td>
                  <td>{row.email}</td>
                  <td>{row.source}</td>
                  <td>{row.welcome_email_sent_at ? formatDate(row.welcome_email_sent_at) : "Not sent"}</td>
                </tr>
              ))}
              {!signups.length && (
                <tr>
                  <td colSpan={5} className="admin-muted">
                    {searchQuery ? "No signups match the search." : "Nobody has joined the mailing list yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && hasSignups && (
        <nav className="admin-pagination" aria-label="Mailing list pages">
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
    </section>
  )
}
