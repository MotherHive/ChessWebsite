import { Suspense } from 'react'
import TournamentsPage from '../../src/features/tournaments/TournamentsPage'

export const metadata = {
  title: "Tournaments | Scranton Chess Club",
}

export const revalidate = 60

export default function Tournaments() {
  const renderedAt = new Date().toISOString()

  return (
    <Suspense>
      <TournamentsPage initialTime={renderedAt} />
    </Suspense>
  )
}
