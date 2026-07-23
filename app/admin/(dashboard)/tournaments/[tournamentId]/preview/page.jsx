import AdminTournamentPreviewPage from "@/tournaments/admin/tournaments/AdminTournamentPreviewPage"

export default function TournamentPreview() {
  return <AdminTournamentPreviewPage initialTime={new Date().toISOString()} />
}
