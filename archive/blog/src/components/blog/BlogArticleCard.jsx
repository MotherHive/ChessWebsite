// Archived blog feature. See archive/blog/README.md before restoring.
import { Link } from "react-router-dom"

export default function BlogArticleCard({ article, index }) {
  return (
    <article className="blog-article-card" style={{ "--blog-item-index": index }}>
      <div className="blog-article-date">
        <time dateTime={article.dateTime}>{article.date}</time>
        <span>{article.category}</span>
      </div>

      <div className="blog-article-copy">
        <h3>
          <Link to={`/blog/${article.slug}`}>{article.title}</Link>
        </h3>
        <p>{article.excerpt}</p>
      </div>

      <Link className="blog-card-link" to={`/blog/${article.slug}`}>
        {article.readTime}
      </Link>
    </article>
  )
}
