import { useEffect, useRef, useState } from "react"

export default function useScrollVisibility({ threshold = 0.18 } = {}) {
  const targetRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const target = targetRef.current

    if (!target) {
      return undefined
    }

    if (!("IntersectionObserver" in window)) {
      const fallbackTimer = window.setTimeout(() => {
        setIsVisible(true)
      }, 0)

      return () => window.clearTimeout(fallbackTimer)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold },
    )

    observer.observe(target)

    return () => observer.disconnect()
  }, [threshold])

  return [targetRef, isVisible]
}
