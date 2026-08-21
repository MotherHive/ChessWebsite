import {
  byePrice,
  expiredMembershipDiscount,
  membershipAgeTiers,
  studentDiscountLabel,
  tournamentRounds,
} from "../registration/constants"
import { formatPrice } from "../registration/pricing"
import {
  PurchaseCheckboxCard,
  PurchaseMessage,
  PurchaseSelectField,
  PurchaseStepFooter,
} from "./PurchaseFormControls"

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
    offersStudentDiscount,
    purchaseForm,
    purchaseMessage,
    purchaseStatus,
    purchaseTotal,
    removeBye,
    selectedByeRounds,
    selectedTournament,
    studentDiscountAmount,
    tournamentSections,
    updateBye,
  } = purchase

  return (
    <div className="purchase-panel purchase-entry-panel">
      <div className="purchase-membership-choice-card">
        <PurchaseSelectField
          field="activeMembershipStatus"
          id="purchase-active-membership"
          label={<>Do you have an <strong>active</strong> US Chess membership?</>}
          purchase={purchase}
          required
          invalid={purchaseStatus === "error" && !purchaseForm.activeMembershipStatus}
        >
          <option value="">Select one</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </PurchaseSelectField>
        <p>Active members only need ID, name, and email on the next step.</p>
      </div>

      {needsMembership && (
        <div className="purchase-cart-card">
          <div className="purchase-cart-card-header">
            <strong>US Chess membership</strong>
          </div>
          <ul className="purchase-age-table">
            {membershipAgeTiers.map((tier) => (
              <li key={tier.label}>
                <span>{tier.ageRange}</span>
                <strong>{formatPrice(tier.price)}</strong>
              </li>
            ))}
          </ul>
          <p>
            Price is calculated from birth date on the information step.
            Expired memberships receive a {formatPrice(expiredMembershipDiscount)} discount.
          </p>
        </div>
      )}

      <div className="purchase-drawer-summary">
        <div className="purchase-tournament-row">
          <div className="purchase-tournament-title">
            <strong>Tournament entry</strong>
          </div>
          <strong>{formatPrice(entryPrice + byeTotal)}</strong>
          <div className="purchase-tournament-options">
            <PurchaseSelectField
              className="purchase-section-select"
              field="section"
              id="purchase-section"
              label="Section"
              purchase={purchase}
            >
              {tournamentSections.map((section) => (
                <option key={section}>{section}</option>
              ))}
            </PurchaseSelectField>
            {maxByeCount > 0 && (
              <button
                className="purchase-add-bye-link"
                type="button"
                onClick={addBye}
                disabled={purchaseForm.byes.length >= maxByeCount}
              >
                <span className="purchase-add-bye-label">+ Add Bye</span>
              </button>
            )}
          </div>
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

        {offersStudentDiscount && (
          <PurchaseCheckboxCard
            checkedField="isStudent"
            className="purchase-student-card"
            title={studentDiscountLabel}
            description={`${formatPrice(studentDiscountAmount)} off the entry fee.`}
            purchase={purchase}
          />
        )}

        <p>
          {selectedTournament.title}. {selectedTournament.dateRange}. {maxByeCount} possible bye
          {maxByeCount === 1 ? "" : "s"} at registration.
        </p>

        {maxByeCount > 0 && purchaseForm.byes.length >= maxByeCount && (
          <small className="purchase-bye-limit">All possible byes have been selected.</small>
        )}
      </div>

      <PurchaseMessage message={purchaseMessage} status={purchaseStatus} />

      {entryStepCanContinue && (
        <PurchaseStepFooter
          label="Current total"
          value={
            hasActiveMembership || membershipTier
              ? formatPrice(purchaseTotal)
              : `${formatPrice(entryPrice + byeTotal)} + membership`
          }
        >
          <button className="button button-large purchase-submit" type="button" onClick={handleEntryContinue}>
            Continue
          </button>
        </PurchaseStepFooter>
      )}
    </div>
  )
}
