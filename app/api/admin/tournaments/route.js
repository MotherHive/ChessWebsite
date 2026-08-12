import { withAdmin } from "@/shared/server/adminAuth"
import { jsonResponse, parseJsonRequest } from "@/shared/server/http"
import {
  listTournaments,
  saveTournament,
} from "@/tournaments/server/adminTournaments"

export const dynamic = "force-dynamic"

export const GET = withAdmin(({ db }) => listTournaments(db))

export const POST = withAdmin(async ({ request, db }) => {
  let body

  try {
    body = await parseJsonRequest(request)
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." })
  }

  return saveTournament(db, body)
})
