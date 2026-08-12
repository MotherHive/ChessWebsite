import { jsonResponse } from "@/shared/server/http"
import { getDatabase } from "@/shared/server/cloudflare"
import { listPublishedTournaments } from "@/tournaments/server/repository"

export const dynamic = "force-dynamic"

export async function GET() {
  let db

  try {
    db = getDatabase()
  } catch {
    return jsonResponse(500, { error: "The tournament database is not configured." })
  }

  try {
    const tournaments = await listPublishedTournaments(db)

    return jsonResponse(
      200,
      { tournaments },
      { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    )
  } catch {
    return jsonResponse(500, { error: "Could not load valid published tournaments." })
  }
}
