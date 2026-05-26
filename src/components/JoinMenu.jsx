import { useState } from "react"
import { supabase } from "../lib/supabaseClient"

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function JoinMenu({ isOpen, onToggle }) {
    const [joinForm, setJoinForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
    })
    const [joinStatus, setJoinStatus] = useState("idle")
    const [joinMessage, setJoinMessage] = useState("")

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

    const handleJoinSubmit = async (event) => {
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

        const { error } = await supabase.from("club_signups").insert({
            first_name: trimmedForm.firstName,
            last_name: trimmedForm.lastName,
            email: trimmedForm.email.toLowerCase(),
            source: "join_menu",
        })

        if (error && error.code !== "23505") {
            setJoinStatus("error")
            setJoinMessage("Could not save your information. Try again later.")
            return
        }

        try {
            window.localStorage.setItem("scranton-chess-club-join", JSON.stringify(trimmedForm))
        } catch {
            // The Supabase insert succeeded, so a blocked local cache should not fail the signup.
        }

        setJoinStatus("success")
        setJoinMessage(error?.code === "23505" ? "You are already on the club list." : "Thanks. Your information is saved.")
        setJoinForm({
            firstName: "",
            lastName: "",
            email: "",
        })
    }

    return (
        <div className="join-menu" id="join">
            <button
                id="join-menu-trigger"
                className="button button-medium join-menu-trigger"
                type="button"
                aria-controls="join-club-form"
                aria-expanded={isOpen}
                onClick={onToggle}
            >
                Join the Club
            </button>

            <form
                className={`join-dropdown${isOpen ? " join-dropdown-open" : ""}`}
                id="join-club-form"
                aria-hidden={!isOpen}
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
    )
}
