// Archived blog feature. See archive/blog/README.md before restoring.
import { Link } from "react-router-dom"
import Board from "../../../assets/Board.jpg"

export default function BlogFeaturedArticle({ article }) {
  return (
    <article className="blog-featured">
      <Link className="blog-featured-media" to={`/blog/${article.slug}`} aria-label={article.title}>
        <img src={Board} alt="Chess board with pieces set for play" />
      </Link>

      <div className="blog-featured-copy">
        <div className="blog-meta">
          <span>{article.category}</span>
          <time dateTime={article.dateTime}>{article.date}</time>
          <span>{article.readTime}</span>
        </div>

        <h2>
          <Link to={`/blog/${article.slug}`}>{article.title}</Link>
        </h2>
        <p>{article.excerpt}</p>
        <Link className="blog-read-link" to={`/blog/${article.slug}`}>
          Read top article
        </Link>
      </div>
    </article>
  )
}
