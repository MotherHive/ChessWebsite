export const sendJson = (res, statusCode, body) => {
  res.status(statusCode).json(body)
}

export const parseJsonBody = (req) => {
  if (typeof req.body === "string") {
    return JSON.parse(req.body || "{}")
  }

  return req.body || {}
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
