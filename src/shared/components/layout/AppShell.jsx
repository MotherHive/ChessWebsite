"use client"

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import End from "./End"
import Footer from "./Footer"
import Header from "./Header"

const JoinMenuContext = createContext(() => {})

export const useOpenJoinMenu = () => useContext(JoinMenuContext)

export default function AppShell({ children }) {
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith("/admin")

  const scrollToJoinMenu = useCallback(() => {
    window.requestAnimationFrame(() => {
      document.getElementById("join")?.scrollIntoView({ block: "start" })
      document.getElementById("join-menu-trigger")?.focus({ preventScroll: true })
    })
  }, [])

  const openJoinMenu = useCallback(() => {
    setIsJoinOpen(true)
    scrollToJoinMenu()
  }, [scrollToJoinMenu])

  const closeJoinMenu = useCallback(() => {
    setIsJoinOpen(false)
  }, [])

  const toggleJoinMenu = useCallback(() => {
    setIsJoinOpen((open) => !open)
  }, [])

  useEffect(() => {
    window.requestAnimationFrame(() => {
      const hash = window.location.hash

      if (hash) {
        if (hash === "#join") {
          openJoinMenu()
          return
        }

        document.getElementById(hash.slice(1))?.scrollIntoView()
        return
      }

      window.scrollTo({ top: 0, left: 0 })
    })
  }, [pathname, openJoinMenu])

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#join") {
        openJoinMenu()
      }
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [openJoinMenu])

  return (
    <main>
      {!isAdminRoute && (
        <Header
          isJoinOpen={isJoinOpen}
          onJoinClose={closeJoinMenu}
          onJoinToggle={toggleJoinMenu}
        />
      )}
      <JoinMenuContext.Provider value={openJoinMenu}>
        {children}
      </JoinMenuContext.Provider>
      {!isAdminRoute && <End />}
      {!isAdminRoute && <Footer />}
    </main>
  )
}
