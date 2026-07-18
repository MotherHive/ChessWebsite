"use client"

import { useOpenJoinMenu } from '../../components/layout/AppShell'
import Hero from './Hero'
import Intro from './Intro'
import QandA from './QandA'
import WhatToExpect from './WhatToExpect'

export default function HomePage() {
  const openJoinMenu = useOpenJoinMenu()

  return (
    <>
      <Hero onOpenJoinMenu={openJoinMenu} />
      <Intro />
      <WhatToExpect />
      <QandA />
    </>
  )
}
