const tournamentImageKeyPattern = /^\d{4}\/[0-9a-f-]+\.(?:jpg|png|webp)$/i

export const isTournamentImageKey = (key) => tournamentImageKeyPattern.test(key)

export const serveTournamentImage = async ({ bucket, cache, key, request, waitUntil }) => {
  if (!isTournamentImageKey(key)) {
    return new Response("Not found", { status: 404 })
  }

  if (cache) {
    try {
      const cachedResponse = await cache.match(request)

      if (cachedResponse) {
        return cachedResponse
      }
    } catch {
      // A cache failure should fall through to R2 instead of breaking images.
    }
  }

  let object

  try {
    object = await bucket.get(key)
  } catch {
    return new Response("Image storage is unavailable.", { status: 503 })
  }

  if (!object) {
    return new Response("Not found", { status: 404 })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set("Cache-Control", "public, max-age=31536000, immutable")
  headers.set("ETag", object.httpEtag)
  headers.set("X-Content-Type-Options", "nosniff")

  const response = new Response(object.body, { headers })

  if (cache) {
    const cacheWrite = cache.put(request, response.clone())
    waitUntil(cacheWrite)
  }

  return response
}
