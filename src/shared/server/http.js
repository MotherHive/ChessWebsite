import { getServerConfig } from "./cloudflare.js"

export const jsonResponse = (status, body, headers) => (
  Response.json(body, { status, headers })
)

const getContentType = (request) => (
  (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase()
)

export const parseJsonRequest = async (request) => {
  const body = await request.text()

  if (!body) {
    return {}
  }

  // A cross-site HTML form can only send simple content types, so requiring the
  // JSON type stops a forged form from reaching a JSON endpoint.
  if (getContentType(request) !== "application/json") {
    throw new SyntaxError("Expected an application/json request body.")
  }

  return JSON.parse(body)
}

export const isCrossSiteRequest = (request) => {
  if (request.method === "GET" || request.method === "HEAD") {
    return false
  }

  const fetchSite = request.headers.get("sec-fetch-site")

  if (fetchSite) {
    return fetchSite !== "same-origin"
  }

  const origin = request.headers.get("origin")

  // Non-browser clients send neither header and cannot carry a signed-in
  // browser's Access cookie, so they are not a request forgery risk.
  if (!origin) {
    return false
  }

  try {
    return origin !== new URL(request.url).origin
  } catch {
    return true
  }
}

export const withNoStore = (response) => {
  const headers = new Headers(response.headers)

  headers.set("Cache-Control", "no-store")

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}

export const getSiteUrl = () => {
  const siteUrl = getServerConfig("SITE_URL")

  if (siteUrl) {
    return siteUrl.replace(/\/$/, "")
  }

  return "https://scrantonchess.org"
}
