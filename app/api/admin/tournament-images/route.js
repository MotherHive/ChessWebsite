import { withAdmin } from "@/shared/server/adminAuth"
import { getTournamentImageBucket } from "@/shared/server/cloudflare"
import { uploadTournamentImage } from "@/tournaments/server/uploadTournamentImage"

export const dynamic = "force-dynamic"

export const POST = withAdmin(({ request }) => (
  uploadTournamentImage(getTournamentImageBucket(), request)
))
