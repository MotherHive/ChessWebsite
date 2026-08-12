import { useEffect, useState } from "react"

export default function useAdminSession() {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    fetch("/api/admin/session", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) {
          return null
        }

        const data = await response.json()
        return data.user || null
      })
      .catch(() => null)
      .then((user) => {
        if (isActive) {
          setSession(user ? { user } : null)
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  return { session, isLoading }
}
