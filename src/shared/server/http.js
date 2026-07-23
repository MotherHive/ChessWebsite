export const jsonResponse = (status, body, headers) => (
  Response.json(body, { status, headers })
)

export const parseJsonRequest = async (request) => {
  const body = await request.text()

  return body ? JSON.parse(body) : {}
}

export const getSiteUrl = () => {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, "")
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "https://scrantonchess.org"
}
