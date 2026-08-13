"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import useAdminSession from "./useAdminSession"

function AdminNavLink({ href, children }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link className={isActive ? "active" : undefined} href={href} aria-current={isActive ? "page" : undefined}>
      {children}
    </Link>
  )
}

export default function AdminLayout({ children }) {
  const { session, isLoading } = useAdminSession()

  if (isLoading) {
    return <div className="admin-shell"><p className="admin-muted">Checking session...</p></div>
  }

  if (!session) {
    return (
      <div className="admin-shell">
        <p className="admin-error">
          Cloudflare Access could not verify this admin session. Check the Access application and Worker variables.
        </p>
      </div>
    )
  }

  const handleSignOut = () => {
    window.location.assign("/cdn-cgi/access/logout")
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-title">
          <h1>Club Admin</h1>
          <span className="admin-muted">{session.user?.email}</span>
        </div>
        <nav className="admin-nav" aria-label="Admin sections">
          <AdminNavLink href="/admin/tournaments">Tournaments</AdminNavLink>
          <AdminNavLink href="/admin/registrations">Registrations</AdminNavLink>
          <AdminNavLink href="/admin/mailing-list">Mailing list</AdminNavLink>
        </nav>
        <div className="admin-header-actions">
          <a href="/tournaments" target="_blank" rel="noreferrer">View site</a>
          <button className="admin-link-button" onClick={handleSignOut} type="button">
            Sign out
          </button>
        </div>
      </header>
      {children}
    </div>
  )
}
