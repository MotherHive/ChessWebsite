const TournamentBanner = "/assets/TournamentBannerTransparent.webp"
import ProgressiveImage from "@/shared/components/ui/ProgressiveImage"

export default function TournamentHero({ featuredTournament }) {
  return (
    <div className="tournaments-hero">
      <div className="tournaments-copy">
        <h2 id="tournaments-heading">UPCOMING EVENTS</h2>
        {featuredTournament?.director?.name && (
          <p className="tournament-director-byline">
            Tournament Director{" "}
            <a href={`mailto:${featuredTournament.director.email}`}>
              {featuredTournament.director.name}
            </a>
          </p>
        )}
        <p>
          Explore upcoming over-the-board events from Scranton Chess, with
          dates, locations, schedules, entry fees, and registration details all
          in one place.
        </p>
      </div>

      <div className="tournaments-board" aria-label="Tournament banner artwork">
        <ProgressiveImage
          className="tournaments-artwork"
          src={TournamentBanner}
          alt="Illustrated chess tournament knights facing each other on a chessboard"
          decoding="async"
          fetchPriority="high"
          width="1774"
          height="887"
        />
      </div>

      <div className="tournaments-edition-bar">
        <span>Tournament Edition</span>
        <span>Over-the-board chess in Northeastern Pennsylvania</span>
      </div>
    </div>
  )
}
