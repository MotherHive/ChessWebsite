import { Resend } from "resend";

// ============================================================================
// 1. Initialization & Configuration Helpers
// ============================================================================

export const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_KEY

  if (!apiKey) {
    throw new Error("Resend API key is not configured.");
  }
  return new Resend(apiKey);
};

const fromAddress = () => (
  process.env.RESEND_FROM || "Scranton Chess Club <noreply@scrantonchess.org>"
);

// ============================================================================
// 2. Formatting & Sanitization Helpers
// ============================================================================

const formatCents = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const detailRows = (details) => [
  ["Tournament", details.tournamentTitle],
  ["Section", details.section],
  ["Dates", details.dateRange],
  ["Location", details.location],
  ["Payment", details.paymentMethodLabel],
].filter(([, value]) => value);

// ============================================================================
// 3. Template Builders: Tournament Registration
// ============================================================================

const buildHtml = (details) => {
  const intro = details.paid
    ? "Your payment was received and your spot is confirmed."
    : "We received your registration. Your payment is still pending.";

  const rows = detailRows(details)
    .map(([label, value]) => `
      <tr>
        <td style="padding:4px 12px 4px 0;color:#6b7280;">${escapeHtml(label)}</td>
        <td style="padding:4px 0;color:#111827;font-weight:600;">${escapeHtml(value)}</td>
      </tr>`)
    .join("");

  const lineItems = (details.lineItems || [])
    .map((item) => `
      <tr>
        <td style="padding:4px 0;color:#374151;">${escapeHtml(item.label)}</td>
        <td style="padding:4px 0;color:#374151;text-align:right;">${formatCents(item.amount_cents)}</td>
      </tr>`)
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
    <h1 style="font-size:20px;">You're signed up, ${escapeHtml(details.playerName)}!</h1>
    <p style="color:#374151;">${intro}</p>
    <table style="border-collapse:collapse;margin:16px 0;">${rows}</table>
    <table style="border-collapse:collapse;width:100%;margin:16px 0;border-top:1px solid #e5e7eb;">
      ${lineItems}
      <tr>
        <td style="padding:8px 0;font-weight:700;border-top:1px solid #e5e7eb;">Total</td>
        <td style="padding:8px 0;font-weight:700;text-align:right;border-top:1px solid #e5e7eb;">${formatCents(details.totalAmountCents)}</td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:13px;">— Scranton Chess Club</p>
  </div>`;
};

const buildText = (details) => {
  const intro = details.paid
    ? "Your payment was received and your spot is confirmed."
    : "We received your registration. Your payment is still pending.";

  const rows = detailRows(details).map(([label, value]) => `${label}: ${value}`).join("\n");
  const lineItems = (details.lineItems || [])
    .map((item) => `  ${item.label}: ${formatCents(item.amount_cents)}`)
    .join("\n");

  return [
    `You're signed up, ${details.playerName}!`,
    "",
    intro,
    "",
    rows,
    "",
    lineItems,
    `Total: ${formatCents(details.totalAmountCents)}`,
    "",
    "— Scranton Chess Club",
  ].join("\n");
};

// ============================================================================
// 4. Template Builders: Club Welcome
// ============================================================================

export const buildWelcomeHtml = (firstName) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
    <h1 style="font-size:20px;">Welcome to the Scranton Chess Club, ${escapeHtml(firstName)}!</h1>
    <p style="color:#374151;">You're signed up. We'll email you meeting updates, events, and tournament news.</p>
    <p style="color:#6b7280;font-size:13px;">Questions? Email <a href="mailto:scrantonchess@gmail.com" style="color:#6b7280;">scrantonchess@gmail.com</a> and we'll help out.</p>
    <p style="color:#6b7280;font-size:13px;">— Scranton Chess Club</p>
  </div>`;

export const buildWelcomeText = (firstName) => [
  `Welcome to the Scranton Chess Club, ${firstName}!`,
  "",
  "You're signed up. We'll email you meeting updates, events, and tournament news.",
  "",
  "Questions? Email scrantonchess@gmail.com and we'll help out.",
  "— Scranton Chess Club",
].join("\n");

// ============================================================================
// 5. Data Mappers
// ============================================================================

export const detailsFromRegistration = (registration, { paid = false } = {}) => ({
  playerName: registration.player.name,
  email: registration.player.email,
  tournamentTitle: registration.tournament.title,
  section: registration.tournament.section,
  dateRange: registration.tournament.dateRange,
  location: registration.tournament.location,
  paymentMethodLabel: registration.order.paymentMethodLabel,
  lineItems: registration.order.lineItems,
  totalAmountCents: registration.order.totalAmountCents,
  paid,
});

export const detailsFromDatabaseRow = (row, { paid = false } = {}) => ({
  playerName: row.player_name,
  email: row.email,
  tournamentTitle: row.tournament_title,
  section: row.section,
  dateRange: row.tournament_date_range,
  location: row.tournament_location,
  paymentMethodLabel: row.payment_method,
  lineItems: row.line_items,
  totalAmountCents: row.total_amount_cents,
  paid,
});

// ============================================================================
// 6. Core Delivery Functions
// ============================================================================

export const sendClubWelcomeEmail = async ({ firstName, email }, { idempotencyKey } = {}) => {
  const resend = getResend();

  return resend.emails.send(
    {
      from: fromAddress(),
      to: email,
      subject: "Welcome to the Scranton Chess Club",
      html: buildWelcomeHtml(firstName),
      text: buildWelcomeText(firstName),
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
};

export const sendRegistrationEmail = async (details, { idempotencyKey } = {}) => {
  const resend = getResend();
  const subject = details.paid
    ? `You're confirmed for ${details.tournamentTitle}`
    : `Registration received for ${details.tournamentTitle}`;

  return resend.emails.send(
    {
      from: fromAddress(),
      to: details.email,
      subject,
      html: buildHtml(details),
      text: buildText(details),
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
};

// ============================================================================
// 7. Defensive Execution Wrappers
// ============================================================================

export const trySendClubWelcomeEmail = async (payload, options) => {
  try {
    const result = await sendClubWelcomeEmail(payload, options);

    if (result?.error) {
      throw result.error;
    }

    return true;
  } catch (error) {
    console.error("Failed to send club welcome email:", error);
    return false;
  }
};

export const trySendRegistrationEmail = async (details, options) => {
  try {
    const result = await sendRegistrationEmail(details, options);

    if (result?.error) {
      throw result.error;
    }

    return true;
  } catch (error) {
    console.error("Failed to send registration email:", error);
    return false;
  }
};
