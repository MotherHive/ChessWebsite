import HomePage from "../src/pages/home/HomePage"

export const revalidate = 3600

export default function Home() {
  return <HomePage meetingReferenceTime={new Date().toISOString()} />
}
