import { withAdmin } from "@/shared/server/adminAuth"
import { loadRegistration } from "@/tournaments/server/adminRegistrations"

export const dynamic = "force-dynamic"

export const GET = withAdmin(async ({ context, supabase }) => {
  const { registrationId } = await context.params

  return loadRegistration(supabase, registrationId)
})
