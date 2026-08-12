import { randomUUID } from "node:crypto"
import { getSiteUrl, jsonResponse } from "@/shared/server/http"
import {
  sniffTournamentImageType,
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

  const fileBytes = new Uint8Array(await file.arrayBuffer())
  const sniffedType = sniffTournamentImageType(fileBytes)

  if (sniffedType !== file.type) {
    return jsonResponse(400, { error: "Use a JPG, PNG, or WebP image." })
  }

  const extension = tournamentImageTypes.get(sniffedType)
  const objectPath = `${new Date().getUTCFullYear()}/${randomUUID()}.${extension}`

  try {
    await bucket.put(objectPath, fileBytes, {
      httpMetadata: {
        cacheControl: "public, max-age=31536000, immutable",
        contentType: sniffedType,
      },
    })
  } catch {
    return jsonResponse(500, { error: "Could not store the tournament image." })
  }

  return jsonResponse(200, {
    imageUrl: `${getSiteUrl()}/api/tournament-images/${objectPath}`,
  })
}
