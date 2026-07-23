import { createHash } from "node:crypto"

const stableStringify = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`
  }

  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)

    return `{${entries.join(",")}}`
  }

  return JSON.stringify(value)
}

export const isValidIdempotencyKey = (value) => (
  typeof value === "string"
  && value.length >= 16
  && value.length <= 128
  && /^[A-Za-z0-9_-]+$/.test(value)
)

export const fingerprintPayload = (payload) => (
  createHash("sha256").update(stableStringify(payload)).digest("hex")
)
