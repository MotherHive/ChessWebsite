import { withAdmin } from "@/shared/server/adminAuth"
import { markRegistrationPaidInPerson } from "@/tournaments/server/adminRegistrations"

export const dynamic = "force-dynamic"

export const POST = withAdmin(async ({ context, supabase }) => {
  const { registrationId } = await context.params

  return markRegistrationPaidInPerson(supabase, registrationId)
})
