import { useEffect, useState } from "react"
import Link from "next/link"
const MarywoodLogo = "/assets/MarywoodLogo.png"
const ScrantonChessClubLogo = "/assets/ScrantonChessClub.png"
import quotes from "../../data/quotes"
import useScrollVisibility from "../../hooks/useScrollVisibility"

const QUOTE_INTERVAL_MS = 14000

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "FAQ", href: "/#qa" },
  { label: "Contact", href: "/contact" },
]

const mapHref = "https://www.google.com/maps/search/?api=1&query=Nazareth%20Center%20Marywood%20University%201300%20University%20Ave%20Scranton%20PA"

function MailIcon() {
  return (
    <svg className="end-contact-icon" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M5 8h22v16H5z" />
      <path d="m6 9 10 8 10-8" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg className="end-location-icon" viewBox="0 0 64 64" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32 58S13 36 13 23a19 19 0 1 1 38 0c0 13-19 35-19 35ZM32 30a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"
      />
    </svg>
  )
}

export default function End() {
  const [footerRef, isVisible] = useScrollVisibility({ threshold: 0.18 })
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * quotes.length))

  useEffect(() => {
    const id = setInterval(() => {
      setQuoteIndex((index) => (index + 1) % quotes.length)
    }, QUOTE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const activeQuote = quotes[quoteIndex]

  return (
    <footer ref={footerRef} className={`end${isVisible ? " is-visible" : ""}`} aria-labelledby="end-heading">
      <h2 className="sr-only" id="end-heading">Scranton Chess Club footer</h2>

      <section className="end-callout" aria-label="Club note">
        <div className="end-callout-inner">
          <figure className="end-quote" style={{ "--end-item-index": 0 }}>
            <div key={quoteIndex} className="end-quote-rotator" aria-live="polite">
              <blockquote>{activeQuote.quote}</blockquote>
              <figcaption className="end-quote-author">{activeQuote.author}</figcaption>
            </div>
          </figure>

          <aside className="end-partnership-panel" style={{ "--end-item-index": 1 }} aria-label="Marywood University partnership">
            <span>In partnership with</span>
            <a className="end-marywood-link" href="https://www.marywood.edu/" target="_blank" rel="noreferrer">
              <img src={MarywoodLogo} alt="Marywood University" />
            </a>
          </aside>
        </div>
      </section>

      <section className="end-footer" aria-label="Footer navigation and contact">
        <div className="end-footer-inner">
          <div className="end-brand" style={{ "--end-item-index": 0 }}>
            <img src={ScrantonChessClubLogo} alt="Scranton Chess Club" />
          </div>

          <nav className="end-links" style={{ "--end-item-index": 1 }} aria-label="Footer quick links">
            <h3>Quick Links</h3>
            <div className="end-heading-rule" aria-hidden="true"></div>
            <ul>
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="end-location" style={{ "--end-item-index": 2 }}>
            <h3>Meeting Location</h3>
            <div className="end-location-body">
              <MapPinIcon />
              <div>
                <address>
                  Nazareth Center 2nd Floor<br />
                  1300 University Ave,<br />
                  Scranton, PA
                </address>
                <a className="end-map-link" href={mapHref} target="_blank" rel="noreferrer">
                  View on Map
                </a>
              </div>
            </div>
          </div>

          <div className="end-contact" id="contact" style={{ "--end-item-index": 3 }}>
            <h3>Get In Touch</h3>
            <ul>
              <li>
                <MailIcon />
                <a href="mailto:scrantonchess@gmail.com">scrantonchess@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </footer>
  )
}
