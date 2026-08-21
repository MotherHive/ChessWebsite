export const byePrice = 5
export const expiredMembershipDiscount = 3

// Student entries come off the section's entry fee. Each tournament stores its
// own amount; this is the value a new tournament starts with.
export const defaultStudentDiscount = 5
export const studentDiscountLabel = "Marywood student or K-12"

export const tournamentRounds = ["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"]

export const membershipAgeTiers = [
  { label: "Youth membership", ageRange: "Under 19 at expiration", maxAge: 18, price: 21 },
  { label: "Young adult membership", ageRange: "Under 24 at expiration", maxAge: 23, price: 30 },
  { label: "Adult membership", ageRange: "24-64", maxAge: 64, price: 51 },
  { label: "Senior membership", ageRange: "65 and older", maxAge: 150, price: 45 },
]

const membershipPrices = membershipAgeTiers.map((tier) => tier.price)

export const membershipPriceRange = {
  min: Math.min(...membershipPrices),
  max: Math.max(...membershipPrices),
}

// US Chess memberships are mailed to a US address, so the state field is a
// closed list rather than free text. Names ride along so a player can type
// either "PA" or "Pennsylvania".
export const usStates = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
]

export const paymentMethods = {
  stripeCheckout: "stripe_checkout",
  payAtEvent: "pay_at_event",
}

export const paymentOptions = [
  { id: paymentMethods.stripeCheckout, label: "Pay online by card" },
  { id: paymentMethods.payAtEvent, label: "Pay at event with cash" },
]
