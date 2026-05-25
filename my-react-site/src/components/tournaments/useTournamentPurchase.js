import { useCallback, useRef, useState } from "react"
import {
  byePrice,
  paymentOptions,
  tournamentEntryPrices,
  tournamentRounds,
} from "../../data/tournaments"
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

export default function useTournamentPurchase(tournaments) {
  const purchaseButtonRef = useRef(null)
  const purchaseCloseButtonRef = useRef(null)
  const featuredTournament = tournaments[0]
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
      section: "Championship",
      byes: [],
      paymentMethod: paymentOptions[0],
    }
  })
  const [purchaseStatus, setPurchaseStatus] = useState("idle")
  const [purchaseMessage, setPurchaseMessage] = useState("")

  const selectedTournament =
    tournaments.find((tournament) => tournament.id === selectedTournamentId) || featuredTournament
  const maxByeCount = selectedTournament.maxByes ?? tournamentRounds.length
  const membershipTier = getMembershipTier(purchaseForm.birthDate)
  const hasActiveMembership = purchaseForm.activeMembershipStatus === "yes"
  const needsMembership = purchaseForm.activeMembershipStatus === "no"
  const entryPrice = tournamentEntryPrices[purchaseForm.section] || tournamentEntryPrices.Championship
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

  const resetPurchaseMessage = () => {
    if (purchaseStatus !== "idle") {
      setPurchaseStatus("idle")
      setPurchaseMessage("")
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

  const focusCloseButton = useCallback(() => {
    purchaseCloseButtonRef.current?.focus()
  }, [])

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
    purchaseStatus,
    purchaseStep,
    purchaseTotal,
    removeBye,
    selectedByeRounds,
    selectedTournament,
    setPurchaseCloseButton,
    updateBye,
    updatePurchaseField,
  }
}
