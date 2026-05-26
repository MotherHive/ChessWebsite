import { useState } from "react"

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function SignupForm() {
    const [signupForm, setSignupForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
    })
    const [signupStatus, setSignupStatus] = useState("idle")
    const [signupMessage, setSignupMessage] = useState("")

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
    )
}
