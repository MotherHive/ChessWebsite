import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { tournamentListings, withTournamentImage } from "../data/tournaments"

const sortByStart = (tournaments) => (
  [...tournaments].sort((first, second) => (
    new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime()
  ))
)

export default function usePublishedTournaments() {
  const [tournaments, setTournaments] = useState(tournamentListings)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    const loadTournaments = async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("id, data")
        .eq("status", "published")

      if (!isActive) {
        return
      }

      if (!error && data) {
        setTournaments(sortByStart(data.map((row) => withTournamentImage({ ...row.data, id: row.id }))))
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
