import {
  byePrice,
  paymentMethods,
  paymentOptions,
  studentDiscountLabel,
} from "../registration/constants"
import { formatPrice, formatRatingLabel } from "../registration/pricing"
import TurnstileWidget from "@/shared/components/ui/TurnstileWidget"
import {
  PurchaseMessage,
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
    retryTurnstile,
    studentDiscount,
    setTurnstileStatus,
    setTurnstileToken,
    turnstileKey,
    turnstileStatus,
    turnstileToken,
  } = purchase
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  const isVerifying = turnstileEnabled && !turnstileToken && turnstileStatus !== "error"
  const turnstileFailed = turnstileEnabled && turnstileStatus === "error"
  const isCardPayment = purchaseForm.paymentMethod === paymentMethods.stripeCheckout

  return (
    <form className="purchase-panel purchase-review-panel" onSubmit={handlePurchaseSubmit} noValidate>
      <div className="purchase-review-card purchase-registration-details">
        <section className="purchase-review-section" aria-labelledby="purchase-player-heading">
          <h4 id="purchase-player-heading">Player details</h4>
          <strong>{purchaseForm.name}</strong>
          <p>{purchaseForm.email}</p>
          {purchaseForm.uscfId && (
            <p>
              US Chess ID:{" "}
              <a className="purchase-member-id-link" href={playerSearchUrl} target="_blank" rel="noreferrer">
                {purchaseForm.uscfId}
              </a>
            </p>
          )}
          {purchaseForm.school && <p>School: {purchaseForm.school}</p>}
        </section>

        <section className="purchase-review-section" aria-labelledby="purchase-tournament-heading">
          <h4 id="purchase-tournament-heading">Tournament details</h4>
          <strong>{checkoutTournamentDetails.title}</strong>
          <p>{checkoutTournamentDetails.type} · {formatRatingLabel(checkoutTournamentDetails.rating)}</p>
          <p>{checkoutTournamentDetails.dateRange}</p>
          <p>{checkoutTournamentDetails.location}</p>
          <p>{checkoutTournamentDetails.address}</p>
          <p>
            {checkoutTournamentDetails.section} section · Up to{" "}
            {checkoutTournamentDetails.possibleByes} possible bye
            {checkoutTournamentDetails.possibleByes === 1 ? "" : "s"}
          </p>
        </section>
      </div>

      <div className="purchase-review-card purchase-payment-card">
        <div className="purchase-review-card-heading">
          <span>Payment</span>
          <strong>How would you like to pay?</strong>
        </div>
        <fieldset className="purchase-payment-options">
          <legend className="sr-only">Payment option</legend>
          {paymentOptions.map((option) => (
            <label className="purchase-payment-option" key={option.id}>
              <input
                type="radio"
                name="paymentMethod"
                value={option.id}
                checked={purchaseForm.paymentMethod === option.id}
                onChange={(event) => purchase.updatePurchaseField("paymentMethod", event.target.value)}
              />
              <span>
                <strong>{option.label}</strong>
                <small>
                  {option.id === paymentMethods.stripeCheckout
                    ? "Continue to Stripe for secure card payment."
                    : "Reserve your place now and pay with cash when you arrive."}
                </small>
              </span>
            </label>
          ))}
        </fieldset>
        {needsMembership && (
          <p className="purchase-payment-note">US Chess membership purchases are non-refundable.</p>
        )}
      </div>

      <div className="purchase-review-card purchase-order-summary">
        <div className="purchase-review-card-heading">
          <span>Order summary</span>
          <strong>Your registration</strong>
        </div>
        <div className="purchase-line-items">
          <div className="purchase-line-item">
            <p>
              Tournament entry · {purchaseForm.section}
              {studentDiscount > 0 && ` · ${studentDiscountLabel} (−${formatPrice(studentDiscount)})`}
            </p>
            <strong>{formatPrice(entryPrice)}</strong>
          </div>
          {purchaseForm.byes.map((bye) => (
            <div className="purchase-line-item" key={bye.id}>
              <p>Bye · {bye.round}</p>
              <strong>{formatPrice(byePrice)}</strong>
            </div>
          ))}
          {needsMembership && (
            <div className="purchase-line-item">
              <p>
                {membershipTier?.label || "US Chess membership"}
                {purchaseForm.isExpiredMember ? " · expired member discount" : ""}
              </p>
              <strong>{formatPrice(membershipPrice)}</strong>
            </div>
          )}
        </div>
        <div className="purchase-total">
          <span>Total</span>
          <strong>{formatPrice(purchaseTotal)}</strong>
        </div>
      </div>

      <PurchaseMessage message={purchaseMessage} status={purchaseStatus} />

      <TurnstileWidget
        action="tournament_registration"
        key={turnstileKey}
        onStatusChange={setTurnstileStatus}
        onVerify={setTurnstileToken}
      />

      {turnstileFailed && (
        <p className="purchase-message purchase-message-error" role="alert">
          The security check could not finish.{" "}
          <button className="purchase-retry" type="button" onClick={retryTurnstile}>
            Try again
          </button>
        </p>
      )}

      <PurchaseStepFooter>
        <button
          className="button button-large purchase-submit"
          type="submit"
          disabled={purchaseStatus === "loading" || (turnstileEnabled && !turnstileToken)}
        >
          {purchaseStatus === "loading"
            ? "Submitting..."
            : isVerifying
              ? "Verifying..."
              : isCardPayment
                ? "Continue to Secure Payment"
                : "Register & Pay at Event"}
        </button>
      </PurchaseStepFooter>
    </form>
  )
}
