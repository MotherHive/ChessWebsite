import './App.css'
import Header from "./components/Header"
import Hero from './components/Hero'
import Intro from './components/Intro'
import Blog from './components/Blog'
import Tournaments from './components/Tournaments'
import QandA from './components/QandA'
import WhatToExpect from './components/WhatToExpect'
import End from './components/End'
import Footer from './components/Footer'


function App() {
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/"
  const isTournamentsPage = currentPath === "/tournaments"
  const isBlogPage = currentPath === "/blog"

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
