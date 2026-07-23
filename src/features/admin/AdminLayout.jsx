"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
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
  const router = useRouter()
  const { session, isLoading } = useAdminSession()

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/admin/login")
    }
  }, [isLoading, session, router])

  if (isLoading || !session) {
    return <div className="admin-shell"><p className="admin-muted">Checking session...</p></div>
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace("/admin/login")
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
