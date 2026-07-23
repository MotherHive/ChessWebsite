import { randomUUID } from "node:crypto"
import { jsonResponse } from "@/shared/server/http"
import {
  tournamentImageTypes,
  validateTournamentImage,
} from "./imageUpload.js"

export const uploadTournamentImage = async (supabase, request) => {
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
  const { error } = await supabase.storage
    .from("tournament-images")
    .upload(objectPath, fileBytes, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return jsonResponse(500, { error: "Could not store the tournament image." })
  }

  const { data } = supabase.storage.from("tournament-images").getPublicUrl(objectPath)

  return jsonResponse(200, { imageUrl: data.publicUrl })
}
