import AdminTournamentPreviewPage from "../../../../../../src/pages/admin/tournaments/AdminTournamentPreviewPage"

export default function TournamentPreview() {
  return <AdminTournamentPreviewPage initialTime={new Date().toISOString()} />
}
