import { exportClubSignups } from "@/club/server/adminClubSignups"
import { withAdmin } from "@/shared/server/adminAuth"

export const dynamic = "force-dynamic"

export const GET = withAdmin(({ request, db }) => (
  exportClubSignups(db, new URL(request.url).searchParams)
))
