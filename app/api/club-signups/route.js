import { getDatabase } from "@/shared/server/cloudflare"
import { firstRow, runStatement } from "@/shared/server/database"
import { trySendClubWelcomeEmail } from "@/shared/server/email"
import { jsonResponse, parseJsonRequest } from "@/shared/server/http"
import { enforcePublicFormRateLimit } from "@/shared/server/rateLimit"
import { verifyTurnstile } from "@/shared/server/turnstile"

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export async function POST(request) {
  const rateLimitResponse = await enforcePublicFormRateLimit(request, "club-signup")

  if (rateLimitResponse) {
    return rateLimitResponse
  }

  let body

  try {
    body = await parseJsonRequest(request)
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." })
  }

  const firstName = String(body?.firstName || "").trim().slice(0, 100)
  const lastName = String(body?.lastName || "").trim().slice(0, 100)
  const email = String(body?.email || "").trim().toLowerCase().slice(0, 254)

  if (!firstName || !lastName || !isValidEmail(email)) {
    return jsonResponse(400, { error: "Enter a valid first name, last name, and email." })
  }

  if (!await verifyTurnstile(request, body?.turnstileToken, "club_signup")) {
    return jsonResponse(400, { error: "Please complete the anti-spam check and try again." })
  }

  let db

  try {
    db = getDatabase()
  } catch {
    return jsonResponse(500, { error: "The club signup database is not configured." })
  }

  try {
    const now = new Date().toISOString()
    let signup = await firstRow(db.prepare(`
      INSERT INTO club_signups (id, created_at, first_name, last_name, email, source)
      VALUES (?, ?, ?, ?, ?, 'join_menu')
      ON CONFLICT(email) DO NOTHING
      RETURNING id, first_name, email, welcome_email_sent_at
    `).bind(crypto.randomUUID(), now, firstName, lastName, email))
    const duplicate = !signup

    if (!signup) {
      signup = await firstRow(db.prepare(`
        SELECT id, first_name, email, welcome_email_sent_at
        FROM club_signups
        WHERE email = ?
      `).bind(email))
    }

    if (!signup) {
      return jsonResponse(500, { error: "Could not verify your saved signup." })
    }

    if (!signup.welcome_email_sent_at) {
      const emailSent = await trySendClubWelcomeEmail(
        { firstName: signup.first_name, email: signup.email },
        { idempotencyKey: `club-signup-${signup.id}-welcome` },
      )

      if (!emailSent) {
        return jsonResponse(502, {
          error: "Your information was saved, but the welcome email could not be sent. Try again later.",
          saved: true,
        })
      }

      await runStatement(db.prepare(`
        UPDATE club_signups
        SET welcome_email_sent_at = ?
        WHERE id = ? AND welcome_email_sent_at IS NULL
      `).bind(new Date().toISOString(), signup.id))
    }

    return jsonResponse(200, { duplicate, emailSent: true })
  } catch {
    return jsonResponse(500, { error: "Could not save your information. Try again later." })
  }
}
