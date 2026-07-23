import HomePage from "@/home/components/HomePage"

export const revalidate = 3600

export default function Home() {
  return <HomePage meetingReferenceTime={new Date().toISOString()} />
}
