import ScrantonChessClubLogo from "../../assets/ScrantonChessClub.png"
import MarywoodLogo from "../../assets/MarywoodLogo.png"
import Board from "../../assets/Board.jpg"
import Calendar from "../../assets/icons/Calendar.svg"
import Clock from "../../assets/icons/Clock.svg"
import Location from "../../assets/icons/Location.svg"


export default function Hero() {
    const nextMeetingDay = 27;
    const nextMeetingMonth = "May"

    return (
        <section className="hero">
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
                            tournaments, and events in partnership with Marywood University.</p>
                        <h6>GET MEETING UPDATES</h6>
                        <div className="email-input-section">
                            <div className="email-field">
                                <div className="email-input-wrap">
                                    <label className="inside-label" htmlFor="email-updates">
                                        Enter your email
                                    </label>

                                    <input
                                        id="email-updates"
                                        name="email"
                                        type="email"
                                        placeholder="example@email.com"
                                        autoComplete="email"
                                    />
                                </div>
                            </div>
                            <button>Sign Me Up</button>
                        </div>

                        <img className="chessboard-img" src={Board} alt="Chessboard" />
                    </div>
                        <div className="banner-bar">
                            <div className="banner-card">
                                <img className="banner-icon" src={Location} alt="Location Icon" />
                                <div className="banner-text">
                                    <h5>WHERE:</h5>
                                    <h6>Nazareth Center 2nd Floor Marywood University</h6>
                                </div>
                            </div>

                            <div className="vertical-divider"></div>
                            <div className="banner-card">
                                <img className="banner-icon" src={Calendar} alt="Calendar Icon" />
                                <div className="banner-text">
                                    <h5>WHEN:</h5>
                                    <h6>Tuesdays 6:30 - 9:00 pm</h6>
                                </div>
                            </div>

                            <div className="vertical-divider"></div>
                            <div className="banner-card">
                                <img className="banner-icon" src={Clock} alt="Clock Icon" />
                                <div className="banner-text">
                                    <h5>NEXT MEETING:</h5>
                                    <h6>Tuesday, {nextMeetingMonth} {nextMeetingDay}</h6>
                                    <a>Add to Calendar</a>
                                </div>
                            </div>
                        </div>
                </div>
            </div>
        </section>
    )
}
