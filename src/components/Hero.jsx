import { useState } from "react"
import ScrantonChessClubLogo from "../../assets/ScrantonChessClub.svg"
import MarywoodLogo from "../../assets/MarywoodLogo.png"
import Board from "../../assets/Board.jpg"
import Calendar from "../../assets/icons/Calendar.svg"
import Clock from "../../assets/icons/Clock.svg"
import Location from "../../assets/icons/Location.svg"

const meetingDetails = {
    title: "Scranton Chess Club",
    location: "Nazareth Center 2nd Floor, Marywood University",
    startHour: 18,
    startMinute: 30,
    endHour: 21,
    endMinute: 0,
}

const formatCalendarDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}${month}${day}`
}

const formatUtcDateTime = (date) => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

const getNextTuesday = () => {
    const today = new Date()
    const daysUntilTuesday = (2 - today.getDay() + 7) % 7
    const nextTuesday = new Date(today)

    nextTuesday.setDate(today.getDate() + daysUntilTuesday)
    nextTuesday.setHours(0, 0, 0, 0)

    return nextTuesday
}

const createCalendarHref = (meetingDate) => {
    const date = formatCalendarDate(meetingDate)
    const stamp = formatUtcDateTime(new Date())
    const startTime = `${String(meetingDetails.startHour).padStart(2, "0")}${String(meetingDetails.startMinute).padStart(2, "0")}00`
    const endTime = `${String(meetingDetails.endHour).padStart(2, "0")}${String(meetingDetails.endMinute).padStart(2, "0")}00`
    const calendarLines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Scranton Chess Club//Meeting Calendar//EN",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:scranton-chess-club-${date}@scrantonchessclub.org`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=America/New_York:${date}T${startTime}`,
        `DTEND;TZID=America/New_York:${date}T${endTime}`,
        "RRULE:FREQ=WEEKLY;BYDAY=TU",
        `SUMMARY:${meetingDetails.title}`,
        `LOCATION:${meetingDetails.location}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ]

    return `data:text/calendar;charset=utf8,${encodeURIComponent(calendarLines.join("\r\n"))}`
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function Hero() {
    const [signupForm, setSignupForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
    })
    const [signupStatus, setSignupStatus] = useState("idle")
    const [signupMessage, setSignupMessage] = useState("")
    const nextMeetingDate = getNextTuesday()
    const nextMeetingLabel = nextMeetingDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    })
    const calendarHref = createCalendarHref(nextMeetingDate)

    const updateSignupField = (field, value) => {
        setSignupForm((currentForm) => ({
            ...currentForm,
            [field]: value,
        }))

        if (signupStatus !== "idle") {
            setSignupStatus("idle")
            setSignupMessage("")
        }
    }

    const handleSignupSubmit = (event) => {
        event.preventDefault()

        const trimmedForm = {
            firstName: signupForm.firstName.trim(),
            lastName: signupForm.lastName.trim(),
            email: signupForm.email.trim(),
        }

        if (!trimmedForm.firstName || !trimmedForm.lastName || !trimmedForm.email) {
            setSignupStatus("error")
            setSignupMessage("Enter your first name, last name, and email to get meeting updates.")
            return
        }

        if (!isValidEmail(trimmedForm.email)) {
            setSignupStatus("error")
            setSignupMessage("Use a valid email address, like name@example.com.")
            return
        }

        setSignupStatus("loading")
        setSignupMessage("")

        window.setTimeout(() => {
            try {
                window.localStorage.setItem("scranton-chess-club-email", trimmedForm.email)
                window.localStorage.setItem("scranton-chess-club-meeting-updates", JSON.stringify(trimmedForm))
                setSignupStatus("success")
                setSignupMessage("Thanks. Your information is saved for meeting updates.")
                setSignupForm({
                    firstName: "",
                    lastName: "",
                    email: "",
                })
            } catch {
                setSignupStatus("error")
                setSignupMessage("Could not save your information in this browser. Try again later.")
            }
        }, 450)
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
                            tournaments, and events in partnership with Marywood University.</p>
                        <h6 id="club-updates">GET MEETING UPDATES</h6>
                        <form className="email-input-section" id="join" onSubmit={handleSignupSubmit} noValidate>
                            <div className="email-field">
                                <div className="email-input-wrap">
                                    <label className="inside-label" htmlFor="updates-first-name">
                                        First name
                                    </label>

                                    <input
                                        id="updates-first-name"
                                        name="firstName"
                                        type="text"
                                        placeholder="First name"
                                        autoComplete="given-name"
                                        value={signupForm.firstName}
                                        aria-invalid={signupStatus === "error" && !signupForm.firstName.trim()}
                                        disabled={signupStatus === "loading"}
                                        onChange={(event) => updateSignupField("firstName", event.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="email-field">
                                <div className="email-input-wrap">
                                    <label className="inside-label" htmlFor="updates-last-name">
                                        Last name
                                    </label>

                                    <input
                                        id="updates-last-name"
                                        name="lastName"
                                        type="text"
                                        placeholder="Last name"
                                        autoComplete="family-name"
                                        value={signupForm.lastName}
                                        aria-invalid={signupStatus === "error" && !signupForm.lastName.trim()}
                                        disabled={signupStatus === "loading"}
                                        onChange={(event) => updateSignupField("lastName", event.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="email-field">
                                <div className="email-input-wrap">
                                    <label className="inside-label" htmlFor="email-updates">
                                        Email
                                    </label>

                                    <input
                                        id="email-updates"
                                        name="email"
                                        type="email"
                                        placeholder="example@email.com"
                                        autoComplete="email"
                                        value={signupForm.email}
                                        aria-describedby={signupMessage ? "email-signup-message" : undefined}
                                        aria-invalid={signupStatus === "error" && Boolean(signupForm.email.trim()) && !isValidEmail(signupForm.email.trim())}
                                        disabled={signupStatus === "loading"}
                                        onChange={(event) => updateSignupField("email", event.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={signupStatus === "loading"}
                                aria-label={signupStatus === "loading" ? "Signing up" : "Sign up"}
                            >
                                <span className="signup-button-label signup-button-label-desktop" aria-hidden="true">
                                    {signupStatus === "loading" ? "Signing Up..." : "Sign Me Up"}
                                </span>
                                <span className="signup-button-label signup-button-label-mobile" aria-hidden="true">
                                    {signupStatus === "loading" ? "Signing..." : "Sign Up"}
                                </span>
                            </button>

                            {signupMessage && (
                                <p
                                    className={`email-signup-message email-signup-message-${signupStatus}`}
                                    id="email-signup-message"
                                    role={signupStatus === "error" ? "alert" : "status"}
                                >
                                    {signupMessage}
                                </p>
                            )}
                        </form>

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
                        <h6>Tuesdays 6:30 - 9:00 pm</h6>
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
