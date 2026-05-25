import { expiredMembershipDiscount } from "../../data/tournaments"
import { formatPrice } from "../../utils/tournamentPricing"
import { isValidEmail } from "../../utils/tournamentValidation"

export default function PurchaseInfoStep({ purchase }) {
  const {
    handleInfoContinue,
    hasActiveMembership,
    infoStepCanContinue,
    membershipPrice,
    membershipTier,
    playerSearchUrl,
    purchaseForm,
    purchaseMessage,
    purchaseStatus,
    purchaseTotal,
    updatePurchaseField,
  } = purchase

  return (
    <div className="purchase-panel">
      <div className="purchase-field">
        <label htmlFor="purchase-name">Player name</label>
        <input
          id="purchase-name"
          type="text"
          autoComplete="name"
          value={purchaseForm.name}
          aria-invalid={purchaseStatus === "error" && !purchaseForm.name.trim()}
          onChange={(event) => updatePurchaseField("name", event.target.value)}
        />
      </div>

      <div className="purchase-field">
        <label htmlFor="purchase-email">Email</label>
        <input
          id="purchase-email"
          type="email"
          autoComplete="email"
          value={purchaseForm.email}
          aria-describedby={purchaseMessage ? "purchase-drawer-message" : undefined}
          aria-invalid={
            purchaseStatus === "error"
            && Boolean(purchaseForm.email.trim())
            && !isValidEmail(purchaseForm.email.trim())
          }
          onChange={(event) => updatePurchaseField("email", event.target.value)}
        />
      </div>

      {hasActiveMembership ? (
        <div className="purchase-field">
          <div className="purchase-label-row">
            <label htmlFor="purchase-uscf-id">USCF ID</label>
            <a href={playerSearchUrl} target="_blank" rel="noreferrer">
              Find ID
            </a>
          </div>
          <input
            id="purchase-uscf-id"
            type="text"
            inputMode="numeric"
            value={purchaseForm.uscfId}
            aria-invalid={purchaseStatus === "error" && !purchaseForm.uscfId.trim()}
            onChange={(event) => updatePurchaseField("uscfId", event.target.value)}
          />
        </div>
      ) : (
        <>
          <label className="purchase-check-card purchase-check-card-compact">
            <input
              type="checkbox"
              checked={purchaseForm.isExpiredMember}
              onChange={(event) => updatePurchaseField("isExpiredMember", event.target.checked)}
            />
            <span>
              <strong>Expired USCF membership</strong>
              <small>{formatPrice(expiredMembershipDiscount)} discount applied.</small>
            </span>
          </label>

          {purchaseForm.isExpiredMember && (
            <div className="purchase-field">
              <div className="purchase-label-row">
                <label htmlFor="purchase-expired-uscf-id">Expired USCF ID</label>
                <a href={playerSearchUrl} target="_blank" rel="noreferrer">
                  Find ID
                </a>
              </div>
              <input
                id="purchase-expired-uscf-id"
                type="text"
                inputMode="numeric"
                value={purchaseForm.uscfId}
                onChange={(event) => updatePurchaseField("uscfId", event.target.value)}
              />
            </div>
          )}

          <div className="purchase-field">
            <label htmlFor="purchase-birth-date">Birth date</label>
            <input
              id="purchase-birth-date"
              type="date"
              value={purchaseForm.birthDate}
              aria-invalid={purchaseStatus === "error" && !purchaseForm.birthDate}
              onChange={(event) => updatePurchaseField("birthDate", event.target.value)}
            />
          </div>

          <div className="purchase-field">
            <label htmlFor="purchase-address">Address</label>
            <input
              id="purchase-address"
              type="text"
              autoComplete="street-address"
              value={purchaseForm.address}
              aria-invalid={purchaseStatus === "error" && !purchaseForm.address.trim()}
              onChange={(event) => updatePurchaseField("address", event.target.value)}
            />
          </div>

          <div className="purchase-field">
            <label htmlFor="purchase-phone">Phone</label>
            <input
              id="purchase-phone"
              type="tel"
              autoComplete="tel"
              value={purchaseForm.phone}
              aria-invalid={purchaseStatus === "error" && !purchaseForm.phone.trim()}
              onChange={(event) => updatePurchaseField("phone", event.target.value)}
            />
          </div>

          <label className="purchase-check-card purchase-check-card-compact">
            <input
              type="checkbox"
              checked={purchaseForm.enteredWithTeam}
              onChange={(event) => updatePurchaseField("enteredWithTeam", event.target.checked)}
            />
            <span>
              <strong>Entered with a team</strong>
              <small>School entry is required for team registrations.</small>
            </span>
          </label>

          {purchaseForm.enteredWithTeam && (
            <div className="purchase-field">
              <label htmlFor="purchase-school">School</label>
              <input
                id="purchase-school"
                type="text"
                value={purchaseForm.school}
                aria-invalid={purchaseStatus === "error" && !purchaseForm.school.trim()}
                onChange={(event) => updatePurchaseField("school", event.target.value)}
              />
            </div>
          )}

          <div className="purchase-cart-card">
            <div>
              <span>Membership price</span>
              <strong>
                {membershipTier ? formatPrice(membershipPrice) : "Birth date needed"}
              </strong>
            </div>
            <p>
              {membershipTier
                ? `${membershipTier.label}${purchaseForm.isExpiredMember ? " with expired member discount" : ""}.`
                : "Birth date decides the membership price."}
            </p>
          </div>
        </>
      )}

      {purchaseMessage && (
        <p
          className={`purchase-message purchase-message-${purchaseStatus}`}
          id="purchase-drawer-message"
          role={purchaseStatus === "error" ? "alert" : "status"}
        >
          {purchaseMessage}
        </p>
      )}

      {infoStepCanContinue && (
        <div className="purchase-drawer-footer">
          <div>
            <span>Order total</span>
            <strong>{formatPrice(purchaseTotal)}</strong>
          </div>
          <button className="button button-large purchase-submit" type="button" onClick={handleInfoContinue}>
            Continue to Payment
          </button>
        </div>
      )}
    </div>
  )
}
