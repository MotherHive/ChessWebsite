import { spawn } from "node:child_process"
import { readFileSync } from "node:fs"
import { Resend } from "resend"

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i))
    .filter(Boolean)
    .map((match) => [match[1], match[2].replace(/^["']|["']$/g, "")]),
)
const currentKey = env.RESEND_API_KEY || env.RESEND_KEY

if (!currentKey) {
  throw new Error("A current Resend API key is required in .env.local.")
}

const resend = new Resend(currentKey)
const { data: createdKey, error } = await resend.apiKeys.create({
  name: "Chess Website Cloudflare",
  permission: "sending_access",
})

if (error || !createdKey?.id || !createdKey?.token) {
  throw new Error(error?.message || "Resend did not return a new API key.")
}

const putSecret = spawn("npx", ["wrangler", "secret", "put", "RESEND_API_KEY"], {
  cwd: new URL("..", import.meta.url),
  shell: false,
  stdio: ["pipe", "inherit", "inherit"],
})

putSecret.stdin.end(createdKey.token)

try {
  await new Promise((resolve, reject) => {
    putSecret.once("error", reject)
    putSecret.once("exit", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`wrangler secret put exited with code ${code}.`))
      }
    })
  })
} catch (putError) {
  await resend.apiKeys.remove(createdKey.id)
  throw putError
}

console.log(JSON.stringify({
  cloudflareSecret: "RESEND_API_KEY",
  resendKeyId: createdKey.id,
  rotated: true,
}))
