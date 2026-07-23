"use client"

import { useOpenJoinMenu } from '../../components/layout/AppShell'
import Hero from './Hero'
import Intro from './Intro'
import QandA from './QandA'
import WhatToExpect from './WhatToExpect'

export default function HomePage({ meetingReferenceTime }) {
  const openJoinMenu = useOpenJoinMenu()

  return (
    <>
      <Hero meetingReferenceTime={meetingReferenceTime} onOpenJoinMenu={openJoinMenu} />
      <Intro />
      <WhatToExpect />
      <QandA />
    </>
  )
}
