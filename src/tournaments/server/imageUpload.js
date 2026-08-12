export const tournamentImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
])

export const tournamentImageMaxBytes = 4 * 1024 * 1024

const startsWith = (bytes, signature) => signature.every((byte, index) => bytes[index] === byte)

// The multipart content type is whatever the client claimed. The stored object
// is served back with that type, so the bytes have to agree with it.
export const sniffTournamentImageType = (bytes) => {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return "image/jpeg"
  }

  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png"
  }

  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50])) {
    return "image/webp"
  }

  return ""
}

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
