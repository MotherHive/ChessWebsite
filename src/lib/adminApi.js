import { supabase } from "./supabaseClient"

export const adminRequest = async (resource, { method = "GET", body } = {}) => {
  const { data } = await supabase.auth.getSession()
  const accessToken = data?.session?.access_token

  if (!accessToken) {
    throw new Error("Sign in to use the admin area.")
  }

  const response = await fetch(`/api/admin?resource=${encodeURIComponent(resource)}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(result.error || "The admin request failed.")
  }

  return result
}
