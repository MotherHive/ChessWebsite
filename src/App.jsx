import './App.css'
import Header from "./components/Header"
import Hero from './components/Hero'
import Intro from './components/Intro'
import Blog from './components/Blog'
import BlogPost from './components/BlogPost'
import Contact from './components/Contact'
import Tournaments from './components/Tournaments'
import QandA from './components/QandA'
import WhatToExpect from './components/WhatToExpect'
import End from './components/End'
import Footer from './components/Footer'
import { getBlogPostBySlug } from './data/blogPosts'


function App() {
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/"
  const isTournamentsPage = currentPath === "/tournaments"
  const isBlogPage = currentPath === "/blog"
  const isBlogPostPage = currentPath.startsWith("/blog/")
  const isContactPage = currentPath === "/contact"

  if (isTournamentsPage) {
    return (
      <main>
        <Header />
        <Tournaments />
        <End />
        <Footer />
      </main>
    )
  }

  if (isBlogPage) {
    return (
      <main>
        <Header />
        <Blog />
        <End />
        <Footer />
      </main>
    )
  }

  if (isBlogPostPage) {
    const postSlug = currentPath.replace("/blog/", "")

    return (
      <main>
        <Header />
        <BlogPost post={getBlogPostBySlug(postSlug)} />
        <End />
        <Footer />
      </main>
    )
  }

  if (isContactPage) {
    return (
      <main>
        <Header />
        <Contact />
        <End />
        <Footer />
      </main>
    )
  }

  return (
    <main>
      <Header />
      <Hero />
      <Intro />
      <WhatToExpect />
      <QandA />
      <End />
      <Footer />
    </main>
  )
}

export default App
