import { useCallback, useEffect, useRef, useState } from "react"

const CONSTRUCTION_POPUP_KEY = "scranton-chess-club-construction-popup-dismissed"

export default function ConstructionPopup() {
  const closeButtonRef = useRef(null)
  const dialogRef = useRef(null)
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return window.sessionStorage.getItem(CONSTRUCTION_POPUP_KEY) !== "true"
    } catch {
      return true
    }
  })

  const closePopup = useCallback(() => {
    try {
      window.sessionStorage.setItem(CONSTRUCTION_POPUP_KEY, "true")
    } catch {
      // Dismiss the popup even when storage is unavailable.
    }

    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closePopup()
        return
      }

      if (event.key !== "Tab") {
        return
      }

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      const focusableItems = Array.from(focusableElements ?? [])

      if (focusableItems.length === 0) {
        return
      }

      const firstItem = focusableItems[0]
      const lastItem = focusableItems[focusableItems.length - 1]

      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault()
        lastItem.focus()
        return
      }

      if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.classList.add("construction-popup-active")

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus({ preventScroll: true })
    }, 80)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener("keydown", handleKeyDown)
      document.body.classList.remove("construction-popup-active")
    }
  }, [closePopup, isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <>
      <div
        className="construction-popup-backdrop"
        aria-hidden="true"
        onClick={closePopup}
      ></div>

      <section
        ref={dialogRef}
        className="construction-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="construction-popup-heading"
        aria-describedby="construction-popup-description"
      >
        <button
          ref={closeButtonRef}
          className="construction-popup-close"
          type="button"
          aria-label="Close under construction notice"
          onClick={closePopup}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>

        <span className="construction-popup-kicker">Site notice</span>
        <h2 id="construction-popup-heading">This site is under construction</h2>
        <p id="construction-popup-description">
          Registration, tournament purchases, community links, and blogs are still in the oven.
        </p>

        <button
          className="button button-medium construction-popup-action"
          type="button"
          onClick={closePopup}
        >
          Got it
        </button>
      </section>
    </>
  )
}
