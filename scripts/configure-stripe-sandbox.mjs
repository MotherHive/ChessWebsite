import { spawn } from "node:child_process"
import { readFileSync } from "node:fs"
import Stripe from "stripe"

const env = Object.fromEntries(
  readFileSync(new URL("../.dev.vars", import.meta.url), "utf8")
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i))
    .filter(Boolean)
    .map((match) => [match[1], match[2].replace(/^["']|["']$/g, "")]),
)
const secretKey = env.STRIPE_SECRET_KEY || ""

if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("rk_test_")) {
  throw new Error("Add a Stripe sandbox key to STRIPE_SECRET_KEY in .dev.vars first.")
}

const stripe = new Stripe(secretKey)
const session = await stripe.checkout.sessions.create({
  cancel_url: "https://scrantonchess.org/tournaments?checkout=sandbox-cancelled",
  line_items: [{
    price_data: {
      currency: "usd",
      product_data: { name: "Scranton Chess sandbox verification" },
      unit_amount: 100,
    },
    quantity: 1,
  }],
  mode: "payment",
  success_url: "https://scrantonchess.org/tournaments?checkout=sandbox-success",
})

if (session.livemode !== false) {
  throw new Error("Stripe unexpectedly created a live-mode Checkout session.")
}

await stripe.checkout.sessions.expire(session.id)

const putSecret = spawn("npx", ["wrangler", "secret", "put", "STRIPE_SECRET_KEY"], {
  cwd: new URL("..", import.meta.url),
  shell: false,
  stdio: ["pipe", "inherit", "inherit"],
})
putSecret.stdin.end(secretKey)

await new Promise((resolve, reject) => {
  putSecret.once("error", reject)
  putSecret.once("exit", (code) => {
    if (code === 0) {
      resolve()
    } else {
      reject(new Error(`wrangler secret put exited with code ${code}.`))
    }
  })
})

console.log(JSON.stringify({
  checkoutSessionCreatedAndExpired: true,
  cloudflareSecret: "STRIPE_SECRET_KEY",
  sandbox: true,
}))
