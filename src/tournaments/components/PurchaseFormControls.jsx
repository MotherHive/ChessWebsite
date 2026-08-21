import { useEffect, useRef, useState } from "react"

export function PurchaseCheckboxCard({
  checkedField,
  className,
  description,
  purchase,
  title,
}) {
  return (
    <label className={`purchase-check-card purchase-check-card-compact${className ? ` ${className}` : ""}`}>
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
  list,
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
        list={list}
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

// A native select of every state opens a list tall enough to run off the
// screen, and neither its height nor a datalist popup's can be styled. This
// keeps the same type-to-filter behaviour in a list the page can cap and
// scroll.
export function PurchaseComboField({
  autoComplete,
  field,
  formatValue,
  hint,
  id,
  invalid,
  label,
  options,
  placeholder,
  purchase,
  resolveValue,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef(null)
  const value = purchase.purchaseForm[field]
  const typed = value.trim().toLowerCase()
  const typedMatches = options.filter((option) => (
    option.value.toLowerCase().startsWith(typed) || option.label.toLowerCase().startsWith(typed)
  ))
  const visibleOptions = typedMatches.length ? typedMatches : options
  const hintId = hint ? `${id}-hint` : undefined
  const listId = `${id}-list`

  // Keep the highlighted option inside the scrolling list while arrowing.
  useEffect(() => {
    if (isOpen) {
      listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" })
    }
  }, [activeIndex, isOpen])

  const commit = (option) => {
    purchase.updatePurchaseField(field, option.value)
    setIsOpen(false)
  }

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false)
      return
    }

    if (event.key === "Enter" && isOpen) {
      event.preventDefault()
      commit(visibleOptions[activeIndex] ?? { value })
      return
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return
    }

    event.preventDefault()

    if (!isOpen) {
      setIsOpen(true)
      return
    }

    const step = event.key === "ArrowDown" ? 1 : -1

    setActiveIndex((current) => (
      (current + step + visibleOptions.length) % visibleOptions.length
    ))
  }

  return (
    <div className="purchase-field purchase-combo">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete={autoComplete}
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-describedby={hintId}
        aria-invalid={invalid}
        placeholder={placeholder}
        value={value}
        onBlur={() => {
          setIsOpen(false)

          // "Pennsylvania" and "pa" both settle into the stored "PA".
          const resolved = resolveValue ? resolveValue(value) : ""

          if (resolved && resolved !== value) {
            purchase.updatePurchaseField(field, resolved)
          }
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        onChange={(event) => {
          purchase.updatePurchaseField(
            field,
            formatValue ? formatValue(event.target.value) : event.target.value,
          )
          setActiveIndex(0)
          setIsOpen(true)
        }}
      />
      {isOpen && visibleOptions.length > 0 && (
        <ul className="purchase-combo-list" id={listId} ref={listRef} role="listbox">
          {visibleOptions.map((option, optionIndex) => (
            <li
              aria-selected={option.value === value}
              className={`purchase-combo-option${optionIndex === activeIndex ? " purchase-combo-option-active" : ""}`}
              key={option.value}
              role="option"
              // Mousedown fires before the input's blur closes the list.
              onMouseDown={(event) => {
                event.preventDefault()
                commit(option)
              }}
              onMouseEnter={() => setActiveIndex(optionIndex)}
            >
              <strong>{option.value}</strong> {option.label}
            </li>
          ))}
        </ul>
      )}
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
