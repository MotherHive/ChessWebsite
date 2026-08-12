import Stripe from "stripe"
import { getCloudflareVariable } from "./cloudflare.js"

const getConfig = (name) => getCloudflareVariable(name) || process.env[name] || ""

export const isStripeSandboxKey = (key) => (
  key.startsWith("sk_test_") || key.startsWith("rk_test_")
)

export const getStripeWebhookSecret = () => getConfig("STRIPE_WEBHOOK_SECRET")

export const getStripe = () => {
  const secretKey = getConfig("STRIPE_SECRET_KEY")

  if (!secretKey) {
    throw new Error("Stripe secret key is not configured.")
  }

  if (!isStripeSandboxKey(secretKey) && getConfig("STRIPE_ALLOW_LIVE") !== "true") {
    throw new Error("A live Stripe key is blocked unless STRIPE_ALLOW_LIVE=true.")
  }

  return new Stripe(secretKey)
}
