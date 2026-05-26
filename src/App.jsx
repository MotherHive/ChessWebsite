import './App.css'
import { useEffect } from 'react'
import { Route, Routes, useLocation, useParams } from 'react-router-dom'
import Header from "./components/Header"
import Home from './components/Home'
import Blog from './components/Blog'
import BlogPost from './components/BlogPost'
import Contact from './components/Contact'
import Tournaments from './components/Tournaments'
import End from './components/End'
import Footer from './components/Footer'
import { getBlogPostBySlug } from './data/blogPosts'

function ScrollToRouteTarget() {
  const { hash, pathname } = useLocation()

  useEffect(() => {
    window.requestAnimationFrame(() => {
      if (hash) {
        document.getElementById(hash.slice(1))?.scrollIntoView()
        return
      }

      window.scrollTo({ top: 0, left: 0 })
    })
  }, [hash, pathname])

  return null
}

function BlogPostRoute() {
  const { postSlug } = useParams()

  return <BlogPost post={getBlogPostBySlug(postSlug)} />
}

function App() {
  return (
    <main>
      <ScrollToRouteTarget />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:postSlug" element={<BlogPostRoute />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <End />
      <Footer />
    </main>
  )
}

export default App
