export const byePrice = 5
export const expiredMembershipDiscount = 3

export const tournamentRounds = ["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"]

export const membershipAgeTiers = [
  { label: "Youth membership", ageRange: "18 and under", maxAge: 18, price: 20 },
  { label: "Adult membership", ageRange: "19-64", maxAge: 64, price: 45 },
  { label: "Senior membership", ageRange: "65+", maxAge: 150, price: 40 },
]

const membershipPrices = membershipAgeTiers.map((tier) => tier.price)

export const membershipPriceRange = {
  min: Math.min(...membershipPrices),
  max: Math.max(...membershipPrices),
}

export const paymentMethods = {
  stripeCheckout: "stripe_checkout",
  payAtEvent: "pay_at_event",
}

export const paymentOptions = [
  { id: paymentMethods.stripeCheckout, label: "Pay online by card" },
  { id: paymentMethods.payAtEvent, label: "Pay at event" },
]
