import { withAdmin } from "@/shared/server/adminAuth"
import { jsonResponse, parseJsonRequest } from "@/shared/server/http"
import { runTournamentAction } from "@/tournaments/server/adminTournaments"

export const dynamic = "force-dynamic"

export const PATCH = withAdmin(async ({ context, request, db }) => {
  let body

  try {
    body = await parseJsonRequest(request)
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." })
  }

  const { tournamentId } = await context.params

  return runTournamentAction(db, tournamentId, String(body?.action || ""))
})

export const DELETE = withAdmin(async ({ context, db }) => {
  const { tournamentId } = await context.params

  return runTournamentAction(db, tournamentId, "delete")
})
