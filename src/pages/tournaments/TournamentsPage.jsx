"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import usePublishedTournaments from "../../hooks/usePublishedTournaments"
import useScrollVisibility from "../../hooks/useScrollVisibility"
import PurchaseDrawer from "./PurchaseDrawer"
import TournamentHero from "./TournamentHero"
import TournamentList from "./TournamentList"
import useTournamentPurchase from "./useTournamentPurchase"

export default function TournamentsPage({ initialTime }) {
  const [sectionRef, isVisible] = useScrollVisibility({ threshold: 0.08 })
  const searchParams = useSearchParams()
  const { tournaments, isLoading } = usePublishedTournaments()
  const featuredTournament = tournaments[0]
  const [openTournamentId, setOpenTournamentId] = useState("")
  const [currentTime, setCurrentTime] = useState(() => new Date(initialTime).getTime())
  const purchase = useTournamentPurchase(tournaments, currentTime)
  const checkoutStatus = searchParams.get("checkout")
  const checkoutMessage = checkoutStatus === "success"
    ? "Stripe checkout complete. Your payment will be confirmed shortly."
    : checkoutStatus === "cancelled"
      ? "Stripe checkout was cancelled. Your registration was saved as pending payment."
      : ""

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
      <div className="tournaments-list-header">
        <span>Current events</span>
        <h2>Upcoming Tournaments</h2>
      </div>
      {checkoutMessage && (
        <p
          className={`purchase-message purchase-message-${checkoutStatus === "success" ? "success" : "error"}`}
          role="status"
        >
          {checkoutMessage}
        </p>
      )}
      {!isLoading && tournaments.length === 0 && (
        <p className="purchase-message" role="status">
          No upcoming tournaments right now. Check back soon.
        </p>
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
