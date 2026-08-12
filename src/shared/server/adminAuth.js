import { createRemoteJWKSet, jwtVerify } from "jose"
import { getCloudflareVariable, getDatabase } from "./cloudflare.js"
import { jsonResponse } from "./http.js"

const remoteKeySets = new Map()

const getConfig = (name) => getCloudflareVariable(name) || process.env[name] || ""

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
  const hostname = new URL(request.url).hostname
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1"

  if (isLocalhost && getConfig("ADMIN_AUTH_BYPASS") === "true") {
    return { email: getConfig("LOCAL_ADMIN_EMAIL") || adminEmails[0] }
  }

  return null
}

const authenticateAdmin = async (request) => {
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
    return authentication.response
  }

  let db

  try {
    db = getDatabase()
  } catch {
    return jsonResponse(500, { error: "The tournament database is not configured." })
  }

  return handler({
    context,
    db,
    request,
    user: authentication.user,
  })
}
