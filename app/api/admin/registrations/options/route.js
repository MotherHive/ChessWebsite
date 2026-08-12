import { withAdmin } from "@/shared/server/adminAuth"
import { listRegistrationOptions } from "@/tournaments/server/adminRegistrations"

export const dynamic = "force-dynamic"

export const GET = withAdmin(({ db }) => listRegistrationOptions(db))
