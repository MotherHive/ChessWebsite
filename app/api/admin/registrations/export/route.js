import { withAdmin } from "@/shared/server/adminAuth"
import { exportRegistrations } from "@/tournaments/server/adminRegistrations"

export const dynamic = "force-dynamic"

export const GET = withAdmin(({ request, supabase }) => (
  exportRegistrations(supabase, new URL(request.url).searchParams)
))
