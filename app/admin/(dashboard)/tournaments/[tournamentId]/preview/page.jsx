import AdminTournamentPreviewPage from "../../../../../../src/features/admin/tournaments/AdminTournamentPreviewPage"

export default function TournamentPreview() {
  return <AdminTournamentPreviewPage initialTime={new Date().toISOString()} />
}
