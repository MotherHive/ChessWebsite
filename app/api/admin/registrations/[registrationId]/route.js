import { withAdmin } from "@/shared/server/adminAuth"
import { loadRegistration } from "@/tournaments/server/adminRegistrations"

export const dynamic = "force-dynamic"

export const GET = withAdmin(async ({ context, db }) => {
  const { registrationId } = await context.params

  return loadRegistration(db, registrationId)
})
