import { withAdmin } from "@/shared/server/adminAuth"
import { settleStripeRegistrations } from "@/tournaments/server/adminRegistrations"

export const dynamic = "force-dynamic"

export const POST = withAdmin(({ db }) => settleStripeRegistrations(db))
