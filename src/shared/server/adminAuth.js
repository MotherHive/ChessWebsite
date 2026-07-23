import { jsonResponse } from "./http.js"
import { getSupabaseAdmin } from "./supabaseAdmin.js"

const getAdminEmails = () => (
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
)

const getBearerToken = (request) => {
  const authorization = request.headers.get("authorization") || ""

  return authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : ""
}

const authenticateAdmin = async (request, supabase) => {
  const adminEmails = getAdminEmails()

  if (!adminEmails.length) {
    return { response: jsonResponse(500, { error: "ADMIN_EMAILS is not configured." }) }
  }

  const token = getBearerToken(request)

  if (!token) {
    return { response: jsonResponse(401, { error: "Sign in to use the admin area." }) }
  }

  const { data, error } = await supabase.auth.getUser(token)
  const email = data?.user?.email?.toLowerCase()

  if (error || !email) {
    return {
      response: jsonResponse(401, {
        error: "The session is invalid or expired. Sign in again.",
      }),
    }
  }

  if (!adminEmails.includes(email)) {
    return { response: jsonResponse(403, { error: "This account does not have admin access." }) }
  }

  return { user: data.user }
}

export const withAdmin = (handler) => async (request, context) => {
  let supabase

  try {
    supabase = getSupabaseAdmin()
  } catch {
    return jsonResponse(500, { error: "Supabase admin is not configured." })
  }

  const authentication = await authenticateAdmin(request, supabase)

  if (authentication.response) {
    return authentication.response
  }

  return handler({
    context,
    request,
    supabase,
    user: authentication.user,
  })
}
