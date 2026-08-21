import { withAdmin } from "@/shared/server/adminAuth"
import { jsonResponse, parseJsonRequest } from "@/shared/server/http"
import {
  hidePreset,
  listHiddenPresets,
  restorePreset,
} from "@/tournaments/server/adminPresets"

export const dynamic = "force-dynamic"

const withParsedBody = (handle) => async ({ request, db }) => {
  let body

  try {
    body = await parseJsonRequest(request)
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." })
  }

  return handle(db, body)
}

export const GET = withAdmin(({ db }) => listHiddenPresets(db))

export const POST = withAdmin(withParsedBody(hidePreset))

export const DELETE = withAdmin(withParsedBody(restorePreset))
