const ScrantonChessClubLogo = "/assets/ScrantonChessClub.svg"
const MarywoodLogo = "/assets/MarywoodLogo.png"
const Board = "/assets/Board.jpg"
const Calendar = "/assets/icons/Calendar.svg"
const Clock = "/assets/icons/Clock.svg"
const Location = "/assets/icons/Location.svg"
import {
    createMeetingCalendarHref,
    formatMeetingDateLabel,
    getMeetingDayDifference,
    getNextTuesday,
} from "../meetingCalendar"

const getRelativeMeetingLabel = (meetingDate, referenceDate) => {
    const daysUntilMeeting = getMeetingDayDifference(meetingDate, referenceDate)

    if (daysUntilMeeting === 0) {
        return "Today"
    }

    if (daysUntilMeeting === 1) {
        return "In 1 day"
    }

    return `In ${daysUntilMeeting} days`
}

export default function Hero({ meetingReferenceTime, onOpenJoinMenu }) {
    const meetingReferenceDate = new Date(meetingReferenceTime)
    const nextMeetingDate = getNextTuesday(meetingReferenceDate)
    const nextMeetingLabel = formatMeetingDateLabel(nextMeetingDate, { weekday: "short" })
    const meetingRelativeLabel = getRelativeMeetingLabel(nextMeetingDate, meetingReferenceDate)
    const calendarHref = createMeetingCalendarHref(nextMeetingDate, meetingReferenceDate)
    const handleJoinClick = () => {
        onOpenJoinMenu?.()
    }

    return (
        <section className="hero" id="home">
            <div className="hero-content">
                <div className="intro">
                    <img className="scranton-chess-img" src={ScrantonChessClubLogo} alt="Scranton Chess Club Logo" />
                    <h3>In partnership with</h3>
                    <img className="marywood-img" src={MarywoodLogo} alt="Marywood Logo" />
                </div>
                <div className="email-hero">
                    <div className="email-hero-inner">
                        <div className="email-heading">
                            <h1>PLAY CHESS IN SCRANTON</h1>
                            <h2>ALL SKILL LEVELS WELCOME</h2>
                        </div>
                        <div className="horizontal-divider"></div>
                        <p>Scranton Chess Club brings local players together for casual games, 
                            tournaments, and events in partnership with Marywood University. Regular club meetings have no fees.</p>
                        <h6 id="club-updates">GET MEETING UPDATES</h6>
                        <button
                            className="button hero-join-button"
                            type="button"
                            aria-describedby="club-updates"
                            onClick={handleJoinClick}
                        >
                            Join the Club
                        </button>

                        <img className="chessboard-img" src={Board} alt="Chessboard" />
                    </div>
                </div>
            </div>
            <div className="banner-bar">
                <div className="banner-card">
                    <div className="banner-label">
                        <img className="banner-icon" src={Location} alt="" aria-hidden="true" />
                        <h5>Where</h5>
                    </div>
                    <h6>Nazareth Center, 2nd Fl.</h6>
                    <p>Marywood University, Scranton</p>
                </div>

                <div className="banner-divider"></div>
                <div className="banner-card">
                    <div className="banner-label">
                        <img className="banner-icon" src={Calendar} alt="" aria-hidden="true" />
                        <h5>When</h5>
                    </div>
                    <h6>Tuesdays, 6:30-9 PM ET</h6>
                    <a href={calendarHref} download="scranton-chess-club.ics" type="text/calendar">
                        Add to Calendar
                    </a>
                </div>

                <div className="banner-divider"></div>
                <div className="banner-card">
                    <div className="banner-label">
                        <img className="banner-icon" src={Clock} alt="" aria-hidden="true" />
                        <h5>Next Meeting</h5>
                    </div>
                    <h6>{nextMeetingLabel}</h6>
                    <p>{meetingRelativeLabel}</p>
                </div>
            </div>
        </section>
    )
}
