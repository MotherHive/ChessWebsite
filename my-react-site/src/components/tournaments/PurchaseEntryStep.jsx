import {
  byePrice,
  expiredMembershipDiscount,
  membershipAgeTiers,
  membershipPriceRange,
  tournamentRounds,
  tournamentSections,
} from "../../data/tournaments"
import { formatPrice } from "../../utils/tournamentPricing"

export default function PurchaseEntryStep({ purchase }) {
  const {
    addBye,
    byeTotal,
    entryPrice,
    entryStepCanContinue,
    handleEntryContinue,
    hasActiveMembership,
    maxByeCount,
    membershipTier,
    needsMembership,
    purchaseForm,
    purchaseMessage,
    purchaseStatus,
    purchaseTotal,
    removeBye,
    selectedByeRounds,
    selectedTournament,
    updateBye,
    updatePurchaseField,
  } = purchase

  return (
    <div className="purchase-panel purchase-entry-panel">
      <div className="purchase-membership-choice-card">
        <div className="purchase-field">
          <label htmlFor="purchase-active-membership">
            Do you have an <strong>active</strong> USCF membership?
          </label>
          <select
            id="purchase-active-membership"
            required
            value={purchaseForm.activeMembershipStatus}
            aria-invalid={purchaseStatus === "error" && !purchaseForm.activeMembershipStatus}
            onChange={(event) => updatePurchaseField("activeMembershipStatus", event.target.value)}
          >
            <option value="">Select one</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <p>Active members only need ID, name, and email on the next step.</p>
      </div>

      {needsMembership && (
        <div className="purchase-cart-card">
          <div className="purchase-cart-card-header">
            <span>Added to cart</span>
            <div className="purchase-membership-title-row">
              <strong>USCF membership</strong>
              <div className="purchase-membership-price">
                <strong className="purchase-range">
                  {formatPrice(membershipPriceRange.min)}-{formatPrice(membershipPriceRange.max)}
                </strong>
                <details className="purchase-info-menu">
                  <summary aria-label="Show USCF membership prices by age">
                    <span aria-hidden="true">i</span>
                  </summary>
                  <div className="purchase-info-popover">
                    <strong>Prices by age</strong>
                    <ul>
                      {membershipAgeTiers.map((tier) => (
                        <li key={tier.label}>
                          <span>{tier.ageRange}</span>
                          <strong>{formatPrice(tier.price)}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              </div>
            </div>
          </div>
          <p>
            Price is calculated from birth date on the information step.
            Expired memberships receive a {formatPrice(expiredMembershipDiscount)} discount.
          </p>
        </div>
      )}

      <div className="purchase-drawer-summary">
        <div className="purchase-tournament-row">
          <div className="purchase-tournament-title">
            <span>Entry</span>
            <strong>Tournament entry</strong>
            <button
              className="purchase-add-bye-link"
              type="button"
              onClick={addBye}
              disabled={purchaseForm.byes.length >= maxByeCount}
            >
              + Add Bye
            </button>
          </div>
          <div className="purchase-section-select">
            <label htmlFor="purchase-section">Section</label>
            <select
              id="purchase-section"
              value={purchaseForm.section}
              onChange={(event) => updatePurchaseField("section", event.target.value)}
            >
              {tournamentSections.map((section) => (
                <option key={section}>{section}</option>
              ))}
            </select>
          </div>
          <strong>{formatPrice(entryPrice)}</strong>
        </div>

        {purchaseForm.byes.length > 0 && (
          <div className="purchase-bye-list">
            <div className="purchase-bye-heading">
              <strong>Byes</strong>
            </div>

            {purchaseForm.byes.map((bye, byeIndex) => (
              <div className="purchase-bye-row" key={bye.id}>
                <label htmlFor={`purchase-bye-${bye.id}`}>Bye {byeIndex + 1}</label>
                <select
                  id={`purchase-bye-${bye.id}`}
                  value={bye.round}
                  onChange={(event) => updateBye(bye.id, event.target.value)}
                >
                  <option value="">Choose round</option>
                  {tournamentRounds.map((round) => (
                    <option
                      disabled={selectedByeRounds.includes(round) && bye.round !== round}
                      key={round}
                    >
                      {round}
                    </option>
                  ))}
                </select>
                <span>+{formatPrice(byePrice)}</span>
                <button
                  className="purchase-bye-remove"
                  type="button"
                  aria-label={`Remove bye ${byeIndex + 1}`}
                  title="Remove bye"
                  onClick={() => removeBye(bye.id)}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <p>
          {selectedTournament.title}. {selectedTournament.dateRange}. {maxByeCount} possible bye
          {maxByeCount === 1 ? "" : "s"} at registration.
        </p>

        {purchaseForm.byes.length >= maxByeCount && (
          <small className="purchase-bye-limit">All possible byes have been selected.</small>
        )}
      </div>

      {purchaseMessage && (
        <p
          className={`purchase-message purchase-message-${purchaseStatus}`}
          id="purchase-drawer-message"
          role={purchaseStatus === "error" ? "alert" : "status"}
        >
          {purchaseMessage}
        </p>
      )}

      {entryStepCanContinue && (
        <div className="purchase-drawer-footer">
          <div>
            <span>Current total</span>
            <strong>
              {hasActiveMembership || membershipTier
                ? formatPrice(purchaseTotal)
                : `${formatPrice(entryPrice + byeTotal)} + membership`}
            </strong>
          </div>
          <button className="button button-large purchase-submit" type="button" onClick={handleEntryContinue}>
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
