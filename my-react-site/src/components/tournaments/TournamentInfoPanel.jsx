export default function TournamentInfoPanel({ featuredTournament }) {
  return (
    <div className="tournament-director-strip" aria-label="Tournament information">
      <div className="tournament-info-panel">
        <span className="tournament-info-label">Tournament Info</span>
        <h3>Organized chess events for local players</h3>
        <dl className="tournament-info-list">
          <div>
            <dt>Registration</dt>
            <dd>Entry details, deadlines, and sections are listed with each tournament.</dd>
          </div>
          <div>
            <dt>Membership</dt>
            <dd>US Chess requirements are handled during tournament registration.</dd>
          </div>
          <div>
            <dt>Players</dt>
            <dd>Events may include rated, scholastic, beginner, and open sections.</dd>
          </div>
        </dl>
        <div className="tournament-director-inline" aria-label="Tournament director contact information">
          <span>Tournament Director</span>
          <strong>{featuredTournament.director.name}</strong>
          <dl className="tournament-director-list">
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${featuredTournament.director.email}`}>
                  {featuredTournament.director.email}
                </a>
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                <a href="tel:+15706042461">{featuredTournament.director.phone}</a>
              </dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd>
                <a href={featuredTournament.director.website} target="_blank" rel="noreferrer">
                  pscfchess.org/clearinghouse
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
