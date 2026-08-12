import { getCloudflareContext } from "@opennextjs/cloudflare"

const getBinding = (name) => {
  const binding = getCloudflareContext().env[name]

  if (!binding) {
    throw new Error(`Cloudflare binding ${name} is not configured.`)
  }

  return binding
}

export const getDatabase = () => getBinding("DB")

export const getTournamentImageBucket = () => getBinding("TOURNAMENT_IMAGES")

export const getDefaultCache = () => globalThis.caches?.default

export const scheduleCloudflareTask = (promise) => {
  const handledPromise = promise.catch(() => undefined)

  try {
    getCloudflareContext().ctx.waitUntil(handledPromise)
  } catch {
    // Local Next.js development has no Cloudflare execution context. The
    // handled promise may still finish, but it must never fail the response.
  }
}

export const getCloudflareVariable = (name) => {
  try {
    return getCloudflareContext().env[name]
  } catch {
    return undefined
  }
}

// Worker secrets arrive as bindings, while `next dev` and the Node scripts only
// populate `process.env`. Every server module must read configuration the same
// way so a secret is never silently missing on one runtime.
export const getServerConfig = (name) => (
  getCloudflareVariable(name) || process.env[name] || ""
)
