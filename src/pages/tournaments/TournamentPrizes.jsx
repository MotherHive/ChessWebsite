import { formatPrizePlace } from "../../utils/tournamentPricing"

export default function TournamentPrizes({ tournament }) {
  return (
    <section className="tournament-prizes-card" aria-label={`${tournament.title} prizes`}>
      <div className="tournament-card-heading">
        <span>Prizes</span>
        <h3>Sections & brackets</h3>
      </div>
      <div className="tournament-prize-grid">
        {tournament.prizes.map((section) => (
          <div className="tournament-prize-section" key={section.section}>
            <strong>{section.section}</strong>
            <div className="tournament-prize-table-wrap">
              <table className="tournament-prize-table">
                <caption>{section.section} prize table</caption>
                <thead>
                  <tr>
                    <th scope="col">Bracket(s)</th>
                    <th scope="col">Prize</th>
                    <th scope="col">Place</th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={`${section.section}-${row.prize}-${row.place}-${row.brackets.join("-")}`}>
                      <td data-label="Bracket(s)">
                        <span className="tournament-prize-brackets">
                          {row.brackets.join(", ")}
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
