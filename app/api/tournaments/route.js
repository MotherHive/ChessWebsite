import { jsonResponse } from "../../../server/http.js"
import { getSupabaseAdmin } from "../../../server/supabaseAdmin.js"
import { listPublishedTournaments } from "../../../server/tournamentRepository.js"

export const dynamic = "force-dynamic"

export async function GET() {
  let supabase

  try {
    supabase = getSupabaseAdmin()
  } catch {
    return jsonResponse(500, { error: "Supabase admin is not configured." })
  }

  try {
    const tournaments = await listPublishedTournaments(supabase)

    return jsonResponse(
      200,
      { tournaments },
      { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    )
  } catch {
    return jsonResponse(500, { error: "Could not load valid published tournaments." })
  }
}
