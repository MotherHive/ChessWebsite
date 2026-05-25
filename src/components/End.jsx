import { useEffect, useRef, useState } from "react"
import MarywoodLogo from "../../assets/MarywoodLogo.png"
import ScrantonChessClubLogo from "../../assets/ScrantonChessClub.png"

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/#qa" },
  { label: "Contact", href: "/contact" },
]

const mapHref = "https://www.google.com/maps/search/?api=1&query=Nazareth%20Center%20Marywood%20University%201300%20University%20Ave%20Scranton%20PA"

function QuoteIcon() {
  return (
    <svg className="end-icon end-quote-icon" viewBox="0 0 74 96" aria-hidden="true">
      <path d="M48 13 13 43" />
      <path d="M12 52h39" />
      <path d="M14 61 49 87" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg className="end-icon end-people-icon" viewBox="0 0 74 74" aria-hidden="true">
      <circle cx="27" cy="25" r="10" />
      <circle cx="48" cy="28" r="8" />
      <path d="M8 62v-9c0-10 8-17 19-17s19 7 19 17v9" />
      <path d="M45 43c9 1 16 7 16 16v3" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg className="end-contact-icon" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M5 8h22v16H5z" />
      <path d="m6 9 10 8 10-8" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg className="end-contact-icon" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M10 5 7 8c0 10 7 17 17 17l3-3-7-5-3 3c-3-1-5-3-6-6l3-3Z" />
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

function SocialPlaceholderIcon({ label }) {
  return (
    <span className="end-social-placeholder" aria-label={label} role="img">
      <span></span>
    </span>
  )
}

export default function End() {
  const footerRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const footer = footerRef.current

    if (!footer) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.18 },
    )

    observer.observe(footer)

    return () => observer.disconnect()
  }, [])

  return (
    <footer ref={footerRef} className={`end${isVisible ? " is-visible" : ""}`} aria-labelledby="end-heading">
      <h2 className="sr-only" id="end-heading">Scranton Chess Club footer</h2>

      <section className="end-callout" aria-label="Club note">
        <div className="end-callout-inner">
          <div className="end-quote-mark" style={{ "--end-item-index": 0 }}>
            <QuoteIcon />
          </div>

          <figure className="end-quote" style={{ "--end-item-index": 1 }}>
            <blockquote>
              Chess is a struggle between my desire not to think and my desire not to lose.
            </blockquote>
            <figcaption>- Jan Gustafsson -</figcaption>
          </figure>

          <div className="end-callout-divider" style={{ "--end-item-index": 2 }} aria-hidden="true"></div>

          <div className="end-partnership-icon" style={{ "--end-item-index": 3 }}>
            <PeopleIcon />
          </div>

          <p className="end-partnership-text" style={{ "--end-item-index": 4 }}>
            Hosted in partnership with Marywood University and open to the Scranton community. All are welcome.
          </p>

          <a className="end-marywood-link" style={{ "--end-item-index": 5 }} href="https://www.marywood.edu/" target="_blank" rel="noreferrer">
            <img src={MarywoodLogo} alt="Marywood University" />
          </a>
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
                  <a href={link.href}>{link.label}</a>
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
              <li>
                <PhoneIcon />
                <span>000-000-0000</span>
              </li>
            </ul>
          </div>

          <div className="end-social" style={{ "--end-item-index": 4 }}>
            <h3>Follow Us</h3>
            <div className="end-social-list" aria-label="Social links coming soon">
              <SocialPlaceholderIcon label="Social link coming soon" />
              <SocialPlaceholderIcon label="Social link coming soon" />
            </div>
          </div>
        </div>
      </section>
    </footer>
  )
}
