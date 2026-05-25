import TournamentSplash from "../../../assets/splash.png"
import TournamentBanner from "../../../assets/TournamentBannerTransparent.png"

export default function TournamentHero({ featuredTournament }) {
  return (
    <div className="tournaments-hero">
      <div className="tournaments-copy">
        <h2 id="tournaments-heading">SCRANTON CHESS TOURNAMENTS</h2>
        <p className="tournament-director-byline">
          Tournament Director{" "}
          <a href={`mailto:${featuredTournament.director.email}`}>
            {featuredTournament.director.name}
          </a>
        </p>
        <p>
          Scranton Chess tournaments bring local players together for organized
          over-the-board events, clear pairings, steady competition, and a
          welcoming path into tournament play.
        </p>
      </div>

      <div className="tournaments-board" aria-label="Tournament banner artwork">
        <img
          className="tournaments-splash"
          src={TournamentSplash}
          alt=""
          aria-hidden="true"
        />
        <img
          className="tournaments-artwork"
          src={TournamentBanner}
          alt="Illustrated chess tournament knights facing each other on a chessboard"
        />
      </div>
    </div>
  )
}
