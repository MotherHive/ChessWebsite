"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { adminRequest } from "../client"

const statusLabels = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
}

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [busyId, setBusyId] = useState("")

  const loadTournaments = useCallback(() => (
    adminRequest("tournaments")
      .then((result) => {
        setTournaments(result.tournaments || [])
        setMessage("")
      })
      .catch((error) => {
        setMessage(error.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  ), [])

  useEffect(() => {
    loadTournaments()
  }, [loadTournaments])

  const runAction = async (id, action) => {
    if (action === "delete" && !window.confirm("Delete this tournament permanently? Registrations are kept.")) {
      return
    }

    setBusyId(id)

    try {
      await adminRequest(`tournaments/${encodeURIComponent(id)}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        ...(action === "delete" ? {} : { body: { action } }),
      })
      await loadTournaments()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusyId("")
    }
  }

  return (
    <section className="admin-section" aria-label="Tournaments">
      <div className="admin-section-header">
        <h2>Tournaments</h2>
        <Link className="button" href="/admin/tournaments/new">New tournament</Link>
      </div>
      {message && <p className="admin-error" role="alert">{message}</p>}
      {isLoading ? (
        <p className="admin-muted">Loading tournaments...</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tournament</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((tournament) => {
                const isBusy = busyId === tournament.id

                return (
                  <tr key={tournament.id}>
                    <td>
                      <strong>{tournament.data?.title || tournament.id}</strong>
                      <span className="admin-muted admin-table-sub">{tournament.id}</span>
                    </td>
                    <td>{tournament.data?.dateRange || "—"}</td>
                    <td>
                      <span className={`admin-status admin-status-${tournament.status}`}>
                        {statusLabels[tournament.status] || tournament.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <Link href={`/admin/tournaments/${tournament.id}`}>Edit</Link>
                        <Link href={`/admin/tournaments/${tournament.id}/preview`}>Preview</Link>
                        {tournament.status !== "published" && (
                          <button disabled={isBusy} onClick={() => runAction(tournament.id, "publish")} type="button">
                            Publish
                          </button>
                        )}
                        {tournament.status === "published" && (
                          <button disabled={isBusy} onClick={() => runAction(tournament.id, "unpublish")} type="button">
                            Unpublish
                          </button>
                        )}
                        <button disabled={isBusy} onClick={() => runAction(tournament.id, "duplicate")} type="button">
                          Duplicate
                        </button>
                        {tournament.status !== "archived" ? (
                          <button disabled={isBusy} onClick={() => runAction(tournament.id, "archive")} type="button">
                            Archive
                          </button>
                        ) : (
                          <>
                            <button disabled={isBusy} onClick={() => runAction(tournament.id, "restore")} type="button">
                              Restore
                            </button>
                            <button
                              className="admin-danger"
                              disabled={isBusy}
                              onClick={() => runAction(tournament.id, "delete")}
                              type="button"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!tournaments.length && (
                <tr>
                  <td colSpan={4} className="admin-muted">No tournaments yet. Create the first one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
