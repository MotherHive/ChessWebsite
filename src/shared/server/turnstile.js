import { getServerConfig } from "./cloudflare.js"

const alwaysPassTestSecret = "1x0000000000000000000000000000000AA"

const getSecret = () => getServerConfig("TURNSTILE_SECRET_KEY")

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

  if (
    getServerConfig("E2E_TESTING") === "true"
    && secret === alwaysPassTestSecret
    && token === "XXXX.DUMMY.TOKEN.XXXX"
  ) {
    return true
  }

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
    const actionMatches = (
      !expectedAction
      || result.action === expectedAction
      || secret === alwaysPassTestSecret
    )

    if (result.success !== true || !actionMatches) {
      // Without this the endpoint only ever reports "complete the anti-spam
      // check", which hides key/secret mismatches and expired tokens.
      console.warn("Turnstile verification rejected", {
        action: result.action,
        errorCodes: result["error-codes"],
        expectedAction,
        success: result.success,
      })
    }

    return result.success === true && actionMatches
  } catch (error) {
    console.warn("Turnstile verification failed", error)
    return false
  }
}
