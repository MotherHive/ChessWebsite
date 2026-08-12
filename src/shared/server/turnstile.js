import { getCloudflareVariable } from "./cloudflare.js"

const getSecret = () => (
  getCloudflareVariable("TURNSTILE_SECRET_KEY")
  || process.env.TURNSTILE_SECRET_KEY
  || ""
)

const isLocalRequest = (request) => {
  try {
    const hostname = new URL(request.url).hostname
    return hostname === "localhost" || hostname === "127.0.0.1"
  } catch {
    return false
  }
}

export const verifyTurnstile = async (request, token, expectedAction) => {
  const secret = getSecret()

  if (!secret) {
    // Missing credentials are convenient locally, but must never silently
    // remove bot protection from a deployed signup or registration endpoint.
    return isLocalRequest(request)
  }

  if (!token) {
    return false
  }

  const formData = new FormData()
  formData.set("secret", secret)
  formData.set("response", token)

  const remoteIp = request.headers.get("cf-connecting-ip")

  if (remoteIp) {
    formData.set("remoteip", remoteIp)
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { body: formData, method: "POST" },
    )
    const result = await response.json()

    return result.success === true && (!expectedAction || result.action === expectedAction)
  } catch {
    return false
  }
}
