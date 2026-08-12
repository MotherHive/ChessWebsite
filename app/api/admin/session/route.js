import { withAdmin } from "@/shared/server/adminAuth"
import { jsonResponse } from "@/shared/server/http"

export const dynamic = "force-dynamic"

export const GET = withAdmin(({ user }) => jsonResponse(200, {
  user: { email: user.email },
}))
