import './App.css'
import Header from "./components/Header"
import Hero from './components/Hero'
import Intro from './components/Intro'
import QandA from './components/QandA'
import WhatToExpect from './components/WhatToExpect'
import End from './components/End'
import Footer from './components/Footer'


function App() {
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
