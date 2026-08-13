import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import Stripe from "stripe"

const project = new URL("..", import.meta.url)
const env = Object.fromEntries(
  readFileSync(new URL("../.dev.vars", import.meta.url), "utf8")
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i))
    .filter(Boolean)
    .map((match) => [match[1], match[2].replace(/^["']|["']$/g, "")]),
)
const secretKey = env.STRIPE_SECRET_KEY || ""
const endpointUrl = "https://staging.scrantonchess.org/api/stripe-webhook"
// Staging moved off workers.dev once Access needed a hostname in our own zone.
// Any endpoint left on the old host would keep receiving duplicate events.
const retiredEndpointUrls = [
  "https://chess-website-staging.scrantonchess.workers.dev/api/stripe-webhook",
]

if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("rk_test_")) {
  throw new Error("Add a Stripe sandbox key to STRIPE_SECRET_KEY in .dev.vars first.")
}

const stripe = new Stripe(secretKey)
const existingEndpoints = await stripe.webhookEndpoints.list({ limit: 100 })

const staleUrls = new Set([endpointUrl, ...retiredEndpointUrls])

for (const endpoint of existingEndpoints.data.filter(({ url }) => staleUrls.has(url))) {
  await stripe.webhookEndpoints.del(endpoint.id)
}

const endpoint = await stripe.webhookEndpoints.create({
  description: "Scranton Chess isolated staging",
  // Delayed payment methods only settle through the async events, so a
  // registration paid that way never confirms if they are not subscribed.
  enabled_events: [
    "checkout.session.async_payment_failed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.completed",
    "checkout.session.expired",
  ],
  url: endpointUrl,
})

if (!endpoint.secret) {
  throw new Error("Stripe created the endpoint without returning its signing secret.")
}

const putSecret = spawnSync(
  "npx",
  [
    "wrangler",
    "secret",
    "put",
    "STRIPE_WEBHOOK_SECRET",
    "--name",
    "chess-website-staging",
    "--config",
    "wrangler.staging.jsonc",
  ],
  {
    cwd: project,
    encoding: "utf8",
    input: endpoint.secret,
    shell: false,
    stdio: ["pipe", "inherit", "inherit"],
  },
)

if (putSecret.status !== 0) {
  await stripe.webhookEndpoints.del(endpoint.id)
  throw new Error(`wrangler secret put exited with code ${putSecret.status}.`)
}

console.log(JSON.stringify({
  enabledEvents: endpoint.enabled_events,
  endpointId: endpoint.id,
  sandbox: endpoint.livemode === false,
  url: endpoint.url,
}))
