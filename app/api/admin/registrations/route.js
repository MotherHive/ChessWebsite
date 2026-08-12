import { withAdmin } from "@/shared/server/adminAuth"
import { listRegistrations } from "@/tournaments/server/adminRegistrations"

export const dynamic = "force-dynamic"

export const GET = withAdmin(({ request, db }) => (
  listRegistrations(db, new URL(request.url).searchParams)
))
