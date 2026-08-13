"use client"

import { useEffect, useState } from "react"
import useScrollVisibility from "@/shared/hooks/useScrollVisibility"
import usePublishedTournaments from "../usePublishedTournaments"
import PurchaseDrawer from "./PurchaseDrawer"
import TournamentHero from "./TournamentHero"
import TournamentList from "./TournamentList"
import useTournamentPurchase from "../registration/useTournamentPurchase"

export default function TournamentsPage({ initialTime }) {
  const [sectionRef, isVisible] = useScrollVisibility({ threshold: 0.08 })
  const { tournaments, isLoading } = usePublishedTournaments()
  const featuredTournament = tournaments[0]
  const [openTournamentId, setOpenTournamentId] = useState("")
  const [currentTime, setCurrentTime] = useState(() => new Date(initialTime).getTime())
  const purchase = useTournamentPurchase(tournaments, currentTime)

  useEffect(() => {
    const initialUpdate = window.setTimeout(() => {
      setCurrentTime(Date.now())
    }, 0)
    const countdownTimer = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => {
      window.clearTimeout(initialUpdate)
      window.clearInterval(countdownTimer)
    }
  }, [])

  return (
    <section
      id="tournaments"
      ref={sectionRef}
      className={`tournaments-section tournaments-page${isVisible ? " is-visible" : ""}`}
      aria-labelledby="tournaments-heading"
    >
      <TournamentHero featuredTournament={featuredTournament} />
      {!isLoading && tournaments.length === 0 && (
        <div className="tournaments-empty-state" role="status">
          <span>Schedule update</span>
          <h3>No upcoming tournaments</h3>
          <p>New events will appear here as soon as registration opens. Check back soon.</p>
        </div>
      )}
      <TournamentList
        currentTime={currentTime}
        isPurchaseDrawerOpen={purchase.isPurchaseDrawerOpen}
        onOpenPurchaseDrawer={purchase.openPurchaseDrawer}
        onToggleTournament={setOpenTournamentId}
        openTournamentId={openTournamentId}
        tournaments={tournaments}
      />
      <PurchaseDrawer purchase={purchase} />
    </section>
  )
}
