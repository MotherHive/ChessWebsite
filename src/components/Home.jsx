import Hero from './Hero'
import Intro from './Intro'
import QandA from './QandA'
import WhatToExpect from './WhatToExpect'

export default function Home({ onOpenJoinMenu }) {
  return (
    <>
      <Hero onOpenJoinMenu={onOpenJoinMenu} />
      <Intro />
      <WhatToExpect />
      <QandA />
    </>
  )
}
