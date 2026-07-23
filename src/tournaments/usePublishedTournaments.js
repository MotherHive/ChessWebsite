import { useEffect, useState } from "react"
import { withTournamentImage } from "./presentation"

const sortByStart = (tournaments) => (
  [...tournaments].sort((first, second) => (
    new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime()
  ))
)

export default function usePublishedTournaments() {
  const [tournaments, setTournaments] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    const loadTournaments = async () => {
      let response
      let result

      try {
        response = await fetch("/api/tournaments")
        result = await response.json()
      } catch {
        result = null
      }

      if (!isActive) {
        return
      }

      if (response?.ok && Array.isArray(result?.tournaments)) {
        setTournaments(sortByStart(result.tournaments.map(withTournamentImage)))
      }

      setIsLoading(false)
    }

    loadTournaments()

    return () => {
      isActive = false
    }
  }, [])

  return { tournaments, isLoading }
}
