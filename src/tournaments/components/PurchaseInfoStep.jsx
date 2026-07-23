import { expiredMembershipDiscount } from "../registration/constants"
import { formatPrice } from "../registration/pricing"
import { isValidEmail } from "../registration/validation"
import {
  PurchaseCheckboxCard,
  PurchaseField,
  PurchaseMessage,
  PurchaseStepFooter,
} from "./PurchaseFormControls"

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
  } = purchase
  const purchaseMessageId = purchaseMessage ? "purchase-drawer-message" : undefined
  const findIdLink = (
    <a href={playerSearchUrl} target="_blank" rel="noreferrer">
      Find ID
    </a>
  )

  return (
    <div className="purchase-panel">
      <PurchaseField
        field="name"
        id="purchase-name"
        label="Player name"
        autoComplete="name"
        purchase={purchase}
        invalid={purchaseStatus === "error" && !purchaseForm.name.trim()}
      />

      <PurchaseField
        field="email"
        id="purchase-email"
        label="Email"
        type="email"
        autoComplete="email"
        purchase={purchase}
        describedBy={purchaseMessageId}
        invalid={
          purchaseStatus === "error"
          && Boolean(purchaseForm.email.trim())
          && !isValidEmail(purchaseForm.email.trim())
        }
      />

      {hasActiveMembership ? (
        <PurchaseField
          field="uscfId"
          id="purchase-uscf-id"
          label="USCF ID"
          inputMode="numeric"
          purchase={purchase}
          labelAction={findIdLink}
          invalid={purchaseStatus === "error" && !purchaseForm.uscfId.trim()}
        />
      ) : (
        <>
          <PurchaseCheckboxCard
            checkedField="isExpiredMember"
            title="Expired USCF membership"
            description={`${formatPrice(expiredMembershipDiscount)} discount applied.`}
            purchase={purchase}
          />

          {purchaseForm.isExpiredMember && (
            <PurchaseField
              field="uscfId"
              id="purchase-expired-uscf-id"
              label="Expired USCF ID"
              inputMode="numeric"
              purchase={purchase}
              labelAction={findIdLink}
            />
          )}

          <PurchaseField
            field="birthDate"
            id="purchase-birth-date"
            label="Birth date"
            type="date"
            purchase={purchase}
            invalid={purchaseStatus === "error" && !purchaseForm.birthDate}
          />

          <PurchaseField
            field="address"
            id="purchase-address"
            label="Address"
            autoComplete="street-address"
            purchase={purchase}
            invalid={purchaseStatus === "error" && !purchaseForm.address.trim()}
          />

          <PurchaseField
            field="phone"
            id="purchase-phone"
            label="Phone"
            type="tel"
            autoComplete="tel"
            purchase={purchase}
            invalid={purchaseStatus === "error" && !purchaseForm.phone.trim()}
          />

          <PurchaseCheckboxCard
            checkedField="enteredWithTeam"
            title="Entered with a team"
            description="School entry is required for team registrations."
            purchase={purchase}
          />

          {purchaseForm.enteredWithTeam && (
            <PurchaseField
              field="school"
              id="purchase-school"
              label="School"
              purchase={purchase}
              invalid={purchaseStatus === "error" && !purchaseForm.school.trim()}
            />
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

      <PurchaseMessage message={purchaseMessage} status={purchaseStatus} />

      {infoStepCanContinue && (
        <PurchaseStepFooter label="Order total" value={formatPrice(purchaseTotal)}>
          <button className="button button-large purchase-submit" type="button" onClick={handleInfoContinue}>
            Continue to Payment
          </button>
        </PurchaseStepFooter>
      )}
    </div>
  )
}
