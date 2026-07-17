import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import End from "./components/layout/End"
import Footer from "./components/layout/Footer"
import Header from "./components/layout/Header"
import AdminLayout from "./pages/admin/AdminLayout"
import AdminLoginPage from "./pages/admin/AdminLoginPage"
import AdminRegistrationsPage from "./pages/admin/registrations/AdminRegistrationsPage"
import AdminTournamentEditorPage from "./pages/admin/tournaments/AdminTournamentEditorPage"
import AdminTournamentPreviewPage from "./pages/admin/tournaments/AdminTournamentPreviewPage"
import AdminTournamentsPage from "./pages/admin/tournaments/AdminTournamentsPage"
import ContactPage from "./pages/contact/ContactPage"
import HomePage from "./pages/home/HomePage"
import TournamentsPage from "./pages/tournaments/TournamentsPage"

function ScrollToRouteTarget({ onJoinTarget }) {
  const { hash, pathname } = useLocation()

  useEffect(() => {
    window.requestAnimationFrame(() => {
      if (hash) {
        if (hash === "#join") {
          onJoinTarget()
          return
        }

        document.getElementById(hash.slice(1))?.scrollIntoView()
        return
      }

      window.scrollTo({ top: 0, left: 0 })
    })
  }, [hash, onJoinTarget, pathname])

  return null
}

function App() {
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const { pathname } = useLocation()
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

  return (
    <main>
      <ScrollToRouteTarget onJoinTarget={openJoinMenu} />
      {!isAdminRoute && (
        <Header
          isJoinOpen={isJoinOpen}
          onJoinClose={closeJoinMenu}
          onJoinToggle={toggleJoinMenu}
        />
      )}
      <Routes>
        <Route path="/" element={<HomePage onOpenJoinMenu={openJoinMenu} />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/tournaments" replace />} />
          <Route path="tournaments" element={<AdminTournamentsPage />} />
          <Route path="tournaments/new" element={<AdminTournamentEditorPage />} />
          <Route path="tournaments/:tournamentId" element={<AdminTournamentEditorPage />} />
          <Route path="tournaments/:tournamentId/preview" element={<AdminTournamentPreviewPage />} />
          <Route path="registrations" element={<AdminRegistrationsPage />} />
        </Route>
        <Route path="*" element={<HomePage onOpenJoinMenu={openJoinMenu} />} />
      </Routes>
      {!isAdminRoute && <End />}
      {!isAdminRoute && <Footer />}
    </main>
  )
}

export default App
