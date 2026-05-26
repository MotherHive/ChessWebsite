import { Link } from "react-router-dom"
import KnightIcon from "../../assets/icons/knight.png"
import PawnIcon from "../../assets/icons/pawn.png"
import RookIcon from "../../assets/icons/rook.png"
import useScrollVisibility from "../hooks/useScrollVisibility"

const introCards = [
  {
    icon: PawnIcon,
    title: "CASUAL PLAY",
    description: "Drop in for friendly games and improve at your own pace.",
    id: "casual-play",
    linkText: "Drop In \u2192",
    linkHref: "#join",
  },
  {
    icon: RookIcon,
    title: "TOURNAMENTS",
    description: "Compete in local events throughout the year.",
    id: "tournaments-overview",
    linkText: "Get Competitive \u2192",
    linkHref: "/tournaments",
  },
  {
    icon: KnightIcon,
    title: "ALL AGES & LEVELS",
    description: "Beginners, advanced players, students, and adults are all welcome.",
    id: "all-levels",
    linkText: "Who Can Join \u2192",
    linkHref: "#qa",
  },
]

export default function Intro() {
  const [sectionRef, isVisible] = useScrollVisibility({ threshold: 0.28 })

  return (
    <section
      id="about"
      ref={sectionRef}
      className={`intro-section${isVisible ? " is-visible" : ""}`}
      aria-labelledby="intro-heading"
    >
      <div className="intro-section-bars" aria-hidden="true">
        <span className="intro-section-bar intro-section-bar-dark"></span>
        <span className="intro-section-bar intro-section-bar-light"></span>
        <span className="intro-section-bar intro-section-bar-light intro-section-bar-short"></span>
        <span className="intro-section-bar intro-section-bar-dark intro-section-bar-short"></span>
      </div>

      <div className="intro-section-header">
        <h2 id="intro-heading">PLAY CHESS &amp; MEET PEOPLE</h2>
        <p>BUILD SCRANTON&rsquo;S CHESS COMMUNITY</p>
      </div>

      <div className="intro-card-grid">
        {introCards.map((card, index) => (
          <article
            className="intro-card"
            id={card.id}
            key={card.title}
            style={{ "--intro-card-index": index }}
          >
            <div className="intro-card-icon" aria-hidden="true">
              <img src={card.icon} alt="" />
            </div>
            <div className="intro-card-shell">
              <div className="intro-card-media" aria-hidden="true"></div>
              <div className="intro-card-body">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <Link to={card.linkHref}>{card.linkText}</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
