import { withAdmin } from "@/shared/server/adminAuth"
import { listRegistrations } from "@/tournaments/server/adminRegistrations"

export const dynamic = "force-dynamic"

export const GET = withAdmin(({ request, supabase }) => (
  listRegistrations(supabase, new URL(request.url).searchParams)
))
