import { useEffect, useRef, useState } from "react"
import Board from "../../assets/Board.jpg"
import { blogPosts } from "../data/blogPosts"

export default function Blog() {
  const sectionRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [featuredArticle, ...moreArticles] = blogPosts

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
      { threshold: 0.18 },
    )

    observer.observe(section)

    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="blog"
      ref={sectionRef}
      className={`blog-section${isVisible ? " is-visible" : ""}`}
      aria-labelledby="blog-heading"
    >
      <div className="blog-shell">
        <header className="blog-header">
          <h1 id="blog-heading">LATEST FROM SCRANTON CHESS CLUB</h1>
        </header>

        <article className="blog-featured">
          <a className="blog-featured-media" href={`/blog/${featuredArticle.slug}`} aria-label={featuredArticle.title}>
            <img src={Board} alt="Chess board with pieces set for play" />
          </a>

          <div className="blog-featured-copy">
            <div className="blog-meta">
              <span>{featuredArticle.category}</span>
              <time dateTime={featuredArticle.dateTime}>{featuredArticle.date}</time>
              <span>{featuredArticle.readTime}</span>
            </div>

            <h2>
              <a href={`/blog/${featuredArticle.slug}`}>{featuredArticle.title}</a>
            </h2>
            <p>{featuredArticle.excerpt}</p>
            <a className="blog-read-link" href={`/blog/${featuredArticle.slug}`}>
              Read top article
            </a>
          </div>
        </article>

        <div className="blog-list-heading">
          <h2>More Articles</h2>
          <span>Newest first</span>
        </div>

        <div className="blog-article-list" aria-label="More blog articles">
          {moreArticles.map((article, index) => (
            <article className="blog-article-card" key={article.title} style={{ "--blog-item-index": index }}>
              <div className="blog-article-date">
                <time dateTime={article.dateTime}>{article.date}</time>
                <span>{article.category}</span>
              </div>

              <div className="blog-article-copy">
                <h3>
                  <a href={`/blog/${article.slug}`}>{article.title}</a>
                </h3>
                <p>{article.excerpt}</p>
              </div>

              <a className="blog-card-link" href={`/blog/${article.slug}`}>
                {article.readTime}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
