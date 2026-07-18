import { Suspense } from 'react'
import TournamentsPage from '../../src/pages/tournaments/TournamentsPage'

export const metadata = {
  title: "Tournaments | Scranton Chess Club",
}

export default function Tournaments() {
  return (
    <Suspense>
      <TournamentsPage />
    </Suspense>
  )
}
