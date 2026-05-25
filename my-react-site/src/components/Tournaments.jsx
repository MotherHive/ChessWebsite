import { useCallback, useEffect, useRef, useState } from "react"
import TournamentSplash from "../../assets/splash.png"
import TournamentBanner from "../../assets/TournamentBannerTransparent.png"
import CalendarIcon from "../../assets/icons/Calendar.svg"
import ClockIcon from "../../assets/icons/Clock.svg"
import LocationIcon from "../../assets/icons/Location.svg"

const tournamentMilestones = [
  {
    label: "Format",
    value: "Swiss pairings",
    detail: "Sections and time controls are being finalized.",
  },
  {
    label: "Players",
    value: "Open entry",
    detail: "Adults, students, rated, and unrated players will be welcome.",
  },
  {
    label: "Updates",
    value: "Club email list",
    detail: "Dates and registration details will be announced here first.",
  },
]

const tournamentChecks = [
  "Local over-the-board events",
  "Casual-friendly tournament environment",
  "Boards, clocks, pairings, and results handled on site",
]

const entryPrice = 25
const byePrice = 5
const expiredMembershipDiscount = 3

const tournamentSections = ["Open", "Reserve", "Scholastic"]
const tournamentRounds = ["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"]

const membershipAgeTiers = [
  { label: "Youth membership", maxAge: 18, price: 20 },
  { label: "Adult membership", maxAge: 64, price: 45 },
  { label: "Senior membership", maxAge: 150, price: 40 },
]

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const getSavedJoinInfo = () => {
  try {
    const savedJoinInfo = window.localStorage.getItem("scranton-chess-club-join")

    if (!savedJoinInfo) {
      return { name: "", email: "" }
    }

    const parsedInfo = JSON.parse(savedJoinInfo)
    const name = [parsedInfo.firstName, parsedInfo.lastName].filter(Boolean).join(" ")

    return {
      name,
      email: parsedInfo.email || "",
    }
  } catch {
    return { name: "", email: "" }
  }
}

const getAgeFromBirthDate = (birthDate) => {
  if (!birthDate) {
    return null
  }

  const today = new Date()
  const birth = new Date(`${birthDate}T00:00:00`)

  if (Number.isNaN(birth.getTime()) || birth > today) {
    return null
  }

  let age = today.getFullYear() - birth.getFullYear()
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth()
    || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())

  if (!hasHadBirthdayThisYear) {
    age -= 1
  }

  return age
}

const getMembershipTier = (birthDate) => {
  const age = getAgeFromBirthDate(birthDate)

  if (age === null) {
    return null
  }

  return membershipAgeTiers.find((tier) => age <= tier.maxAge) || membershipAgeTiers.at(-1)
}

const formatPrice = (amount) => `$${amount}`

export default function Tournaments() {
  const sectionRef = useRef(null)
  const purchaseButtonRef = useRef(null)
  const purchaseCloseButtonRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isPurchaseDrawerOpen, setIsPurchaseDrawerOpen] = useState(false)
  const [purchaseStep, setPurchaseStep] = useState("entry")
  const [purchaseForm, setPurchaseForm] = useState(() => {
    const savedInfo = getSavedJoinInfo()

    return {
      hasActiveMembership: false,
      isExpiredMember: false,
      enteredWithTeam: false,
      uscfId: "",
      name: savedInfo.name,
      email: savedInfo.email,
      phone: "",
      address: "",
      birthDate: "",
      school: "",
      section: "Open",
      byes: [],
    }
  })
  const [purchaseStatus, setPurchaseStatus] = useState("idle")
  const [purchaseMessage, setPurchaseMessage] = useState("")

  const membershipTier = getMembershipTier(purchaseForm.birthDate)
  const membershipPrice = purchaseForm.hasActiveMembership
    ? 0
    : Math.max(0, (membershipTier?.price || 0) - (purchaseForm.isExpiredMember ? expiredMembershipDiscount : 0))
  const byeTotal = purchaseForm.byes.length * byePrice
  const purchaseTotal = entryPrice + byeTotal + membershipPrice
  const selectedByeRounds = purchaseForm.byes.map((bye) => bye.round).filter(Boolean)
  const entryStepCanContinue =
    Boolean(purchaseForm.section)
    && purchaseForm.byes.every((bye) => bye.round)
    && new Set(selectedByeRounds).size === selectedByeRounds.length
  const infoStepCanContinue =
    purchaseForm.name.trim()
    && isValidEmail(purchaseForm.email.trim())
    && (
      purchaseForm.hasActiveMembership
        ? purchaseForm.uscfId.trim()
        : purchaseForm.address.trim()
          && purchaseForm.phone.trim()
          && purchaseForm.birthDate
          && (!purchaseForm.enteredWithTeam || purchaseForm.school.trim())
    )
  const currentStepIndex = purchaseStep === "entry" ? 0 : purchaseStep === "info" ? 1 : 2

  const closePurchaseDrawer = useCallback(() => {
    setIsPurchaseDrawerOpen(false)
    window.setTimeout(() => {
      purchaseButtonRef.current?.focus()
    }, 0)
  }, [])

  const setPurchaseCloseButton = useCallback((node) => {
    purchaseCloseButtonRef.current = node

    if (node && isPurchaseDrawerOpen) {
      window.setTimeout(() => {
        node.focus()
      }, 80)
    }
  }, [isPurchaseDrawerOpen])

  useEffect(() => {
    const section = sectionRef.current

    if (!section) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.08 },
    )

    observer.observe(section)

    return () => observer.disconnect()
  }, [])

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
      purchaseCloseButtonRef.current?.focus()
    }, 80)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener("keydown", handleEscapeKey)
      document.body.classList.remove("purchase-drawer-active")
    }
  }, [closePurchaseDrawer, isPurchaseDrawerOpen])

  const updatePurchaseField = (field, value) => {
    setPurchaseForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))

    if (purchaseStatus !== "idle") {
      setPurchaseStatus("idle")
      setPurchaseMessage("")
    }
  }

  const addBye = () => {
    setPurchaseForm((currentForm) => {
      if (currentForm.byes.length >= tournamentRounds.length) {
        return currentForm
      }

      return {
        ...currentForm,
        byes: [
          ...currentForm.byes,
          {
            id: window.crypto?.randomUUID?.() || `${Date.now()}-${currentForm.byes.length}`,
            round: "",
          },
        ],
      }
    })

    setPurchaseMessage("")
  }

  const updateBye = (id, round) => {
    setPurchaseForm((currentForm) => ({
      ...currentForm,
      byes: currentForm.byes.map((bye) => (
        bye.id === id ? { ...bye, round } : bye
      )),
    }))

    setPurchaseMessage("")
  }

  const removeBye = (id) => {
    setPurchaseForm((currentForm) => ({
      ...currentForm,
      byes: currentForm.byes.filter((bye) => bye.id !== id),
    }))

    setPurchaseMessage("")
  }

  const handleEntryContinue = () => {
    if (!entryStepCanContinue) {
      setPurchaseStatus("error")
      setPurchaseMessage("Choose a section and complete each bye round.")
      return
    }

    setPurchaseStatus("idle")
    setPurchaseMessage("")
    setPurchaseStep("info")
  }

  const handleInfoContinue = () => {
    if (!purchaseForm.name.trim() || !purchaseForm.email.trim()) {
      setPurchaseStatus("error")
      setPurchaseMessage("Enter the player name and email.")
      return
    }

    if (!isValidEmail(purchaseForm.email.trim())) {
      setPurchaseStatus("error")
      setPurchaseMessage("Use a valid email address, like name@example.com.")
      return
    }

    if (purchaseForm.hasActiveMembership && !purchaseForm.uscfId.trim()) {
      setPurchaseStatus("error")
      setPurchaseMessage("Enter the active USCF ID.")
      return
    }

    if (!purchaseForm.hasActiveMembership) {
      if (!purchaseForm.address.trim() || !purchaseForm.phone.trim() || !purchaseForm.birthDate) {
        setPurchaseStatus("error")
        setPurchaseMessage("Enter address, phone, and birth date for the membership.")
        return
      }

      if (purchaseForm.enteredWithTeam && !purchaseForm.school.trim()) {
        setPurchaseStatus("error")
        setPurchaseMessage("Enter the school for the team entry.")
        return
      }
    }

    setPurchaseStatus("idle")
    setPurchaseMessage("")
    setPurchaseStep("review")
  }

  const handlePurchaseSubmit = (event) => {
    event.preventDefault()
    setPurchaseStatus("loading")
    setPurchaseMessage("")

    window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          "scranton-chess-tournament-purchase",
          JSON.stringify({
            ...purchaseForm,
            name: purchaseForm.name.trim(),
            email: purchaseForm.email.trim(),
            entryPrice,
            byePrice,
            membershipPrice,
            total: purchaseTotal,
          }),
        )
        setPurchaseStatus("success")
        setPurchaseStep("thanks")
        setPurchaseMessage("Registration submitted.")
      } catch {
        setPurchaseStatus("error")
        setPurchaseMessage("Could not save your registration in this browser. Please email the club.")
      }
    }, 450)
  }

  return (
    <section
      id="tournaments"
      ref={sectionRef}
      className={`tournaments-section tournaments-page${isVisible ? " is-visible" : ""}`}
      aria-labelledby="tournaments-heading"
    >
      <div className="tournaments-hero">
        <div className="tournaments-copy">
          <h2 id="tournaments-heading">SCRANTON CHESS TOURNAMENTS</h2>
          <p>
            Scranton Chess tournaments bring local players together for organized
            over-the-board events, clear pairings, steady competition, and a
            welcoming path into tournament play.
          </p>

          <div className="tournaments-actions">
            <button
              ref={purchaseButtonRef}
              className="button button-large tournaments-purchase-button"
              type="button"
              aria-controls="tournament-purchase-drawer"
              aria-expanded={isPurchaseDrawerOpen}
              onClick={() => setIsPurchaseDrawerOpen(true)}
            >
              <span aria-hidden="true">+</span>
              Purchase Entry
            </button>
            <a className="button button-large" href="/#join">Get Updates</a>
            <a className="tournaments-text-link" href="mailto:scrantonchess@gmail.com">
              Ask about events
            </a>
          </div>
        </div>

        <div className="tournaments-board" aria-label="Tournament banner artwork">
          <img
            className="tournaments-splash"
            src={TournamentSplash}
            alt=""
            aria-hidden="true"
          />
          <img
            className="tournaments-artwork"
            src={TournamentBanner}
            alt="Illustrated chess tournament knights facing each other on a chessboard"
          />
        </div>
      </div>

      <div className="tournaments-details" aria-label="Tournament details in progress">
        <article className="tournaments-feature-card tournaments-feature-card-primary">
          <div className="tournaments-card-icon" aria-hidden="true">
            <img src={CalendarIcon} alt="" />
          </div>
          <div>
            <span>Schedule</span>
            <h3>Dates are being planned</h3>
            <p>
              Tournament dates will be posted once venue timing, format, and
              director coverage are confirmed.
            </p>
          </div>
        </article>

        <article className="tournaments-feature-card">
          <div className="tournaments-card-icon" aria-hidden="true">
            <img src={LocationIcon} alt="" />
          </div>
          <div>
            <span>Location</span>
            <h3>Marywood University</h3>
            <p>
              Events are expected to run near regular club meeting space at
              Nazareth Center unless a listing says otherwise.
            </p>
          </div>
        </article>

        <article className="tournaments-feature-card">
          <div className="tournaments-card-icon" aria-hidden="true">
            <img src={ClockIcon} alt="" />
          </div>
          <div>
            <span>Time Control</span>
            <h3>To be announced</h3>
            <p>
              We are preparing formats that work for both newer tournament
              players and experienced club competitors.
            </p>
          </div>
        </article>
      </div>

      <div className="tournaments-roadmap">
        {tournamentMilestones.map((item, index) => (
          <article
            className="tournaments-roadmap-item"
            key={item.label}
            style={{ "--tournament-item-index": index }}
          >
            <span>{item.label}</span>
            <h3>{item.value}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>

      <ul className="tournaments-checklist" aria-label="Tournament page features being prepared">
        {tournamentChecks.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

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
            <span>Entry Purchase</span>
            <h3 id="purchase-drawer-heading">Tournament Entry</h3>
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

        <div className="purchase-drawer-summary">
          <div>
            <span>Scranton Chess Tournament</span>
            <strong>${entryPrice}</strong>
          </div>
          <p>
            Reserve tournament entry now. Final event date, section details,
            and payment instructions will be confirmed by email.
          </p>
        </div>

        <form className="purchase-form" onSubmit={handlePurchaseSubmit} noValidate>
          <div className="purchase-field">
            <label htmlFor="purchase-name">Player name</label>
            <input
              id="purchase-name"
              name="name"
              type="text"
              autoComplete="name"
              value={purchaseForm.name}
              aria-invalid={purchaseStatus === "error" && !purchaseForm.name.trim()}
              disabled={purchaseStatus === "loading"}
              onChange={(event) => updatePurchaseField("name", event.target.value)}
            />
          </div>

          <div className="purchase-field">
            <label htmlFor="purchase-email">Email</label>
            <input
              id="purchase-email"
              name="email"
              type="email"
              autoComplete="email"
              value={purchaseForm.email}
              aria-describedby={purchaseMessage ? "purchase-drawer-message" : undefined}
              aria-invalid={
                purchaseStatus === "error"
                && Boolean(purchaseForm.email.trim())
                && !isValidEmail(purchaseForm.email.trim())
              }
              disabled={purchaseStatus === "loading"}
              onChange={(event) => updatePurchaseField("email", event.target.value)}
            />
          </div>

          <div className="purchase-form-row">
            <div className="purchase-field">
              <label htmlFor="purchase-section">Section</label>
              <select
                id="purchase-section"
                name="section"
                value={purchaseForm.section}
                disabled={purchaseStatus === "loading"}
                onChange={(event) => updatePurchaseField("section", event.target.value)}
              >
                <option>Open</option>
                <option>Reserve</option>
                <option>Scholastic</option>
              </select>
            </div>

            <div className="purchase-field">
              <label htmlFor="purchase-quantity">Entries</label>
              <input
                id="purchase-quantity"
                name="quantity"
                type="number"
                min="1"
                max="6"
                value={purchaseForm.quantity}
                disabled={purchaseStatus === "loading"}
                onChange={(event) => updatePurchaseField("quantity", event.target.value)}
              />
            </div>
          </div>

          <div className="purchase-total" aria-live="polite">
            <span>Total</span>
            <strong>${purchaseTotal}</strong>
          </div>

          {purchaseMessage && (
            <p
              className={`purchase-message purchase-message-${purchaseStatus}`}
              id="purchase-drawer-message"
              role={purchaseStatus === "error" ? "alert" : "status"}
            >
              {purchaseMessage}
            </p>
          )}

          <button
            className="button button-large purchase-submit"
            type="submit"
            disabled={purchaseStatus === "loading"}
          >
            {purchaseStatus === "loading" ? "Saving..." : "Reserve Entry"}
          </button>
        </form>
      </aside>
    </section>
  )
}
