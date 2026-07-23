import HomePage from "../src/features/home/HomePage"

export default function NotFound() {
  return <HomePage meetingReferenceTime={new Date().toISOString()} />
}
