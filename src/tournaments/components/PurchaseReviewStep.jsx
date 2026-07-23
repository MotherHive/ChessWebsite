import { byePrice, paymentOptions } from "../registration/constants"
import { formatPrice } from "../registration/pricing"
import {
  PurchaseMessage,
  PurchaseSelectField,
  PurchaseStepFooter,
} from "./PurchaseFormControls"

export default function PurchaseReviewStep({ purchase }) {
  const {
    checkoutTournamentDetails,
    entryPrice,
    handlePurchaseSubmit,
    membershipPrice,
    membershipTier,
    needsMembership,
    playerSearchUrl,
    purchaseForm,
    purchaseMessage,
    purchaseStatus,
    purchaseTotal,
  } = purchase

  return (
    <form className="purchase-panel" onSubmit={handlePurchaseSubmit} noValidate>
      <div className="purchase-review-card">
        <span>Tournament</span>
        <strong>{checkoutTournamentDetails.title}</strong>
        <p>{checkoutTournamentDetails.type} - {checkoutTournamentDetails.rating}</p>
        <p>{checkoutTournamentDetails.dateRange}</p>
        <p>{checkoutTournamentDetails.location}</p>
        <p>{checkoutTournamentDetails.address}</p>
        <p>
          Section: {checkoutTournamentDetails.section}. Possible byes:{" "}
          {checkoutTournamentDetails.possibleByes}.
        </p>
      </div>

      <div className="purchase-review-card">
        <span>Order Review</span>
        <div className="purchase-line-item">
          <p>Tournament entry - {purchaseForm.section}</p>
          <strong>{formatPrice(entryPrice)}</strong>
        </div>
        {purchaseForm.byes.map((bye) => (
          <div className="purchase-line-item" key={bye.id}>
            <p>Bye - {bye.round}</p>
            <strong>{formatPrice(byePrice)}</strong>
          </div>
        ))}
        {needsMembership && (
          <div className="purchase-line-item">
            <p>
              {membershipTier?.label || "USCF membership"}
              {purchaseForm.isExpiredMember ? " with expired discount" : ""}
            </p>
            <strong>{formatPrice(membershipPrice)}</strong>
          </div>
        )}
        <div className="purchase-total">
          <span>Total</span>
          <strong>{formatPrice(purchaseTotal)}</strong>
        </div>
      </div>

      <div className="purchase-review-card">
        <span>Player</span>
        <p>{purchaseForm.name}</p>
        <p>{purchaseForm.email}</p>
        {purchaseForm.uscfId && (
          <p>
            USCF ID:{" "}
            <a className="purchase-member-id-link" href={playerSearchUrl} target="_blank" rel="noreferrer">
              {purchaseForm.uscfId}
            </a>
          </p>
        )}
        {purchaseForm.school && <p>School: {purchaseForm.school}</p>}
      </div>

      <div className="purchase-review-card purchase-payment-card">
        <span>Payment</span>
        <PurchaseSelectField
          field="paymentMethod"
          id="purchase-payment-method"
          label="Payment option"
          purchase={purchase}
        >
          {paymentOptions.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </PurchaseSelectField>
        <p>
          Online card payment redirects to Stripe Checkout. Manual options
          save the registration with payment pending.
        </p>
        {needsMembership && (
          <p>
            USCF membership purchases are non-refundable.
          </p>
        )}
      </div>

      <PurchaseMessage message={purchaseMessage} status={purchaseStatus} />

      <PurchaseStepFooter>
        <button
          className="button button-large purchase-submit"
          type="submit"
          disabled={purchaseStatus === "loading"}
        >
          {purchaseStatus === "loading" ? "Submitting..." : "Pay & Register"}
        </button>
      </PurchaseStepFooter>
    </form>
  )
}
