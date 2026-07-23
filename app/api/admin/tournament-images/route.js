import { withAdmin } from "@/shared/server/adminAuth"
import { uploadTournamentImage } from "@/tournaments/server/uploadTournamentImage"

export const dynamic = "force-dynamic"

export const POST = withAdmin(({ request, supabase }) => uploadTournamentImage(supabase, request))
