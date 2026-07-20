import { supabase } from "./supabaseClient"

export const adminRequest = async (
  resource,
  { method = "GET", body, query, signal } = {},
) => {
  const { data } = await supabase.auth.getSession()
  const accessToken = data?.session?.access_token

  if (!accessToken) {
    throw new Error("Sign in to use the admin area.")
  }

  const searchParams = new URLSearchParams({ resource })

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  })

  const response = await fetch(`/api/admin?${searchParams.toString()}`, {
    method,
    signal,
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
