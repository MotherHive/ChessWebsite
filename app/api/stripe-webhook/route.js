import { handleStripeWebhook } from "@/tournaments/server/handleStripeWebhook"

export const runtime = "nodejs"

export const POST = handleStripeWebhook
