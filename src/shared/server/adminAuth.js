import { createRemoteJWKSet, jwtVerify } from "jose"
import { getDatabase, getServerConfig } from "./cloudflare.js"
import { isCrossSiteRequest, jsonResponse, withNoStore } from "./http.js"

const remoteKeySets = new Map()

const getConfig = getServerConfig

const getAdminEmails = () => (
  getConfig("ADMIN_EMAILS")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
)

const getTeamDomain = () => {
  const configured = getConfig("CLOUDFLARE_ACCESS_TEAM_DOMAIN").trim().replace(/\/$/, "")

  if (!configured) {
    return ""
  }

  return configured.startsWith("https://") ? configured : `https://${configured}`
}

const getRemoteKeySet = (teamDomain) => {
  if (!remoteKeySets.has(teamDomain)) {
    remoteKeySets.set(
      teamDomain,
      createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`)),
    )
  }

  return remoteKeySets.get(teamDomain)
}

const getLocalAdmin = (request, adminEmails) => {
  // The bypass is compiled out of any production build. A deployed Worker must
  // never be one stray environment variable away from unauthenticated admin.
  if (process.env.NODE_ENV === "production") {
    return null
  }

  const hostname = new URL(request.url).hostname
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1"

  if (isLocalhost && getConfig("ADMIN_AUTH_BYPASS") === "true") {
    return { email: getConfig("LOCAL_ADMIN_EMAIL") || adminEmails[0] }
  }

  return null
}

const authenticateAdmin = async (request) => {
  // Cloudflare Access injects the assertion header on every request that
  // carries its cookie, including one a hostile page triggered. Ambient
  // authority like that has to be paired with a request forgery check.
  if (isCrossSiteRequest(request)) {
    return {
      response: jsonResponse(403, { error: "Cross-site admin requests are rejected." }),
    }
  }

  const adminEmails = getAdminEmails()

  if (!adminEmails.length) {
    return { response: jsonResponse(500, { error: "ADMIN_EMAILS is not configured." }) }
  }

  const localAdmin = getLocalAdmin(request, adminEmails)

  if (localAdmin) {
    return { user: localAdmin }
  }

  const teamDomain = getTeamDomain()
  const audiences = getConfig("CLOUDFLARE_ACCESS_AUD")
    .split(",")
    .map((audience) => audience.trim())
    .filter(Boolean)

  if (!teamDomain || !audiences.length) {
    return {
      response: jsonResponse(500, {
        error: "Cloudflare Access verification is not configured.",
      }),
    }
  }

  const token = request.headers.get("cf-access-jwt-assertion")

  if (!token) {
    return { response: jsonResponse(401, { error: "Sign in to use the admin area." }) }
  }

  try {
    const { payload } = await jwtVerify(token, getRemoteKeySet(teamDomain), {
      audience: audiences,
      issuer: teamDomain,
    })
    const email = String(payload.email || "").toLowerCase()

    if (!email) {
      return { response: jsonResponse(401, { error: "The Access identity has no email." }) }
    }

    if (!adminEmails.includes(email)) {
      return { response: jsonResponse(403, { error: "This account does not have admin access." }) }
    }

    return { user: { ...payload, email } }
  } catch {
    return {
      response: jsonResponse(401, {
        error: "The Cloudflare Access session is invalid or expired.",
      }),
    }
  }
}

export const withAdmin = (handler) => async (request, context) => {
  const authentication = await authenticateAdmin(request)

  if (authentication.response) {
    return withNoStore(authentication.response)
  }

  let db

  try {
    db = getDatabase()
  } catch {
    return withNoStore(jsonResponse(500, { error: "The tournament database is not configured." }))
  }

  // Admin payloads carry registrant personal data, so no shared cache anywhere
  // between the Worker and the browser may keep a copy.
  return withNoStore(await handler({
    context,
    db,
    request,
    user: authentication.user,
  }))
}
