import CalendarIcon from "../../../assets/icons/Calendar.svg"
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
  tournamentStatus,
}) {
  const earlyEntryIsExpired = countdown === "Expired"
  const tournamentStatusLabel = tournamentStatus === "over"
    ? "TOURNAMENT OVER"
    : tournamentStatus === "in-progress"
      ? "TOURNAMENT IN PROGRESS"
      : ""
  const canPurchaseEntry = tournamentStatus === "upcoming"
  const getDisplayedEntryPrice = (fee) => (
    earlyEntryIsExpired || !Number.isFinite(fee.earlyPrice) ? fee.price : fee.earlyPrice
  )
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
            <span className="tournament-card-facts" aria-label="Tournament details">
              <span>
                <img src={CalendarIcon} alt="" aria-hidden="true" />
                {tournament.dateRange}
              </span>
              {tournamentStatusLabel && (
                <span className={`tournament-status-badge tournament-status-badge-${tournamentStatus}`}>
                  {tournamentStatusLabel}
                </span>
              )}
              <span>{tournament.type}</span>
            </span>
            {canPurchaseEntry && (
              <span className="tournament-title-actions">
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
            )}
          </span>

          <span className="tournament-meta-line">
            <span className="tournament-price-label">Entry fees</span>
            <span className="tournament-offer-row">
              <span className="tournament-price">
                {tournament.entryFees.map((fee) => (
                  <span className="tournament-price-section" key={fee.section}>
                    <strong>{formatPrice(getDisplayedEntryPrice(fee))}</strong>
                    <span>{fee.section}</span>
                  </span>
                ))}
              </span>
              <span className="tournament-discount">
                {earlyEntryIsExpired ? (
                  <span>Early entry ended</span>
                ) : (
                  <>
                    <span>Early entry discount ends in</span>
                    <strong>{countdown}</strong>
                  </>
                )}
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

      <div className="tournament-bottom-actions">
        <button
          className="tournament-details-button"
          type="button"
          aria-label={`${isOpen ? "Hide" : "Show"} ${tournament.title} details`}
          aria-expanded={isOpen}
          aria-controls={`${tournament.id}-details`}
          onClick={onToggleOpen}
        >
          <span>{isOpen ? "Hide tournament details" : "Show tournament details"}</span>
          <span className="tournament-details-button-icon" aria-hidden="true"></span>
        </button>
      </div>

      <div
        className={`tournament-details-panel${isOpen ? " tournament-details-panel-open" : ""}`}
        id={`${tournament.id}-details`}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="tournament-details-inner">
          <div className="tournament-details-content">
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
        </div>
      </div>
    </article>
  )
}
