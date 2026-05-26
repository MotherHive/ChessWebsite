import './App.css'
import { useCallback, useEffect, useState } from 'react'
import { Route, Routes, useLocation, useParams } from 'react-router-dom'
import Header from "./components/Header"
import Home from './components/Home'
import Blog from './components/Blog'
import BlogPost from './components/BlogPost'
import ConstructionPopup from './components/ConstructionPopup'
import Contact from './components/Contact'
import Tournaments from './components/Tournaments'
import End from './components/End'
import Footer from './components/Footer'
import { getBlogPostBySlug } from './data/blogPosts'

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

function BlogPostRoute() {
  const { postSlug } = useParams()

  return <BlogPost post={getBlogPostBySlug(postSlug)} />
}

function App() {
  const [isJoinOpen, setIsJoinOpen] = useState(false)

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
      <ConstructionPopup />
      <Header
        isJoinOpen={isJoinOpen}
        onJoinClose={closeJoinMenu}
        onJoinToggle={toggleJoinMenu}
      />
      <Routes>
        <Route path="/" element={<Home onOpenJoinMenu={openJoinMenu} />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:postSlug" element={<BlogPostRoute />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home onOpenJoinMenu={openJoinMenu} />} />
      </Routes>
      <End />
      <Footer />
    </main>
  )
}

export default App
