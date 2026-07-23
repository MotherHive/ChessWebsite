"use client"

const Hermes = "/assets/hermes.webp"
const Splash = "/assets/splash.webp"
import ProgressiveImage from "@/shared/components/ui/ProgressiveImage"
import useScrollVisibility from "@/shared/hooks/useScrollVisibility"

const staffPositions = [
  {
    name: "Bruce Wisenburn",
    title: "Club Director",
  },
  {
    name: "Bernie Sporko",
    title: "Tournament Director",
  },
  {
    name: "Kilian Palmiter",
    title: "Assistant Tournament Director",
  },
  {
    name: "Skylar Milovcevich",
    title: "Student President",
  },
  {
    name: "Casey Ames",
    title: "Student Vice President",
  },
  {
    name: "Cian Wescott",
    title: "Website Developer",
  },
  {
    name: "Joe Brown",
    title: "Website Maintainer",
  },
]

export default function ContactPage() {
  const [sectionRef, isVisible] = useScrollVisibility({ threshold: 0.2 })

  return (
    <section
      id="contact"
      ref={sectionRef}
      className={`tournaments-section contact-page${isVisible ? " is-visible" : ""}`}
      aria-labelledby="contact-heading"
    >
      <div className="tournaments-hero contact-hero">
        <div className="tournaments-copy">
          <h2 id="contact-heading">SCRANTON CHESS CLUB CONTACT</h2>
          <p>
            Get club information, ask about meetings or tournaments, and see the staff roles that keep the club running.
          </p>

          <div className="tournaments-actions">
            <a className="button button-large" href="mailto:scrantonchess@gmail.com">Email Club</a>
            <a className="tournaments-text-link" href="https://www.google.com/maps/search/?api=1&query=Nazareth%20Center%20Marywood%20University%201300%20University%20Ave%20Scranton%20PA" target="_blank" rel="noreferrer">
              View meeting location
            </a>
          </div>
        </div>

        <div className="tournaments-board contact-board" aria-label="Contact page club preview">
          <ProgressiveImage
            className="contact-splash"
            src={Splash}
            alt=""
            aria-hidden="true"
            decoding="async"
            width="2000"
            height="1500"
          />
          <ProgressiveImage
            className="contact-hermes"
            src={Hermes}
            alt="Hermes carrying club correspondence"
            decoding="async"
            fetchPriority="high"
            width="1774"
            height="887"
          />
        </div>
      </div>

      <section className="contact-staff" aria-labelledby="staff-heading">
        <div className="contact-staff-heading">
          <h3 id="staff-heading">Club Staff</h3>
        </div>

        <div className="contact-staff-board">
          {staffPositions.map((position, index) => (
            <div className="contact-staff-row" key={`${position.name}-${position.title}`} style={{ "--staff-index": index }}>
              <strong>{position.name}</strong>
              <span>{position.title}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}
