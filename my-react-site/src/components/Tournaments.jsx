import { useCallback, useEffect, useRef, useState } from "react"
import TournamentSplash from "../../assets/splash.png"
import TournamentBanner from "../../assets/TournamentBannerTransparent.png"
import PAAmateurLogo from "../../assets/PAAmateurLogo.png"
import CalendarIcon from "../../assets/icons/Calendar.svg"
import LocationIcon from "../../assets/icons/Location.svg"

const tournamentListings = [
  {
    id: "pa-amateur-championship",
    title: "2026 Pennsylvania State Amateur Championship",
    type: "State Championship Event",
    rating: "USCF",
    price: 17,
    discountedPrice: 12,
    discountEndsAt: "2026-05-25T23:59:59-04:00",
    dateRange: "May 30-31, 2026",
    location: "Latour Room, Nazareth Student Center, Marywood University",
    address: "1300 University Ave., Scranton, PA 18509",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=1300%20University%20Ave%2C%20Scranton%2C%20PA%2018509",
    image: PAAmateurLogo,
    maxByes: 1,
    director: {
      name: "Bernie Sporko",
      email: "basp0529@gmail.com",
      phone: "570-604-2461",
      website: "https://www.pscfchess.org/clearinghouse/",
    },
    rulesUrl: "https://www.pscfchess.org/clearinghouse/",
    days: [
      {
        date: "Sat, May 30",
        sections: [
          {
            name: "Championship",
            control: "G/75 d5",
            times: [
              { label: "8:30 AM", detail: "Registration start" },
              { label: "9:30 AM", detail: "Registration end" },
              { label: "10:00", detail: "Round 1" },
              { label: "1:00", detail: "Round 2" },
              { label: "3:30", detail: "Round 3" },
            ],
          },
          {
            name: "Scholastic",
            control: "G/40 d5",
            times: [
              { label: "8:30 AM", detail: "Registration start" },
              { label: "9:30 AM", detail: "Registration end" },
              { label: "10:00", detail: "Round 1" },
              { label: "11:30", detail: "Round 2" },
              { label: "1:00", detail: "Round 3" },
              { label: "2:30", detail: "Round 4" },
            ],
          },
        ],
      },
      {
        date: "Sun, May 31",
        sections: [
          {
            name: "Championship",
            control: "G/90 d5",
            times: [
              { label: "9:30", detail: "Round 4" },
              { label: "1:00", detail: "Round 5" },
            ],
          },
        ],
      },
    ],
    prizes: [
      {
        section: "Championship",
        rows: [
          { brackets: ["Overall"], prize: "Trophies", place: "1st-3rd" },
          { brackets: ["U1800", "U1600", "U1400", "U1200/Unrated", "School Team"], prize: "Trophy", place: "Top" },
          { brackets: ["Overall"], prize: "2027 PA entry", place: "1st & 2nd" },
          { brackets: ["PA Resident"], prize: "Title", place: "Top" },
        ],
      },
      {
        section: "Scholastic",
        rows: [
          { brackets: ["Overall"], prize: "Trophies", place: "1st-2nd" },
          { brackets: ["U1000", "U800/Unrated", "School Team"], prize: "Trophy", place: "Top" },
        ],
      },
    ],
  },
]

const tournamentEntryPrices = {
  Championship: 17,
  Scholastic: 12,
}
const byePrice = 5
const expiredMembershipDiscount = 3

const tournamentSections = Object.keys(tournamentEntryPrices)
const tournamentRounds = ["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"]

const membershipAgeTiers = [
  { label: "Youth membership", ageRange: "18 and under", maxAge: 18, price: 20 },
  { label: "Adult membership", ageRange: "19-64", maxAge: 64, price: 45 },
  { label: "Senior membership", ageRange: "65+", maxAge: 150, price: 40 },
]

const membershipPrices = membershipAgeTiers.map((tier) => tier.price)
const membershipPriceRange = {
  min: Math.min(...membershipPrices),
  max: Math.max(...membershipPrices),
}

const paymentOptions = [
  "Payment method to be confirmed",
  "Pay at event",
  "Email invoice",
  "Online payment pending",
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

const formatPrizePlace = (row) => {
  const hasMultipleBrackets = row.brackets.length > 1 || row.brackets.some((bracket) => bracket.includes("/"))

  if (row.place === "Top" && hasMultipleBrackets) {
    return "Top Each"
  }

  return row.place
}

const formatCountdown = (endsAt, now) => {
  const remainingMs = new Date(endsAt).getTime() - now

  if (remainingMs <= 0) {
    return "Expired"
  }

  const totalSeconds = Math.floor(remainingMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const padTime = (value) => String(value).padStart(2, "0")

  return `${days}d ${padTime(hours)}h ${padTime(minutes)}m ${padTime(seconds)}s`
}

const getPlayerSearchUrl = (name) => {
  const trimmedName = name.trim()
  const searchParams = new URLSearchParams({ fuzzy: trimmedName || "FIRST LAST" })

  return `https://ratings.uschess.org/?${searchParams.toString()}`
}

export default function Tournaments() {
  const sectionRef = useRef(null)
  const purchaseButtonRef = useRef(null)
  const purchaseCloseButtonRef = useRef(null)
  const featuredTournament = tournamentListings[0]
  const [isVisible, setIsVisible] = useState(false)
  const [isPurchaseDrawerOpen, setIsPurchaseDrawerOpen] = useState(false)
  const [openTournamentId, setOpenTournamentId] = useState(tournamentListings[0].id)
  const [selectedTournamentId, setSelectedTournamentId] = useState(tournamentListings[0].id)
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [purchaseStep, setPurchaseStep] = useState("entry")
  const [purchaseForm, setPurchaseForm] = useState(() => {
    const savedInfo = getSavedJoinInfo()

    return {
      activeMembershipStatus: "",
      isExpiredMember: false,
      enteredWithTeam: false,
      uscfId: "",
      name: savedInfo.name,
      email: savedInfo.email,
      phone: "",
      address: "",
      birthDate: "",
      school: "",
      section: "Championship",
      byes: [],
      paymentMethod: paymentOptions[0],
    }
  })
  const [purchaseStatus, setPurchaseStatus] = useState("idle")
  const [purchaseMessage, setPurchaseMessage] = useState("")

  const selectedTournament =
    tournamentListings.find((tournament) => tournament.id === selectedTournamentId) || featuredTournament
  const maxByeCount = selectedTournament.maxByes ?? tournamentRounds.length
  const checkoutTournamentDetails = {
    id: selectedTournament.id,
    title: selectedTournament.title,
    type: selectedTournament.type,
    rating: selectedTournament.rating,
    dateRange: selectedTournament.dateRange,
    location: selectedTournament.location,
    address: selectedTournament.address,
    section: purchaseForm.section,
    possibleByes: maxByeCount,
  }
  const membershipTier = getMembershipTier(purchaseForm.birthDate)
  const hasActiveMembership = purchaseForm.activeMembershipStatus === "yes"
  const needsMembership = purchaseForm.activeMembershipStatus === "no"
  const entryPrice = tournamentEntryPrices[purchaseForm.section] || tournamentEntryPrices.Championship
  const membershipPrice = needsMembership
    ? Math.max(0, (membershipTier?.price || 0) - (purchaseForm.isExpiredMember ? expiredMembershipDiscount : 0))
    : 0
  const byeTotal = purchaseForm.byes.length * byePrice
  const purchaseTotal = entryPrice + byeTotal + membershipPrice
  const selectedByeRounds = purchaseForm.byes.map((bye) => bye.round).filter(Boolean)
  const playerSearchUrl = getPlayerSearchUrl(purchaseForm.name)
  const entryStepCanContinue =
    Boolean(purchaseForm.activeMembershipStatus)
    && Boolean(purchaseForm.section)
    && purchaseForm.byes.every((bye) => bye.round)
    && new Set(selectedByeRounds).size === selectedByeRounds.length
  const infoStepCanContinue =
    purchaseForm.name.trim()
    && isValidEmail(purchaseForm.email.trim())
    && (
      hasActiveMembership
        ? purchaseForm.uscfId.trim()
        : needsMembership
          && purchaseForm.address.trim()
          && purchaseForm.phone.trim()
          && purchaseForm.birthDate
          && (!purchaseForm.enteredWithTeam || purchaseForm.school.trim())
    )
  const currentStepIndex = purchaseStep === "entry" ? 0 : purchaseStep === "info" ? 1 : 2

  const goToPreviousPurchaseStep = () => {
    setPurchaseStatus("idle")
    setPurchaseMessage("")

    if (purchaseStep === "review") {
      setPurchaseStep("info")
      return
    }

    if (purchaseStep === "info") {
      setPurchaseStep("entry")
    }
  }

  const openPurchaseDrawer = (tournamentId = featuredTournament.id) => {
    const nextTournament =
      tournamentListings.find((tournament) => tournament.id === tournamentId) || featuredTournament
    const nextMaxByeCount = nextTournament.maxByes ?? tournamentRounds.length

    if (document.activeElement instanceof HTMLElement) {
      purchaseButtonRef.current = document.activeElement
    }

    setSelectedTournamentId(nextTournament.id)
    setPurchaseForm((currentForm) => {
      if (currentForm.byes.length <= nextMaxByeCount) {
        return currentForm
      }

      return {
        ...currentForm,
        byes: currentForm.byes.slice(0, nextMaxByeCount),
      }
    })
    setPurchaseStatus("idle")
    setPurchaseMessage("")
    setIsPurchaseDrawerOpen(true)
  }

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

  useEffect(() => {
    const countdownTimer = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => window.clearInterval(countdownTimer)
  }, [])

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
      if (currentForm.byes.length >= maxByeCount) {
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
      setPurchaseMessage("Select membership status, choose a section, and complete each bye round.")
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

    if (hasActiveMembership && !purchaseForm.uscfId.trim()) {
      setPurchaseStatus("error")
      setPurchaseMessage("Enter the active USCF ID.")
      return
    }

    if (needsMembership) {
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
            tournament: checkoutTournamentDetails,
            hasActiveMembership,
            name: purchaseForm.name.trim(),
            email: purchaseForm.email.trim(),
            entryPrice,
            byePrice,
            possibleByes: maxByeCount,
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

      <div className="tournament-director-strip" aria-label="Tournament information">
        <div className="tournament-info-panel">
          <span className="tournament-info-label">Tournament Info</span>
          <h3>Organized chess events for local players</h3>
          <dl className="tournament-info-list">
            <div>
              <dt>Registration</dt>
              <dd>Entry details, deadlines, and sections are listed with each tournament.</dd>
            </div>
            <div>
              <dt>Membership</dt>
              <dd>US Chess requirements are handled during tournament registration.</dd>
            </div>
            <div>
              <dt>Players</dt>
              <dd>Events may include rated, scholastic, beginner, and open sections.</dd>
            </div>
          </dl>
          <div className="tournament-director-inline" aria-label="Tournament director contact information">
            <span>Tournament Director</span>
            <strong>{featuredTournament.director.name}</strong>
            <dl className="tournament-director-list">
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${featuredTournament.director.email}`}>
                    {featuredTournament.director.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>
                  <a href="tel:+15706042461">{featuredTournament.director.phone}</a>
                </dd>
              </div>
              <div>
                <dt>Website</dt>
                <dd>
                  <a href={featuredTournament.director.website} target="_blank" rel="noreferrer">
                    pscfchess.org/clearinghouse
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="tournament-list" aria-label="Available tournaments">
        {tournamentListings.map((tournament, index) => {
          const isOpen = openTournamentId === tournament.id
          const countdown = formatCountdown(tournament.discountEndsAt, currentTime)

          return (
            <article
              className={`tournament-listing${isOpen ? " tournament-listing-open" : ""}`}
              key={tournament.id}
              style={{ "--tournament-card-index": index }}
            >
              <div
                className="tournament-summary"
              >
                <span className="tournament-summary-copy">
                  <span className="tournament-title-stack">
                    <span className="tournament-title-row">
                      <span>
                        <span className="tournament-eyebrow">Tournament</span>
                        <strong>{tournament.title}</strong>
                      </span>
                      <span className={`tournament-rating tournament-rating-${tournament.rating.toLowerCase()}`}>
                        {tournament.rating}
                      </span>
                    </span>
                    <span className="tournament-title-actions">
                      <button
                        className="tournament-chevron-button"
                        type="button"
                        aria-label={`${isOpen ? "Hide" : "Show"} ${tournament.title} details`}
                        aria-expanded={isOpen}
                        aria-controls={`${tournament.id}-details`}
                        onClick={() => setOpenTournamentId(isOpen ? "" : tournament.id)}
                      >
                        <span>Details</span>
                        <span className="tournament-chevron" aria-hidden="true"></span>
                      </button>
                      <button
                        className="button button-large tournament-card-purchase-button"
                        type="button"
                        aria-controls="tournament-purchase-drawer"
                        aria-expanded={isPurchaseDrawerOpen}
                        onClick={() => openPurchaseDrawer(tournament.id)}
                      >
                        <span aria-hidden="true">+</span>
                        Purchase Entry
                      </button>
                    </span>
                  </span>

                  <span className="tournament-meta-line">
                    <span>{tournament.type}</span>
                    <span className="tournament-offer-row">
                      <span className="tournament-price">
                        <s>{formatPrice(tournament.price)}</s>
                        <strong>{formatPrice(tournament.discountedPrice)}</strong>
                      </span>
                      <span className="tournament-discount">
                        <span>Early entry discount</span>
                        <strong>{countdown}</strong>
                      </span>
                    </span>
                  </span>
                </span>

                <span className="tournament-summary-image">
                  <img src={tournament.image} alt="" />
                </span>
              </div>

              <div className="tournament-location-row">
                <span>
                  <img src={LocationIcon} alt="" aria-hidden="true" />
                  {tournament.location}
                </span>
                <a href={tournament.mapUrl} target="_blank" rel="noreferrer">
                  View on map
                </a>
              </div>

              <div className="tournament-dropdown" id={`${tournament.id}-details`} hidden={!isOpen}>
                <div className="tournament-day-grid" aria-label={`${tournament.title} schedule`}>
                  {tournament.days.map((day) => (
                    <section className="tournament-day-card" key={day.date}>
                      <div className="tournament-day-date">
                        <img src={CalendarIcon} alt="" aria-hidden="true" />
                        <h3>{day.date}</h3>
                      </div>
                      <div className="tournament-section-time-grid">
                        {day.sections.map((scheduleSection) => (
                          <section className="tournament-time-card" key={`${day.date}-${scheduleSection.name}`}>
                            <div className="tournament-time-card-head">
                              <span>{scheduleSection.name}</span>
                              <strong>{scheduleSection.control}</strong>
                            </div>
                            <ol>
                              {scheduleSection.times.map((item) => (
                                <li key={`${day.date}-${scheduleSection.name}-${item.label}-${item.detail}`}>
                                  <time>{item.label}</time>
                                  <span>{item.detail}</span>
                                </li>
                              ))}
                            </ol>
                          </section>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>

                <section className="tournament-prizes-card" aria-label={`${tournament.title} prizes`}>
                  <div className="tournament-card-heading">
                    <span>Prizes</span>
                    <h3>Sections & brackets</h3>
                  </div>
                  <div className="tournament-prize-grid">
                    {tournament.prizes.map((section) => (
                      <div className="tournament-prize-section" key={section.section}>
                        <strong>{section.section}</strong>
                        <div className="tournament-prize-table-wrap">
                          <table className="tournament-prize-table">
                            <caption>{section.section} prize table</caption>
                            <thead>
                              <tr>
                                <th scope="col">Bracket(s)</th>
                                <th scope="col">Prize</th>
                                <th scope="col">Place</th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.rows.map((row) => (
                                <tr key={`${section.section}-${row.prize}-${row.place}-${row.brackets.join("-")}`}>
                                  <td>
                                    <span className="tournament-prize-brackets">
                                      {row.brackets.join(", ")}
                                    </span>
                                  </td>
                                  <td>
                                    <strong>{row.prize}</strong>
                                  </td>
                                  <td>{formatPrizePlace(row)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="tournament-footer-row">
                  <nav className="tournament-resource-links" aria-label={`${tournament.title} resources`}>
                    {tournament.rulesUrl && (
                      <a href={tournament.rulesUrl} target="_blank" rel="noreferrer">View rules</a>
                    )}
                    {tournament.flyerUrl && (
                      <a
                        className="tournament-icon-link tournament-icon-link-flyer"
                        href={tournament.flyerUrl}
                        aria-label={`${tournament.title} flyer`}
                      >
                        <span aria-hidden="true"></span>
                      </a>
                    )}
                    {tournament.uscfUrl && (
                      <a
                        className="tournament-icon-link tournament-icon-link-uscf"
                        href={tournament.uscfUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${tournament.title} USCF listing`}
                      >
                        <span aria-hidden="true"></span>
                      </a>
                    )}
                  </nav>
                </div>
              </div>
            </article>
          )
        })}
      </div>

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
              {purchaseStep === "thanks" ? "Thank You" : "Tournament Entry"}
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

        {purchaseStep === "entry" && (
          <div className="purchase-panel purchase-entry-panel">
            <div className="purchase-membership-choice-card">
              <div className="purchase-field">
                <label htmlFor="purchase-active-membership">
                  Do you have an <strong>active</strong> USCF membership?
                </label>
                <select
                  id="purchase-active-membership"
                  required
                  value={purchaseForm.activeMembershipStatus}
                  aria-invalid={purchaseStatus === "error" && !purchaseForm.activeMembershipStatus}
                  onChange={(event) => updatePurchaseField("activeMembershipStatus", event.target.value)}
                >
                  <option value="">Select one</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <p>Active members only need ID, name, and email on the next step.</p>
            </div>

            {needsMembership && (
              <div className="purchase-cart-card">
                <div className="purchase-cart-card-header">
                  <span>Added to cart</span>
                  <div className="purchase-membership-title-row">
                    <strong>USCF membership</strong>
                    <div className="purchase-membership-price">
                      <strong className="purchase-range">
                        {formatPrice(membershipPriceRange.min)}-{formatPrice(membershipPriceRange.max)}
                      </strong>
                      <details className="purchase-info-menu">
                        <summary aria-label="Show USCF membership prices by age">
                          <span aria-hidden="true">i</span>
                        </summary>
                        <div className="purchase-info-popover">
                          <strong>Prices by age</strong>
                          <ul>
                            {membershipAgeTiers.map((tier) => (
                              <li key={tier.label}>
                                <span>{tier.ageRange}</span>
                                <strong>{formatPrice(tier.price)}</strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
                <p>
                  Price is calculated from birth date on the information step.
                  Expired memberships receive a {formatPrice(expiredMembershipDiscount)} discount.
                </p>
              </div>
            )}

            <div className="purchase-drawer-summary">
              <div className="purchase-tournament-row">
                <div className="purchase-tournament-title">
                  <span>Entry</span>
                  <strong>Tournament entry</strong>
                  <button
                    className="purchase-add-bye-link"
                    type="button"
                    onClick={addBye}
                    disabled={purchaseForm.byes.length >= maxByeCount}
                  >
                    + Add Bye
                  </button>
                </div>
                <div className="purchase-section-select">
                  <label htmlFor="purchase-section">Section</label>
                  <select
                    id="purchase-section"
                    value={purchaseForm.section}
                    onChange={(event) => updatePurchaseField("section", event.target.value)}
                  >
                    {tournamentSections.map((section) => (
                      <option key={section}>{section}</option>
                    ))}
                  </select>
                </div>
                <strong>{formatPrice(entryPrice)}</strong>
              </div>

              {purchaseForm.byes.length > 0 && (
                <div className="purchase-bye-list">
                  <div className="purchase-bye-heading">
                    <strong>Byes</strong>
                  </div>

                  {purchaseForm.byes.map((bye, byeIndex) => (
                    <div className="purchase-bye-row" key={bye.id}>
                      <label htmlFor={`purchase-bye-${bye.id}`}>Bye {byeIndex + 1}</label>
                      <select
                        id={`purchase-bye-${bye.id}`}
                        value={bye.round}
                        onChange={(event) => updateBye(bye.id, event.target.value)}
                      >
                        <option value="">Choose round</option>
                        {tournamentRounds.map((round) => (
                          <option
                            disabled={selectedByeRounds.includes(round) && bye.round !== round}
                            key={round}
                          >
                            {round}
                          </option>
                        ))}
                      </select>
                      <span>+{formatPrice(byePrice)}</span>
                      <button
                        className="purchase-bye-remove"
                        type="button"
                        aria-label={`Remove bye ${byeIndex + 1}`}
                        title="Remove bye"
                        onClick={() => removeBye(bye.id)}
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p>
                {selectedTournament.title}. {selectedTournament.dateRange}. {maxByeCount} possible bye
                {maxByeCount === 1 ? "" : "s"} at registration.
              </p>

              {purchaseForm.byes.length >= maxByeCount && (
                <small className="purchase-bye-limit">All possible byes have been selected.</small>
              )}
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

            {entryStepCanContinue && (
              <div className="purchase-drawer-footer">
                <div>
                  <span>Current total</span>
                  <strong>
                    {hasActiveMembership || membershipTier
                      ? formatPrice(purchaseTotal)
                      : `${formatPrice(entryPrice + byeTotal)} + membership`}
                  </strong>
                </div>
                <button className="button button-large purchase-submit" type="button" onClick={handleEntryContinue}>
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {purchaseStep === "info" && (
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
        )}

        {purchaseStep === "review" && (
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
              <div className="purchase-field">
                <label htmlFor="purchase-payment-method">Payment option</label>
                <select
                  id="purchase-payment-method"
                  value={purchaseForm.paymentMethod}
                  onChange={(event) => updatePurchaseField("paymentMethod", event.target.value)}
                >
                  {paymentOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <p>
                Final payment handling can change later without changing the
                rest of this registration flow.
              </p>
              {needsMembership && (
                <p>
                  USCF membership purchases are non-refundable.
                </p>
              )}
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

            <div className="purchase-drawer-footer">
              <button
                className="button button-large purchase-submit"
                type="submit"
                disabled={purchaseStatus === "loading"}
              >
                {purchaseStatus === "loading" ? "Submitting..." : "Pay & Register"}
              </button>
            </div>
          </form>
        )}

        {purchaseStep === "thanks" && (
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
        )}
      </aside>
    </section>
  )
}
