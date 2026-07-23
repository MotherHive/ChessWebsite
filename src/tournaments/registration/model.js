import {
  byePrice,
  paymentOptions,
  tournamentRounds,
} from "./constants.js"
import { getEntryFeePrice } from "./buildRegistration.js"
import {
  getMembershipPrice,
  getMembershipTier,
} from "./pricing.js"
import {
  getPlayerSearchUrl,
  isValidEmail,
} from "./validation.js"

export const emptyTournament = { id: "", title: "", entryFees: [] }

export const getTournamentEntryFees = (tournament) => (
  tournament.entryFees?.length ? tournament.entryFees : [{ section: "Championship", price: 0 }]
)

export const getDefaultTournamentSection = (tournament) => getTournamentEntryFees(tournament)[0].section

export const createPurchaseForm = (tournament, savedInfo = {}) => ({
  activeMembershipStatus: "",
  isExpiredMember: false,
  enteredWithTeam: false,
  uscfId: "",
  name: savedInfo.name || "",
  email: savedInfo.email || "",
  phone: "",
  address: "",
  birthDate: "",
  school: "",
  section: getDefaultTournamentSection(tournament),
  byes: [],
  paymentMethod: paymentOptions[0].id,
})

export const reconcilePurchaseForm = (form, tournament) => {
  const maxByeCount = tournament.maxByes ?? tournamentRounds.length
  const sectionExists = getTournamentEntryFees(tournament).some((fee) => fee.section === form.section)
  const section = sectionExists ? form.section : getDefaultTournamentSection(tournament)

  if (form.byes.length <= maxByeCount && form.section === section) {
    return form
  }

  return {
    ...form,
    section,
    byes: form.byes.slice(0, maxByeCount),
  }
}

export const getEntryStepError = (form, selectedByeRounds) => {
  if (!form.activeMembershipStatus || !form.section || form.byes.some((bye) => !bye.round)) {
    return "Select membership status, choose a section, and complete each bye round."
  }

  if (new Set(selectedByeRounds).size !== selectedByeRounds.length) {
    return "Choose each bye round only once."
  }

  return ""
}

export const getInfoStepError = (form, { hasActiveMembership, membershipTier, needsMembership }) => {
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

export const derivePurchase = (tournament, form, now = Date.now()) => {
  const maxByeCount = tournament.maxByes ?? tournamentRounds.length
  const membershipTier = getMembershipTier(form.birthDate)
  const hasActiveMembership = form.activeMembershipStatus === "yes"
  const needsMembership = form.activeMembershipStatus === "no"
  const entryFees = getTournamentEntryFees(tournament)
  const tournamentSections = entryFees.map((fee) => fee.section)
  const selectedEntryFee = entryFees.find((fee) => fee.section === form.section) ?? entryFees[0]
  const entryPrice = getEntryFeePrice(selectedEntryFee, tournament, now)
  const membershipPrice = getMembershipPrice({
    needsMembership,
    membershipTier,
    isExpiredMember: form.isExpiredMember,
  })
  const byeTotal = form.byes.length * byePrice
  const purchaseTotal = entryPrice + byeTotal + membershipPrice
  const selectedByeRounds = form.byes.map((bye) => bye.round).filter(Boolean)
  const entryStepError = getEntryStepError(form, selectedByeRounds)
  const infoStepError = getInfoStepError(form, {
    hasActiveMembership,
    membershipTier,
    needsMembership,
  })

  return {
    byeTotal,
    checkoutTournamentDetails: {
      id: tournament.id,
      title: tournament.title,
      type: tournament.type,
      rating: tournament.rating,
      dateRange: tournament.dateRange,
      location: tournament.location,
      address: tournament.address,
      section: form.section,
      possibleByes: maxByeCount,
    },
    entryPrice,
    entryStepCanContinue: !entryStepError,
    entryStepError,
    hasActiveMembership,
    infoStepCanContinue: !infoStepError,
    infoStepError,
    maxByeCount,
    membershipPrice,
    membershipTier,
    needsMembership,
    playerSearchUrl: getPlayerSearchUrl(form.name),
    purchaseTotal,
    selectedByeRounds,
    tournamentSections,
  }
}

export const createPurchaseState = (tournament, savedInfo) => ({
  isPurchaseDrawerOpen: false,
  selectedTournamentId: tournament.id,
  purchaseStep: "entry",
  purchaseForm: createPurchaseForm(tournament, savedInfo),
  purchaseStatus: "idle",
  purchaseMessage: "",
  purchaseResult: null,
})

const clearMessage = (state) => ({
  ...state,
  purchaseStatus: "idle",
  purchaseMessage: "",
})

export const purchaseReducer = (state, action) => {
  switch (action.type) {
    case "open":
      return {
        ...state,
        isPurchaseDrawerOpen: true,
        selectedTournamentId: action.tournament.id,
        purchaseStep: "entry",
        purchaseForm: reconcilePurchaseForm({
          ...state.purchaseForm,
          name: state.purchaseForm.name || action.savedInfo?.name || "",
          email: state.purchaseForm.email || action.savedInfo?.email || "",
        }, action.tournament),
        purchaseStatus: "idle",
        purchaseMessage: "",
        purchaseResult: null,
      }
    case "close":
      return { ...state, isPurchaseDrawerOpen: false }
    case "clear-message":
      return clearMessage(state)
    case "show-error":
      return { ...state, purchaseStatus: "error", purchaseMessage: action.message }
    case "update-field":
      return clearMessage({
        ...state,
        purchaseForm: { ...state.purchaseForm, [action.field]: action.value },
      })
    case "add-bye":
      if (state.purchaseForm.byes.length >= action.maxByeCount) {
        return clearMessage(state)
      }

      return clearMessage({
        ...state,
        purchaseForm: {
          ...state.purchaseForm,
          byes: [...state.purchaseForm.byes, { id: action.id, round: "" }],
        },
      })
    case "update-bye":
      return clearMessage({
        ...state,
        purchaseForm: {
          ...state.purchaseForm,
          byes: state.purchaseForm.byes.map((bye) => (
            bye.id === action.id ? { ...bye, round: action.round } : bye
          )),
        },
      })
    case "remove-bye":
      return clearMessage({
        ...state,
        purchaseForm: {
          ...state.purchaseForm,
          byes: state.purchaseForm.byes.filter((bye) => bye.id !== action.id),
        },
      })
    case "continue":
      return { ...clearMessage(state), purchaseStep: action.step }
    case "previous":
      return {
        ...clearMessage(state),
        purchaseStep: state.purchaseStep === "review" ? "info" : "entry",
      }
    case "submit-started":
      return { ...state, purchaseStatus: "loading", purchaseMessage: "" }
    case "redirecting":
      return { ...state, purchaseMessage: "Redirecting to Stripe Checkout..." }
    case "submit-succeeded":
      return {
        ...state,
        purchaseResult: action.result,
        purchaseStatus: "success",
        purchaseStep: "thanks",
        purchaseMessage: "Registration submitted. Payment is pending.",
      }
    default:
      return state
  }
}
