import { formatPrice } from "../../utils/tournamentPricing"

export default function PurchaseThanksStep({ purchase }) {
  const {
    closePurchaseDrawer,
    purchaseForm,
    purchaseTotal,
  } = purchase

  return (
    <div className="purchase-panel purchase-thanks">
      <div className="purchase-thanks-mark" aria-hidden="true"></div>
      <span>Registration submitted</span>
      <h4>Thank you</h4>
      <p>
        Your tournament order has been saved. A confirmation and any final
        payment instructions will be sent to {purchaseForm.email}.
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
