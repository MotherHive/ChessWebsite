import { useEffect, useRef, useState } from "react"
import Board from "../../assets/Board.jpg"
import CalendarIcon from "../../assets/icons/Calendar.svg"
import KnightIcon from "../../assets/icons/knight.png"
import PawnIcon from "../../assets/icons/pawn.png"
import RookIcon from "../../assets/icons/rook.png"

const blogTopics = [
  {
    icon: CalendarIcon,
    label: "Updates",
    title: "Meeting notes",
    detail: "Quick notes from club nights, schedule changes, and community announcements.",
  },
  {
    icon: RookIcon,
    label: "Events",
    title: "Tournament posts",
    detail: "Registration details, recaps, standings, and results will live here.",
  },
  {
    icon: KnightIcon,
    label: "Community",
    title: "Player stories",
    detail: "Game highlights, local chess news, and member spotlights are planned.",
  },
]

const blogChecks = [
  "Club announcements",
  "Tournament recaps and results",
  "Photos, games, and local chess stories",
]

export default function Blog() {
  const sectionRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const section = sectionRef.current

    if (!section) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.22 },
    )

    observer.observe(section)

    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="blog"
      ref={sectionRef}
      className={`tournaments-section${isVisible ? " is-visible" : ""}`}
      aria-labelledby="blog-heading"
    >
      <div className="tournaments-hero">
        <div className="tournaments-copy">
          <p className="tournaments-kicker">Blog Page WIP</p>
          <h2 id="blog-heading">SCRANTON CHESS CLUB BLOG</h2>
          <p>
            We are building a place for club updates, event recaps, local chess
            stories, and useful notes for players around Scranton.
          </p>

          <div className="tournaments-actions">
            <a className="button button-large" href="/#join">Get Updates</a>
            <a className="tournaments-text-link" href="mailto:scrantonchess@gmail.com">
              Send a story idea
            </a>
          </div>
        </div>

        <div className="tournaments-board" aria-label="Blog planning preview">
          <img src={Board} alt="Chess board with pieces set for play" />
          <div className="tournaments-status">
            <img src={PawnIcon} alt="" aria-hidden="true" />
            <div>
              <span>First posts</span>
              <strong>Coming soon</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="tournaments-details" aria-label="Blog sections being prepared">
        {blogTopics.map((topic, index) => (
          <article
            className={`tournaments-feature-card${index === 0 ? " tournaments-feature-card-primary" : ""}`}
            key={topic.title}
          >
            <div className="tournaments-card-icon" aria-hidden="true">
              <img src={topic.icon} alt="" />
            </div>
            <div>
              <span>{topic.label}</span>
              <h3>{topic.title}</h3>
              <p>{topic.detail}</p>
            </div>
          </article>
        ))}
      </div>

      <ul className="tournaments-checklist" aria-label="Blog features being prepared">
        {blogChecks.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
