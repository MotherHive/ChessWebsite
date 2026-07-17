import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"
import useAdminSession from "./useAdminSession"

export default function AdminLayout() {
  const navigate = useNavigate()
  const { session, isLoading } = useAdminSession()

  if (isLoading) {
    return <div className="admin-shell"><p className="admin-muted">Checking session...</p></div>
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate("/admin/login", { replace: true })
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-title">
          <h1>Club Admin</h1>
          <span className="admin-muted">{session.user?.email}</span>
        </div>
        <nav className="admin-nav" aria-label="Admin sections">
          <NavLink to="/admin/tournaments">Tournaments</NavLink>
          <NavLink to="/admin/registrations">Registrations</NavLink>
        </nav>
        <div className="admin-header-actions">
          <a href="/tournaments" target="_blank" rel="noreferrer">View site</a>
          <button className="admin-link-button" onClick={handleSignOut} type="button">
            Sign out
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
