import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { adminRequest } from "../../../lib/adminApi"
import { withTournamentImage } from "../../../data/tournaments"
import { formatCountdown, getTournamentStatus } from "../../../utils/tournamentPricing"
import TournamentCard from "../../tournaments/TournamentCard"

export default function AdminTournamentPreviewPage() {
  const { tournamentId } = useParams()
  const [tournament, setTournament] = useState(null)
  const [tournamentStatus, setTournamentStatus] = useState("")
  const [message, setMessage] = useState("Loading preview...")
  const [isOpen, setIsOpen] = useState(true)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    let isActive = true

    adminRequest("tournaments")
      .then((result) => {
        if (!isActive) {
          return
        }

        const row = (result.tournaments || []).find((tournamentRow) => tournamentRow.id === tournamentId)

        if (!row) {
          setMessage("Tournament not found.")
          return
        }

        setTournament(withTournamentImage({ ...row.data, id: row.id }))
        setTournamentStatus(row.status)
        setMessage("")
      })
      .catch((error) => {
        if (isActive) {
          setMessage(error.message)
        }
      })

    return () => {
      isActive = false
    }
  }, [tournamentId])

  useEffect(() => {
    const countdownTimer = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => window.clearInterval(countdownTimer)
  }, [])

  return (
    <section className="admin-section" aria-label="Tournament preview">
      <div className="admin-section-header">
        <h2>Preview{tournamentStatus ? ` (${tournamentStatus})` : ""}</h2>
        <div className="admin-row-actions">
          <Link to={`/admin/tournaments/${tournamentId}`}>Edit</Link>
          <Link to="/admin/tournaments">Back to list</Link>
        </div>
      </div>
      <p className="admin-muted">
        This is how the tournament card renders on the public tournaments page.
      </p>
      {message && <p className="admin-muted" role="status">{message}</p>}
      {tournament && (
        <div className="tournament-list admin-preview">
          <TournamentCard
            countdown={formatCountdown(tournament.discountEndsAt, currentTime)}
            index={0}
            isOpen={isOpen}
            isPurchaseDrawerOpen={false}
            onOpenPurchaseDrawer={() => {}}
            onToggleOpen={() => setIsOpen((open) => !open)}
            tournament={tournament}
            tournamentStatus={getTournamentStatus(tournament, currentTime)}
          />
        </div>
      )}
    </section>
  )
}
