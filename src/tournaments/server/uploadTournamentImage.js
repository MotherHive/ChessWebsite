import { randomUUID } from "node:crypto"
import { getSiteUrl, jsonResponse } from "@/shared/server/http"
import {
  tournamentImageTypes,
  validateTournamentImage,
} from "./imageUpload.js"

export const uploadTournamentImage = async (bucket, request) => {
  let formData

  try {
    formData = await request.formData()
  } catch {
    return jsonResponse(400, { error: "Could not read the image upload." })
  }

  const file = formData.get("image")
  const validationError = validateTournamentImage(file)

  if (validationError) {
    return jsonResponse(400, { error: validationError })
  }

  const extension = tournamentImageTypes.get(file.type)
  const objectPath = `${new Date().getUTCFullYear()}/${randomUUID()}.${extension}`
  const fileBytes = new Uint8Array(await file.arrayBuffer())

  try {
    await bucket.put(objectPath, fileBytes, {
      httpMetadata: {
        cacheControl: "public, max-age=31536000, immutable",
        contentType: file.type,
      },
    })
  } catch {
    return jsonResponse(500, { error: "Could not store the tournament image." })
  }

  return jsonResponse(200, {
    imageUrl: `${getSiteUrl()}/api/tournament-images/${objectPath}`,
  })
}
