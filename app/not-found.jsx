import HomePage from "@/home/components/HomePage"

export default function NotFound() {
  return <HomePage meetingReferenceTime={new Date().toISOString()} />
}
