import { useEffect, useRef, useState } from "react"
import { tournamentListings } from "../../data/tournaments"
import PurchaseDrawer from "./PurchaseDrawer"
import TournamentHero from "./TournamentHero"
import TournamentList from "./TournamentList"
import useTournamentPurchase from "./useTournamentPurchase"

export default function TournamentsPage() {
  const sectionRef = useRef(null)
  const featuredTournament = tournamentListings[0]
  const [isVisible, setIsVisible] = useState(false)
  const [openTournamentId, setOpenTournamentId] = useState("")
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const purchase = useTournamentPurchase(tournamentListings)

  useEffect(() => {
    const section = sectionRef.current

    if (!section) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.08 },
    )

    observer.observe(section)

    return () => observer.disconnect()
  }, [])

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
