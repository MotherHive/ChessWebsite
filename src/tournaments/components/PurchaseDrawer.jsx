import { useEffect } from "react"
import PurchaseEntryStep from "./PurchaseEntryStep"
import PurchaseInfoStep from "./PurchaseInfoStep"
import PurchaseReviewStep from "./PurchaseReviewStep"
import PurchaseThanksStep from "./PurchaseThanksStep"

export default function PurchaseDrawer({ purchase }) {
  const {
    closePurchaseDrawer,
    currentStepIndex,
    focusCloseButton,
    goToPreviousPurchaseStep,
    isPurchaseDrawerOpen,
    purchaseStep,
    setPurchaseCloseButton,
  } = purchase

  useEffect(() => {
    if (!isPurchaseDrawerOpen) {
      return undefined
    }

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        closePurchaseDrawer()
      }
    }

    document.addEventListener("keydown", handleEscapeKey)
    document.body.classList.add("purchase-drawer-active")
    const focusTimer = window.setTimeout(() => {
      focusCloseButton()
    }, 80)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener("keydown", handleEscapeKey)
      document.body.classList.remove("purchase-drawer-active")
    }
  }, [closePurchaseDrawer, focusCloseButton, isPurchaseDrawerOpen])

  return (
    <>
      <div
        className={`purchase-drawer-backdrop${isPurchaseDrawerOpen ? " purchase-drawer-backdrop-open" : ""}`}
        aria-hidden="true"
        onClick={closePurchaseDrawer}
      ></div>

      <aside
        className={`purchase-drawer${isPurchaseDrawerOpen ? " purchase-drawer-open" : ""}`}
        id="tournament-purchase-drawer"
        aria-labelledby="purchase-drawer-heading"
        aria-hidden={!isPurchaseDrawerOpen}
      >
        <div className="purchase-drawer-header">
          <div>
            <span>Registration</span>
            <h3 id="purchase-drawer-heading">
              {purchaseStep === "thanks" ? "Completed" : "Tournament Entry"}
            </h3>
          </div>
          <button
            ref={setPurchaseCloseButton}
            className="purchase-drawer-close"
            type="button"
            aria-label="Close purchase drawer"
            autoFocus={isPurchaseDrawerOpen}
            onClick={closePurchaseDrawer}
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
        </div>

        {purchaseStep !== "thanks" && (
          <div className="purchase-progress">
            <ol className="purchase-steps" aria-label="Purchase progress">
              {["Entry", "Info", "Payment"].map((step, index) => (
                <li
                  className={index <= currentStepIndex ? "purchase-step purchase-step-active" : "purchase-step"}
                  key={step}
                >
                  <span>{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>

            {currentStepIndex > 0 && (
              <button className="purchase-back-button" type="button" onClick={goToPreviousPurchaseStep}>
                Back to {purchaseStep === "review" ? "Info" : "Entry"}
              </button>
            )}
          </div>
        )}

        {purchaseStep === "entry" && <PurchaseEntryStep purchase={purchase} />}
        {purchaseStep === "info" && <PurchaseInfoStep purchase={purchase} />}
        {purchaseStep === "review" && <PurchaseReviewStep purchase={purchase} />}
        {purchaseStep === "thanks" && <PurchaseThanksStep purchase={purchase} />}
      </aside>
    </>
  )
}
