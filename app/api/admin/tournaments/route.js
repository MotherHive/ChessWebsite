import { withAdmin } from "@/shared/server/adminAuth"
import { jsonResponse, parseJsonRequest } from "@/shared/server/http"
import {
  listTournaments,
  saveTournament,
} from "@/tournaments/server/adminTournaments"

export const dynamic = "force-dynamic"

export const GET = withAdmin(({ supabase }) => listTournaments(supabase))

export const POST = withAdmin(async ({ request, supabase }) => {
  let body

  try {
    body = await parseJsonRequest(request)
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." })
  }

  return saveTournament(supabase, body)
})
