import { listClubSignups } from "@/club/server/adminClubSignups"
import { withAdmin } from "@/shared/server/adminAuth"

export const dynamic = "force-dynamic"

export const GET = withAdmin(({ request, db }) => (
  listClubSignups(db, new URL(request.url).searchParams)
))
