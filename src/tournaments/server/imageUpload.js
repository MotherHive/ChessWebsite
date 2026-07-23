export const tournamentImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
])

export const tournamentImageMaxBytes = 4 * 1024 * 1024

export const validateTournamentImage = (file) => {
  if (!file || typeof file.arrayBuffer !== "function") {
    return "Choose an image to upload."
  }

  if (!tournamentImageTypes.has(file.type)) {
    return "Use a JPG, PNG, or WebP image."
  }

  if (!file.size || file.size > tournamentImageMaxBytes) {
    return "The image must be smaller than 4 MB."
  }

  return ""
}
