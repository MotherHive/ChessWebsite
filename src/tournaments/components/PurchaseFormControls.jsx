export function PurchaseCheckboxCard({
  checkedField,
  description,
  purchase,
  title,
}) {
  return (
    <label className="purchase-check-card purchase-check-card-compact">
      <input
        type="checkbox"
        checked={purchase.purchaseForm[checkedField]}
        onChange={(event) => purchase.updatePurchaseField(checkedField, event.target.checked)}
      />
      <span>
        <strong>{title}</strong>
        {description && <small>{description}</small>}
      </span>
    </label>
  )
}

export function PurchaseField({
  autoComplete,
  describedBy,
  field,
  formatValue,
  hint,
  id,
  inputMode,
  invalid,
  label,
  labelAction,
  pattern,
  placeholder,
  purchase,
  type = "text",
}) {
  const hintId = hint ? `${id}-hint` : undefined
  const descriptionIds = [describedBy, hintId].filter(Boolean).join(" ") || undefined

  return (
    <div className="purchase-field">
      {labelAction ? (
        <div className="purchase-label-row">
          <label htmlFor={id}>{label}</label>
          {labelAction}
        </div>
      ) : (
        <label htmlFor={id}>{label}</label>
      )}
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        pattern={pattern}
        placeholder={placeholder}
        value={purchase.purchaseForm[field]}
        aria-describedby={descriptionIds}
        aria-invalid={invalid}
        onChange={(event) => purchase.updatePurchaseField(
          field,
          formatValue ? formatValue(event.target.value) : event.target.value,
        )}
      />
      {hint && <small className="purchase-field-hint" id={hintId}>{hint}</small>}
    </div>
  )
}

export function PurchaseMessage({ message, status }) {
  if (!message) {
    return null
  }

  return (
    <p
      className={`purchase-message purchase-message-${status}`}
      id="purchase-drawer-message"
      role={status === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  )
}

export function PurchaseSelectField({
  children,
  className = "purchase-field",
  field,
  id,
  invalid,
  label,
  purchase,
  required,
}) {
  return (
    <div className={className}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        required={required}
        value={purchase.purchaseForm[field]}
        aria-invalid={invalid}
        onChange={(event) => purchase.updatePurchaseField(field, event.target.value)}
      >
        {children}
      </select>
    </div>
  )
}

export function PurchaseStepFooter({ children, label, value }) {
  return (
    <div className="purchase-drawer-footer">
      {label && (
        <div>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      )}
      {children}
    </div>
  )
}
