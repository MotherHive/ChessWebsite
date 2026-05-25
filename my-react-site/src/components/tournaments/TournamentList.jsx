import { formatCountdown } from "../../utils/tournamentPricing"
import TournamentCard from "./TournamentCard"

export default function TournamentList({
  currentTime,
  isPurchaseDrawerOpen,
  onOpenPurchaseDrawer,
  onToggleTournament,
  openTournamentId,
  tournaments,
}) {
  return (
    <div className="tournament-list" aria-label="Available tournaments">
      {tournaments.map((tournament, index) => {
        const isOpen = openTournamentId === tournament.id
        const countdown = formatCountdown(tournament.discountEndsAt, currentTime)

        return (
          <TournamentCard
            countdown={countdown}
            index={index}
            isOpen={isOpen}
            isPurchaseDrawerOpen={isPurchaseDrawerOpen}
            key={tournament.id}
            onOpenPurchaseDrawer={() => onOpenPurchaseDrawer(tournament.id)}
            onToggleOpen={() => onToggleTournament(isOpen ? "" : tournament.id)}
            tournament={tournament}
          />
        )
      })}
    </div>
  )
}
