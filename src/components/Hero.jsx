import ScrantonChessClubLogo from "../../assets/ScrantonChessClub.svg"
import MarywoodLogo from "../../assets/MarywoodLogo.png"
import Board from "../../assets/Board.jpg"
import Calendar from "../../assets/icons/Calendar.svg"
import Clock from "../../assets/icons/Clock.svg"
import Location from "../../assets/icons/Location.svg"
import {
    createMeetingCalendarHref,
    formatMeetingDateLabel,
    formatMeetingTimeLabel,
    getNextTuesday,
} from "../utils/meetingCalendar"

export default function Hero({ onOpenJoinMenu }) {
    const nextMeetingDate = getNextTuesday()
    const nextMeetingLabel = formatMeetingDateLabel(nextMeetingDate)
    const meetingTimeLabel = formatMeetingTimeLabel()
    const calendarHref = createMeetingCalendarHref(nextMeetingDate)
    const handleJoinClick = () => {
        onOpenJoinMenu?.()
    }

    return (
        <section className="hero" id="home">
            <div className="hero-content">
                <div className="intro">
                    <img className="scranton-chess-img" src={ScrantonChessClubLogo} alt="Scranton Chess Club Logo" />
                    <h3>Affiliated with</h3>
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
                    <img className="banner-icon" src={Location} alt="Location Icon" />
                    <div className="banner-text">
                        <h5>WHERE:</h5>
                        <h6>Nazareth Center 2nd Floor<br />Marywood University</h6>
                    </div>
                </div>

                <div className="banner-divider"></div>
                <div className="banner-card">
                    <img className="banner-icon" src={Calendar} alt="Calendar Icon" />
                    <div className="banner-text">
                        <h5>WHEN:</h5>
                        <h6>{meetingTimeLabel}</h6>
                    </div>
                </div>

                <div className="banner-divider"></div>
                <div className="banner-card">
                    <img className="banner-icon" src={Clock} alt="Clock Icon" />
                    <div className="banner-text">
                        <h5>NEXT MEETING:</h5>
                        <h6>{nextMeetingLabel}</h6>
                        <a href={calendarHref} download="scranton-chess-club.ics" type="text/calendar">
                            Add to Calendar
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}
