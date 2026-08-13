const TournamentImage = "/assets/photos/tournament.webp"
import ProgressiveImage from "@/shared/components/ui/ProgressiveImage"
import useScrollVisibility from "@/shared/hooks/useScrollVisibility"

const expectationItems = [
  {
    title: "Show up anytime",
    description: "No sign up is required. Just drop in between the listed times for low-pressure chess, room to talk through positions, and the freedom to leave on your own schedule.",
  },
  {
    title: "Meet people",
    description: "We have players of all ages and a friendly community.",
  },
  {
    title: "Analyze your games",
    description: "We love taking a look afterwards to learn. Or forget it and just play blitz!",
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
          <div className="expect-edition-bar">
            <span>The Club Night</span>
            <span>Nazareth Center &middot; Marywood University</span>
          </div>

          <h2 id="expect-heading">WHAT TO EXPECT</h2>

          <div className="expect-feature">
            <div className="expect-editorial">
              <div className="expect-list">
                {expectationItems.map((item, index) => (
                  <article
                    className="expect-item"
                    key={item.title}
                    style={{ "--expect-item-index": index }}
                  >
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <figure className="expect-panel">
              <ProgressiveImage
                src={TournamentImage}
                alt=""
                aria-hidden="true"
                decoding="async"
                loading="lazy"
                width="1881"
                height="1146"
              />
            </figure>
          </div>
        </div>
      </div>
    </section>
  )
}
