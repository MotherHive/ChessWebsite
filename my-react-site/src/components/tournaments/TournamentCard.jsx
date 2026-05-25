import LocationIcon from "../../../assets/icons/Location.svg"
import { formatPrice } from "../../utils/tournamentPricing"
import TournamentPrizes from "./TournamentPrizes"
import TournamentSchedule from "./TournamentSchedule"

export default function TournamentCard({
  countdown,
  index,
  isOpen,
  isPurchaseDrawerOpen,
  onOpenPurchaseDrawer,
  onToggleOpen,
  tournament,
}) {
  return (
    <article
      className={`tournament-listing${isOpen ? " tournament-listing-open" : ""}`}
      style={{ "--tournament-card-index": index }}
    >
      <div className="tournament-summary">
        <span className="tournament-summary-copy">
          <span className="tournament-title-stack">
            <span className="tournament-title-row">
              <span>
                <span className="tournament-eyebrow">Tournament</span>
                <strong>{tournament.title}</strong>
              </span>
              <span className={`tournament-rating tournament-rating-${tournament.rating.toLowerCase()}`}>
                {tournament.rating}
              </span>
            </span>
            <span className="tournament-title-actions">
              <button
                className="tournament-chevron-button"
                type="button"
                aria-label={`${isOpen ? "Hide" : "Show"} ${tournament.title} details`}
                aria-expanded={isOpen}
                aria-controls={`${tournament.id}-details`}
                onClick={onToggleOpen}
              >
                <span>Details</span>
                <span className="tournament-chevron" aria-hidden="true"></span>
              </button>
              <button
                className="button button-large tournament-card-purchase-button"
                type="button"
                aria-controls="tournament-purchase-drawer"
                aria-expanded={isPurchaseDrawerOpen}
                onClick={onOpenPurchaseDrawer}
              >
                <span aria-hidden="true">+</span>
                Purchase Entry
              </button>
            </span>
          </span>

          <span className="tournament-meta-line">
            <span>{tournament.type}</span>
            <span className="tournament-offer-row">
              <span className="tournament-price">
                <s>{formatPrice(tournament.price)}</s>
                <strong>{formatPrice(tournament.discountedPrice)}</strong>
              </span>
              <span className="tournament-discount">
                <span>Early entry discount</span>
                <strong>{countdown}</strong>
              </span>
            </span>
          </span>
        </span>

        <span className="tournament-summary-image">
          <img src={tournament.image} alt="" />
        </span>
      </div>

      <div className="tournament-location-row">
        <span>
          <img src={LocationIcon} alt="" aria-hidden="true" />
          {tournament.location}
        </span>
        <a href={tournament.mapUrl} target="_blank" rel="noreferrer">
          View on map
        </a>
      </div>

      <div className="tournament-dropdown" id={`${tournament.id}-details`} hidden={!isOpen}>
        <TournamentSchedule tournament={tournament} />
        <TournamentPrizes tournament={tournament} />

        <div className="tournament-footer-row">
          <nav className="tournament-resource-links" aria-label={`${tournament.title} resources`}>
            {tournament.rulesUrl && (
              <a href={tournament.rulesUrl} target="_blank" rel="noreferrer">View rules</a>
            )}
            {tournament.flyerUrl && (
              <a
                className="tournament-icon-link tournament-icon-link-flyer"
                href={tournament.flyerUrl}
                aria-label={`${tournament.title} flyer`}
              >
                <span aria-hidden="true"></span>
              </a>
            )}
            {tournament.uscfUrl && (
              <a
                className="tournament-icon-link tournament-icon-link-uscf"
                href={tournament.uscfUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`${tournament.title} USCF listing`}
              >
                <span aria-hidden="true"></span>
              </a>
            )}
          </nav>
        </div>
      </div>
    </article>
  )
}
