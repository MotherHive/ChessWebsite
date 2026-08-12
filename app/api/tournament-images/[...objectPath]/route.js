import {
  getDefaultCache,
  getTournamentImageBucket,
  scheduleCloudflareTask,
} from "@/shared/server/cloudflare"
import { serveTournamentImage } from "@/tournaments/server/serveTournamentImage"

export const dynamic = "force-dynamic"

export async function GET(request, context) {
  const { objectPath } = await context.params
  const key = Array.isArray(objectPath) ? objectPath.join("/") : ""

  return serveTournamentImage({
    bucket: getTournamentImageBucket(),
    cache: getDefaultCache(),
    key,
    request,
    waitUntil: scheduleCloudflareTask,
  })
}
