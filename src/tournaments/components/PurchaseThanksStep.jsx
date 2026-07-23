import { formatPrice } from "../registration/pricing"

export default function PurchaseThanksStep({ purchase }) {
  const {
    closePurchaseDrawer,
    purchaseForm,
    purchaseResult,
    purchaseTotal,
  } = purchase
  const isManualPending = purchaseResult?.paymentStatus === "manual_pending"

  return (
    <div className="purchase-panel purchase-thanks">
      <div className="purchase-thanks-mark" aria-hidden="true"></div>
      <span>Registration submitted</span>
      <h4>Thank you</h4>
      <p>
        {isManualPending
          ? `Your registration has been saved with payment pending. Payment instructions will be sent to ${purchaseForm.email}.`
          : `Your tournament order has been saved. A confirmation will be sent to ${purchaseForm.email}.`}
      </p>
      <div className="purchase-total">
        <span>Order total</span>
        <strong>{formatPrice(purchaseTotal)}</strong>
      </div>
      <button className="button button-large purchase-submit" type="button" onClick={closePurchaseDrawer}>
        Close
      </button>
    </div>
  )
}
