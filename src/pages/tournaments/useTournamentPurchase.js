import { useCallback, useRef, useState } from "react"
import {
  byePrice,
  paymentOptions,
  tournamentRounds,
} from "../../data/tournaments"
import {
  buildTournamentRegistration,
  getEntryFeePrice,
} from "../../utils/tournamentCheckout"
import {
  getMembershipPrice,
  getMembershipTier,
} from "../../utils/tournamentPricing"
import {
  getPlayerSearchUrl,
  isValidEmail,
} from "../../utils/tournamentValidation"

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

const getEntryStepError = (form, selectedByeRounds) => {
  if (!form.activeMembershipStatus || !form.section || form.byes.some((bye) => !bye.round)) {
    return "Select membership status, choose a section, and complete each bye round."
  }

  if (new Set(selectedByeRounds).size !== selectedByeRounds.length) {
    return "Choose each bye round only once."
  }

  return ""
}

const getInfoStepError = (form, { hasActiveMembership, membershipTier, needsMembership }) => {
  if (!form.name.trim() || !form.email.trim()) {
    return "Enter the player name and email."
  }

  if (!isValidEmail(form.email.trim())) {
    return "Use a valid email address, like name@example.com."
  }

  if (hasActiveMembership) {
    return form.uscfId.trim() ? "" : "Enter the active USCF ID."
  }

  if (!needsMembership) {
    return "Select an active USCF membership status."
  }

  if (!form.address.trim() || !form.phone.trim() || !form.birthDate) {
    return "Enter address, phone, and birth date for the membership."
  }

  if (!membershipTier) {
    return "Enter a valid birth date."
  }

  if (form.enteredWithTeam && !form.school.trim()) {
    return "Enter the school for the team entry."
  }

  return ""
}

const getTournamentEntryFees = (tournament) => (
  tournament.entryFees?.length ? tournament.entryFees : [{ section: "Championship", price: 0 }]
)

const getDefaultTournamentSection = (tournament) => getTournamentEntryFees(tournament)[0].section

export default function useTournamentPurchase(tournaments) {
  const purchaseButtonRef = useRef(null)
  const purchaseCloseButtonRef = useRef(null)
  const featuredTournament = tournaments[0] || { id: "", title: "", entryFees: [] }
  const [isPurchaseDrawerOpen, setIsPurchaseDrawerOpen] = useState(false)
  const [selectedTournamentId, setSelectedTournamentId] = useState(featuredTournament.id)
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
      section: getDefaultTournamentSection(featuredTournament),
      byes: [],
      paymentMethod: paymentOptions[0].id,
    }
  })
  const [purchaseStatus, setPurchaseStatus] = useState("idle")
  const [purchaseMessage, setPurchaseMessage] = useState("")
  const [purchaseResult, setPurchaseResult] = useState(null)

  const selectedTournament =
    tournaments.find((tournament) => tournament.id === selectedTournamentId) || featuredTournament
  const maxByeCount = selectedTournament.maxByes ?? tournamentRounds.length
  const membershipTier = getMembershipTier(purchaseForm.birthDate)
  const hasActiveMembership = purchaseForm.activeMembershipStatus === "yes"
  const needsMembership = purchaseForm.activeMembershipStatus === "no"
  const tournamentEntryFees = getTournamentEntryFees(selectedTournament)
  const tournamentSections = tournamentEntryFees.map((fee) => fee.section)
  const selectedEntryFee =
    tournamentEntryFees.find((fee) => fee.section === purchaseForm.section) ?? tournamentEntryFees[0]
  const entryPrice = getEntryFeePrice(selectedEntryFee, selectedTournament)
  const membershipPrice = getMembershipPrice({
    needsMembership,
    membershipTier,
    isExpiredMember: purchaseForm.isExpiredMember,
  })
  const byeTotal = purchaseForm.byes.length * byePrice
  const purchaseTotal = entryPrice + byeTotal + membershipPrice
  const selectedByeRounds = purchaseForm.byes.map((bye) => bye.round).filter(Boolean)
  const playerSearchUrl = getPlayerSearchUrl(purchaseForm.name)
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
  const entryStepError = getEntryStepError(purchaseForm, selectedByeRounds)
  const infoStepError = getInfoStepError(purchaseForm, { hasActiveMembership, membershipTier, needsMembership })
  const entryStepCanContinue = !entryStepError
  const infoStepCanContinue = !infoStepError
  const currentStepIndex = purchaseStep === "entry" ? 0 : purchaseStep === "info" ? 1 : 2

  const clearPurchaseMessage = () => {
    setPurchaseStatus("idle")
    setPurchaseMessage("")
  }

  const showPurchaseError = (message) => {
    setPurchaseStatus("error")
    setPurchaseMessage(message)
  }

  const resetPurchaseMessage = () => {
    if (purchaseStatus !== "idle" || purchaseMessage) {
      clearPurchaseMessage()
    }
  }

  const updatePurchaseField = (field, value) => {
    setPurchaseForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))

    resetPurchaseMessage()
  }

  const openPurchaseDrawer = (tournamentId = featuredTournament.id) => {
    const nextTournament =
      tournaments.find((tournament) => tournament.id === tournamentId) || featuredTournament
    const nextMaxByeCount = nextTournament.maxByes ?? tournamentRounds.length

    if (document.activeElement instanceof HTMLElement) {
      purchaseButtonRef.current = document.activeElement
    }

    setSelectedTournamentId(nextTournament.id)
    setPurchaseStep("entry")
    setPurchaseResult(null)
    setPurchaseForm((currentForm) => {
      const nextSection = getTournamentEntryFees(nextTournament).some((fee) => fee.section === currentForm.section)
        ? currentForm.section
        : getDefaultTournamentSection(nextTournament)

      if (currentForm.byes.length <= nextMaxByeCount && currentForm.section === nextSection) {
        return currentForm
      }

      return {
        ...currentForm,
        section: nextSection,
        byes: currentForm.byes.slice(0, nextMaxByeCount),
      }
    })
    clearPurchaseMessage()
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

  const focusCloseButton = useCallback(() => {
    purchaseCloseButtonRef.current?.focus()
  }, [])

  const goToPreviousPurchaseStep = () => {
    clearPurchaseMessage()

    if (purchaseStep === "review") {
      setPurchaseStep("info")
      return
    }

    if (purchaseStep === "info") {
      setPurchaseStep("entry")
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

    resetPurchaseMessage()
  }

  const updateBye = (id, round) => {
    setPurchaseForm((currentForm) => ({
      ...currentForm,
      byes: currentForm.byes.map((bye) => (
        bye.id === id ? { ...bye, round } : bye
      )),
    }))

    resetPurchaseMessage()
  }

  const removeBye = (id) => {
    setPurchaseForm((currentForm) => ({
      ...currentForm,
      byes: currentForm.byes.filter((bye) => bye.id !== id),
    }))

    resetPurchaseMessage()
  }

  const handleEntryContinue = () => {
    if (entryStepError) {
      showPurchaseError(entryStepError)
      return
    }

    clearPurchaseMessage()
    setPurchaseStep("info")
  }

  const handleInfoContinue = () => {
    if (infoStepError) {
      showPurchaseError(infoStepError)
      return
    }

    clearPurchaseMessage()
    setPurchaseStep("review")
  }

  const handlePurchaseSubmit = async (event) => {
    event.preventDefault()

    if (infoStepError) {
      showPurchaseError(infoStepError)
      return
    }

    let registration

    try {
      registration = buildTournamentRegistration({
        tournamentId: selectedTournament.id,
        form: purchaseForm,
      })
    } catch (error) {
      showPurchaseError(error.message || "Review the registration details and try again.")
      return
    }

    setPurchaseStatus("loading")
    setPurchaseMessage("")

    try {
      const response = await fetch("/api/tournament-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: selectedTournament.id,
          form: purchaseForm,
        }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error || "Could not submit the registration.")
      }

      try {
        window.localStorage.setItem(
          "scranton-chess-tournament-purchase",
          JSON.stringify({
            ...purchaseForm,
            registrationId: result.registrationId,
            tournament: checkoutTournamentDetails,
            hasActiveMembership,
            name: registration.player.name,
            email: registration.player.email,
            entryPrice,
            byePrice,
            possibleByes: maxByeCount,
            membershipPrice,
            total: purchaseTotal,
          }),
        )
      } catch {
        // The server registration succeeded, so a blocked local cache should not fail the purchase.
      }

      if (result.checkoutUrl) {
        setPurchaseMessage("Redirecting to Stripe Checkout...")
        window.location.assign(result.checkoutUrl)
        return
      }

      setPurchaseResult(result)
      setPurchaseStatus("success")
      setPurchaseStep("thanks")
      setPurchaseMessage("Registration submitted. Payment is pending.")
    } catch (error) {
      showPurchaseError(error.message || "Could not submit the registration. Try again later.")
    }
  }

  return {
    addBye,
    byeTotal,
    checkoutTournamentDetails,
    closePurchaseDrawer,
    currentStepIndex,
    entryPrice,
    entryStepCanContinue,
    focusCloseButton,
    goToPreviousPurchaseStep,
    handleEntryContinue,
    handleInfoContinue,
    handlePurchaseSubmit,
    hasActiveMembership,
    infoStepCanContinue,
    isPurchaseDrawerOpen,
    maxByeCount,
    membershipPrice,
    membershipTier,
    needsMembership,
    openPurchaseDrawer,
    playerSearchUrl,
    purchaseForm,
    purchaseMessage,
    purchaseResult,
    purchaseStatus,
    purchaseStep,
    purchaseTotal,
    removeBye,
    selectedByeRounds,
    selectedTournament,
    setPurchaseCloseButton,
    tournamentSections,
    updateBye,
    updatePurchaseField,
  }
}
