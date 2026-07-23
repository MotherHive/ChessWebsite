import Stripe from "stripe"

export const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key is not configured.")
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY)
}
