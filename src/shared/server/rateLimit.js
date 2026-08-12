import { getCloudflareVariable } from "./cloudflare.js"
import { jsonResponse } from "./http.js"

const isLocalRequest = (request) => {
  try {
    const hostname = new URL(request.url).hostname
    return hostname === "localhost" || hostname === "127.0.0.1"
  } catch {
    return false
  }
}

const unavailableResponse = () => jsonResponse(503, {
  error: "Form protection is temporarily unavailable. Try again later.",
})

export const enforcePublicFormRateLimit = async (
  request,
  scope,
  limiter = getCloudflareVariable("PUBLIC_FORM_RATE_LIMITER"),
) => {
  if (!limiter || typeof limiter.limit !== "function") {
    return isLocalRequest(request) ? null : unavailableResponse()
  }

  const clientIp = request.headers.get("cf-connecting-ip")

  if (!clientIp) {
    return unavailableResponse()
  }

  try {
    const { success } = await limiter.limit({ key: `${scope}:${clientIp}` })

    if (success) {
      return null
    }

    return jsonResponse(429, {
      error: "Too many attempts. Wait a few seconds and try again.",
    }, { "Retry-After": "10" })
  } catch {
    return unavailableResponse()
  }
}
