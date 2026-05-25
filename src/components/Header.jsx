import { useEffect, useRef, useState } from 'react'

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isJoinOpen, setIsJoinOpen] = useState(false)
    const [joinForm, setJoinForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
    })
    const [joinStatus, setJoinStatus] = useState("idle")
    const [joinMessage, setJoinMessage] = useState("")
    const headerRef = useRef(null)

    useEffect(() => {
        if (!isMenuOpen && !isJoinOpen) return

        function handleDocumentClick(event) {
            if (!headerRef.current?.contains(event.target)) {
                setIsMenuOpen(false)
                setIsJoinOpen(false)
            }
        }

        function handleEscapeKey(event) {
            if (event.key === "Escape") {
                setIsMenuOpen(false)
                setIsJoinOpen(false)
            }
        }

        document.addEventListener("mousedown", handleDocumentClick)
        document.addEventListener("keydown", handleEscapeKey)

        return () => {
            document.removeEventListener("mousedown", handleDocumentClick)
            document.removeEventListener("keydown", handleEscapeKey)
        }
    }, [isMenuOpen, isJoinOpen])

    const updateJoinField = (field, value) => {
        setJoinForm((currentForm) => ({
            ...currentForm,
            [field]: value,
        }))

        if (joinStatus !== "idle") {
            setJoinStatus("idle")
            setJoinMessage("")
        }
    }

    const handleJoinSubmit = (event) => {
        event.preventDefault()

        const trimmedForm = {
            firstName: joinForm.firstName.trim(),
            lastName: joinForm.lastName.trim(),
            email: joinForm.email.trim(),
        }

        if (!trimmedForm.firstName || !trimmedForm.lastName || !trimmedForm.email) {
            setJoinStatus("error")
            setJoinMessage("Enter your first name, last name, and email.")
            return
        }

        if (!isValidEmail(trimmedForm.email)) {
            setJoinStatus("error")
            setJoinMessage("Use a valid email address, like name@example.com.")
            return
        }

        setJoinStatus("loading")
        setJoinMessage("")

        window.setTimeout(() => {
            try {
                window.localStorage.setItem("scranton-chess-club-join", JSON.stringify(trimmedForm))
                setJoinStatus("success")
                setJoinMessage("Thanks. Your information is saved.")
                setJoinForm({
                    firstName: "",
                    lastName: "",
                    email: "",
                })
            } catch {
                setJoinStatus("error")
                setJoinMessage("Could not save your information in this browser. Try again later.")
            }
        }, 450)
    }

    const closeHeaderMenus = () => {
        setIsMenuOpen(false)
        setIsJoinOpen(false)
    }

    return (
        <header ref={headerRef}>
            <div className="header-container">
                <div className="logo-section">
                    <a className="logo" href="/" aria-label="Scranton Chess Club home">
                        <h5>SCRANTON</h5>
                        <span>
                            <div className="tapered-left"></div>
                            <h6>CHESS CLUB</h6>
                            <div className="tapered-right"></div>
                        </span>
                    </a>
                    <div className="vertical-divider"></div>
                </div>

                <button
                    className="header-menu-button"
                    type="button"
                    aria-controls="primary-navigation"
                    aria-expanded={isMenuOpen}
                    aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
                    onClick={() => {
                        setIsMenuOpen((open) => !open)
                        setIsJoinOpen(false)
                    }}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div className={`nav-section${isMenuOpen ? " nav-section-open" : ""}`}>
                    <nav id="primary-navigation">
                        <ul>
                            <li><a href="/tournaments" onClick={closeHeaderMenus}>Tournaments</a></li>
                            <li><a href="/blog" onClick={closeHeaderMenus}>Blog</a></li>
                            <li><a href="/#qa" onClick={closeHeaderMenus}>FAQ</a></li>
                            <li><a href="/contact" onClick={closeHeaderMenus}>Contact</a></li>
                        </ul>
                    </nav>

                    <div className="vertical-divider"></div>

                    <div className="join-menu">
                        <button
                            className="button button-medium join-menu-trigger"
                            type="button"
                            aria-controls="join-club-form"
                            aria-expanded={isJoinOpen}
                            onClick={() => {
                                setIsJoinOpen((open) => !open)
                            }}
                        >
                            Join the Club
                        </button>

                        <form
                            className={`join-dropdown${isJoinOpen ? " join-dropdown-open" : ""}`}
                            id="join-club-form"
                            aria-hidden={!isJoinOpen}
                            hidden={!isJoinOpen}
                            onSubmit={handleJoinSubmit}
                            noValidate
                        >
                            <div className="join-dropdown-field">
                                <label htmlFor="join-first-name">First name</label>
                                <input
                                    id="join-first-name"
                                    name="firstName"
                                    type="text"
                                    autoComplete="given-name"
                                    value={joinForm.firstName}
                                    aria-invalid={joinStatus === "error" && !joinForm.firstName.trim()}
                                    disabled={joinStatus === "loading"}
                                    onChange={(event) => updateJoinField("firstName", event.target.value)}
                                />
                            </div>

                            <div className="join-dropdown-field">
                                <label htmlFor="join-last-name">Last name</label>
                                <input
                                    id="join-last-name"
                                    name="lastName"
                                    type="text"
                                    autoComplete="family-name"
                                    value={joinForm.lastName}
                                    aria-invalid={joinStatus === "error" && !joinForm.lastName.trim()}
                                    disabled={joinStatus === "loading"}
                                    onChange={(event) => updateJoinField("lastName", event.target.value)}
                                />
                            </div>

                            <div className="join-dropdown-field">
                                <label htmlFor="join-email">Email</label>
                                <input
                                    id="join-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={joinForm.email}
                                    aria-describedby={joinMessage ? "join-dropdown-message" : undefined}
                                    aria-invalid={joinStatus === "error" && Boolean(joinForm.email.trim()) && !isValidEmail(joinForm.email.trim())}
                                    disabled={joinStatus === "loading"}
                                    onChange={(event) => updateJoinField("email", event.target.value)}
                                />
                            </div>

                            {joinMessage && (
                                <p
                                    className={`join-dropdown-message join-dropdown-message-${joinStatus}`}
                                    id="join-dropdown-message"
                                    role={joinStatus === "error" ? "alert" : "status"}
                                >
                                    {joinMessage}
                                </p>
                            )}

                            <button type="submit" disabled={joinStatus === "loading"}>
                                {joinStatus === "loading" ? "Joining..." : "Submit"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </header>
    )
}
