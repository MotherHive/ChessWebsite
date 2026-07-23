const CalendarIcon = "/assets/icons/Calendar.svg"

export default function TournamentSchedule({ tournament }) {
  const days = tournament.days
    .map((day) => ({
      ...day,
      sections: day.sections.filter((section) => section.control || section.times.length),
    }))
    .filter((day) => day.sections.length)

  if (!days.length) {
    return null
  }

  return (
    <div className="tournament-day-grid" aria-label={`${tournament.title} schedule`}>
      {days.map((day) => (
        <section className="tournament-day-card" key={day.date}>
          <div className="tournament-day-date">
            <img src={CalendarIcon} alt="" aria-hidden="true" />
            <h3>{day.date}</h3>
          </div>
          <div className="tournament-section-time-grid">
            {day.sections.map((scheduleSection) => (
              <section className="tournament-time-card" key={`${day.date}-${scheduleSection.name}`}>
                <div className="tournament-time-card-head">
                  <span>{scheduleSection.name}</span>
                  <strong>{scheduleSection.control}</strong>
                </div>
                <ol>
                  {scheduleSection.times.map((item) => (
                    <li key={`${day.date}-${scheduleSection.name}-${item.label}-${item.detail}`}>
                      <time>{item.label}</time>
                      <span>{item.detail}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
