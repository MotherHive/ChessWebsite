import { useCallback, useReducer, useRef, useState } from "react"
import { byePrice } from "./constants"
import {
  createRegistrationAttemptKey,
  readSavedJoinInfo,
  readSavedPurchaseEntry,
  savePurchaseEntry,
  savePurchaseReceipt,
  submitTournamentRegistration,
} from "./client"
import {
  createPurchaseState,
  derivePurchase,
  emptyTournament,
  purchaseReducer,
} from "./model"
import { buildTournamentRegistration } from "./buildRegistration"

const savedEntryFields = new Set(["activeMembershipStatus", "section"])

export default function useTournamentPurchase(tournaments, currentTime) {
  const purchaseButtonRef = useRef(null)
  const purchaseCloseButtonRef = useRef(null)
  const purchaseAttemptKeyRef = useRef("")
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileStatus, setTurnstileStatus] = useState("pending")
  const [turnstileKey, setTurnstileKey] = useState(0)
  const featuredTournament = tournaments[0] || emptyTournament
  const [state, dispatch] = useReducer(
    purchaseReducer,
    featuredTournament,
    (tournament) => createPurchaseState(tournament, {}),
  )
  const {
    isPurchaseDrawerOpen,
    purchaseForm,
    purchaseMessage,
    purchaseResult,
    purchaseStatus,
    purchaseStep,
    selectedTournamentId,
  } = state
  const selectedTournament =
    tournaments.find((tournament) => tournament.id === selectedTournamentId) || featuredTournament
  const purchaseDetails = derivePurchase(selectedTournament, purchaseForm, currentTime)
  const {
    checkoutTournamentDetails,
    entryPrice,
    entryStepError,
    hasActiveMembership,
    infoStepError,
    maxByeCount,
    membershipPrice,
    purchaseTotal,
  } = purchaseDetails
  const currentStepIndex = purchaseStep === "entry" ? 0 : purchaseStep === "info" ? 1 : 2

  const invalidatePurchaseAttempt = () => {
    purchaseAttemptKeyRef.current = ""
  }

  // Remounting the widget restarts the challenge; it reports "pending" itself.
  const retryTurnstile = () => {
    setTurnstileToken("")
    setTurnstileKey((currentKey) => currentKey + 1)
  }

  const showPurchaseError = (message) => {
    dispatch({ type: "show-error", message })
  }

  const updatePurchaseField = (field, value) => {
    invalidatePurchaseAttempt()
    dispatch({ type: "update-field", field, value })

    if (savedEntryFields.has(field)) {
      savePurchaseEntry(selectedTournament.id, { ...purchaseForm, [field]: value })
    }
  }

  const openPurchaseDrawer = (tournamentId = featuredTournament.id) => {
    const tournament =
      tournaments.find((candidate) => candidate.id === tournamentId) || featuredTournament

    if (document.activeElement instanceof HTMLElement) {
      purchaseButtonRef.current = document.activeElement
    }

    invalidatePurchaseAttempt()
    setTurnstileToken("")
    setTurnstileKey((currentKey) => currentKey + 1)
    dispatch({
      type: "open",
      tournament,
      savedInfo: readSavedJoinInfo(),
      savedEntry: readSavedPurchaseEntry(tournament.id),
    })
  }

  const closePurchaseDrawer = useCallback(() => {
    dispatch({ type: "close" })
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
    dispatch({ type: "previous" })
  }

  const addBye = () => {
    invalidatePurchaseAttempt()
    const id = window.crypto?.randomUUID?.() || `${Date.now()}-${purchaseForm.byes.length}`
    const byes = [...purchaseForm.byes, { id, round: "" }]

    dispatch({
      type: "add-bye",
      id,
      maxByeCount,
    })

    if (purchaseForm.byes.length < maxByeCount) {
      savePurchaseEntry(selectedTournament.id, { ...purchaseForm, byes })
    }
  }

  const updateBye = (id, round) => {
    invalidatePurchaseAttempt()
    dispatch({ type: "update-bye", id, round })
    savePurchaseEntry(selectedTournament.id, {
      ...purchaseForm,
      byes: purchaseForm.byes.map((bye) => (bye.id === id ? { ...bye, round } : bye)),
    })
  }

  const removeBye = (id) => {
    invalidatePurchaseAttempt()
    dispatch({ type: "remove-bye", id })
    savePurchaseEntry(selectedTournament.id, {
      ...purchaseForm,
      byes: purchaseForm.byes.filter((bye) => bye.id !== id),
    })
  }

  const handleEntryContinue = () => {
    if (entryStepError) {
      showPurchaseError(entryStepError)
      return
    }

    dispatch({ type: "continue", step: "info" })
  }

  const handleInfoContinue = () => {
    if (infoStepError) {
      showPurchaseError(infoStepError)
      return
    }

    dispatch({ type: "continue", step: "review" })
  }

  const handlePurchaseSubmit = async (event) => {
    event.preventDefault()

    if (infoStepError) {
      showPurchaseError(infoStepError)
      return
    }

    let registration

    try {
      registration = buildTournamentRegistration(
        {
          tournamentId: selectedTournament.id,
          form: purchaseForm,
        },
        currentTime,
        selectedTournament,
      )
    } catch (error) {
      showPurchaseError(error.message || "Review the registration details and try again.")
      return
    }

    dispatch({ type: "submit-started" })
    const idempotencyKey = purchaseAttemptKeyRef.current || createRegistrationAttemptKey()
    purchaseAttemptKeyRef.current = idempotencyKey

    try {
      const result = await submitTournamentRegistration({
        idempotencyKey,
        tournamentId: selectedTournament.id,
        form: purchaseForm,
        turnstileToken,
      })

      savePurchaseReceipt({
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
      })

      if (result.checkoutUrl) {
        dispatch({ type: "redirecting" })
        window.location.assign(result.checkoutUrl)
        return
      }

      dispatch({ type: "submit-succeeded", result })
    } catch (error) {
      showPurchaseError(error.message || "Could not submit the registration. Try again later.")
    } finally {
      setTurnstileToken("")
      setTurnstileKey((currentKey) => currentKey + 1)
    }
  }

  return {
    ...purchaseDetails,
    addBye,
    closePurchaseDrawer,
    currentStepIndex,
    focusCloseButton,
    goToPreviousPurchaseStep,
    handleEntryContinue,
    handleInfoContinue,
    handlePurchaseSubmit,
    isPurchaseDrawerOpen,
    openPurchaseDrawer,
    purchaseForm,
    purchaseMessage,
    purchaseResult,
    purchaseStatus,
    purchaseStep,
    removeBye,
    retryTurnstile,
    selectedTournament,
    setPurchaseCloseButton,
    setTurnstileStatus,
    setTurnstileToken,
    turnstileKey,
    turnstileStatus,
    turnstileToken,
    updateBye,
    updatePurchaseField,
  }
}
