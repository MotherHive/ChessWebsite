"use client"

import { useEffect, useRef } from "react"

// Invisible widgets draw nothing, so a stalled challenge is only visible through
// this timeout. Without it a form whose submit waits on the token stays dead
// with nothing on screen explaining why.
const challengeTimeout = 20000

let turnstileScriptPromise

const loadTurnstile = () => {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile)
  }

  if (!turnstileScriptPromise) {
    turnstileScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-turnstile-script="true"]')
      const script = existingScript || document.createElement("script")

      script.addEventListener("load", () => resolve(window.turnstile), { once: true })
      script.addEventListener("error", () => reject(new Error("Could not load Turnstile.")), {
        once: true,
      })

      if (!existingScript) {
        script.async = true
        script.defer = true
        script.dataset.turnstileScript = "true"
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        document.head.append(script)
      }
    })
  }

  return turnstileScriptPromise
}

export default function TurnstileWidget({ action, onStatusChange, onVerify }) {
  const containerRef = useRef(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return undefined
    }

    let widgetId
    let isActive = true
    let timeoutId

    const report = (status, token) => {
      if (!isActive) {
        return
      }

      if (status !== "pending") {
        window.clearTimeout(timeoutId)
      }

      onVerify(token)
      onStatusChange?.(status)
    }

    const startTimeout = () => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => report("error", ""), challengeTimeout)
    }

    onStatusChange?.("pending")
    startTimeout()

    loadTurnstile()
      .then((turnstile) => {
        if (!isActive || !turnstile) {
          return
        }

        widgetId = turnstile.render(containerRef.current, {
          action,
          callback: (token) => report("ready", token),
          "error-callback": () => report("error", ""),
          "expired-callback": () => {
            // Turnstile refreshes an expired token on its own, so this is a
            // return to waiting rather than a failure.
            report("pending", "")
            startTimeout()
          },
          sitekey: siteKey,
          theme: "auto",
          "timeout-callback": () => report("error", ""),
        })
      })
      .catch(() => report("error", ""))

    return () => {
      isActive = false
      window.clearTimeout(timeoutId)

      if (widgetId !== undefined && window.turnstile) {
        window.turnstile.remove(widgetId)
      }
    }
  }, [action, onStatusChange, onVerify, siteKey])

  return siteKey ? <div ref={containerRef}></div> : null
}
