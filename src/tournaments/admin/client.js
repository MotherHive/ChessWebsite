import { supabase } from "../../shared/supabaseClient"

export const adminRequest = async (
  path,
  { method = "GET", body, query, signal } = {},
) => {
  const { data } = await supabase.auth.getSession()
  const accessToken = data?.session?.access_token

  if (!accessToken) {
    throw new Error("Sign in to use the admin area.")
  }

  const searchParams = new URLSearchParams()

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  const response = await fetch(`/api/admin/${path}${queryString ? `?${queryString}` : ""}`, {
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

export const uploadAdminTournamentImage = async (file, { signal } = {}) => {
  const { data } = await supabase.auth.getSession()
  const accessToken = data?.session?.access_token

  if (!accessToken) {
    throw new Error("Sign in to use the admin area.")
  }

  const formData = new FormData()
  formData.set("image", file)

  const response = await fetch("/api/admin/tournament-images", {
    method: "POST",
    signal,
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  })
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(result.error || "Could not upload the tournament image.")
  }

  return result
}
