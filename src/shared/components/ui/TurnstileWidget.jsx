"use client"

import { useEffect, useRef } from "react"

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

export default function TurnstileWidget({ action, onVerify }) {
  const containerRef = useRef(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return undefined
    }

    let widgetId
    let isActive = true

    loadTurnstile()
      .then((turnstile) => {
        if (!isActive || !turnstile) {
          return
        }

        widgetId = turnstile.render(containerRef.current, {
          action,
          callback: onVerify,
          "error-callback": () => onVerify(""),
          "expired-callback": () => onVerify(""),
          sitekey: siteKey,
          theme: "auto",
        })
      })
      .catch(() => onVerify(""))

    return () => {
      isActive = false

      if (widgetId !== undefined && window.turnstile) {
        window.turnstile.remove(widgetId)
      }
    }
  }, [action, onVerify, siteKey])

  return siteKey ? <div ref={containerRef}></div> : null
}
