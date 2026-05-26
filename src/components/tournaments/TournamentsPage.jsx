import { useEffect, useState } from "react"
import { tournamentListings } from "../../data/tournaments"
import useScrollVisibility from "../../hooks/useScrollVisibility"
import PurchaseDrawer from "./PurchaseDrawer"
import TournamentHero from "./TournamentHero"
import TournamentList from "./TournamentList"
import useTournamentPurchase from "./useTournamentPurchase"

export default function TournamentsPage() {
  const [sectionRef, isVisible] = useScrollVisibility({ threshold: 0.08 })
  const featuredTournament = tournamentListings[0]
  const [openTournamentId, setOpenTournamentId] = useState("")
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const purchase = useTournamentPurchase(tournamentListings)

  useEffect(() => {
    const countdownTimer = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => window.clearInterval(countdownTimer)
  }, [])

  return (
    <section
      id="tournaments"
      ref={sectionRef}
      className={`tournaments-section tournaments-page${isVisible ? " is-visible" : ""}`}
      aria-labelledby="tournaments-heading"
    >
      <TournamentHero featuredTournament={featuredTournament} />
      <div className="tournaments-list-header">
        <span>Current events</span>
        <h2>Upcoming Tournaments</h2>
      </div>
      <TournamentList
        currentTime={currentTime}
        isPurchaseDrawerOpen={purchase.isPurchaseDrawerOpen}
        onOpenPurchaseDrawer={purchase.openPurchaseDrawer}
        onToggleTournament={setOpenTournamentId}
        openTournamentId={openTournamentId}
        tournaments={tournamentListings}
      />
      <PurchaseDrawer purchase={purchase} />
    </section>
  )
}
