import HomePage from "../src/pages/home/HomePage"

export default function NotFound() {
  return <HomePage meetingReferenceTime={new Date().toISOString()} />
}
