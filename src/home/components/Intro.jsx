import Link from "next/link"
const KnightIcon = "/assets/icons/knight.png"
const PawnIcon = "/assets/icons/pawn.png"
const RookIcon = "/assets/icons/rook.png"
const CasualImage = "/assets/photos/casual.webp"
const MatchImage = "/assets/photos/match.webp"
const TournamentImage = "/assets/photos/tournament.webp"
import ProgressiveImage from "@/shared/components/ui/ProgressiveImage"
import useScrollVisibility from "@/shared/hooks/useScrollVisibility"

const introCards = [
  {
    icon: PawnIcon,
    image: CasualImage,
    title: "CASUAL PLAY",
    description: "Drop in for friendly games and improve at your own pace.",
    id: "casual-play",
    linkText: "Drop In \u2192",
    linkHref: "#join",
  },
  {
    icon: RookIcon,
    image: TournamentImage,
    title: "TOURNAMENTS",
    description: "Compete in local events throughout the year.",
    id: "tournaments-overview",
    linkText: "Get Competitive \u2192",
    linkHref: "/tournaments",
  },
  {
    icon: KnightIcon,
    image: MatchImage,
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
              <div className="intro-card-media" aria-hidden="true">
                {card.image && (
                  <ProgressiveImage
                    src={card.image}
                    alt=""
                    decoding="async"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="intro-card-body">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <Link href={card.linkHref}>{card.linkText}</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
