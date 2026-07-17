// Local stand-in for Vercel serverless functions so the site can be tested
// without deploying: `npm run dev:api` alongside `npm run dev`.
import { createServer } from "node:http"

const port = Number(process.env.API_PORT) || 3999

const handlers = {
  "/api/admin": () => import("../api/admin.js"),
  "/api/tournament-registration": () => import("../api/tournament-registration.js"),
  "/api/stripe-webhook": () => import("../api/stripe-webhook.js"),
}

const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = []

  req.on("data", (chunk) => chunks.push(chunk))
  req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
  req.on("error", reject)
})

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`)
  const loadHandler = handlers[url.pathname]

  if (!loadHandler) {
    res.statusCode = 404
    res.end(JSON.stringify({ error: `No API route for ${url.pathname}` }))
    return
  }

  req.query = Object.fromEntries(url.searchParams)
  req.body = await readBody(req)

  res.status = (statusCode) => {
    res.statusCode = statusCode
    return res
  }
  res.json = (body) => {
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify(body))
  }

  try {
    const { default: handler } = await loadHandler()

    await handler(req, res)
  } catch (error) {
    console.error(error)

    if (!res.writableEnded) {
      res.status(500).json({ error: "Local API server error. See terminal." })
    }
  }
}).listen(port, () => {
  console.log(`Local API server ready at http://localhost:${port}/api/*`)
})
