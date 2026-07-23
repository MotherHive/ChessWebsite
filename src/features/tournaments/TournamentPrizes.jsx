import { formatPrizePlace } from "../../utils/tournamentPricing"

const formatEligibility = (brackets) => (
  brackets.map((bracket) => bracket === "Overall" ? "All players" : bracket).join(", ")
)

export default function TournamentPrizes({ tournament }) {
  const prizeSections = tournament.prizes
    .map((section) => ({
      ...section,
      rows: section.rows.filter((row) => row.prize.trim() || row.place.trim()),
    }))
    .filter((section) => section.rows.length)

  if (!prizeSections.length) {
    return null
  }

  return (
    <section className="tournament-prizes-card" aria-label={`${tournament.title} prizes`}>
      <div className="tournament-card-heading">
        <span>Prizes</span>
        <h3>Sections & brackets</h3>
      </div>
      <div className="tournament-prize-grid">
        {prizeSections.map((section) => (
          <div className="tournament-prize-section" key={section.section}>
            <strong>{section.section}</strong>
            <div className="tournament-prize-table-wrap">
              <table className="tournament-prize-table">
                <caption>{section.section} prize table</caption>
                <thead>
                  <tr>
                    <th scope="col">Eligible players</th>
                    <th scope="col">Prize</th>
                    <th scope="col">Place</th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={`${section.section}-${row.prize}-${row.place}-${row.brackets.join("-")}`}>
                      <td data-label="Eligible players">
                        <span className="tournament-prize-brackets">
                          {formatEligibility(row.brackets)}
                        </span>
                      </td>
                      <td data-label="Prize">
                        <strong>{row.prize}</strong>
                      </td>
                      <td data-label="Place">{formatPrizePlace(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
