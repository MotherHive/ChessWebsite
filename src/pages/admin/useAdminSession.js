import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

export default function useAdminSession() {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    supabase.auth.getSession().then(({ data }) => {
      if (isActive) {
        setSession(data.session)
        setIsLoading(false)
      }
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      isActive = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  return { session, isLoading }
}
