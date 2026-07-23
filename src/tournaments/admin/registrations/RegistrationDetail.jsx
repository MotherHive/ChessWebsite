import {
  formatCents,
  formatDate,
  paymentStatusLabels,
} from "./registrationPresentation"

export default function RegistrationDetail({
  onClose,
  onMarkPaid,
  paymentActionMessage,
  paymentActionState,
  registration,
}) {
  return (
    <aside className="admin-detail" aria-label={`Registration for ${registration.player_name}`}>
      <div className="admin-detail-header">
        <h3>{registration.player_name}</h3>
        <button className="admin-link-button" onClick={onClose} type="button">Close</button>
      </div>
      <dl className="admin-detail-grid">
        <div>
          <dt>Tournament</dt>
          <dd>{registration.tournament_title} — {registration.section}</dd>
        </div>
        <div>
          <dt>Registered</dt>
          <dd>{formatDate(registration.created_at)}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd><a href={`mailto:${registration.email}`}>{registration.email}</a></dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{registration.phone || "—"}</dd>
        </div>
        <div>
          <dt>Address</dt>
          <dd>{registration.address || "—"}</dd>
        </div>
        <div>
          <dt>Birth date</dt>
          <dd>{registration.birth_date || "—"}</dd>
        </div>
        <div>
          <dt>USCF ID</dt>
          <dd>{registration.uscf_id || "—"}</dd>
        </div>
        <div>
          <dt>Active USCF membership</dt>
          <dd>
            {registration.active_membership_status}
            {registration.needs_membership && ` — buying ${registration.membership_tier_label || "membership"}`}
            {registration.is_expired_member && " (expired member discount)"}
          </dd>
        </div>
        <div>
          <dt>Team entry</dt>
          <dd>{registration.entered_with_team ? registration.school || "yes" : "No"}</dd>
        </div>
        <div>
          <dt>Byes</dt>
          <dd>
            {(registration.byes || []).length
              ? registration.byes.map((bye) => bye.round).join(", ")
              : "None"}
          </dd>
        </div>
        <div>
          <dt>Order</dt>
          <dd>
            {(registration.line_items || []).map((lineItem, lineItemIndex) => (
              <span className="admin-line-item" key={lineItemIndex}>
                {lineItem.label}: {formatCents(lineItem.amount_cents)}
              </span>
            ))}
            <strong>Total: {formatCents(registration.total_amount_cents)}</strong>
          </dd>
        </div>
        <div>
          <dt>Payment</dt>
          <dd>
            {registration.payment_method === "stripe_checkout"
              ? "Stripe checkout"
              : registration.payment_status === "paid" ? "Paid in person" : "Pay at event"}
            {" — "}
            {paymentStatusLabels[registration.payment_status] || registration.payment_status}
            {registration.paid_at && ` (paid ${formatDate(registration.paid_at)})`}
          </dd>
        </div>
        <div>
          <dt>Stripe</dt>
          <dd>
            {registration.stripe_payment_intent_id ? (
              <a
                href={`https://dashboard.stripe.com/payments/${registration.stripe_payment_intent_id}`}
                rel="noreferrer"
                target="_blank"
              >
                View payment in Stripe
              </a>
            ) : (
              registration.stripe_checkout_session_id || "—"
            )}
            {registration.stripe_payment_status && (
              <span className="admin-muted admin-table-sub">
                Stripe status: {registration.stripe_payment_status}
              </span>
            )}
          </dd>
        </div>
      </dl>
      {registration.payment_status !== "paid" && (
        <div className="admin-payment-action">
          <button
            className="button"
            disabled={paymentActionState === "saving"}
            onClick={onMarkPaid}
            type="button"
          >
            {paymentActionState === "saving" ? "Recording payment..." : "Mark paid in person"}
          </button>
          <span className="admin-muted">
            Use this after receiving cash, check, or another payment at the event.
          </span>
        </div>
      )}
      {paymentActionMessage && (
        <p
          className={paymentActionState === "error" ? "admin-error" : "admin-success"}
          role="status"
        >
          {paymentActionMessage}
        </p>
      )}
    </aside>
  )
}
