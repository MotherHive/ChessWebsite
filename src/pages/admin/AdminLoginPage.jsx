import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"
import useAdminSession from "./useAdminSession"

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { session, isLoading } = useAdminSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState("idle")
  const [message, setMessage] = useState("")

  if (!isLoading && session) {
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus("loading")
    setMessage("")

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setStatus("error")
      setMessage(error.message || "Could not sign in.")
      return
    }

    navigate("/admin", { replace: true })
  }

  return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1>Admin sign in</h1>
        <label>
          Email
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label>
          Password
          <input
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {message && (
          <p className="admin-error" role="alert">{message}</p>
        )}
        <button className="button" disabled={status === "loading"} type="submit">
          {status === "loading" ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  )
}
