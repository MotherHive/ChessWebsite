import { expiredMembershipDiscount, usStates } from "../registration/constants"
import { formatPrice } from "../registration/pricing"
import {
  formatPhoneNumber,
  formatStateInput,
  formatUscfId,
  formatZipCode,
  isValidEmail,
  isValidPhoneNumber,
  isValidStateCode,
  resolveStateCode,
  isValidUscfId,
  isValidZipCode,
} from "../registration/validation"
import {
  PurchaseCheckboxCard,
  PurchaseComboField,
  PurchaseField,
  PurchaseMessage,
  PurchaseStepFooter,
} from "./PurchaseFormControls"

const stateOptions = usStates.map((state) => ({ value: state.code, label: state.name }))

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
  const hasPlayerName = Boolean(purchaseForm.name.trim())
  const findIdLink = hasPlayerName ? (
    <a className="purchase-find-id-link" href={playerSearchUrl} target="_blank" rel="noreferrer">
      Find ID
    </a>
  ) : (
    <span className="purchase-find-id-link purchase-find-id-link-inactive" aria-disabled="true">
      Find ID
    </span>
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
          label="US Chess ID"
          inputMode="numeric"
          pattern="[0-9]{8}"
          placeholder="12345678"
          formatValue={formatUscfId}
          hint="Enter the 8-digit ID issued by US Chess."
          purchase={purchase}
          labelAction={findIdLink}
          invalid={purchaseStatus === "error" && !isValidUscfId(purchaseForm.uscfId)}
        />
      ) : (
        <>
          <PurchaseCheckboxCard
            checkedField="isExpiredMember"
            title="Expired US Chess membership"
            description={`${formatPrice(expiredMembershipDiscount)} discount applied.`}
            purchase={purchase}
          />

          {purchaseForm.isExpiredMember && (
            <PurchaseField
              field="uscfId"
              id="purchase-expired-uscf-id"
              label="Expired US Chess ID"
              inputMode="numeric"
              pattern="[0-9]{8}"
              placeholder="12345678"
              formatValue={formatUscfId}
              hint="Optional, but must be the 8-digit US Chess ID if entered."
              purchase={purchase}
              labelAction={findIdLink}
              invalid={
                purchaseStatus === "error"
                && Boolean(purchaseForm.uscfId.trim())
                && !isValidUscfId(purchaseForm.uscfId)
              }
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

          <div className="purchase-address-group">
            <PurchaseField
              field="street"
              id="purchase-street"
              label="Street address"
              autoComplete="address-line1"
              purchase={purchase}
              labelAction={
                <span className="purchase-field-note">Required to join or renew US Chess</span>
              }
              invalid={purchaseStatus === "error" && !purchaseForm.street.trim()}
            />

            <PurchaseField
              field="unit"
              id="purchase-unit"
              label="Apartment, suite, etc."
              autoComplete="address-line2"
              hint="Optional."
              purchase={purchase}
            />

            <div className="purchase-field-row">
              <PurchaseField
                field="city"
                id="purchase-city"
                label="City"
                autoComplete="address-level2"
                purchase={purchase}
                invalid={purchaseStatus === "error" && !purchaseForm.city.trim()}
              />

              <PurchaseComboField
                field="state"
                id="purchase-state"
                label="State"
                autoComplete="address-level1"
                options={stateOptions}
                placeholder="PA"
                formatValue={formatStateInput}
                resolveValue={resolveStateCode}
                purchase={purchase}
                invalid={purchaseStatus === "error" && !isValidStateCode(purchaseForm.state)}
              />

              <PurchaseField
                field="zip"
                id="purchase-zip"
                label="ZIP code"
                autoComplete="postal-code"
                inputMode="numeric"
                placeholder="18509"
                formatValue={formatZipCode}
                purchase={purchase}
                invalid={purchaseStatus === "error" && !isValidZipCode(purchaseForm.zip)}
              />
            </div>
          </div>

          <PurchaseField
            field="phone"
            id="purchase-phone"
            label="Phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="(570) 555-0123"
            formatValue={formatPhoneNumber}
            hint="Enter a 10-digit US phone number."
            purchase={purchase}
            invalid={purchaseStatus === "error" && !isValidPhoneNumber(purchaseForm.phone)}
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
