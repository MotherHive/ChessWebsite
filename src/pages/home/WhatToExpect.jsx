import CoffeeIcon from "../../../assets/icons/coffee.svg"
import ExitIcon from "../../../assets/icons/exit.svg"
import BoardImage from "../../../assets/Board.webp"
import ProgressiveImage from "../../components/ui/ProgressiveImage"
import useScrollVisibility from "../../hooks/useScrollVisibility"

const expectationItems = [
  {
    icon: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Exclamation marks">
        <path d="M18 10h10l-2 34h-6L18 10Z" />
        <circle cx="23" cy="54" r="5" />
        <path d="M38 10h10l-2 34h-6L38 10Z" />
        <circle cx="43" cy="54" r="5" />
      </svg>
    ),
    title: "Show up anytime",
    description: "No sign up is required. Just drop in between the listed times.",
  },
  {
    icon: <img src={CoffeeIcon} alt="" />,
    title: "Meet people",
    description: "We have players of all ages and a friendly community.",
  },
  {
    icon: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Magnifying glass">
        <circle cx="28" cy="28" r="18" fill="none" stroke="currentColor" strokeWidth="6" />
        <path d="m42 42 15 15" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="square" />
      </svg>
    ),
    title: "Analyze your games",
    description: "We love taking a look afterwards to learn. Or forget it and just play blitz!",
  },
  {
    icon: <img src={ExitIcon} alt="" />,
    title: "Leave whenever",
    description: "You aren’t expected to stay, but we’ll miss you!",
  },
]

export default function WhatToExpect() {
  const [sectionRef, isVisible] = useScrollVisibility({ threshold: 0.24 })

  return (
    <section
      id="expect"
      ref={sectionRef}
      className={`expect-section${isVisible ? " is-visible" : ""}`}
      aria-labelledby="expect-heading"
    >
      <div className="expect-content">
        <div className="expect-copy">
          <h2 id="expect-heading">WHAT TO EXPECT</h2>
          <p className="expect-lede">
            Low-pressure chess nights with room to play, talk through positions, and leave on your own schedule.
          </p>

          <div className="expect-list">
            {expectationItems.map((item, index) => (
              <article
                className="expect-item"
                key={item.title}
                style={{ "--expect-item-index": index }}
              >
                <div className="expect-icon" aria-hidden="true">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="expect-panel" aria-hidden="true">
          <ProgressiveImage
            src={BoardImage}
            alt=""
            decoding="async"
            loading="lazy"
            width="2508"
            height="627"
          />
        </div>
      </div>
    </section>
  )
}
